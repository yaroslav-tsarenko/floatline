import { FloatAxis } from "@/components/float-axis";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

const RARITIES = [
  ["consumer", "text-rarity-consumer border-rarity-consumer"],
  ["industrial", "text-rarity-industrial border-rarity-industrial"],
  ["milspec", "text-rarity-milspec border-rarity-milspec"],
  ["restricted", "text-rarity-restricted border-rarity-restricted"],
  ["classified", "text-rarity-classified border-rarity-classified"],
  ["covert", "text-rarity-covert border-rarity-covert"],
  ["contraband", "text-rarity-contraband border-rarity-contraband"],
] as const;

const SAMPLE = [
  { name: "AK-47 | Redline", wear: "FT", float: 0.234, usd: 34.2, steam: 38.4 },
  { name: "AWP | Asiimov", wear: "WW", float: 0.41, usd: 71.5, steam: 82.1 },
  { name: "★ Karambit | Doppler", wear: "FN", float: 0.012, usd: 29.9, steam: 41.0 },
  { name: "Glock-18 | Fade", wear: "MW", float: 0.09, usd: 22.4, steam: 25.9 },
];

export default function Styleguide() {
  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-10">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted">Signature</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Buy CS2 skins at the real number.
        </h1>
        <Surface className="p-6">
          <FloatAxis value={0.1847} />
        </Surface>
        <div className="flex flex-wrap gap-3 text-sm">
          <Surface inset className="px-3 py-2">
            <span className="num text-lg">12,438</span>{" "}
            <span className="text-muted">in stock</span>
          </Surface>
          <Surface inset className="px-3 py-2">
            <span className="num text-lg text-positive">-11%</span>{" "}
            <span className="text-muted">avg vs Steam</span>
          </Surface>
          <Surface inset className="px-3 py-2">
            <span className="num text-lg">3m</span>{" "}
            <span className="text-muted">avg delivery</span>
          </Surface>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted">Buttons</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Buy for $34.20</Button>
          <Button variant="secondary">Add funds</Button>
          <Button variant="ghost">Details</Button>
          <Button loading>Placing order</Button>
          <Button disabled>Unavailable</Button>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted">
          Money · switch currency in the header
        </p>
        <div className="flex flex-wrap gap-6 text-2xl">
          <Money usd={34.2} />
          <Money usd={1499.99} />
          <Money usd={0.42} />
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted">Rarity</p>
        <div className="flex flex-wrap gap-2">
          {RARITIES.map(([name, cls]) => (
            <span
              key={name}
              className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs ${cls}`}
            >
              <span className="size-2 rounded-full bg-current" />
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted">Item cards</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SAMPLE.map((it) => (
            <Surface key={it.name} className="overflow-hidden">
              <div className="flex aspect-[4/3] items-center justify-center bg-plate">
                <span className="text-xs text-muted">skin</span>
              </div>
              <div className="space-y-2 p-3">
                <FloatAxis value={it.float} variant="mini" />
                <p className="line-clamp-2 min-h-[2.5em] text-sm">{it.name}</p>
                <div className="flex items-center justify-between">
                  <Badge>{it.wear}</Badge>
                  <Badge tone="positive">
                    -{Math.round(((it.steam - it.usd) / it.steam) * 100)}%
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between">
                  <Money usd={it.usd} className="text-base" />
                  <span className="text-xs text-muted line-through">
                    <Money usd={it.steam} />
                  </span>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted">Skeletons</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Surface key={i} className="space-y-2 p-3">
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Surface>
          ))}
        </div>
      </section>
    </div>
  );
}
