import Link from "next/link";
import type { Metadata } from "next";

import { ContentPage, Section } from "@/components/content-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Payment Policy",
  description: `Currencies, cards, payment authorisation, invoicing and security checks on ${SITE.name}.`,
  alternates: { canonical: "/payments" },
};

export default function PaymentsPage() {
  return (
    <ContentPage
      title="Payment Policy"
      intro="This Policy describes available currencies and cards, payment authorisation, invoicing, security checks and payment corrections."
      updated="August 2026"
    >
      <Section heading="1. Seller and payment obligation">
        <p>
          {SITE.company.legalName} is the seller and issues the invoice for each
          accepted order. By submitting an order, you authorise the displayed total
          to be charged to your selected payment method.
        </p>
      </Section>

      <Section heading="2. Accepted methods and currencies">
        <p>
          Eligible Visa and Mastercard cards are accepted. Purchases may be made in
          EUR, GBP or USD, subject to availability displayed at checkout.
        </p>
        <p>
          The currency selected and total payable are displayed before confirmation
          and recorded in the order confirmation and invoice.
        </p>
      </Section>

      <Section heading="3. Prices and taxes">
        <p>
          The displayed total includes all taxes charged by {SITE.company.legalName}{" "}
          in connection with the purchase. No additional Company charge is added
          after confirmation unless clearly disclosed beforehand and expressly
          accepted.
        </p>
        <p>
          Your card issuer may apply currency conversion, foreign transaction or
          other charges under its own terms. {SITE.name} does not control those
          charges.
        </p>
      </Section>

      <Section heading="4. Payment processing">
        <p>
          Payments are processed with the assistance of an authorised third-party
          payment service provider. Information required to complete the payment
          will be displayed through the secure checkout interface, and the payment
          descriptor may appear on the card statement.
        </p>
        <p>
          Payment card data is entered through the secure payment interface.{" "}
          {SITE.name} may receive limited transaction and risk information rather
          than the full card number or card security code. Never send complete card
          credentials by email or support message.
        </p>
      </Section>

      <Section heading="5. Authorisation and authentication">
        <p>
          A payment may require bank authorisation, 3-D Secure or another strong
          customer authentication step. An order cannot be accepted if payment is
          declined, authentication is incomplete or the transaction cannot be
          confirmed.
        </p>
        <p>
          A temporary authorisation shown by your bank is not necessarily a
          completed charge. If an order is not accepted, the release time for an
          authorisation depends on the bank or card issuer.
        </p>
      </Section>

      <Section heading="6. Order acceptance and invoice">
        <p>
          Payment authorisation does not by itself create a purchase contract. The
          contract is concluded when {SITE.company.legalName} accepts the order and
          sends an order confirmation or invoice.
        </p>
        <p>
          The invoice identifies {SITE.company.legalName}, the purchased Item,
          price, currency and applicable transaction information.
        </p>
      </Section>

      <Section heading="7. Security checks">
        <p>
          We or our payment partners may assess location, device, account, card,
          authentication and transaction information to prevent fraud and comply
          with legal or card-network requirements.
        </p>
        <p>
          We may request reasonable information confirming account ownership,
          identity, location or payment authorisation. If a payment presents an
          unacceptable risk, the order may be rejected or cancelled and collected
          funds for an undelivered Item returned, subject to lawful restrictions.
        </p>
      </Section>

      <Section heading="8. Failed, pending or duplicate payments">
        <p>
          If payment fails, do not repeatedly submit the same order without checking
          its status. A repeated attempt may create multiple authorisations.
        </p>
        <p>
          If you believe you were charged more than once, contact {SITE.contactEmail}{" "}
          with the order number, payment date, amount and a redacted bank record
          showing the entries. Do not send a full card number or security code.
        </p>
        <p>
          A confirmed duplicate charge will be returned to the original payment
          method.
        </p>
      </Section>

      <Section heading="9. Refunds">
        <p>
          Approved refunds are returned to the original payment method and in the
          original transaction currency unless applicable law requires another
          method. Currency conversion differences or bank fees imposed by the card
          issuer are outside {SITE.name}’s control.
        </p>
        <p>
          After {SITE.name} initiates a refund, the time before it appears depends
          on the payment provider, card network and issuing bank. Further rules are
          stated in the{" "}
          <Link href="/refunds" className="text-signal hover:underline">
            Refund, Cancellation and Withdrawal Policy
          </Link>
          .
        </p>
      </Section>

      <Section heading="10. Chargebacks">
        <p>
          Contact us before initiating a chargeback so we can investigate and, where
          appropriate, refund or correct the transaction. An unjustified chargeback
          relating to a correctly delivered Item may result in account restriction
          and submission of order, payment and Steam delivery records to the payment
          parties handling the dispute.
        </p>
      </Section>

      <Section heading="11. No stored value">
        <p>
          {SITE.name} does not provide a bank account, payment account, stored-value
          balance, cash withdrawal or cash redemption service. Payments are accepted
          only for purchasing Items offered through the Service.
        </p>
      </Section>

      <Section heading="12. Contact">
        <p>
          Payment questions may be sent to{" "}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-signal hover:underline"
          >
            {SITE.contactEmail}
          </a>
          . Include your order or invoice number but never send full card
          credentials.
        </p>
      </Section>
    </ContentPage>
  );
}
