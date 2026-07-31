import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text",
        "placeholder:text-muted focus-visible:border-signal",
        className,
      )}
      {...props}
    />
  );
}
