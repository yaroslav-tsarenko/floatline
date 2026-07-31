import type { Metadata } from "next";

import { ContentPage, Section } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Floatline.",
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of Service"
      intro="These terms govern your use of Floatline. By creating an account or making a purchase, you agree to them."
      updated="July 2026"
    >
      <Section heading="1. Accounts">
        <p>
          You must provide accurate information and keep your credentials
          secure. You are responsible for activity under your account. To
          receive items you must link a Steam account with Steam Guard enabled.
        </p>
      </Section>

      <Section heading="2. Purchases and balance">
        <p>
          Purchases are made from a prepaid balance denominated in USD. Prices
          are aggregated from third-party markets and may change until the
          moment you confirm. We re-check the price at confirmation and will not
          charge you if it has moved beyond tolerance without your consent.
        </p>
      </Section>

      <Section heading="3. Delivery">
        <p>
          Skins are delivered as Steam trade offers from the seller. Delivery
          times are estimates, not guarantees, and depend on Steam and the
          seller. A purchase is considered complete once the item is in your
          inventory.
        </p>
      </Section>

      <Section heading="4. Refunds">
        <p>
          If a trade cannot be completed, the corresponding amount is credited
          back to your balance automatically. See our refund policy for
          details.
        </p>
      </Section>

      <Section heading="5. Prohibited use">
        <p>
          You may not use Floatline for fraud, money laundering, or any activity
          that violates Steam&apos;s Subscriber Agreement or applicable law. We
          may suspend accounts we reasonably believe are engaged in such
          activity.
        </p>
      </Section>

      <Section heading="6. Disclaimers">
        <p>
          Floatline is provided &quot;as is.&quot; We are not affiliated with or
          endorsed by Valve Corporation. Counter-Strike 2 and Steam are
          trademarks of Valve.
        </p>
      </Section>

      <Section heading="7. Changes">
        <p>
          We may update these terms from time to time. Material changes will be
          reflected in the &quot;last updated&quot; date above.
        </p>
      </Section>
    </ContentPage>
  );
}
