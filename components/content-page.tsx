import type { ReactNode } from "react";

import { COMPANY_ADDRESS_LINES, SITE } from "@/lib/site";

export function ContentPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8 space-y-2 border-b border-border pb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {intro && <p className="text-muted">{intro}</p>}
        {updated && (
          <p className="text-xs uppercase tracking-widest text-muted">
            Last updated {updated}
          </p>
        )}
      </header>
      <div className="space-y-8">{children}</div>
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {heading}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export function CompanyDetails({
  heading = "Operator",
  intro,
}: {
  heading?: string;
  intro?: string;
}) {
  const { company, contactEmail } = SITE;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {heading}
      </h2>
      {intro && (
        <p className="text-sm leading-relaxed text-muted">{intro}</p>
      )}
      <dl className="grid gap-x-6 gap-y-2 rounded-lg border border-border bg-surface-2 p-5 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted">Company</dt>
        <dd className="font-medium text-text">{company.legalName}</dd>

        <dt className="text-muted">Registry code</dt>
        <dd className="font-medium text-text">{company.registryCode}</dd>

        <dt className="text-muted">Registered address</dt>
        <dd className="text-text">
          <address className="not-italic">
            {COMPANY_ADDRESS_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </dd>

        <dt className="text-muted">Contact</dt>
        <dd>
          <a
            href={`mailto:${contactEmail}`}
            className="font-medium text-signal hover:underline"
          >
            {contactEmail}
          </a>
        </dd>
      </dl>
    </section>
  );
}
