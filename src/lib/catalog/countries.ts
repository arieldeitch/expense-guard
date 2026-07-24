/**
 * רשימת מדינות סטטית — ISO 3166-1 alpha-2 code + שם בעברית ואנגלית.
 * מכוונת ל־UX בחירה מהירה עם חיפוש. מכסה מדינות שבהן משתמשי ריצה/כוח פעילים.
 * ניתן להרחבה ידנית — אין תלות ב־API חיצוני (מנע עלות).
 */

export interface CountryOption {
  code: string;
  he: string;
  en: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "IL", he: "ישראל", en: "Israel" },
  { code: "US", he: "ארצות הברית", en: "United States" },
  { code: "GB", he: "בריטניה", en: "United Kingdom" },
  { code: "FR", he: "צרפת", en: "France" },
  { code: "DE", he: "גרמניה", en: "Germany" },
  { code: "IT", he: "איטליה", en: "Italy" },
  { code: "ES", he: "ספרד", en: "Spain" },
  { code: "PT", he: "פורטוגל", en: "Portugal" },
  { code: "NL", he: "הולנד", en: "Netherlands" },
  { code: "BE", he: "בלגיה", en: "Belgium" },
  { code: "CH", he: "שווייץ", en: "Switzerland" },
  { code: "AT", he: "אוסטריה", en: "Austria" },
  { code: "SE", he: "שוודיה", en: "Sweden" },
  { code: "NO", he: "נורווגיה", en: "Norway" },
  { code: "FI", he: "פינלנד", en: "Finland" },
  { code: "DK", he: "דנמרק", en: "Denmark" },
  { code: "IE", he: "אירלנד", en: "Ireland" },
  { code: "PL", he: "פולין", en: "Poland" },
  { code: "CZ", he: "צ׳כיה", en: "Czechia" },
  { code: "HU", he: "הונגריה", en: "Hungary" },
  { code: "GR", he: "יוון", en: "Greece" },
  { code: "CY", he: "קפריסין", en: "Cyprus" },
  { code: "TR", he: "טורקיה", en: "Turkey" },
  { code: "RU", he: "רוסיה", en: "Russia" },
  { code: "UA", he: "אוקראינה", en: "Ukraine" },
  { code: "CA", he: "קנדה", en: "Canada" },
  { code: "MX", he: "מקסיקו", en: "Mexico" },
  { code: "BR", he: "ברזיל", en: "Brazil" },
  { code: "AR", he: "ארגנטינה", en: "Argentina" },
  { code: "CL", he: "צ׳ילה", en: "Chile" },
  { code: "AU", he: "אוסטרליה", en: "Australia" },
  { code: "NZ", he: "ניו זילנד", en: "New Zealand" },
  { code: "JP", he: "יפן", en: "Japan" },
  { code: "KR", he: "דרום קוריאה", en: "South Korea" },
  { code: "CN", he: "סין", en: "China" },
  { code: "IN", he: "הודו", en: "India" },
  { code: "TH", he: "תאילנד", en: "Thailand" },
  { code: "VN", he: "וייטנאם", en: "Vietnam" },
  { code: "SG", he: "סינגפור", en: "Singapore" },
  { code: "AE", he: "איחוד האמירויות", en: "United Arab Emirates" },
  { code: "SA", he: "ערב הסעודית", en: "Saudi Arabia" },
  { code: "EG", he: "מצרים", en: "Egypt" },
  { code: "MA", he: "מרוקו", en: "Morocco" },
  { code: "ZA", he: "דרום אפריקה", en: "South Africa" },
  { code: "KE", he: "קניה", en: "Kenya" },
  { code: "ET", he: "אתיופיה", en: "Ethiopia" },
];

export function findCountry(code: string | null | undefined): CountryOption | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  return COUNTRIES.find((c) => c.code === upper) ?? null;
}

/** חיפוש case-insensitive בעברית או אנגלית או code. */
export function searchCountries(query: string): CountryOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRIES;
  return COUNTRIES.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.he.toLowerCase().includes(q) ||
      c.en.toLowerCase().includes(q),
  );
}
