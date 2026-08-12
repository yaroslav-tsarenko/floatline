import type { Metadata } from "next";

import { ContentPage, Section } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with orders, delivery, float, and your balance.",
};

const FAQ = [
  {
    q: "Is buying here safe?",
    a: "Yes. You fund a balance and spend from it — we never ask for card details per skin. Items are delivered by trade directly from the seller.",
  },
  {
    q: "How long does delivery take?",
    a: "Most trades arrive within minutes of confirming. You accept the offer in Steam like any other trade.",
  },
  {
    q: "What if the trade fails?",
    a: "Your balance is automatically refunded. Money is only final once the item is safely in your inventory.",
  },
  {
    q: "Do I need Steam Guard?",
    a: "Yes — Steam Guard must be enabled to receive trades. It also protects your account.",
  },
  {
    q: "Why do you need my trade link?",
    a: "The trade link is how the seller sends you the item. You can paste it in your account settings.",
  },
  {
    q: "Which currency am I charged in?",
    a: "Always USD. EUR and GBP are shown for reference at today's rate; the charge itself is in USD.",
  },
];

export default function SupportPage() {
  return (
    <ContentPage
      title="Support"
      intro="Answers to the common questions. Still stuck? We're one email away."
    >
      <div className="rounded-lg border border-border bg-surface-2 p-5">
        <p className="font-medium">Talk to a human</p>
        <p className="mt-1 text-sm text-muted">
          Real answers about float, delivery, and orders — usually within the
          hour.
        </p>
        <a
          href="mailto:info@floatline.gg"
          className="mt-3 inline-block rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:brightness-110"
        >
          Email us
        </a>
      </div>

      <Section heading="Frequently asked">
        <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {FAQ.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-text marker:content-none hover:bg-surface-2">
                {f.q}
                <span className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-4 pb-4 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </ContentPage>
  );
}
