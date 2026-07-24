/**
 * Muscle load summary — מסכם עומס לפי קבוצות שריר לתרגילי התבנית.
 * מסתמך על ה־exercises repo לקבל את primary/secondary muscle group per exercise.
 */
import { getExercise } from "@/lib/exercises";
import { listTemplateExercises, listBlocks } from "./repo";
import type { TemplateMuscleLoadSummary } from "./types";

// heuristic: קטגוריית ה־muscle group משפיעה על push/pull/upper/lower/core.
const PUSH_CODES = new Set(["chest", "shoulders", "triceps", "quads"]);
const PULL_CODES = new Set(["back", "biceps", "hamstrings", "forearms"]);
const UPPER_CODES = new Set([
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
]);
const LOWER_CODES = new Set(["quads", "hamstrings", "glutes", "calves", "hip_flexors"]);
const CORE_CODES = new Set(["core", "obliques", "lower_back"]);

export function summarizeTemplateMuscleLoad(templateId: string): TemplateMuscleLoadSummary {
  void listBlocks; // ensure tree-shake awareness
  const templateExercises = listTemplateExercises(templateId);

  const primary = new Map<string, { exercises: number; sets: number }>();
  const secondary = new Map<string, { exercises: number; sets: number }>();
  let push = 0,
    pull = 0,
    upper = 0,
    lower = 0,
    core = 0,
    totalSets = 0;

  for (const te of templateExercises) {
    const ex = getExercise(te.exercise_id);
    if (!ex) continue;
    totalSets += te.planned_sets;
    const primId = ex.primary_muscle_group_id;
    if (primId) {
      const cur = primary.get(primId) ?? { exercises: 0, sets: 0 };
      cur.exercises += 1;
      cur.sets += te.planned_sets;
      primary.set(primId, cur);
    }
    for (const sid of ex.secondary_muscle_group_ids) {
      const cur = secondary.get(sid) ?? { exercises: 0, sets: 0 };
      cur.exercises += 1;
      cur.sets += te.planned_sets;
      secondary.set(sid, cur);
    }
    // classify by primary group code (fallback: id)
    const code = primId; // codes are stored as ids in our seed
    if (code && PUSH_CODES.has(code)) push += 1;
    if (code && PULL_CODES.has(code)) pull += 1;
    if (code && UPPER_CODES.has(code)) upper += 1;
    if (code && LOWER_CODES.has(code)) lower += 1;
    if (code && CORE_CODES.has(code)) core += 1;
  }

  return {
    totalExercises: templateExercises.length,
    totalSets,
    primary: [...primary.entries()]
      .map(([muscle_group_id, v]) => ({ muscle_group_id, ...v }))
      .sort((a, b) => b.sets - a.sets),
    secondary: [...secondary.entries()]
      .map(([muscle_group_id, v]) => ({ muscle_group_id, ...v }))
      .sort((a, b) => b.sets - a.sets),
    pushCount: push,
    pullCount: pull,
    upperCount: upper,
    lowerCount: lower,
    coreCount: core,
  };
}
