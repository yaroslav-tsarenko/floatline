"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { createEmailUser, getUserByEmail } from "@/lib/auth/users";

export type AuthState = { error: string } | null;

const credentials = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

function parse(formData: FormData) {
  return credentials.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  const { email, password } = parsed.data;

  if (await getUserByEmail(email)) {
    return { error: "An account with this email already exists." };
  }

  const userId = await createEmailUser(email, await hashPassword(password));
  await setSessionCookie(userId);
  redirect("/account");
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: "Enter your email and password." };
  }
  const { email, password } = parsed.data;

  const user = await getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await setSessionCookie(user.id);
  redirect("/account");
}

export async function signOut(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
