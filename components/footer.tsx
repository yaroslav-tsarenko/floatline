import Link from "next/link";

import { Wordmark } from "@/components/wordmark";
import { COMPANY_ADDRESS_INLINE, SITE } from "@/lib/site";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Catalog", href: "/catalog" },
      { label: "Best deals", href: "/catalog?sort=discount" },
      { label: "The Vault", href: "/catalog?min=1000&sort=price_desc" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/signin" },
      { label: "Your account", href: "/account" },
      { label: "Orders", href: "/orders" },
      { label: "Cart", href: "/cart" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
      { label: "Payments", href: "/payments" },
      { label: "Delivery", href: "/delivery" },
      { label: "Refunds", href: "/refunds" },
      { label: "Legal notice", href: "/legal" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 space-y-3">
          <Wordmark />
          <p className="max-w-xs text-xs text-muted">
            A CS2 skins marketplace. We show the number and fill the order.
          </p>
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text"
          >
            <span className="size-1.5 rounded-full bg-positive" />
            {SITE.contactEmail}
          </a>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-text">
              {col.title}
            </p>
            <ul className="space-y-2 text-sm text-muted">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-text">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 text-xs text-muted">
          <p className="text-text/80">
            {SITE.company.legalName} · Registry code {SITE.company.registryCode}
          </p>
          <address className="not-italic">{COMPANY_ADDRESS_INLINE}</address>
          <div className="flex flex-col gap-1 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {SITE.company.legalName}. All rights
              reserved.
            </p>
            <p>Not affiliated with Valve.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
