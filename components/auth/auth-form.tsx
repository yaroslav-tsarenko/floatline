"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

type Mode = "signin" | "signup";

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      {mode === "signin" ? "Sign in" : "Create account"}
    </Button>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction] = useActionState<AuthState, FormData>(action, null);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-md border border-border p-1 text-sm">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded py-1.5 font-medium transition-colors",
              mode === m ? "bg-signal text-white" : "text-muted hover:text-text",
            )}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs text-muted">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs text-muted">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-negative">{state.error}</p>
        )}

        <SubmitButton mode={mode} />
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <a
        href="/api/auth/steam"
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm font-medium hover:bg-surface-2"
      >
        Continue with Steam
      </a>
    </div>
  );
}
