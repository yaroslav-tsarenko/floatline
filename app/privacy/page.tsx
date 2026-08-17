import type { Metadata } from "next";

import { CompanyDetails, ContentPage, Section } from "@/components/content-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.company.legalName} collects and uses personal data when you use ${SITE.name}.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      intro={`This Policy explains how ${SITE.company.legalName} collects and uses personal data when you create an account, use Steam Login, purchase Items or contact ${SITE.name}.`}
      updated="August 2026"
    >
      <CompanyDetails
        heading="1. Controller"
        intro={`${SITE.company.legalName} is the controller of personal data processed through the Service. Privacy requests may be sent to ${SITE.contactEmail}.`}
      />

      <Section heading="2. Personal data we collect">
        <p className="font-medium text-text">2.1 Account and contact data</p>
        <p>
          We may process your email address, internal account identifier, account
          status, authentication records, registration date, settings and
          communications preferences.
        </p>
        <p className="font-medium text-text">2.2 Steam data</p>
        <p>
          When you use Steam Login or connect a Steam account, we may process your
          Steam ID, profile name, avatar, profile URL, Trade URL, public inventory
          information, trade eligibility, trade offer identifiers and other
          information made available through Steam according to your Steam settings
          and the functionality you use.
        </p>
        <p className="font-medium text-text">2.3 Order and transaction data</p>
        <p>
          We process order numbers, purchased Items and their characteristics,
          prices, selected currency, applicable tax information, invoices,
          timestamps, payment status, delivery status, Steam trade records,
          refunds, cancellations, disputes and fraud-prevention signals.
        </p>
        <p className="font-medium text-text">2.4 Payment data</p>
        <p>
          Payment card information is processed through an authorised third-party
          payment service provider. {SITE.name} may receive limited transaction
          information such as payer details, billing country, masked card
          information, card type, payment reference, authentication result, payment
          status and fraud or risk indicators. Do not send full card numbers or
          card security codes to us by email.
        </p>
        <p className="font-medium text-text">2.5 Technical and usage data</p>
        <p>
          We may process IP address, approximate location derived from IP, browser
          and device information, operating system, language, referring page,
          access times, pages and features used, cookie identifiers, session
          records, error logs and security events.
        </p>
        <p className="font-medium text-text">2.6 Support and compliance data</p>
        <p>
          If you contact us or if verification is reasonably required, we may
          process the content of your request, correspondence, attachments and
          information needed to verify account ownership, payment authorisation,
          age, location or transaction legitimacy.
        </p>
      </Section>

      <Section heading="3. How we obtain data">
        <p>
          We obtain personal data directly from you, from your use of the Service,
          from Steam when you use Steam Login or delivery functions, from payment
          and fraud-prevention providers, from fulfilment providers involved in an
          order, and from public or lawful compliance sources where necessary.
        </p>
      </Section>

      <Section heading="4. Purposes and legal bases">
        <p>We process personal data for the following purposes and legal bases:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Account creation, authentication, order acceptance, invoicing, payment
            administration and delivery: performance of a contract or steps
            requested before entering a contract.
          </li>
          <li>
            Customer support, complaints, refunds and dispute handling:
            performance of a contract, compliance with legal obligations and
            legitimate interests in resolving claims.
          </li>
          <li>
            Fraud prevention, account security, service integrity and abuse
            detection: legitimate interests and, where applicable, compliance with
            legal obligations.
          </li>
          <li>
            Accounting, taxation, sanctions screening and responses to
            authorities: compliance with legal obligations.
          </li>
          <li>
            Service measurement, troubleshooting and improvement: legitimate
            interests; consent where non-essential cookies or similar technologies
            require it.
          </li>
          <li>
            Marketing messages: consent where consent is required. You may
            unsubscribe at any time without affecting service messages.
          </li>
          <li>
            Establishing, exercising or defending legal claims: legitimate
            interests and applicable legal obligations.
          </li>
        </ul>
        <p>
          Where we rely on legitimate interests, we consider the necessity and
          proportionality of processing and the impact on your rights.
        </p>
      </Section>

      <Section heading="5. Steam Login">
        <p>
          Steam Login is used to authenticate or connect your Steam account and
          support delivery. Steam independently processes information under its own
          privacy terms. {SITE.name} does not receive your Steam password through
          the Steam Login process.
        </p>
      </Section>

      <Section heading="6. Recipients">
        <p>We may disclose personal data only as reasonably necessary to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            payment processing, card authentication and fraud-prevention
            providers;
          </li>
          <li>
            confidential inventory and fulfilment providers that arrange or
            complete delivery;
          </li>
          <li>
            hosting, cloud, email, security, logging and customer-support
            providers;
          </li>
          <li>
            analytics or advertising providers where enabled and lawfully
            consented to;
          </li>
          <li>
            professional advisers, auditors, insurers and accounting providers;
          </li>
          <li>banks, card networks and dispute-resolution participants;</li>
          <li>
            courts, regulators, law-enforcement bodies or other authorities where
            disclosure is legally required; and
          </li>
          <li>
            a buyer, successor or adviser in connection with a merger,
            restructuring or business transfer, subject to appropriate safeguards.
          </li>
        </ul>
        <p>We do not sell personal data for monetary consideration.</p>
      </Section>

      <Section heading="7. International transfers">
        <p>
          Some recipients may process data outside Estonia or the European
          Economic Area. Where required, we use a lawful transfer mechanism such as
          an adequacy decision, standard contractual clauses or another safeguard
          recognised under applicable data protection law. Information about
          relevant safeguards may be requested at {SITE.contactEmail}.
        </p>
      </Section>

      <Section heading="8. Retention">
        <p>
          We retain personal data only for as long as necessary for the stated
          purpose, legal compliance, security and dispute resolution. In general:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            account data is retained while the account is active and normally for
            up to three years after closure, unless a longer period is justified;
          </li>
          <li>
            order, invoice, accounting and transaction records are retained for
            seven years from the end of the relevant financial year where required
            by Estonian accounting or tax law;
          </li>
          <li>
            support and complaint records are normally retained for three years
            after closure of the matter;
          </li>
          <li>
            ordinary technical and usage logs are normally retained for up to
            twelve months; and
          </li>
          <li>
            security, fraud and dispute records may be retained for longer where
            necessary to investigate abuse, enforce rights or comply with law.
          </li>
        </ul>
        <p>
          Data may be anonymised and retained in a form that no longer identifies
          you.
        </p>
      </Section>

      <Section heading="9. Automated tools">
        <p>
          Automated tools may help identify payment, location, security or fraud
          risks. We do not make a solely automated decision producing legal or
          similarly significant effects unless permitted by law and accompanied by
          required safeguards. You may contact us to request human review where
          applicable.
        </p>
      </Section>

      <Section heading="10. Your rights">
        <p>Subject to applicable conditions and exceptions, you may request:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>access to personal data and information about its processing;</li>
          <li>correction of inaccurate or incomplete data;</li>
          <li>deletion of data;</li>
          <li>restriction of processing;</li>
          <li>data portability;</li>
          <li>
            objection to processing based on legitimate interests or direct
            marketing; and
          </li>
          <li>
            withdrawal of consent at any time, without affecting prior lawful
            processing.
          </li>
        </ul>
        <p>
          We may need to verify your identity before acting on a request. We
          normally respond within one month, subject to extensions permitted by
          law.
        </p>
      </Section>

      <Section heading="11. Complaints">
        <p>
          Please contact{" "}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-signal hover:underline"
          >
            {SITE.contactEmail}
          </a>{" "}
          first so we can address your concern. You also have the right to complain
          to the Estonian Data Protection Inspectorate at{" "}
          <a
            href="https://www.aki.ee/en"
            className="text-signal hover:underline"
            rel="noreferrer noopener"
            target="_blank"
          >
            https://www.aki.ee/en
          </a>{" "}
          or to the competent supervisory authority in your country of residence.
        </p>
      </Section>

      <Section heading="12. Security">
        <p>
          We use appropriate organisational and technical measures designed to
          protect personal data against unauthorised access, alteration,
          disclosure, loss or destruction. No online system is completely
          risk-free, and you must protect your own email and Steam credentials.
        </p>
      </Section>

      <Section heading="13. Age restriction">
        <p>
          The Service is intended only for persons aged 18 or older. We do not
          knowingly provide the Service to children. If you believe a person under
          18 has supplied personal data, contact us.
        </p>
      </Section>

      <Section heading="14. Changes">
        <p>
          We may update this Policy when our processing, providers, Service or
          legal obligations change. The current version will be published with its
          effective date. Material changes will be communicated where required.
        </p>
      </Section>
    </ContentPage>
  );
}
