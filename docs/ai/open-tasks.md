# Open Tasks — Backlog

מסודר לפי עדיפות. **אין להוסיף** משימות מחוץ להיקף ב־`product-requirements.md` בלי לעדכן קודם את הדרישות.

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
- [ ] **`main` המקומי מקדים את `origin/main` ב-commit אחד** (`eca9163` — docs של ה-audit) ולא נדחף. החלטת משתמש: לדחוף או להשאיר. **פתוח, לא חוסם.**
- [ ] **הערת lint**: `bun run lint` נכשל מקומית עקב CRLF (R-17); הריצה האמיתית = `bunx eslint . --rule '{"prettier/prettier":"off"}'` → 0 errors, 8 warnings (shadcn). לשקול commit ייעודי ל-`git add --renormalize`. **פתוח.** *(בהתאוששות 2026-07-25 לא בוצעה המרת CRLF גורפת — במכוון.)*

### 🟡 Workout Execution — פערים שנותרו (לא חוסמים שימוש)

- [ ] **Visual QA ברוחב 360px — חוב אימות פתוח.** התאמת 360px נבדקה **סטטית בלבד** (מבנה ו-CSS: grid/flex, `min-w-0`, `flex-wrap`, ללא רוחב קבוע). **אין לטעון שהקריטריון אומת** עד לבדיקה חזותית אמיתית בדפדפן או ב-Lovable Preview ברוחב 360px.
  **החלטה מפורשת:** **לא** להוסיף בדיקת `document.documentElement.scrollWidth` ב-Vitest/jsdom — jsdom אינו מחשב layout, ולכן בדיקה כזו **אינה מוכיחה** היעדר overflow והייתה יוצרת ביטחון שווא. **אין להוסיף Playwright / Cypress / dependency אחרת ללא אישור מפורש.**
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

### 🔴 מוכנות נתונים — דורש החלטת משתמש (R-22, ADR-0030)

- [ ] **A. שימוש מקומי בטוח** — export/import JSON + הרחבת `PersistenceStatus` ל-7 מודולי storage שעדיין בולעים כשל כתיבה. ללא עלות.
- [ ] **B. חיבור Supabase מלא** — Auth + RLS + migrations. **דורש Approval Brief.**

### 💾 מסלול A — גיבוי מקומי (2026-07-25)

- [x] ✅ **Export JSON versioned** עם validation, counts ו-checksum.
- [x] ✅ **Import/Restore** עם preview, snapshot אוטומטי ומדיניות קונפליקטים מפורשת.
- [x] ✅ **Round-trip מאומת** — אותם IDs, קשרים, ערכים, סדר ו-checksum.
- [x] ✅ **Idempotency** — ייבוא חוזר ללא כפילויות.
- [x] ✅ **חוזה הגירה ל-Supabase** — `LOCAL_TO_SUPABASE_MIGRATION_CONTRACT.md`.
- [ ] 🔴 **טיפול בכשל כתיבה ב-7 מודולי storage** — רק `sessions` מדווח `PersistenceStatus`. השאר עדיין בולעים `catch {}`. **הפער המשמעותי ביותר שנותר.**
- [ ] **migration framework versioned + idempotent** — כרגע `schema_version` קיים במעטפת בלבד; אין framework למיגרציה של ה-state המקומי.
- [ ] **Fake Supabase rehearsal** (`InMemoryCloudRepository`) — טרם נכתב.
- [ ] **בדיקות UI ל-Export/Restore** — הלוגיקה מכוסה ברמת unit; מסך `/backup` טרם נבדק ב-render.
