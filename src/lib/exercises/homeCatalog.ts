/**
 * Curated home catalog — הקטלוג שמוצג **כברירת מחדל** בבחירת תרגיל לתוכנית בית.
 *
 * למה: המאגר המלא מכיל גם תרגילי מכון (מוט, כבל, מכונה) ומטא-דאטה עשיר שאינו
 * רלוונטי בזמן בחירה מהירה. כאן מוגדרת רשימה מצומצמת של תרגילים נפוצים,
 * מקובצת ב-6 קבוצות **בשפת משתמש** (לא קטגוריות טכניות).
 *
 * **תאימות:** הקבוצות מפנות ל-`slug` של תרגילים קיימים. ה-`slug` נגזר מ-`name_en`
 * וממנו נגזר ה-`id` (`stableId("ex", slug)`), ולכן **אין לשנות `name_en` של תרגיל
 * קיים** — זה ישנה את ה-ID וישבור תוכניות שמורות. הוספת תרגיל חדש בטוחה.
 *
 * המאגר המלא נשאר זמין; זהו סינון תצוגה בלבד. ראה ADR-0029.
 */
import type { Exercise, NewExercise } from "./types";

/** קבוצות בשפת משתמש — לא muscle groups טכניים. */
export type HomeGroupId = "push" | "pull" | "legs" | "core" | "arms" | "fullbody";

export interface HomeGroup {
  id: HomeGroupId;
  label: string;
  /** slugs של תרגילים בקבוצה, לפי סדר תצוגה מומלץ. */
  slugs: string[];
}

/** פילטר ציוד פשוט — לא `EquipmentType` הטכני המלא. */
export type HomeEquipmentFilter = "none" | "band" | "dumbbells" | "pullup_bar" | "other";

export const HOME_EQUIPMENT_LABELS: Record<HomeEquipmentFilter, string> = {
  none: "ללא ציוד",
  band: "גומייה",
  dumbbells: "משקולות",
  pullup_bar: "מתח",
  other: "אחר",
};

/**
 * 6 קבוצות · 34 תרגילים. מאוזן בין דחיפה/משיכה/רגליים/ליבה/ידיים/גוף מלא.
 * ללא כפילויות — כל slug מופיע פעם אחת בלבד.
 */
export const HOME_GROUPS: HomeGroup[] = [
  {
    id: "push",
    label: "חזה ודחיפה",
    slugs: [
      "push-ups",
      "incline-push-ups",
      "close-grip-push-ups",
      "knee-push-ups",
      "pike-push-ups",
      "chair-dips",
    ],
  },
  {
    id: "pull",
    label: "גב ומשיכה",
    slugs: [
      "pull-ups",
      "band-assisted-pull-ups",
      "band-row",
      "single-arm-dumbbell-row",
      "band-pull-apart",
      "superman",
    ],
  },
  {
    id: "legs",
    label: "רגליים וישבן",
    slugs: [
      "bodyweight-squat",
      "walking-lunges",
      "reverse-lunge",
      "bulgarian-split-squat",
      "glute-bridge",
      "hip-thrust",
      "wall-sit",
      "standing-calf-raise",
    ],
  },
  {
    id: "core",
    label: "ליבה",
    slugs: [
      "plank",
      "side-plank",
      "dead-bug",
      "bird-dog",
      "lying-leg-raises",
      "mountain-climbers",
    ],
  },
  {
    id: "arms",
    label: "כתפיים וידיים",
    slugs: [
      "seated-dumbbell-shoulder-press",
      "dumbbell-bicep-curls",
      "lateral-raise",
      "overhead-triceps-extension",
    ],
  },
  {
    id: "fullbody",
    label: "גוף מלא ותנועה",
    slugs: ["burpees", "kettlebell-swing", "jumping-jacks", "farmer-s-carry"],
  },
];

/** כל ה-slugs של הקטלוג ה-curated, לפי סדר הקבוצות. */
export function curatedSlugs(): string[] {
  return HOME_GROUPS.flatMap((g) => g.slugs);
}

/** מיפוי ציוד טכני → פילטר פשוט. תרגיל ללא ציוד נדרש = "ללא ציוד". */
export function homeEquipmentOf(exercise: Exercise): HomeEquipmentFilter {
  const req = exercise.required_equipment_types ?? [];
  if (req.length === 0) return "none";
  if (req.includes("band")) return "band";
  if (req.includes("dumbbells")) return "dumbbells";
  if (req.includes("pullup_bar")) return "pullup_bar";
  return "other";
}

/**
 * מסנן את המאגר המלא לקטלוג ה-curated, מקובץ לפי קבוצה ובסדר קבוע.
 * תרגילים שאינם ב-curated פשוט לא מוחזרים (הם עדיין קיימים במאגר).
 */
export function curatedGroups(all: Exercise[]): Array<{ group: HomeGroup; exercises: Exercise[] }> {
  const bySlug = new Map(all.map((e) => [e.slug, e]));
  return HOME_GROUPS.map((group) => ({
    group,
    exercises: group.slugs
      .map((slug) => bySlug.get(slug))
      .filter((e): e is Exercise => e !== undefined),
  }));
}

/**
 * בונה `NewExercise` שלם עבור **תרגיל מותאם** שנוצר מתוך בחירת תרגילים.
 * המשתמש מזין שם, סוג מדידה וציוד בלבד; כל השאר מקבל ברירת מחדל שמרנית.
 * ה-contract לא הוחלש — כל השדות מסופקים במפורש.
 */
export function buildCustomHomeExercise(input: {
  name_he: string;
  measure: "reps" | "time";
  equipment: HomeEquipmentFilter;
  /** נדרש ע"י החוזה; מועבר מהקטלוג הקיים. */
  primaryMuscleGroupId: string;
}): NewExercise {
  const isTime = input.measure === "time";
  return {
    is_system: false,
    name_he: input.name_he,
    name_en: null,
    aliases: [],
    slug: "",
    category: "bodyweight",
    primary_muscle_group_id: input.primaryMuscleGroupId,
    secondary_muscle_group_ids: [],
    movement_pattern: "custom",
    tracking_type: isTime ? "time" : "bodyweight_reps",
    required_equipment_ids: [],
    optional_equipment_ids: [],
    required_equipment_types: input.equipment === "none" ? [] : [input.equipment],
    optional_equipment_types: [],
    unilateral: false,
    bodyweight_based: input.equipment === "none",
    difficulty: "beginner",
    default_sets: 3,
    default_reps: isTime ? null : 12,
    default_rep_range_min: null,
    default_rep_range_max: null,
    default_rest_seconds: 60,
    default_rpe: null,
    default_rir: null,
    instructions: null,
    technique_cues: [],
    common_mistakes: [],
    safety_notes: null,
    personal_notes: null,
    location_ids: [],
    is_custom: true,
    parent_exercise_id: null,
    variation_type: null,
    variation_notes: null,
  };
}

/** חיפוש חופשי בעברית או באנגלית (שם, שם משני, aliases). */
export function matchesQuery(exercise: Exercise, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [exercise.name_he, exercise.name_en, ...(exercise.aliases ?? [])]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  return haystack.some((h) => h.includes(q));
}
