/**
 * 1RM formula registry — versioned.
 * ברירת מחדל: Epley (weight * (1 + reps/30)).
 * Brzycki (weight * 36 / (37 - reps)) קיימת כחלופה עתידית.
 *
 * החלפת נוסחה אינה משנה raw data — רק ערכים נגזרים מתעדכנים.
 */
import type { OneRmFormulaId } from "./types";

export interface OneRmFormula {
  id: OneRmFormulaId;
  label: string;
  /** טווח חזרות אמין (כולל). מעליו — לא נחשב. */
  minReps: number;
  maxReps: number;
  compute: (weightKg: number, reps: number) => number;
}

const EPLEY: OneRmFormula = {
  id: "epley-v1",
  label: "Epley (v1)",
  minReps: 1,
  maxReps: 10,
  compute: (w, r) => (r === 1 ? w : w * (1 + r / 30)),
};

const BRZYCKI: OneRmFormula = {
  id: "brzycki-v1",
  label: "Brzycki (v1)",
  minReps: 1,
  maxReps: 10,
  compute: (w, r) => (r === 1 ? w : w * (36 / (37 - r))),
};

const REGISTRY: Record<OneRmFormulaId, OneRmFormula> = {
  "epley-v1": EPLEY,
  "brzycki-v1": BRZYCKI,
};

export const DEFAULT_ONE_RM_FORMULA: OneRmFormulaId = "epley-v1";

export function getFormula(id: OneRmFormulaId = DEFAULT_ONE_RM_FORMULA): OneRmFormula {
  return REGISTRY[id] ?? REGISTRY[DEFAULT_ONE_RM_FORMULA];
}

export function listFormulas(): OneRmFormula[] {
  return Object.values(REGISTRY);
}
