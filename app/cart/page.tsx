import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the skins you're about to buy.",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight">
        Cart
      </h1>
      <EmptyState
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
            aria-hidden
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        }
        title="Your cart is empty"
        body="Add skins from the catalog and they'll wait here until you're ready to check out."
        cta={{ href: "/catalog", label: "Find a skin" }}
      />
    </div>
  );
}
