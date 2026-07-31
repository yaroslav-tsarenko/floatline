import Link from "next/link";

import { Wordmark } from "@/components/wordmark";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Wordmark />
          <p className="max-w-xs text-xs text-muted">
            A CS2 skins marketplace. We show the number and fill the order.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-muted">
          <Link href="/catalog" className="hover:text-text">
            Catalog
          </Link>
          <Link href="/account" className="hover:text-text">
            Account
          </Link>
          <Link href="/orders" className="hover:text-text">
            Orders
          </Link>
          <a
            href="https://t.me/floatline"
            className="hover:text-text"
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram
          </a>
          <Link href="/terms" className="hover:text-text">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-text">
            Privacy
          </Link>
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted">
          Not affiliated with Valve. Prices in USD; EUR/GBP shown for reference.
        </p>
      </div>
    </footer>
  );
}
