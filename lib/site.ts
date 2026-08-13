// Single source of truth for brand identity, the public domain, and the
// legal operator details that must appear consistently across policy pages,
// the footer imprint, metadata, and structured data.

export const SITE = {
  name: "Floatline",
  url: "https://csfloatline.com",
  domain: "csfloatline.com",
  description:
    "Floatline is a CS2 skins marketplace. See the float, compare the price, get it delivered to your Steam inventory in minutes.",
  contactEmail: "info@csfloatline.com",
  company: {
    legalName: "BORGERSONIC OÜ",
    registryCode: "17568868",
    street: "Tornimäe tn 7",
    district: "Kesklinna linnaosa",
    postalCode: "10145",
    city: "Tallinn",
    region: "Harju maakond",
    country: "Estonia",
    countryCode: "EE",
  },
} as const;

export const COMPANY_ADDRESS_LINES = [
  `${SITE.company.street}, ${SITE.company.district}`,
  `${SITE.company.postalCode} ${SITE.company.city}, ${SITE.company.region}`,
  SITE.company.country,
];

export const COMPANY_ADDRESS_INLINE = `${SITE.company.street}, ${SITE.company.district}, ${SITE.company.postalCode} ${SITE.company.city}, ${SITE.company.region}, ${SITE.company.country}`;
