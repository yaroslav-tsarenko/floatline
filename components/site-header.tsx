"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CurrencySwitcher } from "@/components/currency-switcher";
import { Money } from "@/components/money";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/cs2/parseName";
import type { NavCategory } from "@/lib/home";

export interface HeaderStats {
  inStock: number;
  avgDiscount: number | null;
  avgDeliveryMinutes: number | null;
}

export interface HeaderUser {
  email: string;
  hasSteam: boolean;
}

interface SiteHeaderProps {
  stats: HeaderStats;
  nav: NavCategory[];
  user: HeaderUser | null;
  balance: number | null;
  isAdmin: boolean;
}

const CATEGORY_LABEL: Record<Category, string> = {
  rifle: "Rifles",
  pistol: "Pistols",
  knife: "Knives",
  gloves: "Gloves",
  smg: "SMGs",
  heavy: "Heavy",
  agent: "Agents",
  sticker: "Stickers",
  other: "Other",
};

// Quick float/wear jumps surfaced in every mega-panel.
const WEAR_LINKS: { label: string; wear: string }[] = [
  { label: "Factory New", wear: "FN" },
  { label: "Minimal Wear", wear: "MW" },
  { label: "Field-Tested", wear: "FT" },
  { label: "Well-Worn", wear: "WW" },
  { label: "Battle-Scarred", wear: "BS" },
];

function Icon({ path, className }: { path: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-[18px]", className)}
      aria-hidden
    >
      {path}
    </svg>
  );
}

const SearchIcon = (
  <Icon path={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />
);
const HeartIcon = (
  <Icon path={<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />} />
);
const BagIcon = (
  <Icon path={<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>} />
);
const MenuIcon = (
  <Icon path={<><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>} />
);
const CloseIcon = (
  <Icon path={<><path d="M18 6 6 18" /><path d="M6 6l12 12" /></>} />
);
const ChevronIcon = (
  <Icon path={<path d="m6 9 6 6 6-6" />} className="size-4" />
);
const BoltIcon = (
  <Icon path={<path d="M13 2 3 14h7l-1 8 10-12h-7z" />} className="size-3.5" />
);

function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}

/** Thin marquee-style live-stat pills for the top strip. */
function LiveStats({ stats }: { stats: HeaderStats }) {
  return (
    <div className="flex items-center gap-4 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 animate-none rounded-full bg-positive" />
        <span className="num text-text">{fmtInt(stats.inStock)}</span> skins in
        stock
      </span>
      {stats.avgDiscount != null && (
        <span className="hidden items-center gap-1.5 sm:inline-flex">
          <span className="num text-positive">
            −{Math.round(stats.avgDiscount * 100)}%
          </span>
          avg vs Steam
        </span>
      )}
      {stats.avgDeliveryMinutes != null && (
        <span className="hidden items-center gap-1.5 md:inline-flex">
          {BoltIcon}
          <span className="num text-text">
            {Math.round(stats.avgDeliveryMinutes)}m
          </span>
          avg delivery
        </span>
      )}
    </div>
  );
}

function IconLink({
  href,
  label,
  children,
  badge,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative grid size-9 place-items-center rounded-md border border-border bg-surface text-muted transition-colors hover:border-signal hover:text-text"
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="num absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-signal px-1 text-[10px] font-medium text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function SiteHeader({
  stats,
  nav,
  user,
  balance,
  isAdmin,
}: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [openCat, setOpenCat] = useState<Category | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [drawerCat, setDrawerCat] = useState<Category | null>(null);
  const [q, setQ] = useState("");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Condense the header (drop the top strip) once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close overlays on navigation — adjust during render (no effect) to avoid
  // the cascading-render lint, matching the pattern used across the app.
  const [syncedPath, setSyncedPath] = useState(pathname);
  if (syncedPath !== pathname) {
    setSyncedPath(pathname);
    setOpenCat(null);
    setDrawer(false);
  }

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    setDrawer(false);
    router.push(query ? `/catalog?q=${encodeURIComponent(query)}` : "/catalog");
  };

  const hoverOpen = (cat: Category) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenCat(cat);
  };
  const hoverClose = () => {
    closeTimer.current = setTimeout(() => setOpenCat(null), 120);
  };

  const activeNav = nav.find((n) => n.category === openCat);

  return (
    <header className="sticky top-0 z-40">
      {/* Top strip — live stats + currency/theme. Collapses on scroll. */}
      <div
        className={cn(
          "overflow-hidden border-b border-border bg-plate/80 backdrop-blur transition-all duration-300",
          scrolled ? "max-h-0 opacity-0" : "max-h-10 opacity-100",
        )}
      >
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4">
          <LiveStats stats={stats} />
          <div className="flex items-center gap-2">
            <a
              href="https://t.me/floatline"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-xs text-muted hover:text-text sm:inline"
            >
              Support
            </a>
            <span className="hidden h-4 w-px bg-border sm:block" />
            <CurrencySwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <button
            className="grid size-9 place-items-center rounded-md border border-border text-muted lg:hidden"
            aria-label="Open menu"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            {MenuIcon}
          </button>

          <Link href="/" aria-label="Floatline home" className="shrink-0">
            <Wordmark />
          </Link>

          <form
            onSubmit={submitSearch}
            role="search"
            className="relative ml-2 hidden max-w-md flex-1 items-center md:flex"
          >
            <span className="pointer-events-none absolute left-3 text-muted">
              {SearchIcon}
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search AK-47, Doppler, Asiimov…"
              aria-label="Search skins"
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm text-text placeholder:text-muted focus-visible:border-signal"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/catalog"
              aria-label="Search"
              title="Search"
              className="grid size-9 place-items-center rounded-md border border-border bg-surface text-muted transition-colors hover:border-signal hover:text-text md:hidden"
            >
              {SearchIcon}
            </Link>
            <IconLink href="/wishlist" label="Wishlist">
              {HeartIcon}
            </IconLink>
            <IconLink href="/cart" label="Cart">
              {BagIcon}
            </IconLink>

            {isAdmin && (
              <Link
                href="/admin"
                className="hidden rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-text sm:block"
              >
                Admin
              </Link>
            )}

            {user ? (
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-2"
              >
                {balance != null && (
                  <Money usd={balance} className="font-medium text-signal" />
                )}
                <span className="hidden text-muted sm:inline">Account</span>
              </Link>
            ) : (
              <Link
                href="/signin"
                className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Category nav (desktop) with mega-panels */}
        <nav
          className="mx-auto hidden max-w-7xl items-center gap-1 px-4 lg:flex"
          onMouseLeave={hoverClose}
        >
          {nav.map((n) => (
            <div
              key={n.category}
              onMouseEnter={() => hoverOpen(n.category)}
              onFocus={() => hoverOpen(n.category)}
            >
              <Link
                href={`/catalog?category=${n.category}`}
                className={cn(
                  "flex items-center gap-1 border-b-2 px-3 py-2.5 text-sm transition-colors",
                  openCat === n.category
                    ? "border-signal text-text"
                    : "border-transparent text-muted hover:text-text",
                )}
              >
                {CATEGORY_LABEL[n.category]}
                <span className="num text-[11px] text-muted/70">{n.count}</span>
              </Link>
            </div>
          ))}
          <Link
            href="/catalog?sort=discount"
            className="ml-auto flex items-center gap-1 px-3 py-2.5 text-sm font-medium text-signal hover:underline"
          >
            {BoltIcon}
            Deals
          </Link>
        </nav>

        {/* Mega-panel */}
        {activeNav && (
          <div
            className="absolute inset-x-0 top-full hidden lg:block"
            onMouseEnter={() => hoverOpen(activeNav.category)}
            onMouseLeave={hoverClose}
          >
            <div className="mx-auto max-w-7xl px-4">
              <div className="rounded-b-lg border border-t-0 border-border bg-surface p-5 shadow-xl">
                <div className="grid grid-cols-[1fr_2fr_1fr] gap-6">
                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
                      {CATEGORY_LABEL[activeNav.category]}
                    </p>
                    <Link
                      href={`/catalog?category=${activeNav.category}`}
                      className="text-sm text-signal hover:underline"
                    >
                      View all {activeNav.count} listings →
                    </Link>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
                      Popular
                    </p>
                    {activeNav.weapons.length > 0 ? (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {activeNav.weapons.map((w) => (
                          <Link
                            key={w.name}
                            href={`/catalog?category=${activeNav.category}&weapon=${encodeURIComponent(w.name)}`}
                            className="flex items-center justify-between rounded px-2 py-1 text-sm text-muted hover:bg-surface-2 hover:text-text"
                          >
                            <span className="truncate">{w.name}</span>
                            <span className="num text-[11px] opacity-70">
                              {w.count}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted">
                        No sub-categories yet.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
                      By wear
                    </p>
                    <div className="space-y-1">
                      {WEAR_LINKS.map((w) => (
                        <Link
                          key={w.wear}
                          href={`/catalog?category=${activeNav.category}&wear=${w.wear}`}
                          className="block rounded px-2 py-1 text-sm text-muted hover:bg-surface-2 hover:text-text"
                        >
                          {w.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-bg shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Wordmark />
              <button
                className="grid size-9 place-items-center rounded-md border border-border text-muted"
                aria-label="Close menu"
                onClick={() => setDrawer(false)}
              >
                {CloseIcon}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <form onSubmit={submitSearch} role="search" className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  {SearchIcon}
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search skins…"
                  aria-label="Search skins"
                  className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm"
                />
              </form>

              <div className="mt-4 border-t border-border pt-2">
                {nav.map((n) => {
                  const open = drawerCat === n.category;
                  return (
                    <div key={n.category} className="border-b border-border">
                      <div className="flex items-center">
                        <Link
                          href={`/catalog?category=${n.category}`}
                          className="flex-1 py-3 text-sm"
                        >
                          {CATEGORY_LABEL[n.category]}
                          <span className="num ml-2 text-[11px] text-muted">
                            {n.count}
                          </span>
                        </Link>
                        {n.weapons.length > 0 && (
                          <button
                            aria-label={`Toggle ${CATEGORY_LABEL[n.category]}`}
                            aria-expanded={open}
                            onClick={() =>
                              setDrawerCat(open ? null : n.category)
                            }
                            className="grid size-9 place-items-center text-muted"
                          >
                            <span
                              className={cn(
                                "transition-transform",
                                open && "rotate-180",
                              )}
                            >
                              {ChevronIcon}
                            </span>
                          </button>
                        )}
                      </div>
                      {open && n.weapons.length > 0 && (
                        <div className="pb-2 pl-3">
                          {n.weapons.map((w) => (
                            <Link
                              key={w.name}
                              href={`/catalog?category=${n.category}&weapon=${encodeURIComponent(w.name)}`}
                              className="flex items-center justify-between py-1.5 text-sm text-muted"
                            >
                              <span>{w.name}</span>
                              <span className="num text-[11px] opacity-70">
                                {w.count}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link href="/wishlist" className="text-sm text-muted">
                  Wishlist
                </Link>
                <Link href="/cart" className="text-sm text-muted">
                  Cart
                </Link>
                <Link
                  href="/catalog?sort=discount"
                  className="text-sm font-medium text-signal"
                >
                  Deals
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border p-4">
              <div className="flex items-center gap-2">
                <CurrencySwitcher />
                <ThemeToggle />
              </div>
              {user ? (
                <Link
                  href="/account"
                  className="rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  Account
                </Link>
              ) : (
                <Link
                  href="/signin"
                  className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
