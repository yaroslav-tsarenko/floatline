import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { Surface } from "@/components/ui/surface";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-6 space-y-1 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Welcome to Floatline
        </h1>
        <p className="text-sm text-muted">
          Sign in to track orders and manage your balance.
        </p>
      </div>
      <Surface className="p-6">
        <AuthForm />
      </Surface>
      <p className="mt-4 text-center text-xs text-muted">
        You&apos;ll link your Steam account before your first purchase.
      </p>
    </div>
  );
}
