import { cn } from "@/lib/cn";
import { clampFloat, FLOAT_ZONES } from "@/lib/cs2/float";

const BOUNDARIES = FLOAT_ZONES.slice(0, -1).map((z) => z.end);

function Marker({ value }: { value: number }) {
  const left = `${clampFloat(value) * 100}%`;
  return (
    <div
      className="absolute top-0 bottom-0 z-10 -translate-x-1/2"
      style={{ left }}
      aria-hidden
    >
      <div className="h-full w-px bg-signal" />
      <div className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal ring-2 ring-bg" />
    </div>
  );
}

function Track({
  value,
  className,
}: {
  value?: number | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded border border-border bg-surface-2",
        className,
      )}
    >
      {BOUNDARIES.map((b) => (
        <div
          key={b}
          className="absolute top-0 bottom-0 w-px bg-border"
          style={{ left: `${b * 100}%` }}
          aria-hidden
        />
      ))}
      {value != null && <Marker value={value} />}
    </div>
  );
}

/**
 * Float Axis — the signature element. Displays the 0.00 -> 1.00 wear scale with
 * its five zones and, optionally, a marker at an item's float. `mini` is for
 * cards; `full` adds zone labels, range ends and a readout for the item page /
 * hero. The interactive filter variant is built separately in the catalog.
 */
export function FloatAxis({
  value,
  variant = "full",
  className,
}: {
  value?: number | null;
  variant?: "mini" | "full";
  className?: string;
}) {
  if (variant === "mini") {
    return <Track value={value} className={cn("h-1", className)} />;
  }

  return (
    <div className={cn("w-full", className)}>
      <Track value={value} className="h-2.5" />
      <div className="mt-1 flex w-full">
        {FLOAT_ZONES.map((zone) => (
          <span
            key={zone.key}
            className="text-center text-[10px] tracking-wide text-muted"
            style={{ flexBasis: `${(zone.end - zone.start) * 100}%` }}
          >
            {zone.label}
          </span>
        ))}
      </div>
      <div className="mt-0.5 flex w-full justify-between text-[10px] text-muted">
        <span className="num">0.00</span>
        {value != null && (
          <span className="num text-signal">{clampFloat(value).toFixed(4)}</span>
        )}
        <span className="num">1.00</span>
      </div>
    </div>
  );
}
