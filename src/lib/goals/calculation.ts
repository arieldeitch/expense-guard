/**
 * Goal calculation — דטרמיניסטי, שקוף, מבודד מ־storage.
 *
 * מקבל: Goal + נתוני activity רלוונטיים לתחום.
 * מחזיר: GoalProgress מלא — current, percentage, projection, calculation_details.
 *
 * חוקים:
 * - כל חישוב מרוכז בפונקציה per-goal-type.
 * - אין progress > 100 ולא < 0. אין negative_progress. חסום ל־[0..100].
 * - אם אין נתונים → progress=null, data_available=false.
 * - projection = לינארית בלבד (v1). לא ML.
 * - כל המדרג מוצג ב־calculation_details בעברית.
 * - formula_version="v1" בכל snapshot.
 */
import type {
  ConfidenceLabel,
  GoalDomain,
  GoalProgress,
  Goal,
  GoalPeriod,
} from "./types";
import { getGoalTypeSpec } from "./catalog";
import type { RunSession } from "@/lib/runs/types";
import type { StrengthSession, StrengthSet } from "@/lib/sessions/types";
import type { HomeSession } from "@/lib/home/types";

export const FORMULA_VERSION = "v1";

const MS_DAY = 86_400_000;

export interface CalcContext {
  runs?: RunSession[];
  strengthSessions?: StrengthSession[];
  strengthSets?: StrengthSet[];
  homeSessions?: HomeSession[];
  /** current שהוזן ידנית ע"י המשתמש — משמש ב־custom_manual. */
  manualCurrent?: number | null;
  now?: Date;
}

// ---------- Utils ----------

function clampPct(p: number): number {
  if (!isFinite(p)) return 0;
  if (p < 0) return 0;
  if (p > 100) return 100;
  return Math.round(p * 10) / 10; // דיוק 0.1%
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_DAY);
}

function periodStart(period: GoalPeriod | null, now: Date, start_date: string | null): Date | null {
  if (period === "custom" && start_date) return new Date(start_date);
  const d = new Date(now);
  if (period === "week") {
    const day = d.getDay(); // Sun=0
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return new Date(now.getFullYear(), q * 3, 1);
  }
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  if (start_date) return new Date(start_date);
  return null;
}

function activeRuns(runs: RunSession[] | undefined): RunSession[] {
  return (runs ?? []).filter((r) => r.deleted_at == null && r.status === "completed");
}

function activeStrength(sessions: StrengthSession[] | undefined): StrengthSession[] {
  return (sessions ?? []).filter((s) => s.deleted_at == null && s.status === "completed");
}

function activeHome(sessions: HomeSession[] | undefined): HomeSession[] {
  return (sessions ?? []).filter((s) => s.deleted_at == null && s.status === "completed");
}

// ---------- Progress calculators ----------

interface Calc {
  current_value: number | null;
  source_activity_ids: string[];
  details: string;
  data_available: boolean;
}

function calcRunCurrent(goal: Goal, ctx: CalcContext): Calc {
  const now = ctx.now ?? new Date();
  const runs = activeRuns(ctx.runs);
  switch (goal.goal_type) {
    case "run_distance_total": {
      const scope = goal.start_date ? runs.filter((r) => r.started_at >= goal.start_date!) : runs;
      const meters = scope.reduce((a, r) => a + (r.distance_meters ?? 0), 0);
      return {
        current_value: meters / 1000,
        source_activity_ids: scope.map((r) => r.id),
        details: `סכום מרחקים מ־${scope.length} ריצות פעילות = ${(meters / 1000).toFixed(2)} ק״מ`,
        data_available: scope.length > 0,
      };
    }
    case "run_time_for_distance":
    case "run_pace_for_distance": {
      const wantMeters = goal.linked_extra_number ?? 0;
      if (wantMeters <= 0)
        return { current_value: null, source_activity_ids: [], details: "לא צוין מרחק יעד", data_available: false };
      // בחר ריצות שסביב אותו מרחק (±10%) — הטובות ביותר.
      const tol = 0.1;
      const eligible = runs.filter(
        (r) =>
          r.distance_meters != null &&
          Math.abs(r.distance_meters - wantMeters) <= wantMeters * tol,
      );
      if (eligible.length === 0)
        return {
          current_value: null,
          source_activity_ids: [],
          details: `אין ריצות במרחק ${(wantMeters / 1000).toFixed(2)} ק״מ (±10%)`,
          data_available: false,
        };
      if (goal.goal_type === "run_time_for_distance") {
        const best = eligible.reduce((b, r) =>
          (r.duration_seconds ?? Infinity) < (b.duration_seconds ?? Infinity) ? r : b,
        );
        return {
          current_value: best.duration_seconds,
          source_activity_ids: [best.id],
          details: `הזמן הטוב ביותר במרחק היעד מתוך ${eligible.length} ריצות`,
          data_available: best.duration_seconds != null,
        };
      }
      const bestPace = eligible.reduce((b, r) =>
        (r.average_pace_s_per_km ?? Infinity) < (b.average_pace_s_per_km ?? Infinity) ? r : b,
      );
      return {
        current_value: bestPace.average_pace_s_per_km,
        source_activity_ids: [bestPace.id],
        details: `הקצב הטוב ביותר במרחק היעד מתוך ${eligible.length} ריצות`,
        data_available: bestPace.average_pace_s_per_km != null,
      };
    }
    case "run_weekly_distance":
    case "run_monthly_distance": {
      const period: GoalPeriod =
        goal.linked_period ?? (goal.goal_type === "run_weekly_distance" ? "week" : "month");
      const start = periodStart(period, now, goal.start_date);
      const scope = start ? runs.filter((r) => new Date(r.started_at) >= start) : runs;
      const meters = scope.reduce((a, r) => a + (r.distance_meters ?? 0), 0);
      return {
        current_value: meters / 1000,
        source_activity_ids: scope.map((r) => r.id),
        details: `${(meters / 1000).toFixed(2)} ק״מ ב־${scope.length} ריצות בתקופה הנוכחית`,
        data_available: true,
      };
    }
    case "run_count_in_period": {
      const start = periodStart(goal.linked_period ?? "month", now, goal.start_date);
      const scope = start ? runs.filter((r) => new Date(r.started_at) >= start) : runs;
      return {
        current_value: scope.length,
        source_activity_ids: scope.map((r) => r.id),
        details: `${scope.length} ריצות פעילות בתקופה`,
        data_available: true,
      };
    }
    case "run_cumulative_time": {
      const start = periodStart(goal.linked_period ?? "month", now, goal.start_date);
      const scope = start ? runs.filter((r) => new Date(r.started_at) >= start) : runs;
      const seconds = scope.reduce((a, r) => a + (r.duration_seconds ?? 0), 0);
      return {
        current_value: seconds / 60, // דקות
        source_activity_ids: scope.map((r) => r.id),
        details: `סך ${(seconds / 60).toFixed(1)} דקות מ־${scope.length} ריצות בתקופה`,
        data_available: true,
      };
    }
    case "run_event_completion": {
      return {
        current_value: ctx.manualCurrent ?? goal.current_value,
        source_activity_ids: [],
        details: goal.target_date
          ? `אירוע ב־${goal.target_date}. אין חישוב אוטומטי — סטטוס לפי המשתמש.`
          : "אירוע ללא תאריך יעד",
        data_available: goal.target_date != null,
      };
    }
    case "run_custom":
      return {
        current_value: ctx.manualCurrent ?? goal.current_value,
        source_activity_ids: [],
        details: "יעד מותאם — ערך מוזן ידנית",
        data_available: (ctx.manualCurrent ?? goal.current_value) != null,
      };
    default:
      return { current_value: null, source_activity_ids: [], details: "", data_available: false };
  }
}

function calcGymCurrent(goal: Goal, ctx: CalcContext): Calc {
  const now = ctx.now ?? new Date();
  const sessions = activeStrength(ctx.strengthSessions);
  const sets = (ctx.strengthSets ?? []).filter((s) => s.deleted_at == null);
  switch (goal.goal_type) {
    case "gym_exercise_top_weight": {
      const exId = goal.linked_exercise_id;
      if (!exId)
        return { current_value: null, source_activity_ids: [], details: "לא נבחר תרגיל", data_available: false };
      const relevant = sets.filter((s) => s.exercise_id === exId && (s.weight ?? 0) > 0);
      if (relevant.length === 0)
        return {
          current_value: null,
          source_activity_ids: [],
          details: "אין סטים בתרגיל זה",
          data_available: false,
        };
      const top = relevant.reduce((b, s) => ((s.weight ?? 0) > (b.weight ?? 0) ? s : b));
      return {
        current_value: top.weight,
        source_activity_ids: [top.session_id],
        details: `שיא משקל מתוך ${relevant.length} סטים בתרגיל`,
        data_available: true,
      };
    }
    case "gym_reps_at_weight": {
      const exId = goal.linked_exercise_id;
      const wantWeight = goal.linked_extra_number;
      if (!exId || wantWeight == null)
        return { current_value: null, source_activity_ids: [], details: "חסר תרגיל או משקל", data_available: false };
      const relevant = sets.filter(
        (s) => s.exercise_id === exId && (s.weight ?? -1) === wantWeight && (s.reps ?? 0) > 0,
      );
      if (relevant.length === 0)
        return {
          current_value: null,
          source_activity_ids: [],
          details: `אין סטים בתרגיל במשקל ${wantWeight}kg`,
          data_available: false,
        };
      const top = relevant.reduce((b, s) => ((s.reps ?? 0) > (b.reps ?? 0) ? s : b));
      return {
        current_value: top.reps,
        source_activity_ids: [top.session_id],
        details: `שיא חזרות במשקל ${wantWeight}kg מתוך ${relevant.length} סטים`,
        data_available: true,
      };
    }
    case "gym_estimated_1rm": {
      const exId = goal.linked_exercise_id;
      if (!exId)
        return { current_value: null, source_activity_ids: [], details: "לא נבחר תרגיל", data_available: false };
      const relevant = sets.filter(
        (s) => s.exercise_id === exId && (s.weight ?? 0) > 0 && (s.reps ?? 0) > 0,
      );
      if (relevant.length === 0)
        return { current_value: null, source_activity_ids: [], details: "אין סטים לחישוב 1RM", data_available: false };
      // Epley: w * (1 + reps/30)
      let best = 0;
      let bestSid = "";
      for (const s of relevant) {
        const e = (s.weight ?? 0) * (1 + (s.reps ?? 0) / 30);
        if (e > best) {
          best = e;
          bestSid = s.session_id;
        }
      }
      return {
        current_value: Math.round(best * 10) / 10,
        source_activity_ids: [bestSid],
        details: `1RM מוערך (Epley) על סמך ${relevant.length} סטים`,
        data_available: true,
      };
    }
    case "gym_sessions_in_period": {
      const start = periodStart(goal.linked_period ?? "month", now, goal.start_date);
      const scope = start ? sessions.filter((s) => new Date(s.started_at) >= start) : sessions;
      return {
        current_value: scope.length,
        source_activity_ids: scope.map((s) => s.id),
        details: `${scope.length} אימונים בתקופה`,
        data_available: true,
      };
    }
    case "gym_template_completions": {
      const tid = goal.linked_template_id;
      if (!tid)
        return { current_value: null, source_activity_ids: [], details: "לא נבחרה תבנית", data_available: false };
      const scope = sessions.filter((s) => s.template_id === tid);
      return {
        current_value: scope.length,
        source_activity_ids: scope.map((s) => s.id),
        details: `${scope.length} השלמות של התבנית`,
        data_available: true,
      };
    }
    case "gym_set_completion_rate": {
      const start = periodStart(goal.linked_period ?? "month", now, goal.start_date);
      const scope = start ? sessions.filter((s) => new Date(s.started_at) >= start) : sessions;
      let planned = 0;
      let completed = 0;
      const scopeSet = new Set(scope.map((s) => s.id));
      for (const s of sets) {
        if (!scopeSet.has(s.session_id)) continue;
        planned++;
        if (s.completed) completed++;
      }
      const rate = planned === 0 ? 0 : (completed / planned) * 100;
      return {
        current_value: Math.round(rate * 10) / 10,
        source_activity_ids: scope.map((s) => s.id),
        details: `${completed}/${planned} סטים הושלמו בתקופה`,
        data_available: planned > 0,
      };
    }
    case "gym_custom_metric":
    case "gym_custom":
      return {
        current_value: ctx.manualCurrent ?? goal.current_value,
        source_activity_ids: [],
        details: "יעד מותאם — ערך מוזן ידנית",
        data_available: (ctx.manualCurrent ?? goal.current_value) != null,
      };
    default:
      return { current_value: null, source_activity_ids: [], details: "", data_available: false };
  }
}

function calcHomeCurrent(goal: Goal, ctx: CalcContext): Calc {
  const now = ctx.now ?? new Date();
  const sessions = activeHome(ctx.homeSessions);
  switch (goal.goal_type) {
    case "home_consecutive_reps": {
      const exId = goal.linked_exercise_id;
      if (!exId)
        return { current_value: null, source_activity_ids: [], details: "לא נבחר תרגיל", data_available: false };
      let best = 0;
      let bestSid = "";
      for (const s of sessions) {
        for (const ex of s.exercises ?? []) {
          if (ex.exercise_id !== exId) continue;
          for (const set of ex.sets ?? []) {
            const reps = set.reps ?? 0;
            if (reps > best) {
              best = reps;
              bestSid = s.id;
            }
          }
        }
      }
      return {
        current_value: best || null,
        source_activity_ids: bestSid ? [bestSid] : [],
        details: best > 0 ? `שיא של ${best} חזרות בסט יחיד` : "אין סטים בתרגיל",
        data_available: best > 0,
      };
    }
    case "home_hold_seconds": {
      const exId = goal.linked_exercise_id;
      if (!exId)
        return { current_value: null, source_activity_ids: [], details: "לא נבחר תרגיל", data_available: false };
      let best = 0;
      let bestSid = "";
      for (const s of sessions) {
        for (const ex of s.exercises ?? []) {
          if (ex.exercise_id !== exId) continue;
          for (const set of ex.sets ?? []) {
            const dur = set.duration_seconds ?? 0;
            if (dur > best) {
              best = dur;
              bestSid = s.id;
            }
          }
        }
      }
      return {
        current_value: best || null,
        source_activity_ids: bestSid ? [bestSid] : [],
        details: best > 0 ? `שיא אחזקה של ${best} שניות` : "אין סטים בתרגיל",
        data_available: best > 0,
      };
    }
    case "home_total_reps_in_session": {
      const exId = goal.linked_exercise_id;
      if (!exId)
        return { current_value: null, source_activity_ids: [], details: "לא נבחר תרגיל", data_available: false };
      let best = 0;
      let bestSid = "";
      for (const s of sessions) {
        let sessionReps = 0;
        for (const ex of s.exercises ?? []) {
          if (ex.exercise_id !== exId) continue;
          for (const set of ex.sets ?? []) sessionReps += set.reps ?? 0;
        }
        if (sessionReps > best) {
          best = sessionReps;
          bestSid = s.id;
        }
      }
      return {
        current_value: best || null,
        source_activity_ids: bestSid ? [bestSid] : [],
        details: best > 0 ? `סך ${best} חזרות באימון הטוב ביותר` : "אין נתונים",
        data_available: best > 0,
      };
    }
    case "home_sessions_in_period": {
      const start = periodStart(goal.linked_period ?? "month", now, goal.start_date);
      const scope = start ? sessions.filter((s) => new Date(s.started_at) >= start) : sessions;
      return {
        current_value: scope.length,
        source_activity_ids: scope.map((s) => s.id),
        details: `${scope.length} אימוני בית בתקופה`,
        data_available: true,
      };
    }
    case "home_sets_in_period": {
      const start = periodStart(goal.linked_period ?? "month", now, goal.start_date);
      const scope = start ? sessions.filter((s) => new Date(s.started_at) >= start) : sessions;
      let total = 0;
      for (const s of scope) {
        for (const ex of s.exercises ?? []) total += (ex.sets ?? []).length;
      }
      return {
        current_value: total,
        source_activity_ids: scope.map((s) => s.id),
        details: `${total} סטים ב־${scope.length} אימונים בתקופה`,
        data_available: true,
      };
    }
    case "home_reps_per_minute":
    case "home_custom":
      return {
        current_value: ctx.manualCurrent ?? goal.current_value,
        source_activity_ids: [],
        details: "יעד מותאם — ערך מוזן ידנית",
        data_available: (ctx.manualCurrent ?? goal.current_value) != null,
      };
    default:
      return { current_value: null, source_activity_ids: [], details: "", data_available: false };
  }
}

// ---------- Percentage + projection ----------

function computePercentage(goal: Goal, current: number | null): number | null {
  if (current == null || goal.target_value == null) return null;
  const target = goal.target_value;
  const baseline = goal.baseline_value ?? 0;
  switch (goal.calculation_method) {
    case "linear_increasing": {
      const denom = target - baseline;
      if (denom <= 0) return null;
      return clampPct(((current - baseline) / denom) * 100);
    }
    case "linear_decreasing": {
      const denom = baseline - target;
      if (denom <= 0) return null;
      return clampPct(((baseline - current) / denom) * 100);
    }
    case "count_over_target": {
      if (target <= 0) return null;
      return clampPct((current / target) * 100);
    }
    case "rate_percentage": {
      if (target <= 0) return null;
      return clampPct((current / target) * 100);
    }
    case "event_no_progress":
      return null;
    case "custom_manual": {
      const denom = target - baseline;
      if (denom === 0) return null;
      const p = ((current - baseline) / denom) * 100;
      return clampPct(p);
    }
  }
}

/** תחזית לינארית: אם בקצב הנוכחי, איפה נהיה בתאריך היעד. */
function computeProjection(
  goal: Goal,
  current: number | null,
  now: Date,
): { value: number | null; method: string | null; confidence: ConfidenceLabel } {
  if (current == null || goal.start_date == null || goal.target_date == null) {
    return { value: null, method: null, confidence: "none" };
  }
  const start = new Date(goal.start_date);
  const target = new Date(goal.target_date);
  const elapsedDays = Math.max(1, daysBetween(start, now));
  const totalDays = Math.max(1, daysBetween(start, target));
  if (totalDays <= 0) return { value: null, method: null, confidence: "none" };
  const baseline = goal.baseline_value ?? 0;
  const delta = current - baseline;
  const rate = delta / elapsedDays;
  const projected = baseline + rate * totalDays;
  const confidence: ConfidenceLabel =
    elapsedDays < 3
      ? "initial"
      : elapsedDays < 14
      ? "low"
      : elapsedDays < 60
      ? "medium"
      : "high";
  return {
    value: Math.round(projected * 100) / 100,
    method: `לינארי — קצב של ${(rate).toFixed(3)} יחידות/יום מבוסס ${elapsedDays} ימי מעקב`,
    confidence,
  };
}

// ---------- Public entry ----------

export function calcGoalProgress(goal: Goal, ctx: CalcContext = {}): GoalProgress {
  const now = ctx.now ?? new Date();
  const spec = getGoalTypeSpec(goal.goal_type);
  const domain: GoalDomain = spec.domain;
  const calc: Calc =
    domain === "running"
      ? calcRunCurrent(goal, ctx)
      : domain === "gym"
      ? calcGymCurrent(goal, ctx)
      : calcHomeCurrent(goal, ctx);

  const current = spec.manual_current
    ? ctx.manualCurrent ?? goal.current_value
    : calc.current_value;

  const percentage = computePercentage(goal, current);
  const remaining =
    current != null && goal.target_value != null
      ? spec.direction === "decreasing"
        ? current - goal.target_value
        : goal.target_value - current
      : null;

  const days_remaining = goal.target_date ? daysBetween(now, new Date(goal.target_date)) : null;
  const projection = computeProjection(goal, current, now);

  const target_met =
    current != null &&
    goal.target_value != null &&
    (spec.direction === "decreasing"
      ? current <= goal.target_value
      : current >= goal.target_value);

  return {
    goal_id: goal.id,
    current_value: current,
    progress_percentage: percentage,
    remaining_value: remaining,
    days_remaining,
    projected_value: projection.value,
    projection_method: projection.method,
    calculation_method: goal.calculation_method,
    formula_version: FORMULA_VERSION,
    calculation_details: calc.details,
    source_activity_ids: calc.source_activity_ids,
    confidence_label: projection.confidence,
    is_target_met: target_met,
    is_target_date_passed: days_remaining != null && days_remaining < 0,
    data_available: calc.data_available,
  };
}
