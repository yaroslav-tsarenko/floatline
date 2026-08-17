import Link from "next/link";
import type { Metadata } from "next";

import { ContentPage, Section } from "@/components/content-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund, Cancellation and Withdrawal Policy",
  description: `When an order may be cancelled, when a full refund is available and how withdrawal rights apply on ${SITE.name}.`,
  alternates: { canonical: "/refunds" },
};

export default function RefundsPage() {
  return (
    <ContentPage
      title="Refund, Cancellation and Withdrawal Policy"
      intro="This Policy explains when an order may be cancelled, when a full refund is available and how statutory withdrawal rights apply to immediate digital delivery."
      updated="August 2026"
    >
      <Section heading="1. General principle">
        <p>
          {SITE.company.legalName} aims to deliver the exact Item ordered. Refunds
          are available for non-delivery, cancellation, duplicate payment, material
          delivery error and any other circumstance required by applicable law.
        </p>
      </Section>

      <Section heading="2. Cancellation before delivery">
        <p>
          You may request cancellation before an order is accepted or before
          delivery begins. Because fulfilment is normally initiated within minutes,
          cancellation cannot be guaranteed once an order has been accepted and a
          Steam trade offer is being prepared or sent.
        </p>
        <p>
          {SITE.name} may cancel before delivery if the Item becomes unavailable,
          the price or Item information contains a clear error, payment cannot be
          confirmed, the transaction presents a fraud or legal risk, Steam prevents
          delivery or another legitimate reason prevents performance.
        </p>
      </Section>

      <Section heading="3. Non-delivery within 24 hours">
        <p>
          Unless delay is caused by the buyer, if the Item is not delivered within
          24 hours after order confirmation, {SITE.name} will cancel the order and
          initiate a full refund to the original payment method.
        </p>
        <p>
          The deadline is suspended while delivery is prevented by an incorrect
          Trade URL, inaccessible or full inventory, Steam restriction, incomplete
          confirmation, failure to accept a correct offer within 60 minutes,
          inaccurate information or failure to cooperate.
        </p>
      </Section>

      <Section heading="4. Successful delivery">
        <p>
          Once the correct Item has been accepted and transferred to the buyer’s
          Steam account, the order is treated as delivered. A refund is not
          provided merely because the buyer changes their mind, dislikes the Item,
          observes a later price change or can no longer transfer the Item because
          of a Steam restriction.
        </p>
        <p>
          This rule does not limit mandatory consumer remedies for an Item that
          materially differs from the order or otherwise does not conform to the
          contract.
        </p>
      </Section>

      <Section heading="5. Incorrect Item or material discrepancy">
        <p>
          You must review the trade offer before acceptance. If the offered Item is
          incorrect, do not accept it and contact us immediately.
        </p>
        <p>
          If an incorrect Item was transferred or the delivered Item materially
          differs from the confirmed order, contact us promptly with the order
          number and supporting evidence. We will investigate and provide an
          appropriate remedy, which may include correct delivery, replacement,
          price reduction, cancellation or refund as required by law and
          technically possible.
        </p>
      </Section>

      <Section heading="6. Duplicate or incorrect charge">
        <p>
          A confirmed duplicate charge or amount charged in error will be returned
          to the original payment method. Submit the order number, charge date,
          amount and a redacted statement showing the relevant entries. Do not send
          complete card credentials.
        </p>
      </Section>

      <Section heading="7. Unauthorised transactions">
        <p>
          If you believe your account or payment method was used without
          authorisation, notify {SITE.name} and your card issuer promptly. We may
          secure the account, suspend delivery and request information reasonably
          necessary to investigate.
        </p>
      </Section>

      <Section heading="8. Statutory withdrawal rights">
        <p>
          Consumers may have a statutory right to withdraw from certain distance
          contracts within 14 days. Different rules may apply where digital content
          is supplied immediately and not on a tangible medium.
        </p>
        <p>
          To receive immediate delivery, checkout may require you to expressly
          request performance before the end of the withdrawal period and
          acknowledge that, where permitted by law, you lose the withdrawal right
          once supply begins or is completed.
        </p>
        <p>
          A withdrawal right is lost only where the legal requirements for that loss
          have been satisfied. If those requirements were not satisfied, or if
          mandatory law grants another remedy, this Policy does not restrict it.
        </p>
      </Section>

      <Section heading="9. How to request cancellation or refund">
        <p>
          Email{" "}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-signal hover:underline"
          >
            {SITE.contactEmail}
          </a>{" "}
          and include:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>your name and registered email address;</li>
          <li>order or invoice number;</li>
          <li>payment date, amount and currency;</li>
          <li>relevant Steam ID;</li>
          <li>reason for the request; and</li>
          <li>screenshots or records reasonably supporting the request.</li>
        </ul>
        <p>
          Never send a full card number, card security code, password or Steam Guard
          code.
        </p>
      </Section>

      <Section heading="10. Refund method and timing">
        <p>
          Approved refunds are initiated to the original payment method and in the
          original transaction currency unless applicable law requires another
          method.
        </p>
        <p>
          Where a statutory withdrawal refund is due, {SITE.name} will process it
          without undue delay and within the time required by applicable law. For
          other approved refunds, processing begins promptly after approval. The
          date funds become visible depends on the payment provider, card network
          and issuing bank.
        </p>
        <p>
          {SITE.name} is not responsible for currency conversion differences or fees
          imposed independently by the card issuer.
        </p>
      </Section>

      <Section heading="11. Chargebacks">
        <p>
          Please contact {SITE.name} before initiating a chargeback. This gives us
          an opportunity to correct non-delivery, duplication or another genuine
          error.
        </p>
        <p>
          If a chargeback is filed for a correctly delivered Item, we may provide
          the payment parties with the order confirmation, invoice, account records
          and Steam delivery evidence necessary to respond. Fraudulent or abusive
          disputes may result in account restriction.
        </p>
      </Section>

      <Section heading="12. Complaints">
        <p>
          Written consumer complaints are answered within 15 days. If an eligible
          consumer dispute remains unresolved, the consumer may contact the Consumer
          Disputes Committee through{" "}
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
