/**
 * Unified history — one compact row model for runs, home sessions and gym sessions.
 * Pure functions over the existing stores; no new storage key, no new format (ADR-0042).
 */
import type { RunSession } from "@/lib/runs/types";
import type { HomeSession } from "@/lib/home/types";
import type { StrengthSession } from "@/lib/sessions/types";
import { formatDistanceKm, formatDurationHMS } from "@/lib/runs/calc";
import { listSessionEntries, listEntrySets } from "@/lib/home/repo";
import { computeSessionVolume } from "@/lib/sessions/calculations";
import { dayKey, shiftDay, weekStart } from "@/lib/race-project/model";

export type HistoryDomain = "run" | "home" | "gym";
export type HistoryStatus = "completed" | "partial" | "draft";

export interface HistoryItem {
  key: string;
  id: string;
  domain: HistoryDomain;
  started_at: string;
  /** YYYY-MM-DD in Asia/Jerusalem */
  day: string;
  title: string;
  /** The one metric that answers "how much" for this workout type. */
  metric: string;
  /** Short secondary text (source / context), may be empty. */
  sub: string;
  status: HistoryStatus;
  duration_seconds: number | null;
  distance_meters: number | null;
  searchText: string;
}

export const DOMAIN_LABELS: Record<HistoryDomain, string> = {
  run: "ריצה",
  home: "פק״ל בבית",
  gym: "מכון",
};

export const STATUS_LABELS: Record<HistoryStatus, string> = {
  completed: "הושלם",
  partial: "חלקי",
  draft: "טיוטה",
};

function runStatus(r: RunSession): HistoryStatus {
  return r.status === "completed" ? "completed" : "draft";
}

function homeStatus(s: HomeSession): HistoryStatus {
  if (s.status === "completed") return "completed";
  if (s.status === "partial") return "partial";
  return "draft";
}

function gymStatus(s: StrengthSession): HistoryStatus {
  if (s.status === "completed") return "completed";
  if (s.status === "abandoned") return "partial";
  return "draft";
}

export function runItem(r: RunSession): HistoryItem {
  const km = r.distance_meters != null ? `${formatDistanceKm(r.distance_meters)} ק״מ` : null;
  const time = r.duration_seconds ? formatDurationHMS(r.duration_seconds) : null;
  return {
    key: `run-${r.id}`,
    id: r.id,
    domain: "run",
    started_at: r.started_at,
    day: dayKey(r.started_at),
    title: r.run_type === "treadmill" ? "ריצה על הליכון" : "ריצה בחוץ",
    metric: [km, time].filter(Boolean).join(" · ") || "ללא מדדים",
    sub: [r.training_plan_item_id ? "מהתוכנית השבועית" : "", r.race_id ? "מרוץ" : ""]
      .filter(Boolean)
      .join(" · "),
    status: runStatus(r),
    duration_seconds: r.duration_seconds,
    distance_meters: r.distance_meters,
    searchText: `${r.notes ?? ""} ${r.city_or_area ?? ""} ${r.free_text_location ?? ""}`,
  };
}

export function homeItem(s: HomeSession): HistoryItem {
  const entries = listSessionEntries(s.id);
  let sets = 0;
  let reps = 0;
  for (const e of entries) {
    for (const st of listEntrySets(e.id)) {
      if (!st.completed) continue;
      sets += 1;
      reps += st.reps ?? 0;
    }
  }
  const metric =
    sets > 0
      ? `${entries.length} תרגילים · ${sets} סטים${reps ? ` · ${reps} חזרות` : ""}`
      : `${entries.length} תרגילים`;
  return {
    key: `home-${s.id}`,
    id: s.id,
    domain: "home",
    started_at: s.started_at,
    day: dayKey(s.started_at),
    title: s.name,
    metric,
    sub: [
      entries
        .slice(0, 2)
        .map((e) => e.snapshot.exercise_name)
        .join(" · "),
      s.training_partner ? `יחד עם ${s.training_partner}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    status: homeStatus(s),
    duration_seconds: s.duration_seconds,
    distance_meters: null,
    searchText: `${s.notes ?? ""} ${s.training_partner ?? ""} ${entries
      .map((e) => e.snapshot.exercise_name)
      .join(" ")}`,
  };
}

export function gymItem(s: StrengthSession): HistoryItem {
  const v = computeSessionVolume(s.id);
  const metric =
    v.completedSets > 0
      ? `${v.completedSets} סטים · ${Math.round(v.totalVolumeKg)} ק״ג נפח`
      : "ללא סטים";
  return {
    key: `gym-${s.id}`,
    id: s.id,
    domain: "gym",
    started_at: s.started_at,
    day: dayKey(s.started_at),
    title: s.name,
    metric,
    sub: s.duration_seconds ? formatDurationHMS(s.duration_seconds) : "",
    status: gymStatus(s),
    duration_seconds: s.duration_seconds,
    distance_meters: null,
    searchText: s.notes ?? "",
  };
}

export function buildHistoryItems(input: {
  runs: RunSession[];
  home: HomeSession[];
  gym: StrengthSession[];
}): HistoryItem[] {
  return [
    ...input.runs.filter((r) => !r.deleted_at && r.status !== "archived").map(runItem),
    ...input.home
      .filter((s) => !s.deleted_at && s.status !== "trashed" && s.status !== "archived")
      .map(homeItem),
    ...input.gym
      .filter((s) => !s.deleted_at && s.status !== "trashed" && s.status !== "archived")
      .map(gymItem),
  ].sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export interface HistoryFilter {
  domain: HistoryDomain | "all";
  query: string;
  /** YYYY-MM, or null for the whole history */
  month: string | null;
}

export function filterHistory(items: HistoryItem[], f: HistoryFilter): HistoryItem[] {
  const q = f.query.trim().toLowerCase();
  return items.filter(
    (i) =>
      (f.domain === "all" || i.domain === f.domain) &&
      (!f.month || i.day.startsWith(f.month)) &&
      (!q || `${i.title} ${i.metric} ${i.sub} ${i.searchText} ${i.day}`.toLowerCase().includes(q)),
  );
}

export interface HistoryGroup {
  weekStart: string;
  label: string;
  items: HistoryItem[];
  summary: string;
}

const DAY_NAMES = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

/** "ש׳ 26.9" — Hebrew day letter + day.month, never MM-DD. */
export function formatDayLabel(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  const [, m, dd] = day.split("-");
  return `${DAY_NAMES[d.getUTCDay()]} ${Number(dd)}.${Number(m)}`;
}

const MONTH_NAMES = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

export function shiftMonth(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function currentMonth(now = new Date()): string {
  return dayKey(now).slice(0, 7);
}

function weekLabel(start: string, today: string): string {
  const thisWeek = weekStart(today);
  if (start === thisWeek) return "השבוע";
  if (start === shiftDay(thisWeek, -7)) return "שבוע שעבר";
  const [, sm, sd] = start.split("-");
  const end = shiftDay(start, 6);
  const [, em, ed] = end.split("-");
  return `${Number(sd)}.${Number(sm)} – ${Number(ed)}.${Number(em)}`;
}

export function groupByWeek(items: HistoryItem[], today = dayKey()): HistoryGroup[] {
  const map = new Map<string, HistoryItem[]>();
  for (const i of items) {
    const ws = weekStart(i.day);
    map.set(ws, [...(map.get(ws) ?? []), i]);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([ws, list]) => {
      const done = list.filter((i) => i.status !== "draft");
      const seconds = done.reduce((n, i) => n + (i.duration_seconds ?? 0), 0);
      const meters = done.reduce((n, i) => n + (i.distance_meters ?? 0), 0);
      const parts = [`${done.length} אימונים`];
      if (seconds) parts.push(formatDurationHMS(seconds));
      if (meters) parts.push(`${formatDistanceKm(meters, 1)} ק״מ`);
      return {
        weekStart: ws,
        label: weekLabel(ws, today),
        items: list,
        summary: parts.join(" · "),
      };
    });
}

export function historyHref(item: HistoryItem): string {
  if (item.domain === "run")
    return item.status === "draft" ? `/running/${item.id}/edit` : `/running/${item.id}`;
  if (item.domain === "home") return `/home/sessions/${item.id}`;
  return item.status === "draft" ? `/sessions/${item.id}` : `/gym/history/${item.id}`;
}
