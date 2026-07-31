import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Surface({
  className,
  inset = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border border-border",
        inset ? "bg-surface-2" : "bg-surface",
        className,
      )}
      {...props}
    />
  );
}
