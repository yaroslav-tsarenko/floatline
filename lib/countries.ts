export interface Country {
  /** ISO 3166-1 alpha-2 code — stored on the user. */
  code: string;
  name: string;
  /** International dialing prefix, incl. leading "+". */
  dial: string;
}

/** Countries offered in the registration address step. */
export const COUNTRIES: Country[] = [
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "AT", name: "Austria", dial: "+43" },
  { code: "BE", name: "Belgium", dial: "+32" },
  { code: "BG", name: "Bulgaria", dial: "+359" },
  { code: "HR", name: "Croatia", dial: "+385" },
  { code: "CY", name: "Cyprus", dial: "+357" },
  { code: "CZ", name: "Czechia", dial: "+420" },
  { code: "DK", name: "Denmark", dial: "+45" },
  { code: "EE", name: "Estonia", dial: "+372" },
  { code: "FI", name: "Finland", dial: "+358" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "GR", name: "Greece", dial: "+30" },
  { code: "HU", name: "Hungary", dial: "+36" },
  { code: "IS", name: "Iceland", dial: "+354" },
  { code: "IE", name: "Ireland", dial: "+353" },
  { code: "IT", name: "Italy", dial: "+39" },
  { code: "LV", name: "Latvia", dial: "+371" },
  { code: "LT", name: "Lithuania", dial: "+370" },
  { code: "LU", name: "Luxembourg", dial: "+352" },
  { code: "MT", name: "Malta", dial: "+356" },
  { code: "NL", name: "Netherlands", dial: "+31" },
  { code: "NO", name: "Norway", dial: "+47" },
  { code: "PL", name: "Poland", dial: "+48" },
  { code: "PT", name: "Portugal", dial: "+351" },
  { code: "RO", name: "Romania", dial: "+40" },
  { code: "SK", name: "Slovakia", dial: "+421" },
  { code: "SI", name: "Slovenia", dial: "+386" },
  { code: "ES", name: "Spain", dial: "+34" },
  { code: "SE", name: "Sweden", dial: "+46" },
  { code: "CH", name: "Switzerland", dial: "+41" },
  { code: "UA", name: "Ukraine", dial: "+380" },
  { code: "NZ", name: "New Zealand", dial: "+64" },
  { code: "JP", name: "Japan", dial: "+81" },
  { code: "KR", name: "South Korea", dial: "+82" },
  { code: "SG", name: "Singapore", dial: "+65" },
  { code: "HK", name: "Hong Kong", dial: "+852" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "BR", name: "Brazil", dial: "+55" },
  { code: "MX", name: "Mexico", dial: "+52" },
  { code: "AR", name: "Argentina", dial: "+54" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "TR", name: "Turkey", dial: "+90" },
  { code: "IN", name: "India", dial: "+91" },
];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function countryByCode(code: string): Country | undefined {
  return BY_CODE.get(code);
}

export function isCountryCode(code: string): boolean {
  return BY_CODE.has(code);
}

export const DEFAULT_COUNTRY = "GB";

export function dialForCountry(code: string): string {
  return BY_CODE.get(code)?.dial ?? "+44";
}
