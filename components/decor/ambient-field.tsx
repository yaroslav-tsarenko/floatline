import { cn } from "@/lib/cn";

// Purely decorative background layer: soft rarity/signal glow blooms, drifting
// measurement glyphs (crosshairs, tick clusters, ghost float readouts) and a
// faint film grain. All aria-hidden and pointer-events-none; motion is limited
// to transform/opacity and is disabled under prefers-reduced-motion.

const GLOWS = [
  "left-[-8%] top-[6%] size-72 bg-signal/12",
  "right-[-10%] top-[26%] size-80 bg-rarity-covert/10",
  "left-[14%] top-[58%] size-72 bg-rarity-restricted/10",
  "right-[8%] bottom-[8%] size-64 bg-rarity-classified/10",
  "left-[42%] top-[38%] size-56 bg-rarity-milspec/10",
];

const FLOATS = [
  { v: "0.1847", pos: "left-[6%] top-[18%]", drift: "animate-drift" },
  { v: "0.0031", pos: "right-[10%] top-[12%]", drift: "animate-drift-2" },
  { v: "0.2461", pos: "left-[76%] top-[46%]", drift: "animate-drift" },
  { v: "0.3312", pos: "left-[10%] top-[72%]", drift: "animate-drift-2" },
  { v: "0.0777", pos: "right-[22%] bottom-[14%]", drift: "animate-drift" },
];

function Crosshair({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("text-signal/25", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <circle cx="12" cy="12" r="6" />
      <path d="M12 0v6M12 18v6M0 12h6M18 12h6" />
    </svg>
  );
}

function TickCluster({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 12"
      className={cn("text-border", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      {Array.from({ length: 13 }, (_, i) => {
        const x = i * 5;
        const tall = i % 5 === 0;
        return <line key={i} x1={x} y1={tall ? 0 : 5} x2={x} y2="12" />;
      })}
    </svg>
  );
}

export function AmbientField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {GLOWS.map((g, i) => (
        <span key={i} className={cn("glow absolute", g)} />
      ))}

      {FLOATS.map((f, i) => (
        <span
          key={i}
          className={cn(
            "num absolute text-2xl font-semibold text-muted/10",
            f.pos,
            f.drift,
          )}
        >
          {f.v}
        </span>
      ))}

      <Crosshair className="animate-drift absolute left-[52%] top-[14%] size-8" />
      <Crosshair className="animate-drift-2 absolute left-[18%] top-[44%] size-6" />
      <Crosshair className="animate-drift absolute right-[14%] top-[64%] size-10" />

      <TickCluster className="animate-drift-2 absolute left-[4%] top-[52%] w-32 opacity-40" />
      <TickCluster className="animate-drift absolute right-[6%] top-[20%] w-40 opacity-30" />
      <TickCluster className="animate-drift-2 absolute left-[60%] bottom-[10%] w-36 opacity-40" />

      <span className="grain absolute inset-0" />
    </div>
  );
}
