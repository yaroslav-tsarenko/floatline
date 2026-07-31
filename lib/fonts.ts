import { Archivo, Inter_Tight, JetBrains_Mono } from "next/font/google";

// Display — machined, precise grotesk for headings.
export const fontDisplay = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

// Body — compact, neutral, highly readable at small sizes.
export const fontBody = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

// Data — monospaced with strong tabular numerals for every number on the site.
export const fontMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const fontVariables = `${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`;
