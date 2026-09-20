import type { RunSession } from "@/lib/runs/types";

export type TrainingKind =
  "rest" | "easy" | "long" | "intervals" | "hills" | "tempo" | "strides" | "race";
export const KIND_LABELS: Record<TrainingKind, string> = {
  rest: "מנוחה",
  easy: "ריצה קלה",
  long: "ריצת נפח",
  intervals: "אינטרוולים",
  hills: "עליות",
  tempo: "קצב מתמשך",
  strides: "האצות קצרות",
  race: "מרוץ",
};
export const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
export interface Race {
  id: string;
  name: string;
  date: string | null;
  date_note: string;
  status: "planned" | "completed";
  source: "user";
  deleted_at: string | null;
}
export interface CoachSettings {
  id: string;
  year: number;
  target_min: number;
  target_max: number;
  weekly_minutes: number | null;
  longest_minutes: number | null;
  running_days: number[];
  long_day: number;
  quality: TrainingKind;
  surface: "treadmill" | "outdoor";
  recovery: "normal" | "tired" | "pain";
}
export interface Prescription {
  kind: TrainingKind;
  minutes: number | null;
  surface: "treadmill" | "outdoor";
  note: string;
}
export interface PlanDay {
  id: string;
  date: string;
  recommended: Prescription;
  chosen: Prescription;
  skipped: boolean;
}
export interface WeekPlan {
  id: string;
  week_start: string;
  created_at: string;
  updated_at: string;
  status: "pending" | "accepted" | "rejected";
  rationale: string;
  engine: "local-rules-v1";
  days: PlanDay[];
  revisions: Array<{ at: string; days: PlanDay[]; status: WeekPlan["status"] }>;
}
export const DEFAULT_SETTINGS: CoachSettings = {
  id: "half-marathons-2026",
  year: 2026,
  target_min: 5,
  target_max: 10,
  weekly_minutes: null,
  longest_minutes: null,
  running_days: [1, 3, 6],
  long_day: 6,
  quality: "intervals",
  surface: "treadmill",
  recovery: "normal",
};
export const INITIAL_RACES: Race[] = [
  {
    id: "beer-sheva-2026",
    name: "חצי מרתון באר שבע",
    date: null,
    date_note: "תחילת ספטמבר 2026 · הושלם לפי דיווח אריאל",
    status: "completed",
    source: "user",
    deleted_at: null,
  },
  {
    id: "hasargel-2026",
    name: "מרוץ הסרגל",
    date: null,
    date_note: "תחילת אוקטובר 2026 · תאריך ומקצה טרם אומתו",
    status: "planned",
    source: "user",
    deleted_at: null,
  },
  {
    id: "hagor-2026",
    name: "מרוץ הגור",
    date: null,
    date_note: "סוף אוקטובר 2026 · שם, תאריך ומקצה טרם אומתו",
    status: "planned",
    source: "user",
    deleted_at: null,
  },
];
export function dayKey(date: Date | string = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(date));
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function shiftDay(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function weekStart(day = dayKey()) {
  return shiftDay(day, -new Date(`${day}T12:00:00Z`).getUTCDay());
}
export function completedRuns(runs: RunSession[]) {
  return runs.filter((r) => !r.deleted_at && r.status === "completed");
}
export function baseline(runs: RunSession[], start: string) {
  const recent = completedRuns(runs).filter(
    (r) =>
      dayKey(r.started_at) >= shiftDay(start, -28) &&
      dayKey(r.started_at) < start &&
      (r.duration_seconds ?? 0) > 0,
  );
  return {
    count: recent.length,
    weekly: recent.reduce((sum, r) => sum + (r.duration_seconds ?? 0) / 60, 0) / 4,
    longest: Math.max(0, ...recent.map((r) => (r.duration_seconds ?? 0) / 60)),
  };
}
export function createWeek(
  start: string,
  settings: CoachSettings,
  races: Race[],
  runs: RunSession[],
  now = new Date(),
): WeekPlan {
  const base = baseline(runs, start);
  const enough = base.count >= 6;
  const weekly = enough ? base.weekly : settings.weekly_minutes;
  const longest = enough ? base.longest : settings.longest_minutes;
  const ready = weekly != null && longest != null && weekly > 0 && longest > 0;
  const activeRaces = races.filter((r) => !r.deleted_at && r.date);
  const upcoming = activeRaces
    .filter((r) => r.date! >= start)
    .sort((a, b) => a.date!.localeCompare(b.date!))[0];
  const raceWeek = upcoming && upcoming.date! <= shiftDay(start, 6);
  const taper = upcoming && upcoming.date! <= shiftDay(start, 13);
  const recovering = activeRaces.some((r) => r.date! < start && r.date! >= shiftDay(start, -7));
  const cautious = settings.recovery !== "normal" || recovering || taper;
  const daysOn = [...new Set([...settings.running_days, settings.long_day])].sort();
  const budget = ready ? weekly * (cautious ? 0.6 : 1) : 0;
  const longMinutes = ready ? Math.floor(Math.min(longest, budget * 0.45, 120)) : null;
  const easyMinutes = ready
    ? Math.floor((budget - (longMinutes ?? 0)) / Math.max(1, daysOn.length - 1))
    : null;
  const qualityDay = daysOn.find(
    (d) =>
      d !== settings.long_day &&
      Math.min(Math.abs(d - settings.long_day), 7 - Math.abs(d - settings.long_day)) >= 2,
  );
  const days: PlanDay[] = DAYS.map((_, d) => {
    const date = shiftDay(start, d);
    const exactRace = activeRaces.find((r) => r.date === date);
    let kind: TrainingKind = daysOn.includes(d)
      ? d === settings.long_day
        ? "long"
        : "easy"
      : "rest";
    if (d === qualityDay && !cautious && ready) kind = settings.quality;
    if (cautious && kind === "long") kind = "easy";
    if (settings.recovery === "pain" || !ready) kind = "rest";
    if (raceWeek && date > upcoming.date!) kind = "rest";
    if (exactRace && settings.recovery !== "pain") kind = "race";
    const minutes =
      kind === "rest" || kind === "race"
        ? null
        : d === settings.long_day
          ? longMinutes
          : easyMinutes;
    const details: Record<TrainingKind, string> = {
      rest: "מנוחה או תנועה קלה לפי ההרגשה; אין צורך להשלים אימון שהוחמץ.",
      easy: "קצב שיחה נוח. אפשר על ההליכון בקיבוץ. המהירות לפי ההרגשה, לא יעד מחייב.",
      long: "ריצה קלה רציפה, ללא יעד מהירות. אפשר הליכון או חוץ לפי העדפתך.",
      intervals:
        "בתוך הזמן הכולל: חימום וקירור קלים. אם נוח: עד 4 קטעי דקה בקצב נשלט, 2 דקות קלות ביניהם; לא ספרינט מרבי.",
      hills:
        "חימום וקירור כלולים. עד 4 עליות קצרות של דקה בשיפוע מתון ונוח, 2 דקות קלות בין העליות; אפשר בהליכון.",
      tempo: "חימום וקירור כלולים. עד 8 דקות באמצע בקצב יציב מעט מאתגר; להחליף לקל לפי ההרגשה.",
      strides:
        "חימום וקירור כלולים. עד 4 האצות נשלטות של 15 שניות, התאוששות מלאה ביניהן; לא מאמץ מרבי.",
      race: `${exactRace?.name ?? "מרוץ"} · התאריך הוזן ידנית; אין יעד זמן מומצא.`,
    };
    if (minutes != null && minutes < 25 && !["easy", "rest", "race"].includes(kind)) kind = "easy";
    const recommended = {
      kind,
      minutes,
      surface: exactRace ? ("outdoor" as const) : settings.surface,
      note: details[kind],
    };
    return { id: `${start}-${d}`, date, recommended, chosen: { ...recommended }, skipped: false };
  });
  const reasons = [
    enough
      ? "מבוסס על ארבעת השבועות הקודמים ביומן."
      : ready
        ? "מבוסס על נתוני הבסיס שהזנת; ההיסטוריה עדיין חלקית."
        : "חסרים נפח שבועי וריצה ארוכה רגילה. מלא אותם בהעדפות כדי לקבל המלצה מספרית.",
    "אין הגדלה אוטומטית של נפח האימונים.",
  ];
  if (settings.recovery === "pain")
    reasons.push("דיווחת על כאב: אין המלצת ריצה; חזור לפעילות לאחר בירור מתאים.");
  else if (cautious) reasons.push("השבוע מופחת עקב עייפות או קרבה למרוץ; ללא אימון איכות.");
  if (races.some((r) => !r.deleted_at && r.status === "planned" && !r.date))
    reasons.push(
      "למרוצים ללא תאריך מדויק אין התאמת עומס לפי תאריך. השלם תאריכים לפני הסתמכות על ההמלצה.",
    );
  return {
    id: start,
    week_start: start,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    status: "pending",
    rationale: reasons.join(" "),
    engine: "local-rules-v1",
    days,
    revisions: [],
  };
}
