/**
 * checksum — hash דטרמיניסטי לאימות שלמות נתונים, **ללא dependency חדשה**.
 *
 * משמש גם את מעטפת ה-Backup (ADR-0031) וגם את snapshot המיגרציה המקומית
 * (ADR-0033). הגדרה אחת בלבד — אין שכפול של אלגוריתם ה-checksum בריפו.
 */

/** JSON יציב — מפתחות ממוינים, כך שה-checksum אינו תלוי בסדר. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

/** FNV-1a 32-bit — דטרמיניסטי, ללא dependency. */
export function checksumOf(value: unknown): string {
  const text = stableStringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
