/**
 * תוויות עברית עבור enums של תבניות.
 * מרוכז כאן כדי לא לפזר מחרוזות בכל ה־UI.
 */
import type { BlockType, SetType, TemplateStatus } from "./types";

export const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  draft: "טיוטה",
  active: "פעילה",
  paused: "מושהית",
  archived: "בארכיון",
  trashed: "בסל מחזור",
};

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  single: "תרגיל יחיד",
  superset: "סופרסט",
  triset: "טרייסט",
  circuit: "מעגל תחנות",
  warmup: "חימום",
  cooldown: "סיום",
  custom: "מותאם אישית",
};

export const SET_TYPE_LABELS: Record<SetType, string> = {
  regular: "רגיל",
  warmup: "חימום",
  drop_set: "drop set",
  failure: "עד כישלון",
  amrap: "AMRAP",
  timed: "מבוסס זמן",
  custom: "מותאם אישית",
};

/** אותיות קידומת לסימון תרגילים בסופרסט (A1, A2, B1, ...). */
export const SUPERSET_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
