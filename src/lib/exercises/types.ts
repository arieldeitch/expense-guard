/**
 * Exercises domain — טיפוסים משותפים.
 *
 * חוזה בין UI ל־data layer. הרשומות שייכות ל־user יחיד (single-user);
 * שדה owner_id מיועד לגישור עתידי ל־Supabase RLS. תרגילי "מערכת" (seed)
 * מסומנים ב־is_system=true ו־owner_id ריק תמידית (constant).
 *
 * כל רשומה תומכת ב:
 *   - soft delete (deleted_at)
 *   - archive (is_active=false)
 *   - restore
 *   - ווריאציות (parent_exercise_id)
 *
 * שינוי תרגיל אינו משכתב היסטוריה — תרגיל בשימוש עובר ל־archive במקום למחיקה.
 */

/** תחומי אימון — תואמים ל־product-requirements §2 (gym / home / bodyweight custom). */
export type ExerciseDomain = "gym" | "home" | "bodyweight" | "custom";

/** קטגוריה — תיוג פונקציונלי לתרגיל. אופציונלי אך שימושי לפילטרים. */
export type ExerciseCategory =
  | "compound"
  | "isolation"
  | "unilateral"
  | "push"
  | "pull"
  | "legs"
  | "core"
  | "carry"
  | "bodyweight"
  | "warmup"
  | "custom";

/** דפוסי תנועה — לצורך אלגוריתם חלופות. */
export type MovementPattern =
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "squat"
  | "hip_hinge"
  | "lunge"
  | "carry"
  | "flexion"
  | "extension"
  | "rotation"
  | "anti_rotation"
  | "core"
  | "custom";

/** סוג מעקב — קובע אילו שדות דיווח יוצגו בסט. */
export type TrackingType =
  | "weight_reps"
  | "reps_only"
  | "time"
  | "distance"
  | "weight_time"
  | "bodyweight_reps"
  | "bodyweight_plus_weight"
  | "assisted_reps"
  | "left_right_reps"
  | "rounds"
  | "static_hold"
  | "custom";

/** רמת קושי — לצורך פילטר ו־sort. */
export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

/** ווריאציה — סוג הקשר בין תרגיל לאב שלו. */
export type VariationType =
  | "grip"
  | "angle"
  | "range"
  | "load_type"
  | "tempo"
  | "assistance"
  | "unilateral"
  | "custom";

/** אזור הגוף — לצורך קיבוץ בקבוצות שריר וב־muscle map. */
export type BodyRegion =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "core"
  | "glutes"
  | "legs"
  | "calves"
  | "full_body"
  | "custom";

// ---------- Muscle groups ----------

export interface MuscleGroup {
  id: string;
  owner_id: string;
  code: string;
  name_he: string;
  name_en: string;
  body_region: BodyRegion;
  description: string | null;
  icon: string | null;
  color_token: string | null;
  display_order: number;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------- Exercise media ----------

export type MediaType = "image" | "image_sequence" | "gif" | "video" | "illustration" | "muscle_map";

export type VerificationStatus =
  | "unverified"
  | "verified"
  | "missing_source"
  | "not_licensed"
  | "archived";

export interface ExerciseMedia {
  id: string;
  exercise_id: string;
  owner_id: string;
  media_type: MediaType;
  url: string;
  storage_path: string | null;
  thumbnail_url: string | null;
  angle: string | null;
  title: string | null;
  description: string | null;
  source: string | null;
  source_url: string | null;
  license: string | null;
  attribution: string | null;
  verification_status: VerificationStatus;
  duration_seconds: number | null;
  captions: string | null;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------- Exercise ----------

export interface Exercise {
  id: string;
  owner_id: string;
  is_system: boolean;

  name_he: string;
  name_en: string | null;
  aliases: string[];
  slug: string;

  category: ExerciseCategory;
  primary_muscle_group_id: string;
  secondary_muscle_group_ids: string[];

  movement_pattern: MovementPattern;
  tracking_type: TrackingType;

  /** ציוד נדרש — מזהי equipment ID. אם אחד מהם חסר במקום אימון → not available. */
  required_equipment_ids: string[];
  /** ציוד אופציונלי — חסר לא חוסם, מסומן כ־partial. */
  optional_equipment_ids: string[];
  /** ציוד לפי סוג (equipment_type) — לרוב עדיף על required_equipment_ids ב־seed. */
  required_equipment_types: string[];
  optional_equipment_types: string[];

  unilateral: boolean;
  bodyweight_based: boolean;
  difficulty: Difficulty;

  default_sets: number;
  default_reps: number | null;
  default_rep_range_min: number | null;
  default_rep_range_max: number | null;
  default_rest_seconds: number | null;
  default_rpe: number | null;
  default_rir: number | null;

  instructions: string | null;
  technique_cues: string[];
  common_mistakes: string[];
  safety_notes: string | null;
  personal_notes: string | null;

  /** מקומות שבהם התרגיל שימושי — משמש לפילטר אבל אינו חוסם. */
  location_ids: string[];

  is_custom: boolean;
  is_favorite: boolean;
  is_active: boolean;

  /** ווריאציה של תרגיל אחר. */
  parent_exercise_id: string | null;
  variation_type: VariationType | null;
  variation_notes: string | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------- DTOs ----------

export type NewExercise = Omit<
  Exercise,
  | "id"
  | "owner_id"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "is_active"
  | "is_favorite"
  | "is_system"
> &
  Partial<Pick<Exercise, "is_favorite" | "is_system">>;

export type NewMuscleGroup = Omit<
  MuscleGroup,
  | "id"
  | "owner_id"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "is_active"
  | "is_system"
> &
  Partial<Pick<MuscleGroup, "is_system">>;

export type NewExerciseMedia = Omit<
  ExerciseMedia,
  "id" | "owner_id" | "created_at" | "updated_at" | "deleted_at"
>;

// ---------- Filters ----------

export interface ExerciseFilters {
  domains: ExerciseDomain[];
  muscleGroupIds: string[];
  movementPatterns: MovementPattern[];
  trackingTypes: TrackingType[];
  categories: ExerciseCategory[];
  difficulty: Difficulty[];
  /** רק ציוד זמין במקום נבחר. */
  onlyAvailableInLocation: string | null;
  favoritesOnly: boolean;
  withMediaOnly: boolean;
  customOnly: boolean;
  visibility: "active" | "archived" | "all";
  query: string;
}

export const EMPTY_EXERCISE_FILTERS: ExerciseFilters = {
  domains: [],
  muscleGroupIds: [],
  movementPatterns: [],
  trackingTypes: [],
  categories: [],
  difficulty: [],
  onlyAvailableInLocation: null,
  favoritesOnly: false,
  withMediaOnly: false,
  customOnly: false,
  visibility: "active",
  query: "",
};

// ---------- Availability ----------

export type AvailabilityStatus =
  | "available"
  | "partial"
  | "unavailable"
  | "unknown";

export interface EquipmentAvailabilitySummary {
  status: AvailabilityStatus;
  missingRequired: string[];
  missingOptional: string[];
  matchedRequired: string[];
  matchedOptional: string[];
  /** ID של equipment/סוג שמוזכר במפורש (לצרכי badge). */
  humanExplanation: string;
}

// ---------- Alternatives ----------

export interface AlternativeScore {
  exercise: Exercise;
  score: number;
  reasons: string[];
  availability: EquipmentAvailabilitySummary;
}

/** תוצאת בדיקת דמיון־שם — לצורך אזהרה בלי חסימה. */
export interface DuplicateWarning {
  hasSimilar: boolean;
  existing: Exercise[];
}
