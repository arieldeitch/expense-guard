/**
 * Human labels for exercise enums — עברית, RTL.
 * מרוכז לצורך החלפה עתידית ל־i18n.
 */
import type {
  BodyRegion,
  Difficulty,
  ExerciseCategory,
  ExerciseDomain,
  MediaType,
  MovementPattern,
  TrackingType,
  VariationType,
  VerificationStatus,
  AvailabilityStatus,
} from "./types";

export const DOMAIN_LABEL: Record<ExerciseDomain, string> = {
  gym: "חדר כושר",
  home: "בית",
  bodyweight: "משקל גוף",
  custom: "מותאם אישית",
};

export const DOMAINS_ORDERED: ExerciseDomain[] = ["gym", "home", "bodyweight", "custom"];

export const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  compound: "תרגיל מורכב",
  isolation: "תרגיל מבודד",
  unilateral: "חד־צדדי",
  push: "דחיפה",
  pull: "משיכה",
  legs: "רגליים",
  core: "ליבה",
  carry: "נשיאה",
  bodyweight: "משקל גוף",
  warmup: "חימום",
  custom: "מותאם אישית",
};

export const CATEGORIES_ORDERED: ExerciseCategory[] = [
  "compound",
  "isolation",
  "unilateral",
  "push",
  "pull",
  "legs",
  "core",
  "carry",
  "bodyweight",
  "warmup",
  "custom",
];

export const MOVEMENT_PATTERN_LABEL: Record<MovementPattern, string> = {
  horizontal_push: "דחיפה אופקית",
  vertical_push: "דחיפה אנכית",
  horizontal_pull: "משיכה אופקית",
  vertical_pull: "משיכה אנכית",
  squat: "סקוואט",
  hip_hinge: "הטיית אגן (hinge)",
  lunge: "לאנג'",
  carry: "נשיאה",
  flexion: "כפיפה",
  extension: "פשיטה",
  rotation: "סיבוב",
  anti_rotation: "מניעת סיבוב",
  core: "ליבה",
  custom: "מותאם אישית",
};

export const MOVEMENT_PATTERNS_ORDERED: MovementPattern[] = [
  "horizontal_push",
  "vertical_push",
  "horizontal_pull",
  "vertical_pull",
  "squat",
  "hip_hinge",
  "lunge",
  "carry",
  "flexion",
  "extension",
  "rotation",
  "anti_rotation",
  "core",
  "custom",
];

export const TRACKING_TYPE_LABEL: Record<TrackingType, string> = {
  weight_reps: "משקל × חזרות",
  reps_only: "חזרות בלבד",
  time: "זמן",
  distance: "מרחק",
  weight_time: "משקל × זמן",
  bodyweight_reps: "משקל גוף — חזרות",
  bodyweight_plus_weight: "משקל גוף + תוספת",
  assisted_reps: "בסיוע",
  left_right_reps: "ימין/שמאל",
  rounds: "סבבים",
  static_hold: "החזקה סטטית",
  custom: "מותאם אישית",
};

export const TRACKING_TYPES_ORDERED: TrackingType[] = [
  "weight_reps",
  "reps_only",
  "time",
  "distance",
  "weight_time",
  "bodyweight_reps",
  "bodyweight_plus_weight",
  "assisted_reps",
  "left_right_reps",
  "rounds",
  "static_hold",
  "custom",
];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "מתחיל",
  intermediate: "בינוני",
  advanced: "מתקדם",
  expert: "מומחה",
};

export const DIFFICULTIES_ORDERED: Difficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export const BODY_REGION_LABEL: Record<BodyRegion, string> = {
  chest: "חזה",
  back: "גב",
  shoulders: "כתפיים",
  arms: "ידיים",
  core: "בטן וליבה",
  glutes: "ישבן",
  legs: "רגליים",
  calves: "תאומים",
  full_body: "גוף מלא",
  custom: "מותאם אישית",
};

export const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  image: "תמונה",
  image_sequence: "רצף תמונות",
  gif: "GIF",
  video: "סרטון",
  illustration: "איור",
  muscle_map: "מפת שרירים",
};

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  unverified: "לא נבדק",
  verified: "מאומת",
  missing_source: "חסר מקור",
  not_licensed: "לא מאושר",
  archived: "בארכיון",
};

export const VERIFICATION_TONE: Record<
  VerificationStatus,
  "success" | "warning" | "info" | "destructive" | "default"
> = {
  unverified: "info",
  verified: "success",
  missing_source: "warning",
  not_licensed: "destructive",
  archived: "default",
};

export const VARIATION_TYPE_LABEL: Record<VariationType, string> = {
  grip: "אחיזה",
  angle: "זווית",
  range: "טווח תנועה",
  load_type: "סוג עומס",
  tempo: "טמפו",
  assistance: "בסיוע",
  unilateral: "חד־צדדי",
  custom: "מותאם אישית",
};

export const AVAILABILITY_STATUS_LABEL: Record<AvailabilityStatus, string> = {
  available: "זמין",
  partial: "זמין חלקית",
  unavailable: "לא זמין",
  unknown: "חסר מידע",
};

export const AVAILABILITY_STATUS_TONE: Record<
  AvailabilityStatus,
  "success" | "warning" | "info" | "default"
> = {
  available: "success",
  partial: "warning",
  unavailable: "default",
  unknown: "info",
};
