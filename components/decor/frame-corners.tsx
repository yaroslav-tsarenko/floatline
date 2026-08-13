import { cn } from "@/lib/cn";

// Registration / crop marks in the four corners of a surface — the "technical
// drawing frame" motif. Decorative only; parent must be positioned.
export function FrameCorners({ className }: { className?: string }) {
  const base = "pointer-events-none absolute size-4 border-signal/40";
  return (
    <div aria-hidden className={className}>
      <span className={cn(base, "left-2 top-2 border-l border-t")} />
      <span className={cn(base, "right-2 top-2 border-r border-t")} />
      <span className={cn(base, "bottom-2 left-2 border-b border-l")} />
      <span className={cn(base, "bottom-2 right-2 border-b border-r")} />
    </div>
  );
}
