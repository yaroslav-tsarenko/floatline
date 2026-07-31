import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Tone = "neutral" | "signal" | "positive" | "negative";

const TONES: Record<Tone, string> = {
  neutral: "border-border bg-surface-2 text-muted",
  signal: "border-signal/30 bg-signal/10 text-signal",
  positive: "border-positive/30 bg-positive/10 text-positive",
  negative: "border-negative/30 bg-negative/10 text-negative",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
