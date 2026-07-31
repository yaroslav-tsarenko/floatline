import type { Metadata, Viewport } from "next";

import { CurrencyProvider } from "@/components/currency-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getCurrency } from "@/lib/currency.server";
import { fontVariables } from "@/lib/fonts";
import { getFxRates } from "@/lib/fx";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Floatline — buy CS2 skins at the real number",
    template: "%s · Floatline",
  },
  description:
    "Floatline is a CS2 skins marketplace. See the float, compare the price, get it delivered to your Steam inventory in minutes.",
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
  const [currency, rates] = await Promise.all([getCurrency(), getFxRates()]);

  return (
    <html lang="en" suppressHydrationWarning className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col">
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
