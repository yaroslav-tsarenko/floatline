import Link from "next/link";
import type { Metadata } from "next";

import { ContentPage, Section } from "@/components/content-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Digital Item Delivery Policy",
  description: `How ${SITE.name} delivers purchased Items through Steam, normally within minutes and no later than 24 hours.`,
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
  return (
    <ContentPage
      title="Digital Item Delivery Policy"
      intro={`${SITE.name} delivers purchased Items through Steam, normally within minutes and no later than 24 hours unless delivery is prevented by the buyer.`}
      updated="August 2026"
    >
      <Section heading="1. Digital delivery only">
        <p>
          All Items are digital in-game content delivered through Steam. No physical
          goods are shipped and no postal delivery address is required for
          fulfilment.
        </p>
      </Section>

      <Section heading="2. Delivery methods">
        <p>
          Depending on the account holding the selected Item, delivery may be
          completed:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            through a Steam bot operated by or on behalf of a confidential
            fulfilment provider; or
          </li>
          <li>
            directly from the Steam account currently holding the Item to the
            buyer’s Steam account.
          </li>
        </ul>
        <p>
          {SITE.company.legalName} remains the seller and contractual counterparty
          regardless of the account used to deliver the Item.
        </p>
      </Section>

      <Section heading="3. Buyer requirements">
        <p>Before ordering and throughout delivery, you must:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>use a Steam account that belongs to or is lawfully controlled by you;</li>
          <li>provide a valid and current Steam Trade URL;</li>
          <li>
            ensure the Trade URL corresponds to the Steam account linked to your{" "}
            {SITE.name} account;
          </li>
          <li>ensure the account can receive trade offers;</li>
          <li>keep the inventory accessible where required for verification;</li>
          <li>maintain sufficient inventory capacity;</li>
          <li>complete required Steam Guard or mobile confirmations; and</li>
          <li>review every trade offer carefully before accepting it.</li>
        </ul>
      </Section>

      <Section heading="4. Delivery process">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            After payment and order acceptance, {SITE.name} identifies the account
            or bot holding the purchased Item.
          </li>
          <li>
            A Steam trade offer containing the Item is sent to the Steam account
            designated by the buyer.
          </li>
          <li>The buyer reviews the sender, Item and offer contents.</li>
          <li>The buyer accepts and completes any confirmation required by Steam.</li>
          <li>{SITE.name} verifies the Steam transfer and updates the order status.</li>
        </ul>
      </Section>

      <Section heading="5. Timing">
        <p>
          Delivery is normally initiated within a few minutes after order
          confirmation. This is an estimate rather than a guarantee of immediate
          delivery.
        </p>
        <p>
          Unless delay is caused by the buyer, {SITE.name} will complete delivery
          within 24 hours after order confirmation. If delivery cannot be completed
          within that period, the order will be cancelled and a full refund
          initiated to the original payment method.
        </p>
      </Section>

      <Section heading="6. Sixty-minute offer period">
        <p>
          A Steam trade offer will normally remain available for 60 minutes after it
          is sent. You must accept the correct offer within that period.
        </p>
        <p>
          If the offer expires, you may request another offer through the available
          account or support process. Re-sending remains subject to Steam
          availability, security checks and continued transferability of the Item.
        </p>
      </Section>

      <Section heading="7. Buyer-caused delay">
        <p>
          The 24-hour period is suspended while delivery cannot be completed because:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>the Trade URL is incorrect, inactive or linked to another account;</li>
          <li>the Steam account or inventory is private or inaccessible;</li>
          <li>the inventory is full;</li>
          <li>
            Steam Guard, a trade hold, trade ban, community ban or another
            restriction prevents transfer;
          </li>
          <li>the buyer fails to complete a Steam confirmation;</li>
          <li>the buyer does not accept a correct offer within 60 minutes;</li>
          <li>the buyer provides inaccurate information; or</li>
          <li>
            the buyer does not provide cooperation reasonably required to resolve
            the issue.
          </li>
        </ul>
        <p>
          {SITE.name} will provide reasonable instructions where possible. If the
          problem is not resolved within a reasonable period, the order may be
          cancelled and any undelivered Item refunded under the{" "}
          <Link href="/refunds" className="text-signal hover:underline">
            Refund, Cancellation and Withdrawal Policy
          </Link>
          .
        </p>
      </Section>

      <Section heading="8. Other delays">
        <p>
          Delivery may also be delayed by Steam downtime or instability,
          maintenance, security checks, fraud review, synchronisation delays,
          temporary unavailability of a bot or holding account, or another event
          outside our reasonable control. These events do not extend {SITE.name}’s
          24-hour obligation unless the delay is attributable to the buyer.
        </p>
      </Section>

      <Section heading="9. Completion">
        <p>
          Delivery is complete when the correct trade offer is accepted and Steam
          records the Item as transferred to the buyer’s Steam account.
        </p>
        <p>
          Steam may temporarily mark an Item as trade protected or restrict its
          onward transfer, modification or consumption. The existence of such a Steam
          restriction does not mean delivery failed if the Item was transferred to
          and is visible in the buyer’s inventory.
        </p>
      </Section>

      <Section heading="10. Incorrect or incomplete delivery">
        <p>
          Do not accept an offer if its contents do not match the order. Contact{" "}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-signal hover:underline"
          >
            {SITE.contactEmail}
          </a>{" "}
          immediately with the order number and screenshots.
        </p>
        <p>
          If an order contains multiple Items, delivery may occur through more than
          one trade offer. Each correctly transferred Item is treated as delivered.
          Any missing Item remains subject to the 24-hour deadline and applicable
          refund rights.
        </p>
      </Section>

      <Section heading="11. Steam reversal and abuse">
        <p>
          You must not misuse a Steam protection, support or reversal mechanism to
          undo a legitimate delivery. {SITE.name} may restrict the account, recover
          losses and provide relevant records to payment providers, Steam or
          competent authorities where legally appropriate.
        </p>
      </Section>

      <Section heading="12. Support">
        <p>
          For delivery assistance, email{" "}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-signal hover:underline"
          >
            {SITE.contactEmail}
          </a>{" "}
          and provide the order number, registered email, Steam ID, Trade URL and a
          description of the issue. Never send your Steam password, email password or
          payment card security code.
        </p>
      </Section>
    </ContentPage>
  );
}
