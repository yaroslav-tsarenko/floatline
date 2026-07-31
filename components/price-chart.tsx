import type { PricePoint } from "@/lib/catalog/item";

const W = 100;
const H = 36;

function pathFor(
  points: PricePoint[],
  pick: (p: PricePoint) => number | null,
  min: number,
  max: number,
): string {
  const span = max - min || 1;
  const coords = points
    .map((p, i) => {
      const v = pick(p);
      if (v == null) return null;
      const x = points.length > 1 ? (i / (points.length - 1)) * W : W / 2;
      const y = H - ((v - min) / span) * H;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .filter((c): c is string => c != null);
  if (coords.length === 0) return "";
  return `M ${coords.join(" L ")}`;
}

/**
 * Dependency-free price trend. Two lines: our price (signal) and the Steam
 * reference (muted). Kept as inline SVG so it adds nothing to the bundle.
 */
export function PriceChart({ points }: { points: PricePoint[] }) {
  const values = points.flatMap((p) =>
    [p.sell, p.steam].filter((v): v is number => v != null),
  );
  if (values.length < 2) {
    return (
      <p className="py-6 text-center text-xs text-muted">
        Not enough price history yet.
      </p>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-28 w-full"
        role="img"
        aria-label="Price history"
      >
        <path
          d={pathFor(points, (p) => p.steam, min, max)}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={0.6}
          strokeDasharray="1.5 1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={pathFor(points, (p) => p.sell, min, max)}
          fill="none"
          stroke="var(--color-signal)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span className="num">${min.toFixed(2)}</span>
        <span>
          <span className="text-signal">— our price</span>{" "}
          <span>· · Steam</span>
        </span>
        <span className="num">${max.toFixed(2)}</span>
      </div>
    </div>
  );
}
