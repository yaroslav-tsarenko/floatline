"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { createEmailUser, getUserByEmail } from "@/lib/auth/users";
import { isCountryCode } from "@/lib/countries";

export type AuthState = { error: string } | null;

/** Whole years between `dob` and today. */
function ageInYears(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

// Sign-in stays intentionally loose: length/format is enforced at sign-up, so
// here we only need a well-formed email and a non-empty password.
const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    dateOfBirth: z.string().min(1, "Date of birth is required."),
    email: z.email("Enter a valid email address."),
    phone: z.string().trim().min(3, "Phone number is required."),
    streetAddress: z.string().trim().min(1, "Street address is required."),
    city: z.string().trim().min(1, "City is required."),
    country: z.string().refine(isCountryCode, "Select a country."),
    postalCode: z.string().trim().min(1, "Postal code is required."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
    terms: z.boolean(),
  })
  .refine((d) => !Number.isNaN(ageInYears(d.dateOfBirth)), {
    message: "Enter a valid date of birth.",
    path: ["dateOfBirth"],
  })
  .refine((d) => ageInYears(d.dateOfBirth) >= 18, {
    message: "You must be at least 18 years old to register.",
    path: ["dateOfBirth"],
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don’t match.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.terms, {
    message: "You must accept the Terms and Privacy Policy to continue.",
    path: ["terms"],
  });

export type SignUpInput = z.input<typeof signUpSchema>;

export async function signUp(input: SignUpInput): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  const d = parsed.data;

  if (await getUserByEmail(d.email)) {
    return { error: "An account with this email already exists." };
  }

  const userId = await createEmailUser(d.email, await hashPassword(d.password), {
    firstName: d.firstName,
    lastName: d.lastName,
    dateOfBirth: d.dateOfBirth,
    phone: d.phone,
    streetAddress: d.streetAddress,
    city: d.city,
    country: d.country,
    postalCode: d.postalCode,
  });
  await setSessionCookie(userId);
  redirect("/account");
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Enter your email and password." };
  }
  const { email, password } = parsed.data;

  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await setSessionCookie(user.id);
  redirect("/account");
}

export async function signOut(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
