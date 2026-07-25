# Product Alignment Audit — מטריצת התאמה

עודכן: 2026-07-24. מקור אמת: `product-requirements.md`. ראיות: `route-inventory.md`, `entity-inventory.md`, `design-system-audit.md`.

**סטטוסים:** `ALIGNED` · `PARTIALLY_ALIGNED` · `NOT_ALIGNED` · `MISSING` · `LEGACY` · `UNKNOWN`

## מסקנה כללית

הפרויקט **מיושר היטב** עם דרישות המוצר. רוב הדרישות התפקודיות של שלושת התחומים כבר ממומשות ברמת קוד ובדיקות (localStorage). הפערים המרכזיים הם **תשתיתיים ועתידיים** (backend/auth/RLS/audit/AI/export) ולא סתירות מוצר. נקודת המחלוקת המוצרית האמיתית היחידה: **משטח ה-goals** (עמוד גלובלי קיים אך orphan, מול "יעדים בתוך התחום"). "מקור המדידה" הבודד: הרבה קוד עשיר לא מחובר לגמרי ל-UI (goals surface, trash לחלק מהישויות).

## מטריצה

| # | דרישה | מימוש נוכחי | סטטוס | קבצים | פער | סיכון | הזדמנות reuse | פעולה | תלות | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Single-user scope | `owner_id="single-user"` קבוע; אין auth/multi-tenant | ALIGNED | `*/storage.ts` | להחליף בקבוע `auth.uid()` בעתיד | נמוך | הקבוע מוכן ל-RLS | KEEP | Auth | 12 | RLS scoped ל-uid יחיד |
| 2 | שלושה תחומי אימון בלבד | routes+lib ל-running/gym/home + goals/catalog/analytics; אין תחום זר | ALIGNED | `src/routes/*`, `src/lib/*` | — | נמוך | — | KEEP | — | — | אין תחום מחוץ להיקף |
| 3 | ריצה (מלא) | `runs/` + 8 routes (חוץ/הליכון/מסלולים/היסטוריה/פרטים) | ALIGNED | `lib/runs`, `routes/running.*` | — | נמוך | — | KEEP | — | 4 | ריצה נשמרת+מוצגת+נערכת |
| 4 | ריצת הליכון | `run_type=treadmill`, `TreadmillProfile`, incline | ALIGNED | `lib/runs`, `lib/catalog` | — | נמוך | — | KEEP | — | 3-4 | הליכון ספציפי משויך לריצה |
| 5 | ריצת חוץ | `run_type`, geo, `country_code`, `RunningRoute` | ALIGNED | `lib/runs`, `running.routes` | — | נמוך | — | KEEP | — | 4 | ריצת חוץ עם מדינה+מקום |
| 6 | Suunto (raw נפרד) | `RunDeviceReading` store נפרד, `raw_value`+`normalized_value` | ALIGNED | `lib/suunto` | ייבוא קובץ (GPX/FIT/CSV) טרם | נמוך | — | KEEP + הוסף ייבוא | החלטת פורמט | 5 | קריאות Suunto נשמרות raw |
| 7 | השוואת Suunto↔הליכון + כיול שקוף | `TreadmillCalibrationProfile`, `compare.ts`, `outliers.ts`, `treadmills.$id` | ALIGNED | `lib/suunto`, `routes/treadmills.$id` | — | נמוך | — | KEEP | — | 5 | פקטור כיול מוצע בלי לשנות raw |
| 8 | מקומות אימון | `TrainingLocation` + CRUD + geo | ALIGNED | `lib/catalog`, `routes/locations.*` | — | נמוך | — | KEEP | — | 3 | מקום נוצר/נערך/משויך |
| 9 | ציוד לפי מקום | `EquipmentItem` (FK location), זמינות תרגילים | ALIGNED | `lib/catalog`, `lib/exercises/availability` | — | נמוך | — | KEEP | — | 3 | ציוד למקום מסנן תרגילים |
| 10 | ספריית תרגילים | `Exercise`+`MuscleGroup`, seed, חלופות, cues/mistakes | ALIGNED | `lib/exercises`, `routes/exercises.*` | — | נמוך | — | KEEP | — | 6 | חיפוש/פילטר/CRUD תרגיל |
| 11 | מדיה לתרגילים (מקור+רישיון) | `ExerciseMedia` (license/attribution/verification); data-URL ≤500KB | PARTIALLY_ALIGNED | `lib/exercises`, `MediaGallery`, `ImagePicker` | אין bucket/signed-URL; inline data-URL בלבד | בינוני | טיפוסים מוכנים | REUSE_INFRASTRUCTURE | Storage | 6/12 | מדיה בפרטי + signed URL |
| 12 | סופרסטים | `WorkoutTemplateBlock.block_type=superset/triset/circuit` | ALIGNED | `lib/templates`, `lib/sessions` | — | נמוך | — | KEEP | — | 7 | סופרסט מוגדר+מבוצע |
| 13 | תבניות (כוח+בית) | `WorkoutTemplate`(+versions) ו-`HomeTemplate`(+versions) | ALIGNED | `lib/templates`, `lib/home` | — | נמוך | — | KEEP | — | 7/8 | תבנית נוצרת+גרסאות+הפעלה |
| 14 | ברירת מחדל 3×12 + שינוי כל סט | defaults 3×12; `StrengthSet`/`HomeExerciseSet` לכל סט | ALIGNED | `lib/templates/defaults`, `lib/sessions` | — | נמוך | — | KEEP | — | 7 | כל סט נערך בנפרד |
| 15 | משקל/חזרות/RPE/RIR/טיימר מנוחה | שדות + `SessionTimerRecord` + rest | ALIGNED | `lib/sessions` | — | נמוך | — | KEEP | — | 7 | סט עם RPE/RIR + טיימר |
| 16 | Active workout (ביצוע) | `sessions.$id` (autosave/סופרסט/מנוחה/החלפה) + `home.sessions.$id` | ALIGNED | `routes/sessions.$id`, `routes/home.sessions.$id` | — | נמוך | — | KEEP | — | 7/8 | אימון פעיל נשמר תוך כדי |
| 17 | הצגת ביצוע קודם | `home` prev perf; analytics `exerciseHistory` | ALIGNED | `lib/home`, `lib/analytics` | — | נמוך | — | KEEP | — | 7 | ביצוע קודם מוצג בסט |
| 18 | Home quick entry (תרגיל יחיד) | `HomeSession.is_quick_entry`, `/home/quick*` | ALIGNED | `lib/home`, `routes/home.quick.*` | — | נמוך | — | KEEP | — | 8 | דיווח מהיר תרגיל בודד |
| 19 | סטים ביתיים (חזרות/זמן/צדדים/סבבים) | `HomeExerciseSet` (reps/duration/side/round_number/added_weight) | ALIGNED | `lib/home` | — | נמוך | — | KEEP | — | 8 | סט ביתי עם round+side |
| 20 | שיאים/1RM מסומן כהערכה | `analytics/oneRM` (`epley/brzycki`), `records` baseline-aware | ALIGNED | `lib/analytics`, `lib/home/records` | — | נמוך | — | KEEP | — | 10 | 1RM מסומן estimated |
| 21 | מדד איכות/התקדמות שקוף | `quality.ts`, `progress.ts`, `data_completeness`, `formula_version` | ALIGNED | `lib/analytics`, `lib/home/metrics` | — | נמוך | — | KEEP | — | 10 | ציון איכות מוסבר |
| 22 | יעדים — נוצרים רק ע"י המשתמש | `goals/`; אין המצאת ערך; `auto_mark_achieved=false` | ALIGNED (מנוע) | `lib/goals` | — | נמוך | — | KEEP | — | 9 | המערכת לא ממציאה יעד |
| 23 | יעד מוצג בתוך התחום (לא עמוד גלובלי) | 12 domain-goals routes + `DomainPrimaryGoalTile` ב-3 המסכים; `/goals*` = compat redirects | **ALIGNED** ✅ | `routes/{running,gym,home}.goals.*`, `components/goals/*` | — | נמוך | — | KEEP (Phase 1 done) | — | 9 ✅ | יעד מוצג בתוך run/gym/home |
| 24 | snapshots + היסטוריית גרסאות ליעד | `GoalSnapshot` + `GoalVersion` + `GoalActivityLink` | ALIGNED | `lib/goals` | — | נמוך | — | KEEP | — | 9 | כל שינוי יעד → snapshot |
| 25 | תחזית מסומנת כהערכה; יעד שעבר ≠ כישלון | `projected_value`+`confidence_label`; status `not_achieved` נפרד | ALIGNED | `lib/goals` | לוודא ב-UI שלא מוצג ככישלון | נמוך | — | KEEP | — | 9 | תחזית=הערכה, אין "נכשל" |
| 26 | History (רלוונטית בהקשר) | היסטוריה פר-תחום (running/gym/home/exercise/template) | ALIGNED | `routes/*.history*` | — | נמוך | — | KEEP | — | 10 | היסטוריה נגישה בהקשר |
| 27 | Analytics | `lib/analytics` (volume/records/progress/quality/muscleLoad/compare) | ALIGNED | `lib/analytics`, `gym.compare` | dashboards גרפיים עתידיים | נמוך | — | KEEP | — | 10 | חישובים derived מוצגים |
| 28 | הנעה מבוססת נתונים (לא cheerleader) | trend deltas עובדתיים; DomainSummaryTile ללא מוטיבציה | ALIGNED | `components/tile/*` | — | נמוך | — | KEEP | — | — | אין confetti/badges |
| 29 | Tiles לפני רשימות | מערכת `Tile` (CVA) = primitive דיפולטי | ALIGNED | `components/tile` | — | נמוך | — | KEEP | — | 1 | רשומות כאריחים |
| 30 | Mobile-first | base=mobile, `sm/lg` progressive, touch ≥44px | ALIGNED | `styles.css`, `shell/*` | — | נמוך | — | KEEP | — | 1 | 390×844 ללא בעיה |
| 31 | עברית + RTL | `dir="rtl"`, logical props, Heebo, `ltr-nums` | ALIGNED | `__root.tsx`, `styles.css` | 404/Error באנגלית | נמוך | — | KEEP_AND_ADAPT | — | 1 | כל טקסט עברי+RTL |
| 32 | אין גלילה אופקית | `min-w-0`/`truncate`/SVG chart | ALIGNED | `shell/*`, `analytics/MiniLineChart` | — | נמוך | — | KEEP | — | 1 | 0 overflow אופקי |
| 33 | Soft delete | `deleted_at` בכל ישות עסקית | ALIGNED | `*/storage.ts` | — | נמוך | — | KEEP | — | 2 | אין hard delete ב-UI |
| 34 | Restore (סל) + 2 פעולות למחיקה | `/trash` ל-9 ישויות (כולל gym/home sessions + goals) עם `ConfirmDialog`/confirm | **ALIGNED** ✅ | `routes/trash.tsx` | — | נמוך | — | KEEP (Phase 2 done) | — | 2 ✅ | כל ישות ניתנת לשחזור |
| 35 | Offline | draft ב-localStorage לטופס פעיל טרם; autosave קיים | PARTIALLY_ALIGNED | `lib/*/storage` | אין offline queue/sync | נמוך (R-10) | — | DEPRECATE_LATER | Backend | 11+ | דיווח לא אובד ללא רשת |
| 36 | Auth | אין (במכוון) | MISSING | — | לבנות email+password | גבוה (עתידי) | — | REQUIRES_PRODUCT_DECISION (timing) | Supabase | 12 | login מוגן |
| 37 | Supabase (persistence אמיתי) | localStorage בלבד; `RepoKind="supabase"` seam קיים | MISSING | `lib/repo` | להפעיל Lovable Cloud + migrations | גבוה | seam+חוזי repo מוכנים | REUSE_INFRASTRUCTURE | אישור משתמש | 12 | דאטה נשמרת בשרת |
| 38 | RLS | אין (אין DB) | MISSING | `data-model.md` (מתוכנן) | policies USING+WITH CHECK לכל טבלה | גבוה | תכנון קיים | (מתוכנן) | Supabase | 12 | RLS פעיל לכל טבלה |
| 39 | AI (עם approval) | אין; `ai_suggestions` מתוכנן | MISSING | `data-model.md` | approval flow | בינוני | — | DEPRECATE_LATER | — | 13 | AI לא משנה בלי אישור |
| 40 | Exports (CSV/JSON) | אריח "בקרוב" ב-more; אין מימוש | MISSING | `routes/more.tsx` | ייצוא של כל דאטת המשתמש | נמוך | — | DEPRECATE_LATER | — | 10+ | ייצוא CSV/JSON |
| 41 | Audit logs | stubs טיפוס בלבד (`RunAuditEntry`/`GoalVersion`) | PARTIALLY_ALIGNED | `lib/runs`, `lib/goals` | `audit_log` אמיתי טרם | בינוני (R-01) | טיפוסים קיימים | KEEP_AND_ADAPT | Supabase | 12 | שינוי משמעותי נרשם |
| 42 | provenance/units/timestamps לכל מדידה | סיומות יחידה, `provenance`/`source`, `created/updated/deleted_at` | ALIGNED | `lib/runs`, `lib/suunto` | אין `profile` units/locale | נמוך | — | KEEP | — | 2 | מדידה נושאת unit+source+ts |
| 43 | raw ≠ derived | Suunto readings נפרד; `derive()` מסמן ולא דורס | ALIGNED | `lib/suunto`, `lib/runs` | — | נמוך | — | KEEP | — | 5 | raw לא נדרס ע"י מחושב |

## סתירות דרישה↔מימוש — עודכן 2026-07-24

1. ~~§6 "יעדים בתוך התחום"~~ — ✅ **נפתר (Phase 1)**: 12 domain-goals routes, `/goals*` compat, `DomainPrimaryGoalTile` מחובר. ADR-0021.
2. ~~404/Error באנגלית~~ — ✅ **נפתר**: תורגם לעברית+RTL (`__root.tsx`).
3. ~~restore לא מלא~~ — ✅ **נפתר (Phase 2)**: gym/home sessions + goals ב-`/trash`.

אין סתירות נותרות. אין קוד legacy מחוץ להיקף. שם התיקייה `expense-guard` מטעה (scaffold) אך אינו משפיע על קוד (פתוח — `open-tasks.md`).
