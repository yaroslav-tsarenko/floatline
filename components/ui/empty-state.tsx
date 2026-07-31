import Link from "next/link";

import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  body,
  cta,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  cta?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-20 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid size-14 place-items-center rounded-full border border-border bg-surface-2 text-muted">
          {icon}
        </div>
      )}
      <h2 className="font-display text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:brightness-110"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
