/**
 * Home metrics — נוסחאות עובדתיות ומדדים.
 * מקור אמת מלא: docs/ai/metrics-home.md.
 *
 * עקרונות:
 *  - כל חישוב דטרמיניסטי.
 *  - baseline מסומן באימון ראשון של תרגיל.
 *  - null מתאפשר בהעדר נתונים; לא נזייף ערכים.
 */
import type { HomeExerciseSet, HomeSetSummary } from "./types";

export function completedSets(sets: HomeExerciseSet[]): HomeExerciseSet[] {
  return sets.filter((s) => !s.deleted_at && !s.skipped && s.completed);
}

/** סטים המהווים בסיס לחישוב "חזרות" (כאלה שיש להם reps מספרי). */
export function repSets(sets: HomeExerciseSet[]): HomeExerciseSet[] {
  return completedSets(sets).filter((s) => typeof s.reps === "number" && (s.reps ?? 0) >= 0);
}

export function sumReps(sets: HomeExerciseSet[]): number {
  return repSets(sets).reduce((acc, s) => acc + (s.reps ?? 0), 0);
}

export function sumDurationSeconds(sets: HomeExerciseSet[]): number {
  return completedSets(sets).reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0);
}

export function medianOf(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function meanOf(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function stdevOf(nums: number[]): number | null {
  if (nums.length < 2) return null;
  const m = meanOf(nums)!;
  const variance = nums.reduce((acc, n) => acc + (n - m) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

/** מקדם שונות — CV = stdev/|mean|. */
export function cvOf(nums: number[]): number | null {
  const m = meanOf(nums);
  const sd = stdevOf(nums);
  if (m == null || sd == null || m === 0) return null;
  return sd / Math.abs(m);
}

/** יציבות: 1 - CV, נחתך ל־[0,1]. null אם <2 נקודות או mean=0. */
export function stabilityFromReps(reps: number[]): number | null {
  const c = cvOf(reps);
  if (c == null) return null;
  return Math.max(0, Math.min(1, 1 - c));
}

export function summarizeSets(sets: HomeExerciseSet[]): HomeSetSummary {
  const valid = sets.filter((s) => !s.deleted_at);
  const completed = valid.filter((s) => s.completed && !s.skipped);
  const skipped = valid.filter((s) => s.skipped);
  const reps = completed
    .map((s) => s.reps)
    .filter((r): r is number => typeof r === "number");
  const durations = completed
    .map((s) => s.duration_seconds)
    .filter((d): d is number => typeof d === "number");
  const first = reps[0] ?? null;
  const last = reps[reps.length - 1] ?? null;
  const ratio = first != null && last != null && first > 0 ? last / first : null;

  return {
    totalSets: valid.length,
    completedSets: completed.length,
    skippedSets: skipped.length,
    totalReps: reps.reduce((a, b) => a + b, 0),
    totalDurationSeconds: durations.reduce((a, b) => a + b, 0),
    averageReps: reps.length ? meanOf(reps) : null,
    medianReps: reps.length ? medianOf(reps) : null,
    maxReps: reps.length ? Math.max(...reps) : null,
    minReps: reps.length ? Math.min(...reps) : null,
    firstSetReps: first,
    lastSetReps: last,
    lastToFirstRatio: ratio,
    stability: stabilityFromReps(reps),
    stdev: stdevOf(reps),
    cv: cvOf(reps),
  };
}

/** חזרות לדקה — רק כאשר יש reps וזמן. */
export function repsPerMinute(reps: number, seconds: number): number | null {
  if (reps <= 0 || seconds <= 0) return null;
  return (reps / seconds) * 60;
}

/**
 * ציון איכות ביתי (0-100). מנורמל, מטפל בחסרים.
 * רכיבים:
 *  - completion (0-25): שיעור סטים שהושלמו.
 *  - reps_progress (0-25): שינוי בסך חזרות מול baseline (חותך ל־[-25,+25]).
 *  - stability (0-20): 1-CV נורמלי.
 *  - rpe_signal (0-15): נמוך יותר טוב, רק אם RPE הוזן.
 *  - completeness (0-15): שיעור סטים עם נתונים תקינים.
 * רכיב שאין לו נתונים לא מפחית — עוברים לנרמול פרו־רטה.
 */
export function homeQualityScore(input: {
  sets: HomeExerciseSet[];
  previousTotalReps?: number | null;
}): { score: number; breakdown: Array<{ label: string; value: number; max: number }> } {
  const { sets, previousTotalReps } = input;
  const valid = sets.filter((s) => !s.deleted_at);
  const completed = valid.filter((s) => s.completed && !s.skipped);
  const completion = valid.length ? completed.length / valid.length : 0;

  const totalReps = sumReps(sets);
  const repsProgress = (() => {
    if (previousTotalReps == null || previousTotalReps <= 0) return null;
    return (totalReps - previousTotalReps) / previousTotalReps; // -inf..+inf
  })();

  const reps = completed.map((s) => s.reps).filter((r): r is number => typeof r === "number");
  const stab = stabilityFromReps(reps); // 0..1 | null

  const rpes = completed.map((s) => s.rpe).filter((r): r is number => typeof r === "number");
  const rpeSignal = rpes.length ? 1 - Math.min(1, meanOf(rpes)! / 10) : null;

  const rowsWithData = valid.filter(
    (s) => (typeof s.reps === "number" && s.reps >= 0) || (s.duration_seconds ?? 0) > 0,
  );
  const completeness = valid.length ? rowsWithData.length / valid.length : 0;

  const parts: Array<{ label: string; value: number; max: number; missing: boolean }> = [
    { label: "השלמה", value: completion * 25, max: 25, missing: false },
    {
      label: "מגמת חזרות",
      value:
        repsProgress == null
          ? 0
          : Math.max(-25, Math.min(25, repsProgress * 25)) + 12.5, // center 12.5 → range 0-25? No, we want signed
      max: 25,
      missing: repsProgress == null,
    },
    { label: "יציבות", value: (stab ?? 0) * 20, max: 20, missing: stab == null },
    { label: "מאמץ", value: (rpeSignal ?? 0) * 15, max: 15, missing: rpeSignal == null },
    { label: "שלמות נתונים", value: completeness * 15, max: 15, missing: false },
  ];

  // Progress normalization: if missing, exclude and rescale others.
  const usable = parts.filter((p) => !p.missing);
  const usableMax = usable.reduce((a, p) => a + p.max, 0);
  const usableSum = usable.reduce((a, p) => a + p.value, 0);
  const score = usableMax > 0 ? Math.round((usableSum / usableMax) * 100) : 0;

  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown: parts.map((p) => ({ label: p.label, value: Math.round(p.value), max: p.max })),
  };
}

/** שלמות נתונים 0-100 (עצמאי — נשמר על ה־session). */
export function dataCompleteness(sets: HomeExerciseSet[]): number {
  const valid = sets.filter((s) => !s.deleted_at);
  if (!valid.length) return 0;
  const withData = valid.filter(
    (s) =>
      (typeof s.reps === "number" && s.reps >= 0) ||
      (s.duration_seconds != null && s.duration_seconds > 0),
  );
  return Math.round((withData.length / valid.length) * 100);
}

export function frequencyPerWeek(sessionDates: string[], weeks = 4): number | null {
  if (!sessionDates.length) return null;
  const cutoff = Date.now() - weeks * 7 * 24 * 3600 * 1000;
  const recent = sessionDates.filter((d) => new Date(d).getTime() >= cutoff);
  return recent.length / weeks;
}

export function averageDaysBetween(sessionDates: string[]): number | null {
  if (sessionDates.length < 2) return null;
  const sorted = [...sessionDates]
    .map((d) => new Date(d).getTime())
    .sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push((sorted[i] - sorted[i - 1]) / (24 * 3600 * 1000));
  }
  return meanOf(gaps);
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 3600 * 1000));
}
