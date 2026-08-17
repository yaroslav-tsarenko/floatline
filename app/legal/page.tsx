import Link from "next/link";
import type { Metadata } from "next";

import { CompanyDetails, ContentPage, Section } from "@/components/content-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Legal Notice",
  description: `The operator of ${SITE.name} and the principal legal and contact information for ${SITE.domain}.`,
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <ContentPage
      title="Legal Notice"
      intro={`This Notice identifies the operator of ${SITE.name} and provides the principal legal and contact information for ${SITE.domain}.`}
      updated="August 2026"
    >
      <CompanyDetails
        heading="1. Website operator"
        intro={`Legal form: Estonian private limited company (osaühing / OÜ). Registered in the Estonian Commercial Register.`}
      />

      <Section heading="2. Business activity">
        <p>
          {SITE.name} provides eligible adult users with the ability to purchase
          digital Counter-Strike 2 Items. {SITE.company.legalName} is the seller and
          issues the buyer’s invoice. {SITE.name} does not allow users to sell Items
          through the Service or redeem Items for cash.
        </p>
      </Section>

      <Section heading="3. Delivery">
        <p>
          Items are delivered through Steam, either by a bot operated by or on
          behalf of a confidential fulfilment provider or directly from the Steam
          account holding the Item to the buyer’s Steam account. Delivery is
          governed by the{" "}
          <Link href="/delivery" className="text-signal hover:underline">
            Digital Item Delivery Policy
          </Link>
          .
        </p>
      </Section>

      <Section heading="4. Independence from Valve">
        <p>
          {SITE.name} is not affiliated with, sponsored by, endorsed by or operated
          by Valve Corporation or Steam. Steam, Counter-Strike, Counter-Strike 2 and
          related names, marks, images and game assets belong to their respective
          owners.
        </p>
      </Section>

      <Section heading="5. Intellectual property">
        <p>
          Unless otherwise stated, the {SITE.name} website design, text, software,
          branding and original materials are owned by or licensed to{" "}
          {SITE.company.legalName}. Third-party materials remain the property of
          their owners.
        </p>
        <p>
          No part of the website may be reproduced, distributed, modified or
          commercially exploited without permission, except where permitted by
          applicable law.
        </p>
      </Section>

      <Section heading="6. Legal documents">
        <p>Use of the Service and purchases are governed by the following documents:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/terms" className="text-signal hover:underline">
              Terms of Service
            </Link>
            ;
          </li>
          <li>
            <Link href="/privacy" className="text-signal hover:underline">
              Privacy Policy
            </Link>
            ;
          </li>
          <li>
            <Link href="/cookies" className="text-signal hover:underline">
              Cookie Policy
            </Link>
            ;
          </li>
          <li>
            <Link href="/payments" className="text-signal hover:underline">
              Payment Policy
            </Link>
            ;
          </li>
          <li>
            <Link href="/delivery" className="text-signal hover:underline">
              Digital Item Delivery Policy
            </Link>
            ; and
          </li>
          <li>
            <Link href="/refunds" className="text-signal hover:underline">
              Refund, Cancellation and Withdrawal Policy
            </Link>
            .
          </li>
        </ul>
      </Section>

      <Section heading="7. Consumer complaints">
        <p>
          Send a written complaint to{" "}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-signal hover:underline"
          >
            {SITE.contactEmail}
          </a>
          . Include sufficient information to identify the order and explain the
          requested resolution. Written consumer complaints will be answered within
          15 days.
        </p>
        <p>
          An eligible consumer may refer an unresolved contractual dispute to the
          Consumer Disputes Committee of the Estonian Consumer Protection and
          Technical Regulatory Authority:{" "}
          <a
            href="https://ttja.ee/en/consumer-disputes-committee"
            className="text-signal hover:underline"
            rel="noreferrer noopener"
            target="_blank"
          >
            https://ttja.ee/en/consumer-disputes-committee
          </a>
          .
        </p>
      </Section>

      <Section heading="8. Notices and contact">
        <p>
          Legal notices, privacy requests, payment questions, delivery issues and
          complaints may be sent to{" "}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-signal hover:underline"
          >
            {SITE.contactEmail}
          </a>{" "}
          or to the registered address stated above.
        </p>
      </Section>
    </ContentPage>
  );
}
