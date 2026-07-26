/**
 * Fixture ל-rehearsal — dataset מלא עם היררכיה אמיתית.
 *
 * נבנה כמעטפת Export ישירות (ולא דרך ה-repositories) כדי שהבדיקה תשלוט בדיוק
 * בכל מזהה, חותמת זמן, סטטוס וסדר — וכך תוכל להוכיח שהם שרדו את ההגירה.
 * המבנה תואם ל-`BackupEnvelope` האמיתי ועובר `validateBackup`.
 */
import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, type BackupEnvelope } from "@/lib/backup";
import { checksumOf } from "@/lib/storage/checksum";

export const SOURCE_OWNER = "single-user";
export const AUTHENTICATED_USER = "auth-user-11111111";
export const OTHER_USER = "auth-user-22222222";

const T0 = "2026-07-20T06:00:00.000Z";
const T1 = "2026-07-20T06:30:00.000Z";
const T2 = "2026-07-20T07:15:00.000Z";

function base(created = T0, updated = T1) {
  return { created_at: created, updated_at: updated, deleted_at: null };
}

/** dataset מינימלי-אך-מלא: taxonomy → תרגילים → תבנית → אימונים → סטים. */
export function buildRehearsalEntities(): Record<string, unknown> {
  return {
    exercises: {
      version: 1,
      seeded: true,
      muscle_groups: [
        {
          id: "mg_chest",
          owner_id: SOURCE_OWNER,
          code: "chest",
          name_he: "חזה",
          name_en: "Chest",
          body_region: "upper",
          description: null,
          icon: null,
          color_token: null,
          display_order: 1,
          is_active: true,
          is_system: true,
          ...base(),
        },
      ],
      exercises: [
        {
          id: "ex_push-up",
          owner_id: SOURCE_OWNER,
          is_system: true,
          name_he: "שכיבות סמיכה",
          name_en: "Push Up",
          aliases: [],
          slug: "push-up",
          category: "bodyweight",
          primary_muscle_group_id: "mg_chest",
          secondary_muscle_group_ids: [],
          tracking_type: "reps",
          ...base(),
        },
        {
          // תרגיל מותאם של המשתמש — **לא** מערכתי.
          id: "ex_custom-wall-press",
          owner_id: SOURCE_OWNER,
          is_system: false,
          name_he: "לחיצת קיר",
          name_en: "Wall Press",
          aliases: [],
          slug: "wall-press",
          category: "bodyweight",
          primary_muscle_group_id: "mg_chest",
          secondary_muscle_group_ids: [],
          tracking_type: "reps",
          ...base(),
        },
      ],
      media: [],
    },

    catalog: {
      locations: [
        {
          id: "loc_home",
          owner_id: SOURCE_OWNER,
          name: "בית",
          location_type: "home",
          country_code: "IL",
          city: null,
          area: null,
          address: null,
          description: null,
          notes: null,
          latitude: null,
          longitude: null,
          is_default: true,
          is_favorite: false,
          is_active: true,
          ...base(),
        },
      ],
      treadmills: [],
      equipment: [],
    },

    home: {
      templates: [
        {
          id: "htpl_morning",
          owner_id: SOURCE_OWNER,
          parent_template_id: null,
          name: "בוקר — גוף עליון",
          description: null,
          version: 2,
          rounds: 1,
          status: "active",
          is_favorite: true,
          notes: null,
          usage_count: 3,
          last_used_at: T2,
          ...base(),
        },
      ],
      templateEntries: [
        {
          id: "htpe_1",
          template_id: "htpl_morning",
          exercise_id: "ex_push-up",
          sequence: 0,
          planned_sets: 3,
          planned_reps: 12,
          planned_reps_min: null,
          planned_reps_max: null,
          planned_duration_seconds: null,
          planned_added_weight: null,
          weight_unit: "kg",
          rest_seconds: 60,
          notes: null,
          ...base(),
        },
        {
          id: "htpe_2",
          template_id: "htpl_morning",
          exercise_id: "ex_custom-wall-press",
          sequence: 1,
          planned_sets: 3,
          planned_reps: 15,
          planned_reps_min: null,
          planned_reps_max: null,
          planned_duration_seconds: null,
          planned_added_weight: null,
          weight_unit: "kg",
          rest_seconds: 45,
          notes: null,
          ...base(),
        },
        {
          id: "htpe_3",
          template_id: "htpl_morning",
          exercise_id: "ex_push-up",
          sequence: 2,
          planned_sets: 2,
          planned_reps: null,
          planned_reps_min: 8,
          planned_reps_max: 12,
          planned_duration_seconds: null,
          planned_added_weight: null,
          weight_unit: "kg",
          rest_seconds: 90,
          notes: "סיום",
          ...base(),
        },
      ],
      templateVersions: [
        {
          id: "htv_1",
          template_id: "htpl_morning",
          version: 1,
          snapshot: { template_id: "htpl_morning", template_version: 1, name: "בוקר", rounds: 1 },
          created_at: T0,
        },
      ],
      sessions: [
        {
          id: "hs_2026_07_20",
          owner_id: SOURCE_OWNER,
          template_id: "htpl_morning",
          template_version: 2,
          template_snapshot: null,
          primary_exercise_id: null,
          is_quick_entry: false,
          name: "בוקר — גוף עליון",
          started_at: T1,
          ended_at: T2,
          timezone: "Asia/Jerusalem",
          duration_seconds: 2700,
          status: "completed",
          notes: null,
          perceived_effort: 7,
          self_reported_quality: 4,
          quality_score: 82,
          quality_score_details: ["completion"],
          data_completeness: 90,
          ...base(T1, T2),
        },
      ],
      entries: [
        {
          // ⚠️ שם השדה הוא `home_session_id`, לא `session_id`.
          id: "he_1",
          home_session_id: "hs_2026_07_20",
          exercise_id: "ex_push-up",
          sequence: 0,
          snapshot: { exercise_id: "ex_push-up", exercise_name: "שכיבות סמיכה" },
          notes: null,
          completed: true,
          ...base(T1, T2),
        },
        {
          id: "he_2",
          home_session_id: "hs_2026_07_20",
          exercise_id: "ex_custom-wall-press",
          sequence: 1,
          snapshot: { exercise_id: "ex_custom-wall-press", exercise_name: "לחיצת קיר" },
          notes: null,
          completed: false,
          ...base(T1, T2),
        },
      ],
      sets: [
        {
          id: "hset_1",
          entry_id: "he_1",
          set_number: 1,
          tracking_type: "reps",
          reps: 12,
          duration_seconds: null,
          side: null,
          added_weight: null,
          weight_unit: "kg",
          assistance_value: null,
          round_number: null,
          rpe: 7,
          rir: 3,
          set_type: "regular",
          notes: null,
          completed: true,
          skipped: false,
          completed_at: T2,
          ...base(T1, T2),
        },
        {
          id: "hset_2",
          entry_id: "he_1",
          set_number: 2,
          tracking_type: "reps",
          reps: 10,
          duration_seconds: null,
          side: null,
          added_weight: null,
          weight_unit: "kg",
          assistance_value: null,
          round_number: null,
          rpe: 8,
          rir: 2,
          set_type: "regular",
          notes: null,
          completed: true,
          skipped: false,
          completed_at: T2,
          ...base(T1, T2),
        },
        {
          id: "hset_3",
          entry_id: "he_2",
          set_number: 1,
          tracking_type: "reps",
          reps: null,
          duration_seconds: null,
          side: null,
          added_weight: null,
          weight_unit: "kg",
          assistance_value: null,
          round_number: null,
          rpe: null,
          rir: null,
          set_type: "regular",
          notes: null,
          completed: false,
          skipped: true,
          completed_at: null,
          ...base(T1, T2),
        },
      ],
      prefs: {
        default_sets: 3,
        default_reps: 12,
        default_rest_seconds: 60,
        default_hold_seconds: 30,
        haptics: true,
      },
    },

    goals: {
      goals: [
        {
          id: "goal_pushups",
          user_id: SOURCE_OWNER,
          domain: "home",
          goal_type: "max_reps",
          name: "20 שכיבות סמיכה",
          description: null,
          baseline_value: 10,
          current_value: 12,
          target_value: 20,
          target_unit: "חזרות",
          start_date: "2026-07-01",
          target_date: "2026-09-01",
          linked_exercise_id: "ex_push-up",
          linked_route_id: null,
          linked_treadmill_id: null,
          linked_template_id: null,
          linked_metric: null,
          linked_period: null,
          linked_extra_number: null,
          calculation_method: "max",
          direction: "increase",
          event_details: null,
          status: "active",
          priority: 1,
          is_primary: true,
          display_preference: "tile",
          auto_mark_achieved: false,
          version: 1,
          last_snapshot_at: null,
          ...base(),
        },
      ],
      snapshots: [],
      versions: [],
      activityLinks: [],
    },

    templates: { templates: [], blocks: [], exercises: [], versions: [] },
    // ה-scalars נכתבים בצורתם המלאה בכוונה: כך "שחזור מדויק" הוא טענה בעלת משמעות
    // ולא נבלע בנורמליזציה של ה-writers.
    sessions: {
      sessions: [],
      blocks: [],
      exercises: [],
      sets: [],
      timers: [],
      prefs: { auto_start_rest: true, default_rest_seconds: 90, haptics: true },
    },
    runs: {
      runs: [],
      routes: [],
      lastUsed: {
        run_type: null,
        location_id: null,
        treadmill_id: null,
        route_id: null,
        country_code: null,
        city_or_area: null,
      },
    },
    suunto: { readings: [], calibrations: [], exclusions: [] },
    preferences: { landingModule: "home" },
  };
}

function countRecords(state: unknown): number {
  if (!state || typeof state !== "object" || Array.isArray(state)) return 0;
  let n = 0;
  for (const value of Object.values(state as Record<string, unknown>)) {
    if (Array.isArray(value) && value.every((v) => v && typeof v === "object")) n += value.length;
  }
  return n;
}

/** מעטפת Export תקפה — כולל `entity_counts` ו-checksum אמיתיים. */
export function buildRehearsalEnvelope(
  entities: Record<string, unknown> = buildRehearsalEntities(),
): BackupEnvelope {
  const entity_counts: Record<string, number> = {};
  let total = 0;
  for (const [mod, state] of Object.entries(entities)) {
    const n = countRecords(state);
    entity_counts[mod] = n;
    total += n;
  }

  return {
    format: BACKUP_FORMAT,
    schema_version: BACKUP_SCHEMA_VERSION,
    exported_at: T2,
    app_version: BACKUP_SCHEMA_VERSION,
    entities,
    metadata: {
      entity_counts,
      integrity: { total_records: total, checksum: checksumOf(entities) },
    },
  };
}

/** משכתב checksum אחרי שינוי ידני ב-entities. */
export function reseal(envelope: BackupEnvelope): BackupEnvelope {
  envelope.metadata.integrity.checksum = checksumOf(envelope.entities);
  let total = 0;
  for (const [mod, state] of Object.entries(envelope.entities)) {
    const n = countRecords(state);
    envelope.metadata.entity_counts[mod] = n;
    total += n;
  }
  envelope.metadata.integrity.total_records = total;
  return envelope;
}
