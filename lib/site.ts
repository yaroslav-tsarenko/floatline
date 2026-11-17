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
  contactPhone: "+372 5912 2296",
  company: {
    legalName: "CROWNSTONE PARTNERS LTD",
    // UK companies are identified by a Companies House company number; the
    // label below is rendered next to it wherever the imprint appears.
    registrationNumber: "17452360",
    registrationLabel: "Company number",
    street: "Dept 6956, 43 Owston Road",
    locality: "Carcroft",
    city: "Doncaster",
    postalCode: "DN6 8DA",
    country: "United Kingdom",
    countryCode: "GB",
  },
} as const;

export const CONTACT_PHONE_HREF = `tel:${SITE.contactPhone.replace(/\s+/g, "")}`;

// UK postal order: street, locality + post town, postcode, country.
export const COMPANY_ADDRESS_LINES = [
  SITE.company.street,
  `${SITE.company.locality}, ${SITE.company.city}`,
  SITE.company.postalCode,
  SITE.company.country,
];

export const COMPANY_ADDRESS_INLINE = COMPANY_ADDRESS_LINES.join(", ");
