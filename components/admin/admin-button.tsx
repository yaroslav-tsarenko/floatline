"use client";

import { useState, useTransition } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export function AdminButton({
  action,
  label,
  variant = "secondary",
  size = "sm",
}: {
  action: () => Promise<ActionResult>;
  label: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        variant={variant}
        size={size}
        loading={pending}
        onClick={() => {
          setResult(null);
          startTransition(async () => setResult(await action()));
        }}
      >
        {label}
      </Button>
      {result && (
        <span
          className={
            result.ok ? "text-xs text-positive" : "text-xs text-negative"
          }
        >
          {result.ok ? (result.message ?? "Done") : result.error}
        </span>
      )}
    </span>
  );
}
