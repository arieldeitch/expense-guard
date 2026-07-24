/**
 * DomainSummary selector — פונקציה טהורה.
 * מקבל activities + goals, מחזיר summary להצגה באריח.
 *
 * ברירות מחדל למדד ראשי (ניתן לשינוי בעתיד ע"י המשתמש):
 * - running: מרחק החודש (ק״מ).
 * - gym: מספר אימונים החודש.
 * - home: מספר אימונים החודש.
 *
 * שפה עובדתית בלבד. אין המצאה של יעדים.
 */
import type { Activity, Goal, Domain } from "@/lib/repo";

export type DomainSummary = {
  domain: Domain;
  /** האם יש בכלל פעילות אי-פעם. */
  hasAnyActivity: boolean;
  /** מדד ראשי — מספר + יחידה. */
  primary: { value: number | null; unit: string; label: string };
  /** מדד משני (עד אחד). null אם אין. */
  secondary: { value: number | null; unit: string | null; label: string } | null;
  /** ISO של פעילות אחרונה. null אם אין. */
  lastActivityAt: string | null;
  /** ימים מאז פעילות אחרונה. null אם אין. */
  daysSinceLast: number | null;
  /** יעד יחיד להצגה (priority=1 מבין active). null אם אין. */
  activeGoal: GoalSummary | null;
  /** מספר יעדים פעילים נוספים מעבר לזה שמוצג. */
  otherActiveGoalsCount: number;
};

export type GoalSummary = {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  targetUnit: string;
  /** אחוז השלמה 0-100 (עגול, לא חורג מ-100). */
  percent: number;
};

const MS_PER_DAY = 86_400_000;

export function computeDomainSummary(
  domain: Domain,
  activities: Activity[],
  goals: Goal[],
  now: Date = new Date(),
): DomainSummary {
  const domainActivities = activities.filter((a) => a.domain === domain);
  const hasAnyActivity = domainActivities.length > 0;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonth = domainActivities.filter((a) => a.occurredAt >= monthStart);

  // primary + secondary לפי דומיין
  let primary: DomainSummary["primary"];
  let secondary: DomainSummary["secondary"];

  if (domain === "running") {
    const totalMeters = sum(thisMonth.map((a) => a.distanceM ?? 0));
    primary = {
      value: hasAnyActivity ? +(totalMeters / 1000).toFixed(1) : null,
      unit: "ק״מ",
      label: "מרחק החודש",
    };
    secondary = {
      value: hasAnyActivity ? thisMonth.length : null,
      unit: "ריצות",
      label: "ריצות החודש",
    };
  } else if (domain === "gym") {
    primary = {
      value: hasAnyActivity ? thisMonth.length : null,
      unit: "אימונים",
      label: "אימונים החודש",
    };
    secondary = null;
  } else {
    primary = {
      value: hasAnyActivity ? thisMonth.length : null,
      unit: "אימונים",
      label: "אימונים החודש",
    };
    secondary = null;
  }

  // last activity + days since
  const sorted = [...domainActivities].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  const lastActivityAt = sorted[0]?.occurredAt ?? null;
  const daysSinceLast =
    lastActivityAt !== null
      ? Math.floor((now.getTime() - new Date(lastActivityAt).getTime()) / MS_PER_DAY)
      : null;

  // active goals — ממוין לפי priority עולה
  const activeGoals = goals
    .filter((g) => g.domain === domain && g.status === "active")
    .sort((a, b) => a.priority - b.priority);

  const primaryGoal = activeGoals[0] ?? null;
  const otherActiveGoalsCount = Math.max(0, activeGoals.length - 1);

  const activeGoal: GoalSummary | null = primaryGoal
    ? {
        id: primaryGoal.id,
        title: primaryGoal.title,
        currentValue: primaryGoal.currentValue,
        targetValue: primaryGoal.targetValue,
        targetUnit: primaryGoal.targetUnit,
        percent: pct(primaryGoal.currentValue, primaryGoal.targetValue),
      }
    : null;

  return {
    domain,
    hasAnyActivity,
    primary,
    secondary,
    lastActivityAt,
    daysSinceLast,
    activeGoal,
    otherActiveGoalsCount,
  };
}

function sum(xs: number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}

function pct(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  const p = Math.round((current / target) * 100);
  if (p < 0) return 0;
  if (p > 100) return 100;
  return p;
}

/** פורמט "לפני N ימים" לתצוגה. */
export function formatDaysSince(days: number | null): string | null {
  if (days === null) return null;
  if (days === 0) return "היום";
  if (days === 1) return "אתמול";
  return `לפני ${days} ימים`;
}
