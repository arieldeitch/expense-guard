# Open Tasks — Backlog

מסודר לפי עדיפות. **אין להוסיף** משימות מחוץ להיקף ב־`product-requirements.md` בלי לעדכן קודם את הדרישות.

> ⚠️ **הסעיפים העליונים גוברים.** הסעיפים מ-"עדכון 2026-07-25 — הושלמו בשלב Design System + Shell" ומטה הם **רשומה היסטורית** ומכילים פריטים שכבר נסגרו. במקרה של סתירה — הסעיף העליון קובע. (סומן ב-Recovery Audit, 2026-07-30.)

---

## 🎯 הפעולה הבאה (עודכן 2026-07-31 (ב), אחרי אימות End-to-End בדפדפן)

> ✅ **האפליקציה אומתה בריצה ב-2026-07-31** — כל זרימות הליבה (בית · כוח · ריצה · גיבוי) עברו מקצה לקצה בדפדפן אמיתי, 0 שגיאות console, 0 גלישה ב-360px. **מוכנה לשימוש יומיומי על מכשיר יחיד** ברגע שיבוצע הגיבוי שבסעיף 0.

### 0. 🔴 חוסם — פעולה ידנית של המשתמש (לא ניתנת לביצוע ע"י סוכן)
**ייצוא גיבוי בפועל.** לפתוח `/backup` בגרסת `main` המאומתת, לייצא, ולשמור את הקובץ **מחוץ לאחסון הדפדפן** (מכשיר נפרד או תיקייה מגובה). עד אז R-22 פתוח בפועל — **יכולת גיבוי אינה גיבוי**. זו הפעולה הבאה היחידה שבאמת חוסמת.

### 1. ✅ **תיקון R-24 — בוצע (2026-07-31)**
נסגר על `main`. `REFERENCE_RULES` משתמש ב-`home_session_id` · נוסף כלל `home.sets → home.entries` על `entry_id` · דילוג ה-`parents.size === 0` הוסר · גיבוי תקין ממשיך לעבור ולייבא (רגרסיה מפורשת) · קובץ שבור מייצר `dangling_reference` ואינו נכתב. backup 14 → **21** בדיקות. ADR-0037.
בנוסף תוקן באג שהתגלה תוך כדי: `deriveDependencyOrder` הסיק `true` מקובץ שביצע אפס פעולות (readiness 29 → **31**).

### 2. 🟡 החלטת מוצר פתוחה — **R-25: מצב ייבוא "דלג על השבורים"**
- **הבעיה:** אחרי ADR-0037 קובץ עם ולו הפניה שבורה אחת נדחה **כולו**. משתמש שזה הגיבוי היחיד שלו לא יכול לחלץ ממנו כלום.
- **הצעה:** מצב ייבוא `merge_skip_broken` — **opt-in מפורש בלבד, לעולם לא ברירת מחדל** — שמייבא את התקין, מדלג על השבור, ומציג דוח מלא של מה נשמט.
- **Scope צפוי:** `src/lib/backup/repo.ts` + `src/lib/backup/types.ts` + מסך `/backup` + בדיקות.
- **החלטה אנושית נדרשת לפני התחלה?** **כן** — זו תוספת UI ומדיניות ייבוא, לא תיקון באג.
- **עלות?** אין.

### 3. 🟡 נפתחו באימות של 2026-07-31 — לא חוסמים
- **R-28 — טיוטות ריצה יתומות.** כניסה ל-`/running/new/outdoor` יוצרת רשומת `draft` **מיד**; נטישת המסך משאירה טיוטה ריקה בהיסטוריה. נצפו 2 בפועל. תיקון = ליצור בשמירה הראשונה, או לנקות טיוטות ריקות ביציאה. **החלטת מוצר.**
- **R-26 — `/sessions/$id/summary`** מדפיס שגיאת שרת (`notFound()` ב-SSR) ונופל ל-client rendering. עובד; העלות היא רעש ביומן. תיקון = כיבוי SSR למסלול.
- **R-27 — `exercises`/`catalog` לא מגודרים ב-hydration** במכוון (הקטלוג מזורע בשרת). פער צר שמופיע רק אחרי התאמה אישית של הקטלוג.
- **שאלה ארכיטקטונית פתוחה:** האם בכלל להשאיר SSR? לשרת אין ולא יהיו נתונים (localStorage בלבד), ולכן SSR מרנדר קליפה ריקה בכל מסך נתונים. כיבוי SSR היה מייתר את R-26, R-27 ואת רוב ADR-0039. **דורש החלטה מפורשת — משנה התנהגות deploy.**

### 4. ❄️ לא בסשן הזה — מסלול B (Supabase אמיתי, R-23)
דורש **Approval Brief** לפי `CLAUDE.md` — יוצר פרויקט ועלות.

---

## 🗄️ מסלול A — בטיחות נתונים מקומית (עודכן 2026-07-26)

- [x] ✅ **Export / Import / Restore מקומי** — `/backup`, מעטפת versioned, אימות, preview, snapshot לפני כתיבה. ADR-0031.
- [x] ✅ **כל 9 מודולי האחסון עוברים דרך `safeStorage`** ומדווחים כשל כתיבה. ADR-0032.
- [x] ✅ **התראת כשל כתיבה גלובלית** — `GlobalStorageBanner` ברמת `__root`; כשל בכל מודול גלוי בכל מסך, `memory_only`=`status`, `failed`=`alert`, קישור ל-`/backup`, התאוששות מסירה. 13 בדיקות render. ADR-0033.
- [x] ✅ **local schema version** — `fitlog:storage-meta`, `schema_version` 1.0.0. ADR-0033.
- [x] ✅ **migration registry** — `legacy -> 1.0.0`, idempotent, לא הרסנית, שומרת שדות לא מוכרים.
- [x] ✅ **snapshot ו-rollback לפני migration** — עם checksum, אימות קריאה, ומפתח נפרד מ-snapshot ה-Restore.
- [x] ✅ **חסימת future schema version** — גרסה גבוהה מ-1.0.0 אינה נוגעת בנתונים.
- [x] ✅ **Fake Supabase rehearsal** — `src/lib/migration/`: ענן מדומה בזיכרון, מפת 30 ישויות, סדר ייבוא טופולוגי, ownership מה-session המאומת, idempotency וקונפליקטים. **ללא Supabase, SDK, רשת, env או עלות.** 44 בדיקות. ADR-0034/0035.
- [x] ✅ **Readiness Gate** — `src/lib/readiness/`: 16 בדיקות ושני gates, **נגזרים מריצות אמיתיות** ולא מקבועים. שניהם `true`. 29 בדיקות. ADR-0036.
- [ ] 🔴 **Import אמיתי מול Supabase עם Auth/RLS** — **הפער העיקרי שנותר.** ה-rehearsal מוכיח את המודל, לא את המנוע: לא נבדקו RLS, FK constraints, טיפוסי עמודות, טרנזקציות ורשת. דורש **Approval Brief** (CLAUDE.md) כי הוא יוצר פרויקט/עלות.
- [x] ✅ **P1 — `REFERENCE_RULES` ב-`src/lib/backup/repo.ts` בדק שדה שאינו קיים — תוקן (2026-07-31).** השדה שונה ל-`home_session_id`, נוסף כלל `home.sets → home.entries` על `entry_id`, ודילוג ה-`parents.size === 0` הוסר (הוחלף בהבחנה בין אוסף הורים חסר לאוסף ריק). 7 בדיקות חדשות, כולל רגרסיה שגיבוי תקין ממשיך לעבור ולייבא. ADR-0037, R-24 נסגר.
  ⚠️ **שינוי התנהגות מכוון שנכנס לתוקף:** גיבויים עם הפניות שבורות שעברו עד היום **נפסלים כעת**. הנגזרת — אין מסלול "ייבא בכל זאת" — נפתחה כ-**R-25** ודורשת החלטת מוצר.
- [ ] 🟡 **`preferences` אינו ממופה לענן** — הוא singleton (שורת `profiles` אחת ממופתחת ב-user id) ולא אוסף מערכים, וה-pipeline הנוכחי עובד ברמת אוספים. מדווח במפורש כ-`deferred_entities` ולכן **אינו נבלע בשקט**. ההשפעה מוגבלת לשדה אחד (`landingModule`).
- [ ] 🟡 **גיבוי תלוי משמעת משתמש** — אין תזכורת ואין אימות שהקובץ נשמר מחוץ למכשיר. ראה R-22.

**מסלול A סגור לשימוש מקומי במכשיר יחיד ומוזג ל-`main`** (2026-07-26, merge commit `0e51653`). מה שנותר אינו חוסם שימוש יומיומי אלא מעבר לענן.

**⚠️ פעולה ידנית שנותרה למשתמש:** ליצור **Export ידני מתוך גרסת `main` המאומתת** דרך מסך `/backup`, ולשמור את הקובץ **מחוץ לאחסון הדפדפן** — רצוי במכשיר נפרד או בתיקייה מגובה. עד שזה יבוצע, R-22 נשאר פתוח בפועל.

---

## 🧑‍⚖️ Human Decisions Required (מ-Product Alignment Audit, 2026-07-24)

החלטות אלו **דורשות את המשתמש** — יש להן השפעה מוצרית/בלתי הפיכה. אין ליישם עד תשובה. (נושאים טכניים — שמות/מבנה/refactor — אינם כאן; מוכרעים אוטונומית.)

1. ~~**משטח goals**~~ — ✅ **פתור (Phase 1)**: יעדים לפי domain, `/goals*` compat redirects, אין מסך גלובלי. ADR-0021.
2. **פורמט ייבוא Suunto.** מנוע ה-raw readings קיים אך אין ייבוא קובץ. GPX / FIT / CSV / הזנה ידנית? — משפיע על תלות ספק (R-09). **פתוח.**
3. **תזמון Supabase/Auth.** האם/מתי להפעיל Lovable Cloud (יוצר פרויקט Supabase = עלות/משאב). דורש **Approval Brief** (CLAUDE.md). כרגע localStorage בלבד (ADR-0012). **פתוח.**
4. **שם הריפו/תיקייה `expense-guard`.** מטעה (הקוד אפליקציית כושר). rename משפיע על Lovable sync — האם לשנות? **פתוח.**
5. **גיזום shadcn לא בשימוש.** command/menubar/navigation-menu/sidebar/carousel/resizable/chart(recharts) — לאשר הסרה עתידית או להשאיר. **פתוח.**
6. ~~**restore חלקי**~~ — ✅ **פתור (Phase 2)**: gym/home sessions + goals מחוברים ל-`/trash` עם שחזור דו-שלבי.

---

## 🟠 Phase 1/2 — פערי אימות ורגרסיה (פתוחים; נדרש לסגור לפני phase הבא)

מבוסס על מצב ה-repo ב-2026-07-25 (HEAD `16f4444`). אלו פתוחים כי אין להם הוכחת completion אוטומטית (executable test), למעט מה שמצוין.

- [x] ✅ **domain-isolation ל-goals** — נאכף ע"י `goalMatchesDomain` (GoalForm edit + GoalDetailView) ובדוק ב-`domain-scope.test.ts` (cross-domain, updateGoal לא משנה domain, restore שומר domain).
- [x] ✅ **מניעת חציית תחום בעריכה / דריסת domain מה-route** — GoalForm חוסם עריכת יעד מתחום אחר; `listGoalTypesByDomain` מגביל סוגים; updateGoal שומר domain. נבדק.
- [x] ✅ **primary selection מחריג archived/trashed** — נבדק.
- [x] ✅ **restore שומר domain+links ולא יוצר קשר שקרי (dependency חסרה)** — נבדק.
- [x] ✅ **Router test harness** — `src/test/routerTestHarness.tsx`: memory router מול route tree האמיתי, loaders אמיתיים, בידוד stores + localStorage, teardown מפורש. `@testing-library/{react,jest-dom,user-event}` + `jsdom` נוספו כ-devDeps.
- [x] ✅ **בדיקות רגרסיה ל-4 ה-routes שתוקנו** (`exercises.$id`, `locations.$id`, `running.$id`, `running.new.$type`): loader רץ ו-`notFound()` על מזהה חסר — נבדק ב-`runningRouteLoaders.test.tsx` + `catalogRouteLoaders.test.tsx`.
- [x] ✅ **התנהגות 404 ברמת render** — `systemScreens.test.tsx` (404 root + error boundary, עברית/RTL/a11y) ו-`domainGoalRoutes.test.tsx` (guard cross-domain ב-detail וב-edit, 19 בדיקות).
- [x] ✅ **route layout nesting** (התגלה בהתאוששות 2026-07-25) — 24 route modules שוטחו ל-`*.index.tsx`; `__root.tsx` הוא ה-layout היחיד. URLs ו-compat routes נשמרו. ADR-0025.
- [x] ✅ **התאוששות מריסטרט** — freeze `6fb22c3`, checkpoint `da20f72`, סיום `a4d24e2`. **הושלמה ונדחפה.**
- [x] ✅ **Git push** של `feat/domain-alignment-and-restore` — **בוצע 2026-07-25**: `5af65bd..a4d24e2` (fast-forward, ללא force). הענף מסונכרן: **ahead 0 / behind 0**. *(PR עדיין לא נפתח — החלטת משתמש, לא חוסמת.)*
- [x] ✅ **`main` מסונכרן** — הפריט הישן (`main` מקדים ב-`eca9163`) **נסגר**: `eca9163` הוא ancestor של `main` לאחר המיזוג. `main` = `origin/main` = `0e51653`, ahead/behind 0/0.
- [ ] **הערת lint**: `bun run lint` נכשל מקומית עקב CRLF (R-17); הריצה האמיתית = `bunx eslint . --rule '{"prettier/prettier":"off"}'` → 0 errors, 8 warnings (shadcn). לשקול commit ייעודי ל-`git add --renormalize`. **פתוח.** *(בהתאוששות 2026-07-25 לא בוצעה המרת CRLF גורפת — במכוון.)*

### 🟡 Workout Execution — פערים שנותרו (לא חוסמים שימוש)

- [x] ✅ **Visual QA ברוחב 360px — נסגר 2026-07-31.** נמדד **בדפדפן אמיתי** (Chrome 150 headless דרך CDP, ללא dependency חדשה): `documentElement.scrollWidth` מול `clientWidth` ב-9 מסכים ברוחב 360px — `/`, `/home`, `/gym`, `/running`, `/more`, `/backup`, `/home/quick`, `/running/history`, `/home/history`. **בכולם `scrollW=360, clientW=360` — אפס גלישה אופקית.**
  ההחלטה המקורית (לא לזייף את הבדיקה ב-jsdom, שאינו מחשב layout) **נשמרה** — הבדיקה בוצעה במנוע layout אמיתי, לא ב-jsdom.
- [x] ✅ **RPE** — ממומש ונחשף בכל סט.
- [ ] **RIR ב-UI** — `StrengthSet.rir` קיים בחוזה ואינו נחשף במסך. משימת המשך; לא חוסם MVP.
- [ ] **שמירת מיקום גלילה בין ניווטים** — לא מומש. **אינו חוסם MVP.**
- [ ] **drag reorder לתרגילים** — `moveExercise` (מעלה/מטה) קיים ופעיל בתפריט; גרירה לא מומשה. **אינו חוסם MVP.**
- [ ] **בדיקת render לסיום חלקי** — חסומה ע"י R-21 (Radix Sheet ב-harness). ההתנהגות מכוסה ברמת repository; **R-21 הוא סיכון בדיקות נקודתי ואינו חוסם שימוש בפועל** (הרכיב עובד בדפדפן).

### 🔵 P2 — לא חוסם

- [ ] **Investigate cumulative Vitest/jsdom router test hang in a single worker lifecycle.**
  - **Reproduction:** לאחד מחדש את `systemScreens` + `runningRouteLoaders` + `catalogRouteLoaders` לקובץ אחד ולהריץ `bunx vitest run <file>` → hang, exit 124, `Worker exited unexpectedly`. (הקובץ המקורי `systemErrors.test.tsx` פוצל ואינו קיים.)
  - **מה כן עובד:** כל אחד מחמשת קובצי ה-router עובר ומסתיים בתהליך Vitest נפרד (38 בדיקות). תתי-קבוצות עם `-t` עברו תמיד.
  - **מה נשלל:** pool `forks` ו-`threads` — שניהם נתקעו. custom process runner קובץ-לתהליך — לא הסתיים דטרמיניסטית, הוסר.
  - **heap:** יציב ~90–130MB — לא OOM.
  - **סטטוס:** אינה חוסמת פיתוח; אין ראיה להשפעה מוצרית (תשתית בדיקות בלבד). **אין לטפל לפני משימות הליבה ללא ראיה להשפעה מוצרית.** ראה R-20 + ADR-0026.

---

## 🔴 Critical (חוסם התקדמות)

- [x] ✅ **Workout Execution screen** — `/sessions/$id`: סטים בפועל, **RPE**, מנוחה, סופרסטים, דילוג תרגיל, סיום מלא/חלקי, סטטוס שמירה אמיתי, מצב התאוששות. *(המסך היה קיים ומלא ברובו; באיטרציה זו נסגרו הפערים.)* **RIR עדיין לא נחשף ב-UI** (קיים בחוזה) — ראה למטה. ADR-0027/0028.
  - **תיקון תיעוד:** `WorkoutSessionSnapshot` **אינו קיים** בקוד. החוזה בפועל: `StrengthSession` → `StrengthSessionExercise` (+`StrengthSessionExerciseSnapshot`) → `StrengthSet`.
- [ ] הפעלת **Lovable Cloud** + מיגרציות (עדיין ב־localStorage בלבד).
- [ ] Auth flow (email+password, `_authenticated/route.tsx`).


## 🟠 High

- [ ] הפעלת **Lovable Cloud** (רק כשמוכנים לכתוב מיגרציה — לא לפני).
- [ ] מיגרציה #001: `profile` + auth trigger (יצירת profile אוטומטית ב־signup).
- [ ] Auth flow: מסך `/auth` עם email+password, `_authenticated/route.tsx` (integration-managed), logout מנוקה.
- [ ] Design tokens — צבעים, גבולות, radii, טיפוגרפיה — מותאמים RTL ועברית. **לא** להשאיר את oklch של shadcn כברירת מחדל למוצר.
- [ ] רכיב `Tile` בסיסי (מכיוון שאריחים = default UI pattern).
- [ ] רכיב `DeleteWithConfirm` (2-step, soft-delete flow).
- [ ] `audit_log` skeleton + helper לרישום שינויים.

## 🟡 Medium

- [ ] מיגרציה ראשונה לתחום שנבחר (למשל `strength_sessions` + `strength_sets` + `exercises`).
- [ ] queryOptions לפי entity ב־`src/lib/query-options/`.
- [ ] Validators (zod) משותפים ב־`src/lib/validators/`.
- [ ] "פריטים שנמחקו" — מסך שחזור פר-domain.
- [ ] Import של Suunto (הגדרת פורמט מקובל — GPX/FIT/CSV → החלטה).
- [ ] Empty states ו־loading states בכל query view.
- [ ] Vitest bootstrap + טסט ראשון (למשל: `Tile` render + a11y).

## 🟢 Future / כאשר יתאים

- [ ] Insights derived (חישוב שבועי/חודשי).
- [ ] AI suggestions (למשל: הצעת RPE יעד, החלפת תרגיל) — עם approval flow.
- [ ] Offline draft (form autosave ל־localStorage).
- [ ] Analytics אישי — dashboards גרפיים לתחום.
- [ ] Export דאטה (CSV / JSON) של כל מה שהמשתמש הזין.
- [ ] Media לתרגילים (Storage bucket פרטי + signed URLs).
- [ ] Playwright E2E לזרימות מרכזיות.

## ❄️ Icebox / דחוי במפורש

- מערכת משתמשים ציבורית, feed, מאמנים — **מחוץ להיקף** (`product-requirements.md`).
- Badges/gamification — **מחוץ להיקף**.
- מסך "היום" מרכזי בסגנון feed — **מחוץ להיקף**.

---

## עדכון 2026-07-25 — הושלמו בשלב Design System + Shell

- [x] RTL + i18n bootstrap (dir="rtl", lang="he", Heebo font).
- [x] מטא־דאטה של `__root.tsx` (Fit Log · אימונים אישיים).
- [x] החלפת placeholder ב־`/` (home dashboard עם 3 domain tiles).
- [x] Design tokens (`src/styles.css`).
- [x] רכיב `Tile` בסיסי + variants.
- [x] AppShell, BottomNav, SideNav, TopBar, PageHeader, SectionHeader, EmptyState.
- [x] Routes: `/`, `/running`, `/gym`, `/home`, `/more` — כולם עם head() ייחודי.

## עדיפויות עדכניות

### 🔴 Critical
- [ ] **החלטה: מאיזה תחום להתחיל את הבנייה המלאה?** ריצה / חדר כושר / בית.
- [ ] מסך `/auth` (login + password) — לפי `product-requirements.md` §4, ADR-0004.

### 🟠 High
- [ ] הפעלת **Lovable Cloud** + מיגרציה #001 (`profile` + trigger).
- [ ] `_authenticated/route.tsx` — integration-managed gate.
- [ ] `DeleteWithConfirm` (2-step soft-delete flow).
- [ ] `audit_log` helper.
- [ ] `Toaster` (sonner) ב־root — לכל notification עתידי.

### 🟡 Medium
- [ ] queryOptions לפי entity ב־`src/lib/query-options/`.
- [ ] Validators (zod) משותפים ב־`src/lib/validators/`.
- [ ] מסך "פריטים שנמחקו" פר-domain.
- [ ] Import Suunto (GPX/FIT/CSV — החלטה).
- [ ] Vitest bootstrap + טסט ראשון ל־`Tile`.

### 🟢 Future
- [ ] Insights derived, AI suggestions (עם approval flow), offline draft, analytics dashboards, export CSV/JSON, media לתרגילים, Playwright E2E.

### 🏠 תוכניות בית — מצב 2026-07-25

- [x] ✅ **פישוט בחירת תרגילים** — picker חדש: אחרונים → מועדפים → 6 קבוצות בשפת משתמש, חיפוש he/en, פילטר ציוד פשוט, בחירה מרובה, תרגיל מותאם באותו גיליון. ADR-0029.
- [x] ✅ **קטלוג curated** — 34 תרגילים (מתוך מאגר של 51). IDs קיימים לא שונו.
- [x] ✅ **יצירה ועריכה במסך אחד** — `/home/templates/$id/edit` (כבר היה כך; נשמר).
- [ ] **עריכת ערכי entry inline** — קיימת דרך `NumberField` במסך העריכה; **טרם נבדקה ב-render test**. לא חוסם.
- [ ] **Undo להסרת תרגיל** — כרגע הסרה ישירה (soft-delete ב-repo). לשקול Undo קצר.
- [ ] **Visual QA ב-360px** למסך התוכנית וה-picker — כמו במסך Workout Execution, **לא אומת**.

### 🔴 מוכנות נתונים — דורש החלטת משתמש (R-22, ADR-0030) — ⛔ **חלקית Superseded (2026-07-30)**

- [x] ✅ **A. שימוש מקומי בטוח** — **נבחר, בוצע ומוזג ל-`main`** (merge `0e51653`, 2026-07-26). export/import JSON + כל 9 מודולי ה-storage מדווחים כשל כתיבה. ללא עלות. אומת מחדש 2026-07-30.
- [ ] **B. חיבור Supabase מלא** — Auth + RLS + migrations. **דורש Approval Brief.** עדיין פתוח (R-23).

### 💾 מסלול A — גיבוי מקומי (2026-07-25) — ⛔ **Superseded (2026-07-30)**

> ⛔ **הסעיף הזה מיושן ונשמר כרשומה היסטורית בלבד.** ארבעת הפריטים הפתוחים שלמטה
> (כשל כתיבה ב-7 מודולים · migration framework · Fake Supabase rehearsal · בדיקות UI
> ל-Export/Restore) **נסגרו כולם ב-2026-07-26** — ראה הסעיף "מסלול A — בטיחות נתונים
> מקומית" בראש המסמך, שהוא הקובע. אומת ב-Recovery Audit 2026-07-30:
> 9/9 מודולי אחסון מדווחים כשל · `src/lib/storage/migrations.ts` קיים (34 בדיקות) ·
> `src/lib/migration/` קיים (44 בדיקות) · `globalPersistenceWarning.test.tsx` (13 בדיקות render).

- [x] ✅ **Export JSON versioned** עם validation, counts ו-checksum.
- [x] ✅ **Import/Restore** עם preview, snapshot אוטומטי ומדיניות קונפליקטים מפורשת.
- [x] ✅ **Round-trip מאומת** — אותם IDs, קשרים, ערכים, סדר ו-checksum.
- [x] ✅ **Idempotency** — ייבוא חוזר ללא כפילויות.
- [x] ✅ **חוזה הגירה ל-Supabase** — `LOCAL_TO_SUPABASE_MIGRATION_CONTRACT.md`.
- [ ] 🔴 **טיפול בכשל כתיבה ב-7 מודולי storage** — רק `sessions` מדווח `PersistenceStatus`. השאר עדיין בולעים `catch {}`. **הפער המשמעותי ביותר שנותר.**
- [ ] **migration framework versioned + idempotent** — כרגע `schema_version` קיים במעטפת בלבד; אין framework למיגרציה של ה-state המקומי.
- [ ] **Fake Supabase rehearsal** (`InMemoryCloudRepository`) — טרם נכתב.
- [ ] **בדיקות UI ל-Export/Restore** — הלוגיקה מכוסה ברמת unit; מסך `/backup` טרם נבדק ב-render.
