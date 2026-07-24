# Entity / Data-Layer Inventory — `src/lib/`

עודכן: 2026-07-24 (Product Alignment Audit). מקור: קריאה ישירה של `types.ts`/`schemas.ts`/`storage.ts`/`repo.ts` בכל תת-תחום.

> **הבהרה חשובה:** `docs/ai/data-model.md` מתאר את **סכימת היעד ב-Supabase** (טרם נבנתה). המימוש הקיים בפועל הוא **localStorage** תחת `src/lib/<domain>/`. מסמך זה מתעד את **המצב בפועל**.

## תקציר מנהלים

- **Persistence אמיתי ב-localStorage** (לא in-memory בלבד). כל תחום עסקי משתמש במפתח יחיד `fitlog:<domain>:v<n>` עם cache בזיכרון + דפוס subscriber ל-`useSyncExternalStore`. **הנתונים שורדים refresh** בדפדפן. ב-SSR / כשאין localStorage — snapshot ריק דטרמיניסטי.
- החריג: `src/lib/repo/` — חוזה `Repository` **מאוחד** — מגובה ב-**mock טהור בזיכרון** (`mock.ts`) שמחזיר `[]` כברירת מחדל ואינו persistent. זהו façade קריאה-בלבד (`listActivities`/`listGoals`) שנועד להתחלף ב-Supabase; דאטת הפיצ'רים האמיתית חיה ב-stores הפר-תחומיים.
- עקרונות הדאטה (PR §4) **מכובדים היטב במודל הטיפוסים**: יחידות בבסיס SI עם סיומות שם, `source`/provenance נשמר, timestamps (`created_at`/`updated_at`/`deleted_at`) כמעט בכל ישות, ו-**raw ≠ derived** נשמר (קריאות Suunto בנפרד מ-RunSession).
- **Soft-delete + restore (trash) ממומש** end-to-end ל-catalog/runs/exercises/templates (מוצג ב-`src/routes/trash.tsx`). sessions/home/goals נושאים `deleted_at` + `trashed` אך **לא** מחוברים ל-UI של הסל.
- **אין ישויות legacy של expense/finance/identity.** `peopleDirectory`, `transport` IDs, `roles`, `PIN` — **נעדרים**. שם התיקייה `expense-guard` הוא scaffold ישן ומטעה — הקוד הוא אפליקציית כושר.

## מכניקת Persistence (מאומת בקוד)

| היבט | ממצא |
|---|---|
| מדיום | `localStorage` בדפדפן, blob JSON אחד לכל תחום |
| שורד refresh? | **כן** בדפדפן. כל store: `let cache`, hydrate מ-`getItem`, כתיבה חזרה בכל mutation |
| SSR / ללא storage | דטרמיניסטי: `read*ServerSnapshot()` מחזיר `EMPTY_STATE` קבוע |
| Reactivity | `Set<() => void>` listeners + `subscribe*()` → `useSyncExternalStore` |
| Owner scoping | קבוע `CURRENT_OWNER_ID = "single-user"` נחתם בכל שורה (הכנה ל-RLS) |
| repo מאוחד | in-memory טהור, לא persistent. `mockRepository` מחזיר `[]` אלא אם `fitlog:mock-mode==="demo"` |

**מפתחות storage:** `fitlog:runs:v1`, `fitlog:suunto:v1`, `fitlog:catalog:v1`, `fitlog:exercises:v1`, `fitlog:templates:v1`, `fitlog:sessions:v2` (המפתח היחיד ש**קודם ל-v2**), `fitlog:home:v1`, `fitlog:goals:v1`, `fitlog:preferences:v1`, + sessionStorage `fitlog:session:landed`, + דגל demo `fitlog:mock-mode`.

**חוזה repository מאוחד** (`src/lib/repo/types.ts`): `Domain = "running"|"gym"|"home"`, טיפוסי view שטוחים `Activity` ו-`Goal`, ו-`Repository = { listActivities, listAllActivities, listGoals }`. `RepoKind = "mock"|"supabase"`. `activeRepo = mockRepository`, `activeRepoKind = "mock"`. זהו התפר המיועד ל-Supabase.

## מקרא: SD=soft-delete, R=restore ב-UI, Prov=provenance, TS=timestamps

## מלאי ישויות (לפי תחום)

### `runs/` — ריצה (`fitlog:runs:v1`)
- **`RunSession`** — יחידות בסיס (`distance_meters`, `duration_seconds`, `average_speed_kmh`, `average_pace_s_per_km`, incline%, HR bpm, `cadence_spm`, elevation, calories); `started_at`/`ended_at`/`timezone`; `perceived_effort` 1-10; **`provenance: Partial<Record<field, Source>>`**, `outlier_overrides[]`, `data_completeness`, `primary_source`. FKs: `location_id`, `treadmill_id`, `route_id`, `country_code`. SD+R (`softDeleteRun`/`restoreRun`/`purgeRun`) + archive. `derive()` ממלא pace/speed ומסמן `"derived"` בלי לדרוס manual. Tests: `runs/__tests__/`.
- **`RunSegment`** — מקטעים derived משובצים ב-`RunSession.segments[]`; sums לא דורסים totals.
- **`RunningRoute`** — מסלולים קבועים; SD+R + archive (`is_active`); `is_favorite`.
- **`RunAuditEntry`** — טיפוס audit-log stub, **לא persistent/wired**.

### `suunto/` — קריאות raw + כיול (`fitlog:suunto:v1`)
- **`RunDeviceReading`** — **`raw_value` נשמר לצד `normalized_value` + `raw_unit` + `unit`**; `metric_key` (hr/pace/cadence/TE/EPOC/…); `source_type` (suunto/treadmill/manual/import/screenshot); `input_method`; `confidence`; `captured_at`/`entered_at`. FK: `run_session_id`. זו הפרדת **raw ≠ derived** שה-PR דורש — שורות חיישן ב-store נפרד, לעולם לא משתנות ע"י כיול.
- **`TreadmillCalibrationProfile`** — `factor`, `calculation_method`, `diagnostics`, `status` (draft→proposed→approved→revoked→superseded). FK: `treadmill_id`. שכבה derived מגורסת; "לעולם לא משנה source".
- **`CalibrationExclusion`** — מחריג ריצה מכיול בלי למחוק. FKs: `treadmill_id`, `run_session_id`.
- **`DeviceRunSnapshot`** — projection derived לתצוגה/השוואה (לא נשמר).

### `catalog/` — מקומות/הליכונים/ציוד/מדינות (`fitlog:catalog:v1`)
- **`TrainingLocation`** — `location_type`, `country_code`, geo, `is_default/favorite/active`. SD+R (בסל). FK: `country_code`.
- **`TreadmillProfile`** — machine_number, manufacturer/model, `image_url` (data-URL ≤500KB). SD+R. FK: `location_id`.
- **`EquipmentItem`** — `equipment_type`, `quantity`, min/max weight, `unit`, `availability_status`. SD+R. FK: `location_id`. מזין זמינות תרגילים.
- **`CountryOption`** — מערך קבוע (`countries.ts`), lookup סטטי (לא ישות עסקית).

### `exercises/` — תרגילים + קבוצות שריר + מדיה (`fitlog:exercises:v1`)
- **`Exercise`** — `name_he/en/aliases/slug`, `category`, `movement_pattern`, `tracking_type`, `required/optional_equipment`, `unilateral`, `bodyweight_based`, defaults (sets/reps/rest/rpe/rir), cues/mistakes, `is_system`, `parent_exercise_id`+`variation_type`. FKs: `primary_muscle_group_id`, `secondary_muscle_group_ids[]`, `location_ids[]`. SD+R + archive. **`seedExercises()` auto על טעינה ראשונה** (`is_system=true`, IDs דטרמיניסטיים, ניתן לעריכה/מחיקה). Tests: `exercises/__tests__/`.
- **`MuscleGroup`** — `code`, `name_he/en`, `body_region`, `color_token`. **`seedMuscleGroups()` auto**.
- **`ExerciseMedia`** — `media_type`, `url`, `storage_path`, license/attribution, `verification_status`. FK: `exercise_id`. מוכן ל-Signed-URL.

### `templates/` — תבניות אימון כוח (`fitlog:templates:v1`)
- **`WorkoutTemplate`** — `estimated_duration_seconds`, muscle overrides, `status` (draft/active/paused/archived/**trashed**), `version`, `usage_count`, `is_favorite`. SD+R (trashed + `deleted_at`). FKs: `location_id`, `parent_template_id`. Tests: `templates/__tests__/`.
- **`WorkoutTemplateBlock`** — `block_type` (single/superset/triset/circuit/warmup/cooldown), `rounds`, `color_token`. **סופרסטים כ-block**. FK: `template_id`.
- **`WorkoutTemplateExercise`** — `planned_sets/reps` + range, `planned_weight`+unit, `tempo`, `alternate_exercise_ids[]`, ברירת מחדל 3×12. FKs: `block_id`, `exercise_id`.
- **`WorkoutTemplateVersion`** — `snapshot` מלא (blocks+exercises), `reason`. FK: `template_id`.

### `sessions/` — אימוני כוח בחדר כושר (`fitlog:sessions:v2`)
- **`StrengthSession`** — timestamps, `duration_seconds` (מהטיימר), `status` (…/**trashed**), `perceived_quality` 1-5, `quality_score` 0-100, `data_completeness`. FKs: `template_id`+`template_version`+`template_snapshot`, `location_id`. `deleted_at`+`trashed` אך **לא בסל UI**. snapshot קפוא בתחילת אימון.
- **`StrengthSessionExercise`** — `snapshot` קפוא, `substituted_from_exercise_id`+reason. FKs: `session_id`, `block_id`, `exercise_id`.
- **`StrengthSet`** — `planned_reps/weight` מול **`actual_reps/actual_weight`** + unit, `duration_seconds`, `rpe`/`rir`, `side` (L/R), `assistance_value`, `completed`/`skipped`. FK: `session_exercise_id`.
- **`StrengthSessionBlock`**, **`SessionTimerRecord`** (timestamps → wall-clock).

### `home/` — בית / משקל גוף (`fitlog:home:v1`)
- **`HomeSession`** — `status` (…/partial/**trashed**), **`is_quick_entry`**, `primary_exercise_id`, `quality_score`, `data_completeness`. FKs: `template_id`+snapshot, `primary_exercise_id`. `deleted_at`+`trashed` אך **לא בסל UI**. Tests: `home/__tests__/`.
- **`HomeExerciseEntry`** — `snapshot`, `sequence`, `completed`. FKs: `home_session_id`, `exercise_id`.
- **`HomeExerciseSet`** — `reps`, `duration_seconds`, `side`, `added_weight`+unit, `assistance_value`, `round_number` (סבבים), `rpe`/`rir`. FK: `entry_id`.
- **`HomeTemplate`** + **`HomeTemplateEntry`** + **`HomeTemplateVersion`** — תבניות ביתיות + גרסאות.

### `goals/` — יעדים + snapshots + גרסאות (`fitlog:goals:v1`)
- **`Goal`** — `domain`, **`goal_type`** (26 טיפוסים דטרמיניסטיים), `baseline/current/target_value`+unit, `calculation_method`, `direction`, `status` (…/achieved/not_achieved/**trashed**), `priority`, `is_primary`, **`auto_mark_achieved=false`**, `version`. FKs: `user_id`, `linked_exercise_id`/`route_id`/`treadmill_id`/`template_id`. `deleted_at`+`trashed` אך **לא בסל UI**. Tests: `goals/__tests__/`.
- **`GoalSnapshot`** — `progress_percentage`, `projected_value`, `source_activity_ids[]`, `formula_version`, `confidence_label`. FK: `goal_id`. derived, ניתן לחישוב מחדש.
- **`GoalVersion`** — snapshot קפוא `GoalFrozen`, `changed_fields[]`, `reason`. FK: `goal_id`.
- **`GoalActivityLink`** — `activity_kind`, `linked_by` (system/user). audit של אילו פעילויות הזינו snapshot.
- **`GoalTypeSpec`** — `GOAL_TYPE_CATALOG` סטטי (lookup).

### `preferences/` — העדפות (`fitlog:preferences:v1`)
- **`Preferences`** — `landingModule`. `hasLandedThisSession` ב-sessionStorage. הכי קרוב ל-`profile`; **חסר** units_distance/units_weight/locale/timezone (שדות `profile` בדאטה-מודל טרם ממומשים).

### `analytics/` — derived טהור, ללא storage
`oneRM`, `records`, `volume`, `progress`, `quality`, `muscleLoad`, `exerciseHistory`, `sessionHistory`, `comparability`, `chartData`. מחשב מעל raw, **אף פעם לא משנה מקור**. נוסחאות מגורסות (`OneRmFormulaId = "epley-v1"|"brzycki-v1"`, `formula_version`). Tests: `analytics/__tests__/`.

## ממצאים ממוקדים

**Provenance / יחידות / timestamps (PR §4):** נוכחים חזק ברמת הטיפוסים. סיומות יחידה בסיסיות (`_meters`/`_seconds`/`_kmh`/`_bpm`/`_kg`). `RunSession.provenance` (מפת Source פר-שדה), `RunDeviceReading.source_type`+`confidence`, `GoalSnapshot.formula_version`. **פער מול data-model:** אין `profile` עם units/locale/timezone — רק `landingModule` נשמר; יחידת משקל פר-סט (`weight_unit`).

**raw ≠ derived (Suunto):** מופרד נכון. `RunDeviceReading` ב-store נפרד עם `raw_value`+`raw_unit` לצד `normalized_value`+`unit`. pace/speed ב-`RunSession` מחושבים ומסומנים `"derived"` בלי דריסה. כיול = שכבה additive עם `diagnostics`.

**Soft-delete + restore:** ממומש. `deleted_at` בכל ישות עסקית; `/trash` מציג סל אמיתי ל-**locations/treadmills/equipment/runs/exercises/templates** עם restore דו-שלבי (`ConfirmDialog`) — מקיים "כל מחיקה ≥ 2 פעולות". **לא מחובר לסל:** `StrengthSession`, `HomeSession`, `Goal` (נושאים `trashed`+`deleted_at` אך restore לא מוצג ב-`/trash`). ← פער UI לתיקון עתידי.

**חוזה repository מאוחד:** קיים אך מינימלי ולא persistent (façade קריאה-בלבד). ה-CRUD האמיתי חי פר-תחום ב-`repo.ts`, עם חתימות שכתובות לחקות repo עתידי של Supabase.

**legacy peopleDirectory/transport/roles/PIN:** **נעדרים לחלוטין**. כל `role` הוא ARIA. אין שכבת auth/identity/PIN ואין מודל expense. שם התיקייה `expense-guard` הוא ה-marker היחיד — לא משקף את הקוד.

**שש ישויות Quick Add:** אין רישום מפורש של 6. הקרוב ביותר — home "quick entry" (`HomeSession.is_quick_entry` + `QuickEntryInput`). ← או UI-only או טרם נבנה; לא ישויות נפרדות.

**Seed / sample שניתן למחוק בעתיד:** רק (1) `exercises/seed.ts` (`seedMuscleGroups`+`seedExercises`, auto, `is_system`, ניתן לעריכה); (2) `repo/mock.ts` `DEMO_ACTIVITIES/DEMO_GOALS` מאחורי דגל `mock-mode=demo` (כבוי). שאר ה-stores (runs/suunto/catalog/sessions/home/goals) מתחילים **ריקים** — מכבד "אל תמציא דאטה בשם המשתמש".

**דגלי rename/migration:** שמות ישויות תואמי-מוצר, אין צורך ב-rename. שיקולי migration ל-Supabase: מפתח `sessions` כבר ב-`v2` (תקדים); חוסר עקביות `Goal.user_id` מול `owner_id` באחרים; מודלי ה-`Goal`/`Activity` הפר-תחומיים עשירים בהרבה מה-façade; טבלאות `profile`/`audit_log`/`ai_suggestions`/`insights` מה-data-model **טרם נבנו** (רק stubs ברמת טיפוס: `RunAuditEntry`/`GoalVersion`/`GoalActivityLink`).
