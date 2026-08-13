import { cn } from "@/lib/cn";

// Blueprint-style divider between home sections: a coordinate label, a ruler
// strip of measurement ticks, and the float-gauge brand glyph. Decorative.
export function SectionRule({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted/70",
        className,
      )}
    >
      <span className="num shrink-0 text-signal/70">{label}</span>
      <span className="h-3 w-px bg-border" />
      <span className="bg-ruler h-2 flex-1 opacity-60" />
      <span className="relative inline-block h-2.5 w-5 shrink-0 rounded-[2px] border border-border bg-surface-2">
        <span className="absolute inset-y-0 left-[35%] w-px bg-signal/70" />
        <span className="absolute left-[35%] top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/70" />
      </span>
    </div>
  );
}
