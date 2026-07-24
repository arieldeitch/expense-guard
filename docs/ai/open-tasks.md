# Open Tasks — Backlog

מסודר לפי עדיפות. **אין להוסיף** משימות מחוץ להיקף ב־`product-requirements.md` בלי לעדכן קודם את הדרישות.

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
