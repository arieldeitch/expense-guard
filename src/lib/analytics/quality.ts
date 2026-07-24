/**
 * Workout Quality Score — ציון איכות אישי ושקוף.
 *
 * מטרתו: להשוות אימונים דומים של אותו משתמש, לזהות עמידה בתכנון, שיפור מבוקר
 * ושלמות נתונים. אינו ציון בריאות/רפואי/טכניקה/השוואה לאחרים.
 *
 * משקלי ברירת מחדל (סה"כ 1.00 כאשר כל הרכיבים זמינים):
 *   completion 0.25 | rep_target 0.20 | load_progression 0.15 | set_consistency 0.15
 *   rpe_alignment 0.10 | rest_adherence 0.05 | data_completeness 0.10
 *
 * רכיב חסר (מידע לא הוזן) → מוחרג ומנורמל מחדש. לא מעניש.
 */
import type { StrengthSet, StrengthSessionExercise } from "@/lib/sessions";
import {
  getSession,
  listSessionExercises,
  listExerciseSets,
  computeDataCompleteness,
} from "@/lib/sessions";
import type { QualityComponent, WorkoutQuality } from "./types";
import { isWorkingSet } from "./comparability";

const DEFAULT_WEIGHTS = {
  completion: 0.25,
  rep_target: 0.20,
  load_progression: 0.15,
  set_consistency: 0.15,
  rpe_alignment: 0.10,
  rest_adherence: 0.05,
  data_completeness: 0.10,
} as const;

function clamp01to100(x: number): number {
  return Math.max(0, Math.min(100, Math.round(x)));
}

function computeCompletion(exercises: StrengthSessionExercise[]): QualityComponent | null {
  let total = 0;
  let done = 0;
  for (const ex of exercises) {
    for (const s of listExerciseSets(ex.id)) {
      if (s.set_type === "warmup") continue;
      total++;
      if (s.completed) done++;
    }
  }
  if (total === 0) return null;
  return {
    id: "completion",
    label: "השלמת סטים",
    score: clamp01to100((done / total) * 100),
    weight: 0,
    defaultWeight: DEFAULT_WEIGHTS.completion,
    included: true,
  };
}

function computeRepTarget(exercises: StrengthSessionExercise[]): QualityComponent | null {
  let total = 0;
  let inTarget = 0;
  for (const ex of exercises) {
    const min = ex.snapshot.rep_range_min ?? ex.snapshot.planned_reps ?? null;
    const max = ex.snapshot.rep_range_max ?? ex.snapshot.planned_reps ?? null;
    if (min == null && max == null) continue;
    for (const s of listExerciseSets(ex.id)) {
      if (s.set_type === "warmup" || !s.completed || s.actual_reps == null) continue;
      total++;
      const lo = min ?? 0;
      const hi = max ?? Number.POSITIVE_INFINITY;
      if (s.actual_reps >= lo && s.actual_reps <= hi) inTarget++;
    }
  }
  if (total === 0) return null;
  return {
    id: "rep_target",
    label: "עמידה בטווח חזרות",
    score: clamp01to100((inTarget / total) * 100),
    weight: 0,
    defaultWeight: DEFAULT_WEIGHTS.rep_target,
    included: true,
  };
}

function computeLoadProgression(exercises: StrengthSessionExercise[]): QualityComponent | null {
  let considered = 0;
  let met = 0;
  for (const ex of exercises) {
    const plannedW = ex.snapshot.planned_weight;
    if (plannedW == null) continue;
    for (const s of listExerciseSets(ex.id)) {
      if (s.set_type === "warmup" || !s.completed || s.actual_weight == null) continue;
      considered++;
      if (s.actual_weight >= plannedW) met++;
    }
  }
  if (considered === 0) return null;
  return {
    id: "load_progression",
    label: "עמידה במשקל המתוכנן",
    score: clamp01to100((met / considered) * 100),
    weight: 0,
    defaultWeight: DEFAULT_WEIGHTS.load_progression,
    included: true,
  };
}

function computeSetConsistency(exercises: StrengthSessionExercise[]): QualityComponent | null {
  let totalGrouped = 0;
  let scoreAcc = 0;
  for (const ex of exercises) {
    const working = listExerciseSets(ex.id).filter(isWorkingSet);
    const reps = working.map((s) => s.actual_reps).filter((r): r is number => r != null);
    if (reps.length < 2) continue;
    const first = reps[0];
    const last = reps[reps.length - 1];
    if (first === 0) continue;
    const dropRatio = Math.max(0, (first - last) / first);
    // 0 → 100, 0.5 → 0
    const s = Math.max(0, 100 - dropRatio * 200);
    scoreAcc += s;
    totalGrouped++;
  }
  if (totalGrouped === 0) return null;
  return {
    id: "set_consistency",
    label: "יציבות בין סטים",
    score: clamp01to100(scoreAcc / totalGrouped),
    weight: 0,
    defaultWeight: DEFAULT_WEIGHTS.set_consistency,
    included: true,
  };
}

function computeRpeAlignment(exercises: StrengthSessionExercise[]): QualityComponent | null {
  let considered = 0;
  let aligned = 0;
  for (const ex of exercises) {
    const target = ex.snapshot.default_rpe;
    if (target == null) continue;
    for (const s of listExerciseSets(ex.id)) {
      if (!s.completed || s.rpe == null) continue;
      considered++;
      if (Math.abs(s.rpe - target) <= 1) aligned++;
    }
  }
  if (considered === 0) return null;
  return {
    id: "rpe_alignment",
    label: "עמידה ב־RPE מתוכנן",
    score: clamp01to100((aligned / considered) * 100),
    weight: 0,
    defaultWeight: DEFAULT_WEIGHTS.rpe_alignment,
    included: true,
  };
}

function computeRestAdherence(exercises: StrengthSessionExercise[]): QualityComponent | null {
  // ללא זמני מנוחה בפועל שנמדדו — אין רכיב.
  // דוגמה מינימלית: אם planned rest_seconds הוגדר אך אין נתון בפועל → מוחרג.
  let hasAnyPlanned = false;
  let considered = 0;
  let close = 0;
  for (const ex of exercises) {
    for (const s of listExerciseSets(ex.id)) {
      if (s.set_type === "warmup") continue;
      if (s.rest_seconds != null) hasAnyPlanned = true;
      // אין actual_rest_seconds → לא ניתן לחשב.
    }
  }
  if (!hasAnyPlanned || considered === 0) return null;
  return {
    id: "rest_adherence",
    label: "עמידה בזמני מנוחה",
    score: clamp01to100((close / considered) * 100),
    weight: 0,
    defaultWeight: DEFAULT_WEIGHTS.rest_adherence,
    included: true,
  };
}

function componentFromDataCompleteness(sessionId: string): QualityComponent {
  const { score } = computeDataCompleteness(sessionId);
  return {
    id: "data_completeness",
    label: "שלמות נתונים",
    score: clamp01to100(score),
    weight: 0,
    defaultWeight: DEFAULT_WEIGHTS.data_completeness,
    included: true,
  };
}

export function computeWorkoutQuality(sessionId: string): WorkoutQuality {
  const session = getSession(sessionId);
  const exercises = listSessionExercises(sessionId);
  const raw: (QualityComponent | null)[] = [
    computeCompletion(exercises),
    computeRepTarget(exercises),
    computeLoadProgression(exercises),
    computeSetConsistency(exercises),
    computeRpeAlignment(exercises),
    computeRestAdherence(exercises),
    componentFromDataCompleteness(sessionId),
  ];
  const included = raw.filter((c): c is QualityComponent => !!c);
  const excluded = raw
    .map((c, i) =>
      c
        ? null
        : (
            [
              "completion",
              "rep_target",
              "load_progression",
              "set_consistency",
              "rpe_alignment",
              "rest_adherence",
              "data_completeness",
            ] as const
          )[i],
    )
    .filter((x): x is NonNullable<typeof x> => !!x) as string[];

  // נרמול מחדש של משקלים לפי הרכיבים הכלולים.
  const totalDefault = included.reduce((sum, c) => sum + c.defaultWeight, 0);
  const normalized = included.map((c) => ({
    ...c,
    weight: totalDefault > 0 ? c.defaultWeight / totalDefault : 0,
  }));

  let total: number | null = null;
  if (normalized.length >= 3) {
    total = clamp01to100(normalized.reduce((sum, c) => sum + c.score * c.weight, 0));
  }

  const narrative: string[] = [];
  const completion = normalized.find((c) => c.id === "completion");
  if (completion) narrative.push(`הושלמו ${completion.score}% מהסטים המתוכננים.`);
  const rep = normalized.find((c) => c.id === "rep_target");
  if (rep) narrative.push(`${rep.score}% מהסטים בוצעו בטווח החזרות המתוכנן.`);
  const cons = normalized.find((c) => c.id === "set_consistency");
  if (cons) narrative.push(`יציבות בין סטים: ${cons.score}%.`);
  const rpe = normalized.find((c) => c.id === "rpe_alignment");
  if (rpe) narrative.push(`התאמת RPE לתכנון: ${rpe.score}%.`);
  else if (excluded.includes("rpe_alignment"))
    narrative.push("RPE לא הוזן ולכן אינו חלק מהציון.");
  if (excluded.includes("rest_adherence"))
    narrative.push("זמני מנוחה בפועל לא נמדדו — לא נכלל.");
  if (session?.perceived_quality != null) {
    narrative.push(`תחושה עצמית שדווחה: ${session.perceived_quality}/5.`);
  }

  const label =
    total == null
      ? "אין מספיק נתונים לחישוב מדד איכות"
      : total >= 85
        ? "אימון עקבי — בוצע כמתוכנן"
        : total >= 70
          ? "בוצע ברובו כמתוכנן"
          : total >= 50
            ? "בוצע חלקית — יש פערים מהתכנון"
            : "בוצע בפערים משמעותיים מהתכנון";

  return {
    sessionId,
    totalScore: total,
    label,
    components: normalized,
    excludedComponents: excluded,
    narrative,
  };
}
