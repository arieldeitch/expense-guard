# Local → Supabase Migration Contract

> **חוזה עתידי.** אין כרגע סכמת Supabase, פרויקט, טבלאות או Auth. המסמך מגדיר
> כיצד ה-Export המקומי **יתורגם** לענן כשההחלטה תתקבל. אין להסיק ממנו שקיים DB.

## גרסאות — שתי שכבות נפרדות (עודכן 2026-07-26)

יש **שתי** גרסאות schema במערכת, והן אינן אותו דבר:

| שכבה | מפתח / שדה | גרסה | תפקיד |
|---|---|---|---|
| **local storage schema** | `fitlog:storage-meta` → `schema_version` | **1.0.0** | מתאר את מבנה תשעת מפתחות ה-localStorage **במכשיר הזה**. נשלט ע"י `LOCAL_MIGRATIONS` (ADR-0033). |
| **backup envelope schema** | `schema_version` בתוך קובץ הגיבוי | **1.0.0** | מתאר את הפורמט הנייד של קובץ ה-Export (ADR-0031). זהו הפורמט הקנוני להעברה לענן. |

כרגע שתיהן `1.0.0`, אך **הן מתקדמות בנפרד**: שינוי במבנה האחסון המקומי אינו מחייב שינוי בפורמט הקובץ, ולהפך. מיגרציה מקומית מריצה `legacy -> 1.0.0`, יוצרת snapshot מאומת לפני כל שינוי, וכותבת את ה-metadata **רק** אחרי שכל הכתיבות הצליחו. גרסה מקומית **גבוהה** מזו שהאפליקציה מכירה נחסמת ואינה נוגעת בנתונים.

**השלכה על הייבוא לענן:** הייבוא לענן יקרא **קובץ Export**, לא את מפתחות ה-localStorage. לכן `LOCAL_SCHEMA_VERSION` אינו חלק מחוזה הענן — אך הוא **תנאי מוקדם**: מכשיר שלא עבר מיגרציה בהצלחה אינו אמור לייצא קובץ לייבוא.

## עקרונות

1. **record identity נשמרת.** ה-`id` שבקובץ הגיבוי הוא ה-primary key גם בענן. אין יצירת מזהים מחדש ואין הזנה ידנית.
2. **cloud ownership תיקבע בשרת לפי `auth.uid()`.** שדה `owner_id` שבקובץ (כיום `"single-user"` / `HOME_OWNER_ID`) **אינו סמכות הרשאה** ואין לסמוך עליו. הוא נשמר לצורכי מעקב בלבד וייכתב מחדש בייבוא.
3. **Import הוא upsert לפי stable id** ולכן idempotent — ייבוא חוזר של אותו קובץ אינו יוצר כפילויות.
4. **סדר ייבוא לפי תלויות** — הורה לפני ילד. אחרת RLS/FK יכשילו את הייבוא.
5. **קונפליקטים אינם נדרסים בשקט** — אותה מדיניות שקיימת מקומית.

## טבלת מיפוי

| Local entity | Local storage key | Local fields (עיקר) | Future Supabase table | PK | Ownership | Parent dependency | Import order | Conflict rule | Transformation | Validation | Missing / unsupported |
|---|---|---|---|---|---|---|---|---|---|---|---|
| muscle groups | `fitlog:exercises:v1` | `id, code, name_he, name_en, body_region` | `muscle_groups` | `id` | `auth.uid()` | — | 1 | upsert by id | none | id יציב (`mg_<code>`) | — |
| exercises (seed + custom) | `fitlog:exercises:v1` | `id, slug, name_he, name_en, tracking_type, required_equipment_types, is_custom, is_system` | `exercises` | `id` | `auth.uid()` | muscle_groups | 2 | upsert by id | `is_system` נשמר; seed לא ישוכפל | id = `ex_<slug>`, יציב | media (לא קיים) |
| equipment / locations | `fitlog:catalog:v1` | `id, name, equipment_type` | `locations`, `equipment` | `id` | `auth.uid()` | — | 2 | upsert by id | none | id יציב | תמונות inline |
| home templates | `fitlog:home:v1` → `templates` | `id, name, rounds, version, status, is_favorite` | `home_templates` | `id` | `auth.uid()` | — | 3 | upsert by id | none | `deleted_at` נשמר (soft delete) | — |
| home template entries | `fitlog:home:v1` → `templateEntries` | `id, template_id, exercise_id, sequence, planned_*` | `home_template_entries` | `id` | דרך ההורה | home_templates, exercises | 4 | upsert by id | none | `sequence` שומר סדר | — |
| home sessions | `fitlog:home:v1` → `sessions` | `id, name, status, started_at, ended_at` | `home_sessions` | `id` | `auth.uid()` | — | 3 | upsert by id | none | timestamps ISO-8601 | — |
| home entries / sets | `fitlog:home:v1` → `entries`, `sets` | `id, session_id, entry_id, reps, duration` | `home_session_entries`, `home_session_sets` | `id` | דרך ההורה | home_sessions | 4–5 | upsert by id | none | סדר נשמר | — |
| strength sessions | `fitlog:sessions:v2` → `sessions` | `id, name, status, started_at, duration_seconds, template_snapshot` | `strength_sessions` | `id` | `auth.uid()` | — | 3 | upsert by id | `template_snapshot` נשאר JSONB | — | — |
| session blocks | `fitlog:sessions:v2` → `blocks` | `id, session_id, sequence, block_type, rounds` | `strength_session_blocks` | `id` | דרך ההורה | strength_sessions | 4 | upsert by id | none | — | — |
| session exercises | `fitlog:sessions:v2` → `exercises` | `id, session_id, block_id, exercise_id, sequence, snapshot` | `strength_session_exercises` | `id` | דרך ההורה | blocks, exercises | 5 | upsert by id | `snapshot` → JSONB | — | — |
| sets | `fitlog:sessions:v2` → `sets` | `id, session_exercise_id, set_number, actual_*, rpe, completed` | `strength_sets` | `id` | דרך ההורה | session exercises | 6 | upsert by id | none | `set_number` שומר סדר | `rir` קיים ולא בשימוש ב-UI |
| session timers | `fitlog:sessions:v2` → `timers` | `session_id, started_at, paused_seconds` | `strength_session_timers` | `session_id` | דרך ההורה | strength_sessions | 4 | upsert by session_id | **אין `id`** — ממופתח ב-`session_id` | — | — |
| runs | `fitlog:runs:v1` | `id, run_type, distance_meters, duration_seconds, segments, provenance` | `run_sessions` | `id` | `auth.uid()` | — | 3 | upsert by id | `segments`/`provenance` → JSONB | — | — |
| suunto readings | `fitlog:suunto:v1` | `id, ...` | `suunto_readings` | `id` | `auth.uid()` | runs | 4 | upsert by id | none | — | אין ייבוא קובץ |
| goals | `fitlog:goals:v1` | `id, domain, goal_type, target_value, status, is_primary` | `goals` | `id` | `auth.uid()` | — | 3 | upsert by id | none | domain isolation נאכף | — |
| gym templates | `fitlog:templates:v1` | `id, name, version, blocks` | `workout_templates` | `id` | `auth.uid()` | exercises | 3 | upsert by id | none | — | — |
| preferences | `fitlog:preferences:v1` | `landingModule, units` | `profiles` (עמודות) | `user_id` | `auth.uid()` | — | 1 | upsert by user | **אין `id`** — שורה יחידה | — | — |

## מה עדיין חסר לפני ייבוא אמיתי

- **החוזה הזה מעולם לא הורץ.** לא בוצע Fake Supabase rehearsal — לא הוכח שקובץ ה-Export ניתן לתרגום לסכמה יחסית לפי סדר התלויות שבטבלה, ולא נבדק upsert חוזר. **זו המשימה הפתוחה הבאה** (`open-tasks.md`).
- לא בוצע ייבוא מול Supabase אמיתי — רק החוזה והפורמט קיימים.
- אין הגדרת RLS policies.
- אין FK constraints מוגדרים; סדר הייבוא לעיל הוא ההנחה.
- `owner_id` המקומי יידרס — יש לוודא שאין הסתמכות עליו בקוד לפני המעבר.
