import Link from "next/link";
import type { Metadata } from "next";

import { ContentPage, Section } from "@/components/content-page";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How buying CS2 skins on Floatline works — from picking a float to accepting the trade in Steam.",
};

const STEPS = [
  {
    n: "1",
    title: "Browse at the real number",
    body: "Every listing shows a live price aggregated across 28+ markets, alongside the Steam reference and the exact float. No hidden markup at checkout.",
  },
  {
    n: "2",
    title: "Fund your balance",
    body: "Top up once in USD. You spend from that balance per purchase, so we never touch your card details on a per-skin basis.",
  },
  {
    n: "3",
    title: "Confirm the buy",
    body: "We re-check the price against the market the moment you confirm. If it moved, we tell you before anything is charged.",
  },
  {
    n: "4",
    title: "Accept in Steam",
    body: "A trade offer lands in your inventory directly from the seller, usually within minutes. Accept it like any other trade.",
  },
];

export default function HowItWorksPage() {
  return (
    <ContentPage
      title="How it works"
      intro="Buying a skin here is four steps. The price you see is the price you pay."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-lg border border-border bg-surface p-5"
          >
            <div className="num text-sm text-signal">Step {s.n}</div>
            <div className="mt-1 font-medium text-text">{s.title}</div>
            <p className="mt-1 text-sm text-muted">{s.body}</p>
          </div>
        ))}
      </div>

      <Section heading="Why link Steam?">
        <p>
          Skins are delivered as Steam trade offers, so we need your Steam
          identity and trade link to send the item. You can sign up with email
          first and link Steam right before your first purchase.
        </p>
      </Section>

      <Section heading="What if a trade fails?">
        <p>
          Money is only final once the item is in your inventory. If a trade
          falls through, your balance is credited back automatically — no
          support ticket required. See our{" "}
          <Link href="/refunds" className="text-signal hover:underline">
            refund policy
          </Link>{" "}
          for details.
        </p>
      </Section>

      <div className="rounded-lg border border-border bg-surface-2 p-5 text-center">
        <p className="font-medium">Ready to find your float?</p>
        <Link
          href="/catalog"
          className="mt-3 inline-block rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-white hover:brightness-110"
        >
          Browse the catalog
        </Link>
      </div>
    </ContentPage>
  );
}
