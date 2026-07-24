/**
 * Duration estimation — משך משוער לתבנית.
 * חישוב:
 *   לכל בלוק:
 *     - single/warmup/cooldown: sum(sets * (execution + rest_between_sets)) + transition
 *     - superset/triset/circuit: rounds * (sum(execution_per_exercise) + intra_rest * (n-1)) + round_rest * (rounds-1) + transition
 * הפלט כולל טווח: min = 90% seconds, max = 130% seconds.
 */
import {
  AVERAGE_SET_EXECUTION_SECONDS,
  AVERAGE_TRANSITION_BETWEEN_EXERCISES_SECONDS,
  DEFAULT_INTRA_SUPERSET_REST_SECONDS,
  DEFAULT_REST_SECONDS,
  DEFAULT_SUPERSET_ROUND_REST_SECONDS,
} from "./defaults";
import { listBlocks, listBlockExercises, getTemplate } from "./repo";
import type { TemplateDurationEstimate, WorkoutTemplateBlock, WorkoutTemplateExercise } from "./types";

export function estimateTemplateDuration(templateId: string): TemplateDurationEstimate {
  const template = getTemplate(templateId);
  const blocks = listBlocks(templateId);
  if (!template || blocks.length === 0) {
    return {
      seconds: 0,
      minMinutes: 0,
      maxMinutes: 0,
      explanation: ["אין תרגילים בתבנית עדיין"],
    };
  }

  const templateRest = template.default_rest_seconds ?? DEFAULT_REST_SECONDS;
  let total = 0;
  const details: string[] = [];

  for (const block of blocks) {
    const exs = listBlockExercises(block.id);
    if (exs.length === 0) continue;
    const rounds = Math.max(1, block.rounds);
    const isSuperset =
      block.block_type === "superset" ||
      block.block_type === "triset" ||
      block.block_type === "circuit";

    if (!isSuperset) {
      // single, warmup, cooldown
      for (const ex of exs) {
        total += estimateExerciseSeconds(ex, templateRest);
      }
      total += (exs.length - 1) * AVERAGE_TRANSITION_BETWEEN_EXERCISES_SECONDS;
    } else {
      total += estimateSupersetSeconds(block, exs, templateRest);
    }
    total += AVERAGE_TRANSITION_BETWEEN_EXERCISES_SECONDS;
  }

  details.push(`חושב לפי ${blocks.length} בלוקים ו־${blocks.reduce((n, b) => n + Math.max(1, b.rounds), 0)} סבבים סה"כ`);
  details.push("הערכה — יכולה להשתנות בפועל לפי קצב המנוחה");

  const seconds = Math.round(total);
  return {
    seconds,
    minMinutes: Math.max(1, Math.round((seconds * 0.9) / 60)),
    maxMinutes: Math.max(1, Math.round((seconds * 1.3) / 60)),
    explanation: details,
  };
}

function estimateExerciseSeconds(ex: WorkoutTemplateExercise, templateRest: number): number {
  const sets = Math.max(1, ex.planned_sets);
  const rest = ex.rest_seconds ?? templateRest;
  return sets * AVERAGE_SET_EXECUTION_SECONDS + (sets - 1) * rest;
}

function estimateSupersetSeconds(
  block: WorkoutTemplateBlock,
  exs: WorkoutTemplateExercise[],
  templateRest: number,
): number {
  const rounds = Math.max(1, block.rounds);
  const intra = block.rest_between_exercises_seconds ?? DEFAULT_INTRA_SUPERSET_REST_SECONDS;
  const roundRest = block.rest_between_rounds_seconds ?? DEFAULT_SUPERSET_ROUND_REST_SECONDS;
  // ממוצע סטים לתרגיל — משמש להערכה
  const perRoundExec = exs.length * AVERAGE_SET_EXECUTION_SECONDS;
  const perRoundIntra = (exs.length - 1) * intra;
  const roundSeconds = perRoundExec + perRoundIntra;
  void templateRest;
  return rounds * roundSeconds + (rounds - 1) * roundRest;
}
