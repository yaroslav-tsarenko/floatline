import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Skins you're watching — get notified when the price drops.",
};

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight">
        Wishlist
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
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        }
        title="Your wishlist is empty"
        body="Save skins while you browse and we'll keep an eye on the float and the price for you."
        cta={{ href: "/catalog", label: "Browse the catalog" }}
      />
    </div>
  );
}
