/**
 * מפת הישויות לענן העתידי — **נגזרת מהמודל בפועל**, לא רשימה שרירותית.
 *
 * כל רשומה כאן מצהירה: מאיזה מודול/אוסף ב-Export היא באה, מהו המפתח היציב שלה,
 * מי ההורים שלה (ולכן מה סדר הייבוא), מהו שדה הסדר שיש לשמר, ומי הבעלים בענן.
 * סדר הייבוא **מחושב טופולוגית** מהקשרים שכאן ואינו מקודד ידנית.
 *
 * אין כאן SQL, אין SDK ואין רשת — זו הצהרת חוזה בלבד.
 * ראה `docs/ai/LOCAL_TO_SUPABASE_MIGRATION_CONTRACT.md` ו-ADR-0034.
 */
import type { BackupModule } from "@/lib/backup";

export type OwnershipKind =
  /** רשומה בבעלות המשתמש — `user_id` נקבע מה-session המאומת. */
  | "user"
  /** taxonomy/seed מערכתי — אינו מקבל בעלות משתמש כשה-flag דלוק. */
  | "system_taxonomy"
  /** שורת פרופיל יחידה, ממופתחת ב-user id עצמו. */
  | "profile";

export interface CloudParentRef {
  /** השדה בילד שמחזיק את מזהה ההורה. */
  field: string;
  /** טבלת ההורה. */
  table: string;
  /** false = FK אופציונלי (null מותר), אך ערך שאינו null חייב להתקיים. */
  required: boolean;
}

export interface CloudEntityDef {
  /** שם הטבלה העתידית בענן. */
  table: string;
  module: BackupModule;
  /** האוסף בתוך ה-state של המודול. */
  collection: string;
  /** שדה המפתח היציב. **לעולם לא index של מערך.** */
  primaryKey: string;
  parents: CloudParentRef[];
  /** שדה סדר שחייב להישמר. null אם אין סדר משמעותי. */
  orderField: string | null;
  ownership: OwnershipKind;
  /** שדה בוליאני שמסמן רשומת מערכת. כשהוא true — אין בעלות משתמש. */
  systemFlagField?: string;
  /**
   * שדות self-reference (הורה מאותה טבלה). מאומתים כהפניה, אך **מוחרגים מגרף
   * התלויות** — אחרת טבלה שמצביעה על עצמה הייתה יוצרת מעגל מדומה.
   */
  selfReferences?: string[];
  /** שדה הבעלות המקומי, אם קיים — נשמר כ-source metadata בלבד. */
  sourceOwnerField?: string;
}

/**
 * כל הישויות שה-Export מכיל ושיש להן ייצוג בענן.
 * אוספים שאינם כאן מדווחים כ-`unsupported_entities` — לא נבלעים בשקט.
 */
export const CLOUD_ENTITIES: readonly CloudEntityDef[] = [
  // ---------- taxonomy ----------
  {
    table: "muscle_groups",
    module: "exercises",
    collection: "muscle_groups",
    primaryKey: "id",
    parents: [],
    orderField: "display_order",
    ownership: "system_taxonomy",
    systemFlagField: "is_system",
    sourceOwnerField: "owner_id",
  },
  {
    table: "exercises",
    module: "exercises",
    collection: "exercises",
    primaryKey: "id",
    parents: [{ field: "primary_muscle_group_id", table: "muscle_groups", required: true }],
    orderField: null,
    ownership: "system_taxonomy",
    systemFlagField: "is_system",
    sourceOwnerField: "owner_id",
  },
  {
    table: "exercise_media",
    module: "exercises",
    collection: "media",
    primaryKey: "id",
    parents: [{ field: "exercise_id", table: "exercises", required: true }],
    orderField: "display_order",
    ownership: "user",
    sourceOwnerField: "owner_id",
  },

  // ---------- catalog ----------
  {
    table: "locations",
    module: "catalog",
    collection: "locations",
    primaryKey: "id",
    parents: [],
    orderField: null,
    ownership: "user",
    sourceOwnerField: "owner_id",
  },
  {
    table: "treadmills",
    module: "catalog",
    collection: "treadmills",
    primaryKey: "id",
    parents: [{ field: "location_id", table: "locations", required: false }],
    orderField: null,
    ownership: "user",
    sourceOwnerField: "owner_id",
  },
  {
    table: "equipment",
    module: "catalog",
    collection: "equipment",
    primaryKey: "id",
    parents: [{ field: "location_id", table: "locations", required: false }],
    orderField: null,
    ownership: "user",
    sourceOwnerField: "owner_id",
  },

  // ---------- gym templates ----------
  {
    table: "workout_templates",
    module: "templates",
    collection: "templates",
    primaryKey: "id",
    parents: [],
    orderField: null,
    ownership: "user",
    sourceOwnerField: "owner_id",
  },
  {
    table: "workout_template_blocks",
    module: "templates",
    collection: "blocks",
    primaryKey: "id",
    parents: [{ field: "template_id", table: "workout_templates", required: true }],
    orderField: "sequence",
    ownership: "user",
    sourceOwnerField: "owner_id",
  },
  {
    table: "workout_template_exercises",
    module: "templates",
    collection: "exercises",
    primaryKey: "id",
    parents: [
      { field: "block_id", table: "workout_template_blocks", required: true },
      { field: "exercise_id", table: "exercises", required: true },
    ],
    orderField: "sequence",
    ownership: "user",
    sourceOwnerField: "owner_id",
  },
  {
    table: "workout_template_versions",
    module: "templates",
    collection: "versions",
    primaryKey: "id",
    parents: [{ field: "template_id", table: "workout_templates", required: true }],
    orderField: "version",
    ownership: "user",
    sourceOwnerField: "owner_id",
  },

  // ---------- home templates ----------
  {
    table: "home_templates",
    module: "home",
    collection: "templates",
    primaryKey: "id",
    parents: [],
    orderField: null,
    ownership: "user",
    selfReferences: ["parent_template_id"],
    sourceOwnerField: "owner_id",
  },
  {
    table: "home_template_entries",
    module: "home",
    collection: "templateEntries",
    primaryKey: "id",
    parents: [
      { field: "template_id", table: "home_templates", required: true },
      { field: "exercise_id", table: "exercises", required: true },
    ],
    orderField: "sequence",
    ownership: "user",
  },
  {
    table: "home_template_versions",
    module: "home",
    collection: "templateVersions",
    primaryKey: "id",
    parents: [{ field: "template_id", table: "home_templates", required: true }],
    orderField: "version",
    ownership: "user",
  },

  // ---------- home sessions ----------
  {
    table: "home_sessions",
    module: "home",
    collection: "sessions",
    primaryKey: "id",
    parents: [{ field: "template_id", table: "home_templates", required: false }],
    orderField: null,
    ownership: "user",
    sourceOwnerField: "owner_id",
  },
  {
    // ⚠️ שדה ההורה הוא `home_session_id` ולא `session_id`.
    table: "home_session_entries",
    module: "home",
    collection: "entries",
    primaryKey: "id",
    parents: [
      { field: "home_session_id", table: "home_sessions", required: true },
      { field: "exercise_id", table: "exercises", required: true },
    ],
    orderField: "sequence",
    ownership: "user",
  },
  {
    table: "home_session_sets",
    module: "home",
    collection: "sets",
    primaryKey: "id",
    parents: [{ field: "entry_id", table: "home_session_entries", required: true }],
    orderField: "set_number",
    ownership: "user",
  },

  // ---------- strength sessions ----------
  {
    table: "strength_sessions",
    module: "sessions",
    collection: "sessions",
    primaryKey: "id",
    parents: [
      { field: "template_id", table: "workout_templates", required: false },
      { field: "location_id", table: "locations", required: false },
    ],
    orderField: null,
    ownership: "user",
    sourceOwnerField: "owner_id",
  },
  {
    table: "strength_session_blocks",
    module: "sessions",
    collection: "blocks",
    primaryKey: "id",
    parents: [{ field: "session_id", table: "strength_sessions", required: true }],
    orderField: "sequence",
    ownership: "user",
  },
  {
    table: "strength_session_exercises",
    module: "sessions",
    collection: "exercises",
    primaryKey: "id",
    parents: [
      { field: "session_id", table: "strength_sessions", required: true },
      { field: "block_id", table: "strength_session_blocks", required: true },
      { field: "exercise_id", table: "exercises", required: true },
    ],
    orderField: "sequence",
    ownership: "user",
  },
  {
    table: "strength_sets",
    module: "sessions",
    collection: "sets",
    primaryKey: "id",
    parents: [
      { field: "session_exercise_id", table: "strength_session_exercises", required: true },
    ],
    orderField: "set_number",
    ownership: "user",
  },
  {
    // ממופתח ב-`session_id` — אין לו `id` משלו.
    table: "strength_session_timers",
    module: "sessions",
    collection: "timers",
    primaryKey: "session_id",
    parents: [{ field: "session_id", table: "strength_sessions", required: true }],
    orderField: null,
    ownership: "user",
  },

  // ---------- running ----------
  {
    table: "running_routes",
    module: "runs",
    collection: "routes",
    primaryKey: "id",
    parents: [{ field: "location_id", table: "locations", required: false }],
    orderField: null,
    ownership: "user",
    sourceOwnerField: "owner_id",
  },
  {
    table: "run_sessions",
    module: "runs",
    collection: "runs",
    primaryKey: "id",
    parents: [
      { field: "location_id", table: "locations", required: false },
      { field: "treadmill_id", table: "treadmills", required: false },
      { field: "route_id", table: "running_routes", required: false },
    ],
    orderField: null,
    ownership: "user",
    sourceOwnerField: "owner_id",
  },
  {
    table: "suunto_readings",
    module: "suunto",
    collection: "readings",
    primaryKey: "id",
    parents: [{ field: "run_session_id", table: "run_sessions", required: true }],
    orderField: null,
    ownership: "user",
    sourceOwnerField: "owner_id",
  },
  {
    table: "treadmill_calibrations",
    module: "suunto",
    collection: "calibrations",
    primaryKey: "id",
    parents: [{ field: "treadmill_id", table: "treadmills", required: true }],
    orderField: null,
    ownership: "user",
    sourceOwnerField: "owner_id",
  },
  {
    table: "calibration_exclusions",
    module: "suunto",
    collection: "exclusions",
    primaryKey: "id",
    parents: [
      { field: "treadmill_id", table: "treadmills", required: true },
      { field: "run_session_id", table: "run_sessions", required: true },
    ],
    orderField: null,
    ownership: "user",
    sourceOwnerField: "owner_id",
  },

  // ---------- goals ----------
  {
    table: "goals",
    module: "goals",
    collection: "goals",
    primaryKey: "id",
    parents: [
      { field: "linked_exercise_id", table: "exercises", required: false },
      { field: "linked_route_id", table: "running_routes", required: false },
      { field: "linked_treadmill_id", table: "treadmills", required: false },
      { field: "linked_template_id", table: "workout_templates", required: false },
    ],
    orderField: "priority",
    ownership: "user",
    sourceOwnerField: "user_id",
  },
  {
    table: "goal_snapshots",
    module: "goals",
    collection: "snapshots",
    primaryKey: "id",
    parents: [{ field: "goal_id", table: "goals", required: true }],
    orderField: null,
    ownership: "user",
  },
  {
    table: "goal_versions",
    module: "goals",
    collection: "versions",
    primaryKey: "id",
    parents: [{ field: "goal_id", table: "goals", required: true }],
    orderField: "version",
    ownership: "user",
  },
  {
    table: "goal_activity_links",
    module: "goals",
    collection: "activityLinks",
    primaryKey: "id",
    parents: [{ field: "goal_id", table: "goals", required: true }],
    orderField: null,
    ownership: "user",
  },
];

/** אוספים ידועים שאין להם ייצוג בענן — scalars/defaults מקומיים בלבד. */
export const LOCAL_ONLY_COLLECTIONS: readonly string[] = [
  "home.prefs",
  "sessions.prefs",
  "runs.lastUsed",
  "exercises.version",
  "exercises.seeded",
];

export function findEntity(table: string): CloudEntityDef | null {
  return CLOUD_ENTITIES.find((e) => e.table === table) ?? null;
}

/**
 * סדר ייבוא טופולוגי — הורה לפני ילד. דטרמיניסטי: שובר שוויון לפי סדר ההצהרה,
 * כך שאותו קלט תמיד מייצר את אותו סדר.
 *
 * self-references מוחרגים (ראה `selfReferences`). מעגל אמיתי זורק — עדיף כשל
 * רועש מאשר סדר ייבוא שגוי.
 */
export function topologicalImportOrder(
  entities: readonly CloudEntityDef[] = CLOUD_ENTITIES,
): string[] {
  const byTable = new Map(entities.map((e) => [e.table, e]));
  const visiting = new Set<string>();
  const done = new Set<string>();
  const order: string[] = [];

  const visit = (table: string, trail: string[]) => {
    if (done.has(table)) return;
    if (visiting.has(table)) {
      throw new Error(`מעגל תלויות במפת הענן: ${[...trail, table].join(" -> ")}`);
    }
    const def = byTable.get(table);
    if (!def) return; // הורה שאינו חלק מהמפה — אינו מטיל סדר
    visiting.add(table);
    for (const parent of def.parents) {
      if (parent.table === table) continue; // self-reference
      visit(parent.table, [...trail, table]);
    }
    visiting.delete(table);
    done.add(table);
    order.push(table);
  };

  for (const entity of entities) visit(entity.table, []);
  return order;
}
