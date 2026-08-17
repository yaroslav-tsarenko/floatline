import Link from "next/link";
import type { Metadata } from "next";

import { CompanyDetails, ContentPage, Section } from "@/components/content-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that govern your use of ${SITE.name}, operated by ${SITE.company.legalName}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of Service"
      intro={`These Terms govern access to and use of ${SITE.domain}, ${SITE.name} accounts and purchases of Counter-Strike 2 digital items from ${SITE.company.legalName}. By creating an account, placing an order or otherwise using the Service, you confirm that you have read, understood and agreed to these Terms. If you do not agree, you must not use the Service.`}
      updated="August 2026"
    >
      <CompanyDetails
        heading="1. Operator and definitions"
        intro={`In these Terms, “${SITE.name},” “Company,” “we,” “us” and “our” refer to ${SITE.company.legalName}. “User,” “you” and “your” refer to the person accessing or using the Service. “Item” means a digital in-game item associated with Counter-Strike 2. “Service” means ${SITE.domain}, related accounts, purchasing functionality and associated services.`}
      />

      <Section heading="2. About the Service">
        <p>
          {SITE.name} enables eligible users to purchase Items. Users cannot sell
          Items to {SITE.name}, withdraw funds or redeem Items for cash through
          the Service.
        </p>
        <p>
          {SITE.company.legalName} is the seller and contractual counterparty for
          each accepted order and issues the corresponding invoice.
        </p>
        <p>
          {SITE.name} may obtain inventory information and arrange fulfilment
          through confidential third-party inventory, technology and fulfilment
          providers. Their identity constitutes confidential commercial
          information and will not be disclosed unless required by applicable law
          or a competent authority.
        </p>
        <p>
          Depending on where an Item is held, delivery may be made by a bot
          operated by or on behalf of a fulfilment provider or directly from the
          Steam account currently holding the Item to the buyer’s Steam account.
          This delivery arrangement does not change {SITE.company.legalName}’s
          position as seller.
        </p>
      </Section>

      <Section heading="3. Relationship with Steam and Valve">
        <p>
          {SITE.name} is independent and is not affiliated with, sponsored by,
          endorsed by or operated by Valve Corporation or Steam. Steam,
          Counter-Strike, Counter-Strike 2 and related names, trademarks, images
          and game assets belong to their respective owners.
        </p>
        <p>
          The possession, transfer, functionality and availability of Items
          remain subject to Steam’s rules, technical systems, security measures,
          trade restrictions and user agreements. {SITE.name} does not control
          Steam and cannot guarantee that Valve will not modify the
          characteristics, transferability, usability or availability of an Item.
        </p>
      </Section>

      <Section heading="4. Eligibility and restricted countries">
        <p>
          You must be at least 18 years old, have legal capacity to enter into a
          binding contract and be legally permitted to use the Service.
        </p>
        <p>
          The Service is unavailable to persons located in, ordinarily resident
          in or accessing the Service from Afghanistan, Belarus, Central African
          Republic, Cuba, Democratic Republic of the Congo, Haiti, Iran, Iraq,
          Mali, Myanmar (Burma), North Korea, Russia, Somalia, South Sudan,
          Sudan, Syria, Venezuela, Yemen or Zimbabwe.
        </p>
        <p>
          You must not use a virtual private network, proxy, false address or
          other method to conceal or misrepresent your location. Additional
          restrictions may be applied where reasonably required by law,
          sanctions, security obligations, payment restrictions or a competent
          authority.
        </p>
      </Section>

      <Section heading="5. Accounts">
        <p>
          An account may be created using an email address or supported Steam
          Login functionality. You must provide accurate, current and complete
          information and keep it updated.
        </p>
        <p>
          Your account is personal. You must not sell, transfer or share it; use
          another person’s account; allow another person to make purchases
          through it; or create multiple accounts to evade limits or enforcement
          measures.
        </p>
        <p>
          You are responsible for protecting your login credentials and for
          activity conducted through your account. Notify {SITE.contactEmail}{" "}
          promptly if you believe that your {SITE.name} account, email address,
          Steam account or credentials have been compromised.
        </p>
        <p>
          The Steam account used for delivery must belong to or be lawfully
          controlled by you. We may require the Steam account, Steam identifier
          and Trade URL to correspond with information connected to your{" "}
          {SITE.name} account.
        </p>
      </Section>

      <Section heading="6. Item information">
        <p>
          Before ordering, you must review the displayed Item information,
          including its name, exterior or wear condition, float value, paint seed
          or pattern, stickers, charms, StatTrak or Souvenir status, available
          images, price and trade restrictions, where applicable.
        </p>
        <p>
          You must review the contents of the Steam trade offer before accepting
          it. If the offer does not correspond to your order, do not accept it and
          contact us immediately.
        </p>
        <p>
          Inventory data may be supplied through third-party systems. An Item may
          become unavailable before acceptance due to another transaction, a Steam
          restriction, a synchronisation delay or another event outside our
          reasonable control. Displaying an Item is an invitation to place an
          order and does not guarantee availability.
        </p>
      </Section>

      <Section heading="7. Prices, currencies and taxes">
        <p>
          Purchases may be completed in euros (EUR), pounds sterling (GBP) or
          United States dollars (USD). The total price displayed before submission
          includes all taxes charged by the Company in connection with the
          purchase.
        </p>
        <p>
          Your bank or card issuer may apply currency conversion, cross-border or
          other fees under its own terms. Those charges are not imposed or
          controlled by {SITE.name}.
        </p>
        <p>
          Prices may change before an order is accepted. A change will not affect
          an accepted order. If a displayed price is clearly incorrect because of
          a technical, typographical, synchronisation or data error, we may reject
          or cancel the order and return any collected payment.
        </p>
      </Section>

      <Section heading="8. Orders and contract formation">
        <p>
          By submitting an order, you offer to purchase the selected Item at the
          displayed total price and confirm that the Item, Steam account, Trade
          URL and payment information are correct.
        </p>
        <p>
          A payment authorisation or automated acknowledgement does not by itself
          constitute acceptance. The purchase contract is concluded when{" "}
          {SITE.company.legalName} confirms the order and issues an order
          confirmation or invoice.
        </p>
        <p>
          We may reject or cancel an order before delivery if the Item is
          unavailable, information contains a clear error, payment cannot be
          confirmed, the transaction presents a fraud or legal risk, Steam
          prevents delivery or another legitimate reason prevents performance.
          Collected payment for an undelivered Item will be returned under the{" "}
          <Link href="/refunds" className="text-signal hover:underline">
            Refund, Cancellation and Withdrawal Policy
          </Link>
          .
        </p>
      </Section>

      <Section heading="9. Payment">
        <p>
          Eligible Visa and Mastercard cards are accepted. Payments may be
          processed through an authorised third-party payment service provider and
          may be subject to card issuer checks, strong customer authentication or
          other security controls.
        </p>
        <p>
          You authorise the displayed total to be charged to your selected payment
          method. You must not use an unauthorised payment method, provide false
          billing information, conceal the true payer or beneficiary, or initiate
          an unjustified chargeback for a correctly delivered Item.
        </p>
        <p>
          Further terms are stated in the{" "}
          <Link href="/payments" className="text-signal hover:underline">
            Payment Policy
          </Link>
          .
        </p>
      </Section>

      <Section heading="10. Delivery">
        <p>
          Items are delivered digitally through Steam. Delivery is normally
          initiated within a few minutes after payment and order confirmation.
        </p>
        <p>
          Unless delay is caused by you, {SITE.name} will complete delivery within
          24 hours after order confirmation or cancel the order and provide a full
          refund to the original payment method.
        </p>
        <p>
          The 24-hour period is suspended while delivery cannot be completed
          because of an incorrect or inactive Trade URL, an inaccessible or full
          inventory, a Steam restriction, failure to complete a confirmation,
          failure to accept a correct offer, inaccurate information or failure to
          provide reasonably required cooperation.
        </p>
        <p>
          A Steam trade offer will normally remain available for 60 minutes. If it
          expires, you may request another offer, subject to Steam availability,
          security checks and the Item remaining transferable.
        </p>
        <p>
          Delivery is complete when the correct offer is accepted and Steam records
          the Item as transferred to your account. A temporary Steam protection,
          reversal, transfer, modification or consumption restriction does not mean
          delivery failed if the Item was transferred to and is visible in your
          inventory.
        </p>
        <p>
          You must not misuse Steam protection or reversal functions to interfere
          with a legitimate delivery. Further terms are stated in the{" "}
          <Link href="/delivery" className="text-signal hover:underline">
            Digital Item Delivery Policy
          </Link>
          .
        </p>
      </Section>

      <Section heading="11. Cancellations, refunds and withdrawal">
        <p>
          An order may be cancelled and refunded where {SITE.name} cannot deliver
          within the applicable 24-hour period for reasons not caused by you, the
          Item becomes unavailable, payment was duplicated, {SITE.name} cancels
          before delivery or a refund is required by law.
        </p>
        <p>
          Because Items are digital content supplied through Steam, checkout may
          require you to expressly request immediate delivery before the end of a
          statutory withdrawal period and acknowledge that, where legally
          permitted, the withdrawal right is lost once supply begins or is
          completed. Any loss of that right applies only where all legal
          conditions are met.
        </p>
        <p>
          Acceptance of an Item does not remove mandatory remedies where the Item
          materially differs from the order or does not conform to the contract.
          Further terms are stated in the{" "}
          <Link href="/refunds" className="text-signal hover:underline">
            Refund, Cancellation and Withdrawal Policy
          </Link>
          .
        </p>
      </Section>

      <Section heading="12. Acceptable use">
        <p>You must not use or attempt to use the Service to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>violate applicable law, sanctions or third-party rights;</li>
          <li>
            commit fraud, payment abuse, identity theft or chargeback abuse;
          </li>
          <li>obtain an Item without valid payment;</li>
          <li>
            use another person’s account or payment method without permission;
          </li>
          <li>misrepresent your identity, age, residence or location;</li>
          <li>manipulate prices, Item data, orders or delivery records;</li>
          <li>
            interfere with bots, APIs, security measures or technical
            infrastructure;
          </li>
          <li>introduce malware or harmful code;</li>
          <li>
            scrape or extract data through automated means without written
            permission;
          </li>
          <li>
            exploit bugs, vulnerabilities, errors or synchronisation delays;
          </li>
          <li>
            reverse a properly completed trade through misuse of Steam functions;
            or
          </li>
          <li>
            engage in money laundering, sanctions evasion or other unlawful
            activity.
          </li>
        </ul>
      </Section>

      <Section heading="13. Security and verification">
        <p>
          We may review, delay, reject or cancel a transaction where reasonably
          necessary to protect users, investigate suspected fraud, comply with law
          or respond to a payment or security risk. We may request reasonable
          information necessary to confirm account ownership, payment
          authorisation, identity, age, residence or transaction legitimacy.
        </p>
        <p>
          If requested information is not provided within a reasonable period, we
          may decline or cancel the order. Payment for an undelivered Item will be
          handled under the Refund, Cancellation and Withdrawal Policy, subject to
          lawful restrictions.
        </p>
      </Section>

      <Section heading="14. Suspension and termination">
        <p>
          We may restrict, suspend or terminate an account where we reasonably
          believe these Terms were violated; false information was supplied; the
          account presents a fraud, sanctions, payment or security risk; the user
          is in a restricted country; or the user abused refunds, chargebacks,
          promotions, delivery or Steam protection features.
        </p>
        <p>
          A user may request account closure at {SITE.contactEmail}. Closure does
          not require deletion of information retained for legal, accounting,
          fraud-prevention, dispute-resolution or security purposes.
        </p>
      </Section>

      <Section heading="15. Intellectual property">
        <p>
          The Service, excluding third-party materials, is owned by or licensed to{" "}
          {SITE.company.legalName} and protected by applicable intellectual
          property law. We grant you a limited, personal, non-exclusive,
          non-transferable and revocable right to use the Service for lawful
          personal purposes.
        </p>
        <p>
          You must not copy, reproduce, modify, distribute, sell, license, reverse
          engineer or commercially exploit the Service except where permitted by
          law or prior written consent.
        </p>
      </Section>

      <Section heading="16. Virtual Item risks">
        <p>
          Items are digital in-game content. They are not legal tender, electronic
          money, a bank deposit, a security, a regulated investment product, a
          guarantee of profit or redeemable for cash from {SITE.name}.
        </p>
        <p>
          Prices may change significantly. {SITE.name} does not provide
          investment, financial, tax or trading advice and does not guarantee
          future value, liquidity, usability or transferability.
        </p>
      </Section>

      <Section heading="17. Availability and third parties">
        <p>
          We aim to provide a reliable Service but do not guarantee uninterrupted
          availability. We may restrict the Service for maintenance, security,
          updates, legal compliance or events affecting Steam or third-party
          systems.
        </p>
        <p>
          The Service depends on Steam, payment processing, hosting,
          communications, inventory information and fulfilment infrastructure.
          Third-party services are governed by their own terms. This does not
          exclude {SITE.company.legalName}’s responsibility as seller or liability
          that cannot lawfully be excluded.
        </p>
      </Section>

      <Section heading="18. Privacy and communications">
        <p>
          Personal data is processed under the{" "}
          <Link href="/privacy" className="text-signal hover:underline">
            Privacy Policy
          </Link>{" "}
          and cookies under the{" "}
          <Link href="/cookies" className="text-signal hover:underline">
            Cookie Policy
          </Link>
          . Transactional and service communications may be sent to your
          registered email address. You are responsible for keeping that address
          current.
        </p>
      </Section>

      <Section heading="19. Liability">
        <p>
          Nothing in these Terms excludes liability for fraud, intentional
          misconduct, gross negligence, death or personal injury caused by
          negligence, breach of mandatory consumer rights or liability that cannot
          lawfully be excluded.
        </p>
        <p>
          Subject to the preceding paragraph, {SITE.name} is not responsible for
          losses caused solely by your failure to secure credentials, inaccurate
          information, failure to accept a correct offer, restrictions on your
          Steam account, unauthorised use of your payment method not caused by our
          breach, your violation of Steam rules, or events outside our reasonable
          control.
        </p>
        <p>
          To the extent permitted by law, we are not liable for indirect or
          unforeseeable losses, loss of opportunity or changes in an Item’s
          external value. Mandatory consumer rights remain unaffected.
        </p>
      </Section>

      <Section heading="20. Complaints and disputes">
        <p>
          Send complaints to {SITE.contactEmail} with your name, account email,
          order or invoice number, relevant Steam identifier, a description,
          requested resolution and supporting records. Written consumer complaints
          will be answered within 15 days.
        </p>
        <p>
          An eligible consumer may refer an unresolved dispute to the Consumer
          Disputes Committee of the Estonian Consumer Protection and Technical
          Regulatory Authority:{" "}
          <a
            href="https://ttja.ee/en/consumer-disputes-committee"
            className="text-signal hover:underline"
            rel="noreferrer noopener"
            target="_blank"
          >
            https://ttja.ee/en/consumer-disputes-committee
          </a>
          . Consumers in another European Union country may seek assistance from
          their European Consumer Centre where applicable.
        </p>
      </Section>

      <Section heading="21. Governing law">
        <p>
          These Terms and contracts concluded under them are governed by Estonian
          law. A consumer retains mandatory protections of the law of their
          habitual residence where those protections apply regardless of this
          choice. Subject to mandatory consumer jurisdiction rules, disputes are
          subject to the competent courts of Estonia; consumers may also have the
          right to bring proceedings in their country of habitual residence.
        </p>
      </Section>

      <Section heading="22. Changes and general provisions">
        <p>
          We may update these Terms to reflect changes in the Service, law,
          security or third-party systems. The current version will be published
          with its effective date. Material changes will be communicated where
          required and will not retroactively alter an accepted order unless
          required by law or agreed with you.
        </p>
        <p>
          If a provision is invalid or unenforceable, the remaining provisions
          continue to apply. Failure to enforce a provision is not a waiver. You
          may not transfer your rights or obligations without prior written
          consent. We may transfer ours as part of a merger, restructuring or
          business transfer provided mandatory consumer protections are not
          reduced.
        </p>
      </Section>
    </ContentPage>
  );
}
