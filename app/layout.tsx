import type { Metadata, Viewport } from "next";

import { CurrencyProvider } from "@/components/currency-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getCurrency } from "@/lib/currency.server";
import { fontVariables } from "@/lib/fonts";
import { getFxRates } from "@/lib/fx";
import { ensureFxFresh } from "@/lib/jobs/lazy";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Floatline — buy CS2 skins at the real number",
    template: "%s · Floatline",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "CS2 skins",
    "Counter-Strike 2 skins",
    "buy CS2 skins",
    "CS2 skin marketplace",
    "skin float",
    "Steam trade",
    "cheap CS2 skins",
  ],
  authors: [{ name: SITE.company.legalName }],
  publisher: SITE.company.legalName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "Floatline — buy CS2 skins at the real number",
    description: SITE.description,
    url: SITE.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Floatline — buy CS2 skins at the real number",
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e10" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  ensureFxFresh();

  const [currency, rates] = await Promise.all([getCurrency(), getFxRates()]);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: SITE.company.legalName,
    url: SITE.url,
    email: SITE.contactEmail,
    identifier: SITE.company.registryCode,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.company.street,
      addressLocality: SITE.company.city,
      postalCode: SITE.company.postalCode,
      addressRegion: SITE.company.region,
      addressCountry: SITE.company.countryCode,
    },
  };

  return (
    <html lang="en" suppressHydrationWarning className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CurrencyProvider initialCurrency={currency} rates={rates}>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
