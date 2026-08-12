import type { Metadata } from "next";

import { ContentPage, Section } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data Floatline collects and how we use it.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      intro="What we collect, why we collect it, and the choices you have."
      updated="July 2026"
    >
      <Section heading="What we collect">
        <p>
          Account data (email, and — once linked — your SteamID and trade link),
          transaction and order history, and basic technical data such as your
          IP address and device information needed to operate the service
          securely.
        </p>
      </Section>

      <Section heading="How we use it">
        <p>
          To create and secure your account, process purchases, deliver items
          via Steam trades, prevent fraud, and provide support. We do not sell
          your personal data.
        </p>
      </Section>

      <Section heading="Payment data">
        <p>
          Balance top-ups are handled by our payment provider. We do not store
          full card numbers on our servers; that data is processed by the
          provider under their own terms.
        </p>
      </Section>

      <Section heading="Third parties">
        <p>
          We share the minimum data necessary with the seller and Steam to
          deliver a trade, and with our payment and infrastructure providers to
          run the service. Each is bound by their own privacy obligations.
        </p>
      </Section>

      <Section heading="Retention">
        <p>
          We keep account and transaction records for as long as your account is
          active and as required to meet legal, tax, and anti-fraud obligations.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can request access to or deletion of your personal data by
          contacting us at info@floatline.gg. Some records must be retained
          where the law requires it.
        </p>
      </Section>
    </ContentPage>
  );
}
