/**
 * Home records + previous performance.
 * שיא נקבע רק אם קיימת היסטוריה קודמת של אותו תרגיל.
 * אימון ראשון = baseline (לא "שיא").
 */
import type {
  HomeExerciseHistorySummary,
  HomePreviousPerformance,
  HomeRecord,
} from "./types";
import {
  listAllHomeSessions,
  listEntrySets,
  listSessionEntries,
  getHomeSession,
} from "./repo";
import {
  averageDaysBetween,
  daysSince,
  frequencyPerWeek,
  medianOf,
  meanOf,
  sumDurationSeconds,
  sumReps,
} from "./metrics";
import type { HomeExerciseEntry, HomeExerciseSet, HomeSession } from "./types";

interface EntryWithSetsAndSession {
  session: HomeSession;
  entry: HomeExerciseEntry;
  sets: HomeExerciseSet[];
}

export function collectExerciseHistory(exerciseId: string): EntryWithSetsAndSession[] {
  const sessions = listAllHomeSessions().filter(
    (s) => !s.deleted_at && s.status !== "trashed" && s.status !== "draft",
  );
  const rows: EntryWithSetsAndSession[] = [];
  for (const s of sessions) {
    const entries = listSessionEntries(s.id).filter((e) => e.exercise_id === exerciseId);
    for (const e of entries) {
      rows.push({ session: s, entry: e, sets: listEntrySets(e.id) });
    }
  }
  // Sort chronologically (oldest → newest).
  rows.sort(
    (a, b) => new Date(a.session.started_at).getTime() - new Date(b.session.started_at).getTime(),
  );
  return rows;
}

export function previousPerformance(
  exerciseId: string,
  excludeSessionId?: string,
): HomePreviousPerformance | null {
  const rows = collectExerciseHistory(exerciseId).filter(
    (r) => r.session.id !== excludeSessionId && r.session.status !== "in_progress",
  );
  if (!rows.length) return null;
  const last = rows[rows.length - 1];
  const reps = last.sets
    .filter((s) => s.completed && !s.skipped)
    .map((s) => s.reps)
    .filter((r): r is number => typeof r === "number");
  const durations = last.sets
    .filter((s) => s.completed && !s.skipped)
    .map((s) => s.duration_seconds)
    .filter((d): d is number => typeof d === "number");
  return {
    sessionId: last.session.id,
    sessionDate: last.session.started_at,
    totalReps: reps.length ? reps.reduce((a, b) => a + b, 0) : null,
    totalDurationSeconds: durations.length ? durations.reduce((a, b) => a + b, 0) : null,
    maxRepsInSet: reps.length ? Math.max(...reps) : null,
    longestHoldSeconds: durations.length ? Math.max(...durations) : null,
    sets: last.sets.map((s) => ({
      set_number: s.set_number,
      reps: s.reps,
      duration_seconds: s.duration_seconds,
      added_weight: s.added_weight,
      weight_unit: s.weight_unit,
      side: s.side,
      round_number: s.round_number,
    })),
    note: last.entry.notes,
  };
}

interface HistoryAcc {
  topRepsInSet: number;
  topRepsInSession: number;
  topAvgRepsPerSet: number;
  topHoldSeconds: number;
  topRounds: number;
  topRpm: number;
  topAddedWeight: number;
  minRpeByLoad: Map<string, number>;
}

function newAcc(): HistoryAcc {
  return {
    topRepsInSet: 0,
    topRepsInSession: 0,
    topAvgRepsPerSet: 0,
    topHoldSeconds: 0,
    topRounds: 0,
    topRpm: 0,
    topAddedWeight: 0,
    minRpeByLoad: new Map(),
  };
}

function loadKey(reps: number, added: number | null): string {
  return `${reps}|${added ?? 0}`;
}

function fillAcc(rows: EntryWithSetsAndSession[]): HistoryAcc {
  const acc = newAcc();
  for (const r of rows) {
    const compl = r.sets.filter((s) => s.completed && !s.skipped);
    const reps = compl.map((s) => s.reps).filter((n): n is number => typeof n === "number");
    const durations = compl
      .map((s) => s.duration_seconds)
      .filter((n): n is number => typeof n === "number");
    if (reps.length) {
      const maxR = Math.max(...reps);
      if (maxR > acc.topRepsInSet) acc.topRepsInSet = maxR;
      const sum = reps.reduce((a, b) => a + b, 0);
      if (sum > acc.topRepsInSession) acc.topRepsInSession = sum;
      const avg = sum / reps.length;
      if (avg > acc.topAvgRepsPerSet) acc.topAvgRepsPerSet = avg;
    }
    if (durations.length) {
      const maxD = Math.max(...durations);
      if (maxD > acc.topHoldSeconds) acc.topHoldSeconds = maxD;
      const sumD = durations.reduce((a, b) => a + b, 0);
      const sumR = reps.reduce((a, b) => a + b, 0);
      if (sumD > 0 && sumR > 0) {
        const rpm = (sumR / sumD) * 60;
        if (rpm > acc.topRpm) acc.topRpm = rpm;
      }
    }
    // Rounds: max round_number appearing.
    const rounds = Math.max(0, ...compl.map((s) => s.round_number ?? 0));
    if (rounds > acc.topRounds) acc.topRounds = rounds;
    // Added weight
    const maxAdded = Math.max(
      0,
      ...compl.map((s) => (typeof s.added_weight === "number" ? s.added_weight : 0)),
    );
    if (maxAdded > acc.topAddedWeight) acc.topAddedWeight = maxAdded;
    // rpe map
    for (const s of compl) {
      if (typeof s.reps !== "number" || typeof s.rpe !== "number") continue;
      const k = loadKey(s.reps, s.added_weight);
      const prev = acc.minRpeByLoad.get(k);
      if (prev == null || s.rpe < prev) acc.minRpeByLoad.set(k, s.rpe);
    }
  }
  return acc;
}

/** מזהה שיאים לאחר הוספת session אחרון. baseline = אין היסטוריה קודמת. */
export function detectRecords(exerciseId: string, sessionId: string): HomeRecord[] {
  const all = collectExerciseHistory(exerciseId);
  const before = all.filter((r) => r.session.id !== sessionId);
  const current = all.find((r) => r.session.id === sessionId);
  if (!current) return [];
  const session = getHomeSession(sessionId);
  if (!session) return [];
  const isBaseline = before.length === 0;
  const priorAcc = fillAcc(before);
  const currentAcc = fillAcc([current]);
  const records: HomeRecord[] = [];
  const at = session.ended_at ?? session.started_at;

  const compare = (
    kind: HomeRecord["kind"],
    value: number,
    prior: number,
    units: HomeRecord["units"],
    minDelta = 0,
  ) => {
    if (value <= 0) return;
    if (isBaseline) {
      records.push({
        kind,
        value,
        units,
        exerciseId,
        sessionId,
        isBaseline: true,
        achievedAt: at,
      });
      return;
    }
    if (value > prior + minDelta) {
      records.push({
        kind,
        value,
        units,
        exerciseId,
        sessionId,
        isBaseline: false,
        achievedAt: at,
      });
    }
  };

  compare("top_reps_in_set", currentAcc.topRepsInSet, priorAcc.topRepsInSet, "reps");
  compare(
    "top_reps_in_session",
    currentAcc.topRepsInSession,
    priorAcc.topRepsInSession,
    "reps",
  );
  compare(
    "top_avg_reps_per_set",
    currentAcc.topAvgRepsPerSet,
    priorAcc.topAvgRepsPerSet,
    "reps",
    0.5,
  );
  compare("top_hold_seconds", currentAcc.topHoldSeconds, priorAcc.topHoldSeconds, "seconds");
  compare("top_rounds", currentAcc.topRounds, priorAcc.topRounds, "rounds");
  compare("top_reps_per_minute", currentAcc.topRpm, priorAcc.topRpm, "reps_per_minute", 0.5);
  compare(
    "top_added_weight",
    currentAcc.topAddedWeight,
    priorAcc.topAddedWeight,
    "kg",
    0.001,
  );

  // Same-load lower RPE: for each (reps, added_weight) in current with RPE, compare to prior min.
  if (!isBaseline) {
    for (const [k, rpe] of currentAcc.minRpeByLoad) {
      const prior = priorAcc.minRpeByLoad.get(k);
      if (prior != null && rpe < prior) {
        records.push({
          kind: "same_load_lower_rpe",
          value: rpe,
          units: "rpe",
          exerciseId,
          sessionId,
          isBaseline: false,
          achievedAt: at,
        });
        break; // אחד מייצג מספיק — לא מציפים את המסך.
      }
    }
  }

  return records;
}

export function summarizeExerciseHistory(exerciseId: string): HomeExerciseHistorySummary {
  const rows = collectExerciseHistory(exerciseId);
  if (!rows.length) {
    return {
      exerciseId,
      timesPerformed: 0,
      lastSessionAt: null,
      daysSinceLast: null,
      topRepsInSet: null,
      topRepsInSession: null,
      topAvgRepsPerSet: null,
      topHoldSeconds: null,
      totalRepsAllTime: 0,
      totalDurationAllTime: 0,
      frequencyPerWeek: null,
      averageDaysBetween: null,
      medianRepsPerSet: null,
      trend: "insufficient_data",
    };
  }
  const acc = fillAcc(rows);
  const dates = rows.map((r) => r.session.started_at);
  const last = dates[dates.length - 1];
  const totalReps = rows.reduce((a, r) => a + sumReps(r.sets), 0);
  const totalDur = rows.reduce((a, r) => a + sumDurationSeconds(r.sets), 0);
  const allReps = rows.flatMap((r) =>
    r.sets
      .filter((s) => s.completed && !s.skipped)
      .map((s) => s.reps)
      .filter((n): n is number => typeof n === "number"),
  );
  // Trend: compare avg of last 3 sessions' totalReps to previous 3.
  let trend: HomeExerciseHistorySummary["trend"] = "insufficient_data";
  if (rows.length >= 4) {
    const totalsPerSession = rows.map((r) => sumReps(r.sets));
    const cut = Math.max(3, Math.floor(totalsPerSession.length / 2));
    const recent = totalsPerSession.slice(-cut);
    const prev = totalsPerSession.slice(0, -cut);
    const recentAvg = meanOf(recent) ?? 0;
    const prevAvg = meanOf(prev) ?? 0;
    if (prevAvg > 0) {
      const delta = (recentAvg - prevAvg) / prevAvg;
      trend = delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat";
    }
  }
  return {
    exerciseId,
    timesPerformed: rows.length,
    lastSessionAt: last,
    daysSinceLast: daysSince(last),
    topRepsInSet: acc.topRepsInSet || null,
    topRepsInSession: acc.topRepsInSession || null,
    topAvgRepsPerSet: acc.topAvgRepsPerSet || null,
    topHoldSeconds: acc.topHoldSeconds || null,
    totalRepsAllTime: totalReps,
    totalDurationAllTime: totalDur,
    frequencyPerWeek: frequencyPerWeek(dates),
    averageDaysBetween: averageDaysBetween(dates),
    medianRepsPerSet: allReps.length ? medianOf(allReps) : null,
    trend,
  };
}

/** מזהה תרגילים אחרונים ומועדפים לפי היסטוריה (עבור אריחי דיווח מהיר). */
export function recentExerciseIds(limit = 6): string[] {
  const sessions = listAllHomeSessions()
    .filter((s) => !s.deleted_at && s.status !== "trashed" && s.status !== "draft")
    .sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    );
  const seen: string[] = [];
  for (const s of sessions) {
    for (const e of listSessionEntries(s.id)) {
      if (!seen.includes(e.exercise_id)) seen.push(e.exercise_id);
      if (seen.length >= limit) return seen;
    }
  }
  return seen;
}
