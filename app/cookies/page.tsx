import type { Metadata } from "next";

import { ContentPage, Section } from "@/components/content-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `How ${SITE.name} uses cookies and similar technologies on ${SITE.domain} and how you can control them.`,
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <ContentPage
      title="Cookie Policy"
      intro={`This Policy explains how ${SITE.name} uses cookies and similar technologies on ${SITE.domain} and how users can control optional technologies.`}
      updated="August 2026"
    >
      <Section heading="1. What cookies are">
        <p>
          Cookies are small text files stored on or accessed from your device when
          you visit a website. Similar technologies may include local storage,
          pixels, tags and software development tools. They can support
          authentication, security, preferences, measurement and communications.
        </p>
      </Section>

      <Section heading="2. Who uses them">
        <p>
          {SITE.company.legalName} uses cookies and similar technologies as
          operator of {SITE.domain}. Certain technologies may also be operated by
          service providers acting on our behalf or by independent third parties
          such as Steam or a payment service provider when you interact with their
          functionality.
        </p>
      </Section>

      <Section heading="3. Categories">
        <p className="font-medium text-text">3.1 Strictly necessary</p>
        <p>
          These technologies are required for core functions such as account login,
          session continuity, security, fraud prevention, order processing, consent
          preferences and load balancing. They cannot generally be disabled through
          our consent tool because the Service would not function correctly without
          them.
        </p>
        <p className="font-medium text-text">3.2 Preference</p>
        <p>
          Preference technologies remember choices such as language, currency or
          interface settings. Where required by law, they are used only after
          consent.
        </p>
        <p className="font-medium text-text">3.3 Analytics</p>
        <p>
          Analytics technologies help measure visits, page performance, errors and
          feature use so the Service can be improved. Non-essential analytics are
          used only after consent where required.
        </p>
        <p className="font-medium text-text">3.4 Advertising</p>
        <p>
          If advertising or campaign measurement technologies are introduced, they
          will be used only with legally valid consent where required. {SITE.name}{" "}
          will not activate such technologies merely because you accept necessary
          cookies.
        </p>
      </Section>

      <Section heading="4. Current details and duration">
        <p>
          The cookie settings interface available on {SITE.domain} provides the
          current list of non-essential technologies, their providers, purposes and
          duration where applicable.
        </p>
        <p>
          Session technologies expire when the browser session ends. Persistent
          technologies remain until their stated expiry or deletion. We choose
          durations proportionate to purpose and periodically review them.
        </p>
      </Section>

      <Section heading="5. Consent choices">
        <p>
          Where consent is required, non-essential technologies remain disabled
          until you make an affirmative choice. You may accept all, reject
          non-essential technologies or select categories separately.
        </p>
        <p>
          You may withdraw or change consent at any time through the cookie settings
          link on {SITE.domain}. Withdrawal does not affect processing carried out
          before withdrawal.
        </p>
      </Section>

      <Section heading="6. Browser controls">
        <p>
          Most browsers allow you to view, block or delete cookies. Blocking
          strictly necessary cookies may prevent login, order processing or other
          core functions. Browser settings operate separately from {SITE.name}’s
          consent tool.
        </p>
      </Section>

      <Section heading="7. Third-party functionality">
        <p>
          Steam Login, card authentication or other embedded third-party
          functionality may cause the relevant third party to set or access its own
          technologies. Those parties process information under their own terms and
          privacy notices. Relevant third-party information will be shown through the
          applicable interface or consent settings where required.
        </p>
      </Section>

      <Section heading="8. Personal data">
        <p>
          Where a cookie or similar identifier relates to an identifiable person, it
          is personal data and is processed under the Privacy Policy.
        </p>
      </Section>

      <Section heading="9. Changes and contact">
        <p>
          We may update this Policy when technologies, providers or legal
          requirements change. Questions may be sent to{" "}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-signal hover:underline"
          >
            {SITE.contactEmail}
          </a>
          .
        </p>
      </Section>
    </ContentPage>
  );
}
