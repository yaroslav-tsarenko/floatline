import Link from "next/link";
import type { Metadata } from "next";

import { ContentPage, Section } from "@/components/content-page";

export const metadata: Metadata = {
  title: "About",
  description:
    "Floatline is a CS2 skins marketplace built around one idea: show the real number and fill the order.",
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About Floatline"
      intro="A CS2 skins marketplace built around one idea: show the real number and fill the order."
    >
      <Section heading="What we do">
        <p>
          Floatline aggregates skin listings across dozens of markets and
          surfaces the genuine price — the one you actually pay — next to the
          Steam reference and the item&apos;s float. When you buy, the skin is
          delivered directly from the seller as a Steam trade, typically within
          minutes.
        </p>
      </Section>

      <Section heading="Why we built it">
        <p>
          Buying skins usually means bouncing between marketplaces, guessing at
          real prices, and hoping a manual fulfillment goes through. We wanted a
          single place where the number is honest, delivery is automatic, and a
          failed trade refunds itself instead of turning into a support saga.
        </p>
      </Section>

      <Section heading="How we make money">
        <p>
          We add a small, transparent margin over the aggregated market price.
          There are no per-purchase card fees and no surprise charges at
          checkout — you fund a USD balance and spend from it.
        </p>
      </Section>

      <Section heading="Not affiliated with Valve">
        <p>
          Floatline is an independent marketplace. Counter-Strike 2 and Steam
          are trademarks of Valve Corporation; we are not affiliated with or
          endorsed by Valve.
        </p>
      </Section>

      <p className="text-sm text-muted">
        Questions? Reach us on{" "}
        <Link href="/support" className="text-signal hover:underline">
          our support page
        </Link>
        .
      </p>
    </ContentPage>
  );
}
