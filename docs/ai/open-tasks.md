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

- [ ] **בדיקות רגרסיה ל-4 ה-routes שתוקנו** (`exercises.$id`, `locations.$id`, `running.$id`, `running.new.$type`): לוודא שה-loader עדיין רץ ו-`notFound()` נזרק על מזהה חסר. **סטטוס נוכחי: לא נבדק ע"י טסט** — התנהגות נשמרה ב-source בלבד (הקוד לא נגע ב-loaders).
- [ ] **התנהגות מזהה לא-קיים/שגוי**: `/{domain}/goals/$id` עם id לא קיים; `/goals/$id` compat עם id חסר → 404 עברית. אין טסט executable כרגע.
- [ ] **`running.new.$type` נתמך/לא-נתמך**: `type=treadmill|outdoor` תקין; ערך אחר → `notFound()`. אין טסט executable.
- [ ] **בדיקות domain-isolation ל-goals ברמת route**: כניסה ל-`/running/goals/$id` עם יעד של gym → אסור להציג/לערוך (יש guard `goal.domain !== domain` ב-`GoalDetailView`, אך **ללא טסט**).
- [ ] **מניעת חציית תחום בעריכה**: `GoalForm` נעול ל-domain של ה-route; `listGoalTypesByDomain` מוגבל לתחום (נבדק ב-`domain-scope.test.ts`). מניעת **דריסת ה-domain שמסופק ע"י ה-route** — אין טסט ייעודי.
- [ ] **ראיות מלאות Typecheck/Lint/Test/Build** בתיעוד — קיימות מ-2026-07-25 (ראה `SESSION_HANDOFF.md`); לחזור ולהריץ בתחילת ה-session הבא לאימות.
- [ ] **Git push / PR** של `feat/domain-alignment-and-restore` — **לא בוצע** (ללא upstream). דורש החלטת משתמש/מדיניות (ראה `SESSION_HANDOFF.md`).
- [ ] **הערת lint**: `bun run lint` נכשל מקומית עקב CRLF (R-17); הריצה האמיתית = `bunx eslint . --rule '{"prettier/prettier":"off"}'` → 0 errors, 8 warnings (shadcn). לשקול commit ייעודי ל-`git add --renormalize`.

---

## 🔴 Critical (חוסם התקדמות)

- [ ] **Workout Execution screen** — מסך ביצוע האימון שקורא מ־`sessions.$id`: סטים בפועל, RPE/RIR, מנוחה, סימון סופרסט. Data contract כבר קיים (`WorkoutSessionSnapshot`).
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
