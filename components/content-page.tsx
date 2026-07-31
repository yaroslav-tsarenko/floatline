import type { ReactNode } from "react";

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
