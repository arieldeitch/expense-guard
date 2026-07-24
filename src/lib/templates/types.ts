/**
 * Workout Templates domain — types.
 *
 * מודל תבנית אימון כוח:
 *   WorkoutTemplate
 *     └── WorkoutTemplateBlock (n)   — יחיד / סופרסט / טרייסט / circuit / חימום / סיום / מותאם
 *           └── WorkoutTemplateExercise (n)  — עם ברירת מחדל 3×12
 *
 * versioning: כל שמירה של שינוי משמעותי יוצרת WorkoutTemplateVersion (snapshot מלא של המבנה).
 * snapshot: כשמתחיל אימון — נבנה snapshot נפרד (StrengthSessionSnapshot) שנשמר עם ה־session.
 *
 * הערה: כרגע Persistence ב־localStorage; חוזה זהה יעבוד ל־Supabase בעתיד.
 */

/** יחידת משקל. שומרים כאן locally כדי לא לגרור dependency היקפי. */
export type WeightUnit = "kg" | "lb";

export type TemplateStatus =
  | "draft" // טיוטה — עדיין לא ניתן להתחיל אימון
  | "active" // פעילה — ניתן להתחיל אימון
  | "paused" // מושהית — לא מוצגת בברירת מחדל
  | "archived" // בארכיון — היסטוריה
  | "trashed"; // בסל מחזור

export type BlockType =
  | "single" // תרגיל יחיד
  | "superset" // 2+ תרגילים בסבב
  | "triset" // 3+ תרגילים בסבב (variant של superset)
  | "circuit" // תחנה — 3+ תרגילים, מספר סבבים גדול
  | "warmup" // חימום
  | "cooldown" // סיום
  | "custom"; // מותאם אישית

export type SetType = "regular" | "warmup" | "drop_set" | "failure" | "amrap" | "timed" | "custom";

/** מזהי צבע סמנטיים לבלוקים בסופרסט. עוקבים אחרי טוקנים ב־styles.css. */
export type BlockColorToken =
  | "gym"
  | "home"
  | "run"
  | "goal"
  | "primary"
  | "warning"
  | "info"
  | "success";

// ---------- Records ----------

export interface WorkoutTemplateRecordBase {
  id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkoutTemplate extends WorkoutTemplateRecordBase {
  name: string;
  description: string | null;

  location_id: string | null;

  /** משך משוער במונח־שניות. מחושב אך נשמר לזמן טעינת רשימות. */
  estimated_duration_seconds: number | null;

  /** קבוצות שריר ראשיות. אם null — נגזרות אוטומטית מהתרגילים. */
  primary_muscle_group_ids: string[] | null;
  /** override ידני של קבוצות שריר משניות. אם null — נגזרות אוטומטית. */
  secondary_muscle_group_ids: string[] | null;
  /** true אם המשתמש דרס קבוצות שריר ידנית — נשמר לצורך audit/UX. */
  muscle_override: boolean;

  /** מנוחה ברירת מחדל בשניות (בלוקים ותרגילים יורשים אם לא הוגדר משלהם). */
  default_rest_seconds: number;

  status: TemplateStatus;
  version: number; // מונה גרסאות פנימי (מתחיל ב־1)
  parent_template_id: string | null; // שכפול/גרסה חדשה — מפנה למקור

  is_favorite: boolean;

  /** אחרון שהופעל ממנו אימון (session). null אם עדיין לא. */
  last_used_at: string | null;
  /** כמה פעמים אימון בפועל נפתח מהתבנית. */
  usage_count: number;
}

export interface WorkoutTemplateBlock extends WorkoutTemplateRecordBase {
  template_id: string;
  sequence: number; // 0-based, ייחודי בתוך template

  block_type: BlockType;
  /** שם מוצג. null → נגזר לפי block_type. */
  display_label: string | null;
  color_token: BlockColorToken | null;

  /** מספר סבבים. עבור single — תמיד 1. עבור superset/circuit — 1..n. */
  rounds: number;

  rest_between_exercises_seconds: number | null; // בתוך סבב (superset)
  rest_between_rounds_seconds: number | null; // בין סבבים
  notes: string | null;
}

export interface WorkoutTemplateExercise extends WorkoutTemplateRecordBase {
  block_id: string;
  exercise_id: string;
  sequence: number; // בתוך block

  planned_sets: number; // ברירת מחדל 3
  /** null אם משתמשים בטווח. */
  planned_reps: number | null; // ברירת מחדל 12
  rep_range_min: number | null;
  rep_range_max: number | null;

  planned_weight: number | null; // numeric
  weight_unit: WeightUnit;

  rest_seconds: number | null; // override לבלוק
  default_rpe: number | null;
  default_rir: number | null;

  set_type: SetType;
  tempo: string | null; // "2-0-1-0" למשל
  notes: string | null;

  /** רשימה מדורגת של תרגילים חלופיים (id) — לבחירה בזמן אימון. */
  alternate_exercise_ids: string[];
}

// ---------- Versioning ----------

/** ברשומה נשמר snapshot מלא של המבנה (blocks + exercises) בעת יצירת גרסה חדשה. */
export interface WorkoutTemplateVersion {
  id: string;
  template_id: string;
  owner_id: string;
  version: number;
  reason: string | null; // תיאור השינוי (אופציונלי)
  created_at: string;
  snapshot: WorkoutTemplateSnapshot;
}

/** snapshot מלא — משמש גם ל־versions וגם ל־session start. */
export interface WorkoutTemplateSnapshot {
  template: Omit<WorkoutTemplate, "created_at" | "updated_at" | "deleted_at">;
  blocks: Array<
    Omit<WorkoutTemplateBlock, "created_at" | "updated_at" | "deleted_at"> & {
      exercises: Array<Omit<WorkoutTemplateExercise, "created_at" | "updated_at" | "deleted_at">>;
    }
  >;
}

// ---------- DTOs ----------

export type NewTemplate = Partial<
  Omit<
    WorkoutTemplate,
    keyof WorkoutTemplateRecordBase | "version" | "usage_count" | "last_used_at"
  >
> & {
  name: string;
};

export type NewBlock = Omit<WorkoutTemplateBlock, keyof WorkoutTemplateRecordBase | "sequence"> & {
  sequence?: number;
};

export type NewTemplateExercise = Omit<
  WorkoutTemplateExercise,
  keyof WorkoutTemplateRecordBase | "sequence"
> & { sequence?: number };

// ---------- Derived / summaries ----------

export interface TemplateMuscleLoadSummary {
  primary: Array<{ muscle_group_id: string; exercises: number; sets: number }>;
  secondary: Array<{ muscle_group_id: string; exercises: number; sets: number }>;
  totalExercises: number;
  totalSets: number;
  pushCount: number;
  pullCount: number;
  upperCount: number;
  lowerCount: number;
  coreCount: number;
}

export interface TemplateDurationEstimate {
  seconds: number;
  minMinutes: number;
  maxMinutes: number;
  /** אריחי הסבר קצר בעברית. */
  explanation: string[];
}

export interface TemplateEquipmentCheck {
  totalExercises: number;
  availableExercises: number;
  partialExercises: number;
  unavailableExercises: number;
  unknown: boolean; // true אם אין מקום נבחר
  missingByExercise: Array<{ exercise_id: string; missing: string[] }>;
}
