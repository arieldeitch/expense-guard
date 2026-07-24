# Data Model

מסמך זה מגדיר את **המודל היעד** של האפליקציה. כרגע **אין** טבלאות בפועל — הפרויקט לא מחובר ל־Lovable Cloud עדיין. כל טבלה תיווצר במיגרציה ייעודית עם RLS מלא לפי `product-requirements.md`.

## עקרונות רוחביים

- **owner_id** בכל טבלה עסקית → `auth.uid()`. גם באפליקציה חד־משתמש: אחיד, פשוט לאכיפה.
- **soft delete**: `deleted_at timestamptz null`. שאילתות רגילות מסננות `WHERE deleted_at IS NULL`.
- **timestamps**: `created_at`, `updated_at` (טריגר update).
- **מספרים**: `numeric` (לא `float`) לכל משקל/מרחק/זמן/סכום. יחידות בשדה נפרד (`unit text` עם CHECK).
- **מקור מדידה**: `source text` (`manual`, `suunto`, `derived`, `ai`).
- **audit_log**: כל שינוי משמעותי (יעדים, מחיקות, שינוי דאטה היסטורית).
- **raw ≠ derived**: נתוני חיישן נשמרים ב־`*_readings` נפרד ממה שמחושב.

## Entities

### Identity

**profile**
- `id uuid PK` = `auth.users.id`
- `display_name text`
- `locale text default 'he'`, `timezone text`
- `units_distance` (`km`|`mi`), `units_weight` (`kg`|`lb`), `units_body_weight`
- `created_at`, `updated_at`

### Global (system) tables — מוגבלות

**exercise_media** (public read, אך רק לתרגילי מערכת) — לוגו/הדגמה של תרגילים סטנדרטיים.
כל שאר ה־lookups **אישיים** ונושאים `owner_id`.

### Running domain

**training_locations** (משותף — לוקיישן כללי; owner_id)
- `id`, `owner_id`, `name`, `kind` (`gym`|`home`|`outdoor`|`track`), `notes`, timestamps, `deleted_at`

**treadmills** — כיול מסילות ספציפיות
- `id`, `owner_id`, `location_id fk`, `label`, `calibration_notes`
- `last_calibration_at`, `calibration_source text`

**running_routes**
- `id`, `owner_id`, `name`, `surface` (`road`|`trail`|`treadmill`|`track`)
- `distance_m numeric`, `elevation_gain_m numeric`
- `geo jsonb` (raw GPS מיובא — אם קיים)

**run_sessions**
- `id`, `owner_id`, `started_at`, `ended_at`, `route_id fk null`
- `distance_m numeric`, `duration_s numeric`, `avg_hr numeric null`, `avg_pace_s_per_km numeric`
- `perceived_effort_rpe smallint null` (1–10)
- `notes text`

**suunto_readings** (raw — לא מחושב)
- `id`, `owner_id`, `session_id fk null`, `recorded_at`
- `metric text` (`hr`|`pace`|`cadence`|`altitude`|`power`|...)
- `value numeric`, `unit text`, `source text default 'suunto'`

**run_segments** (derived / מחושב)
- `id`, `session_id fk`, `owner_id`, `index int`
- `distance_m`, `duration_s`, `avg_pace_s_per_km`, `avg_hr`
- `segment_type` (`km`|`mile`|`interval`|`custom`)

### Strength (gym + home) domain

**equipment**
- `id`, `owner_id`, `name`, `kind` (`barbell`|`dumbbell`|`machine`|`bodyweight`|`band`|`kettlebell`|...)
- `location_id fk`, `notes`

**muscle_groups** (system-level אך קטן וברור — או per-owner? החלטה ב־`decisions.md`)
- `id`, `name`, `code`

**exercises**
- `id`, `owner_id null` (null = system), `name`, `primary_muscle_group_id fk`
- `secondary_muscle_groups uuid[]`
- `default_equipment_kind`, `is_bodyweight boolean`
- `unilateral boolean`, `notes`

**exercise_media**
- `id`, `exercise_id fk`, `storage_path text` (Signed URL בלבד), `media_type` (`image`|`video`), `owner_id`

**workout_templates**
- `id`, `owner_id`, `name`, `domain` (`gym`|`home`), `notes`

**workout_template_items**
- `id`, `template_id fk`, `order_index int`
- `exercise_id fk`, `superset_group int null`, `target_sets int`, `target_reps text` (טווח), `target_rpe numeric null`, `rest_s int null`

**supersets** — נטמע ב־`superset_group` בתוך `workout_template_items` וב־`strength_sets` (אין טבלה נפרדת אלא אם יתעורר צורך).

**strength_sessions**
- `id`, `owner_id`, `template_id fk null`, `domain` (`gym`|`home`)
- `started_at`, `ended_at`, `location_id fk`, `notes`

**strength_sets**
- `id`, `session_id fk`, `owner_id`, `exercise_id fk`
- `set_index int`, `superset_group int null`
- `weight_kg numeric null`, `reps int null`, `time_s int null` (לתרגילי זמן), `distance_m numeric null` (למשל farmer's carry)
- `rpe numeric null`, `rir int null`
- `is_warmup boolean default false`, `is_failure boolean default false`
- `recorded_at`

**home_sessions** — alias/וריאנט של `strength_sessions` עם `domain='home'`; אין טבלה נפרדת.
**home_exercise_sets** — נכנס ל־`strength_sets` עם session שסומן `home`.

### Goals

**goals**
- `id`, `owner_id`, `domain` (`running`|`gym`|`home`)
- `metric text` (`distance_weekly_m`|`long_run_m`|`squat_1rm_kg`|`bench_1rm_kg`|...)
- `target_value numeric`, `target_unit text`
- `starts_at`, `target_date null`, `status` (`active`|`achieved`|`paused`|`cancelled`)
- `notes`

**goal_snapshots** (audit של יעדים)
- `id`, `goal_id fk`, `snapshot_at`, `value numeric`, `source` (`user`|`derived`)

### Insights / AI

**insights** (מסקנות מוצגות למשתמש — derived)
- `id`, `owner_id`, `domain`, `kind`, `payload jsonb`, `generated_at`, `dismissed_at null`

**ai_suggestions**
- `id`, `owner_id`, `context jsonb`, `suggestion jsonb`
- `status` (`pending`|`accepted`|`rejected`|`expired`)
- `created_at`, `decided_at null`

### System / infra

**audit_log**
- `id`, `owner_id`, `entity text`, `entity_id uuid`, `action text` (`create`|`update`|`delete`|`restore`|`goal_change`|`ai_apply`)
- `diff jsonb`, `occurred_at`

## פערים לעומת המצב הנוכחי

**הכל.** אף טבלה אינה קיימת. כאשר יתחיל שלב הבנייה, כל אחת מהן תיווצר במיגרציה עם:
1. GRANT ל־`authenticated` + `service_role`.
2. `ENABLE ROW LEVEL SECURITY`.
3. Policies: `SELECT/INSERT/UPDATE/DELETE` scoped ל־`auth.uid() = owner_id`, כולל `USING` **ו־**`WITH CHECK`.
4. אינדקסים: `(owner_id)`, `(owner_id, deleted_at)`, `(owner_id, <sort-key>)`.
5. Trigger ל־`updated_at`.

## מודלים סותרים

אין. אין קוד קיים שמגדיר מודלים חלופיים.
