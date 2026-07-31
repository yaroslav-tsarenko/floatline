import Link from "next/link";
import type { Metadata } from "next";

import { ContentPage, Section } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "When and how refunds happen on Floatline.",
};

export default function RefundsPage() {
  return (
    <ContentPage
      title="Refund Policy"
      intro="Money is only final once the item is in your inventory. If something goes wrong before that, you get your balance back."
      updated="July 2026"
    >
      <Section heading="Automatic refunds">
        <p>
          If a trade cannot be completed — the seller can&apos;t deliver, the
          item goes out of stock, or the trade offer fails — the full amount is
          credited back to your Floatline balance automatically. No ticket, no
          waiting on a human.
        </p>
      </Section>

      <Section heading="Delivered items">
        <p>
          Once a skin is successfully in your Steam inventory, the sale is
          complete and final. Because items are transferable digital goods, we
          can&apos;t reverse a delivered trade.
        </p>
      </Section>

      <Section heading="Balance withdrawals">
        <p>
          Your balance is meant to be spent on skins. If you need to withdraw an
          unspent balance, contact us on{" "}
          <a
            href="https://t.me/floatline"
            target="_blank"
            rel="noopener noreferrer"
            className="text-signal hover:underline"
          >
            Telegram
          </a>{" "}
          and we&apos;ll help, subject to anti-fraud checks.
        </p>
      </Section>

      <Section heading="Price changes">
        <p>
          We re-check the market price when you confirm a purchase. If it has
          moved beyond tolerance, we stop and ask before charging — so you never
          overpay because of a stale price.
        </p>
      </Section>

      <p className="text-sm text-muted">
        More questions? See{" "}
        <Link href="/support" className="text-signal hover:underline">
          Support
        </Link>
        .
      </p>
    </ContentPage>
  );
}
