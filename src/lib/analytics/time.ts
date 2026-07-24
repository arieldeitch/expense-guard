/**
 * Time range helpers עבור פילטרים.
 */
export type TimeRangeId =
  | "7d"
  | "30d"
  | "month_current"
  | "month_prev"
  | "3m"
  | "6m"
  | "1y"
  | "all"
  | "custom";

export interface TimeRange {
  id: TimeRangeId;
  labelHe: string;
  from: string | null;
  to: string | null;
}

const iso = (d: Date) => d.toISOString();

export function resolveRange(id: TimeRangeId, custom?: { from?: string; to?: string }): TimeRange {
  const now = new Date();
  const nowIso = iso(now);
  switch (id) {
    case "7d":
      return { id, labelHe: "7 ימים", from: iso(daysAgo(7)), to: nowIso };
    case "30d":
      return { id, labelHe: "30 ימים", from: iso(daysAgo(30)), to: nowIso };
    case "3m":
      return { id, labelHe: "3 חודשים", from: iso(daysAgo(90)), to: nowIso };
    case "6m":
      return { id, labelHe: "6 חודשים", from: iso(daysAgo(180)), to: nowIso };
    case "1y":
      return { id, labelHe: "שנה", from: iso(daysAgo(365)), to: nowIso };
    case "month_current": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { id, labelHe: "חודש נוכחי", from: iso(from), to: nowIso };
    }
    case "month_prev": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { id, labelHe: "חודש קודם", from: iso(from), to: iso(to) };
    }
    case "custom":
      return { id, labelHe: "מותאם אישית", from: custom?.from ?? null, to: custom?.to ?? null };
    case "all":
    default:
      return { id: "all", labelHe: "כל הזמנים", from: null, to: null };
  }
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

export const TIME_RANGE_OPTIONS: TimeRangeId[] = [
  "7d",
  "30d",
  "month_current",
  "month_prev",
  "3m",
  "6m",
  "1y",
  "all",
];
