/**
 * Domain data types + repository contract.
 * זהו ה־contract בין UI ל־data source. כרגע מיושם ע"י mock repository;
 * בעתיד יוחלף ב־Supabase repository בלי שינוי ב־UI.
 */

export type Domain = "running" | "gym" | "home";

export type Activity = {
  id: string;
  domain: Domain;
  /** UTC ISO */
  occurredAt: string;
  /** ריצה: מטרים. כוח: null. */
  distanceM: number | null;
  /** ריצה: שניות. כוח: משך אימון בשניות אם ידוע. */
  durationS: number | null;
  /** כוח בית: מספר חזרות כולל. אחרת null. */
  totalReps: number | null;
  /** ריצה: קצב שניות/ק״מ. אחרת null. */
  paceSPerKm: number | null;
};

export type Goal = {
  id: string;
  domain: Domain;
  /** תיאור קצר בעברית — "20 ק״מ בשבוע", "3 אימונים בשבוע" וכו'. */
  title: string;
  /** ערך היעד המספרי. */
  targetValue: number;
  /** יחידה — "ק״מ", "אימונים", "חזרות" וכו'. */
  targetUnit: string;
  /** התקדמות נוכחית (מחושבת/מדווחת). */
  currentValue: number;
  /** עדיפות: אריח ראשי מציג רק את היעד עם priority=1. */
  priority: number;
  status: "active" | "achieved" | "paused";
};

export type Repository = {
  listActivities: (domain: Domain) => Promise<Activity[]>;
  listAllActivities: () => Promise<Activity[]>;
  listGoals: (domain: Domain) => Promise<Goal[]>;
};

/** תג לזיהוי סוג ה־repo בממשק. */
export type RepoKind = "mock" | "supabase";
