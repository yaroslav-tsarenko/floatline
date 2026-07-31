import { cn } from "@/lib/cn";

/**
 * Floatline wordmark. The segment between "t" and "l" is a miniature float
 * scale with a marker — the brand *is* the signature element.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display text-lg font-semibold tracking-tight text-text",
        className,
      )}
    >
      Float
      <span className="relative mx-0.5 inline-block h-3 w-6 translate-y-[-1px] self-center rounded-[2px] border border-border bg-surface-2">
        <span className="absolute top-0 bottom-0 left-[35%] w-px bg-signal" />
        <span className="absolute top-1/2 left-[35%] size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" />
      </span>
      line
    </span>
  );
}
