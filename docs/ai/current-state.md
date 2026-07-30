# Current State — מצב הפרויקט

תאריך עדכון: **2026-07-30** (Recovery Audit — התיעוד אומת מול הריפו)

---

## ✅ אימות מצב 2026-07-30 (Recovery Audit)

**Git:** `main` · HEAD **`daba93c`** · `main` = `origin/main` (0/0) · working tree נקי · אין stashes/tags/commits לא-דחופים · שני ה-feature branches מוזגו ומסונכרנים.

**כל הבדיקות הורצו מחדש על `main` והתוצאות זהות לתיעוד מ-2026-07-26:** typecheck exit 0 (גם אחרי build) · `test:unit` **305/305** (21 קבצים) · `test:router` **61/61** (10 קבצים) · migration 44 · readiness 29 · backup 14 · storage 34 · eslint **0 errors / 8 baseline warnings** · build exit 0 עם `routeTree.gen.ts` ללא שינוי.

**אומת בקוד:** `activeRepoKind === "mock"` · `CLOUD_ENTITIES` = 30 · `DEFERRED_MODULES = ["preferences"]` · **אין `@supabase`, אין `createClient`, אין `import.meta.env`/`process.env`, אין `.env`/secret ב-tracking, אין `supabase/`, אין CI** · 47 אזכורי "Supabase" ב-`src` הם הערות בלבד · 0 TODO/FIXME · 0 בדיקות מדולגות.

**תוקן בסשן זה:** ספירת ה-routes — היה כתוב **53**, בפועל **54 route modules** + `__root.tsx` (נוסף `backup.index.tsx` במסלול A ולא עודכן). מאושר מול `src/routes/` ומול `RootRouteChildren` ב-`routeTree.gen.ts`.

**החסם היחיד:** R-22 — **טרם נוצר קובץ גיבוי בפועל מחוץ לדפדפן.** פעולה ידנית של המשתמש.

---

## 🗄️ מוכנות נתונים (עודכן 2026-07-26) — **local בלבד, לא בסיס נתונים ענני**

| רכיב | מצב | ראיה |
|---|---|---|
| Supabase client | ❌ אין | אין import; אזכורים בקוד הם הערות בלבד |
| env contract | ❌ אין | אין `.env`; אין `import.meta.env`/`process.env` בקוד |
| Migrations (ענן) | ❌ אין | אין `supabase/` ואין `migrations/` |
| Auth / RLS | ❌ אין | אין מסך auth, אין policies |
| Active repository | `mock` | `activeRepoKind === "mock"` |
| Persistence | localStorage · 9 מפתחות `fitlog:*` | `catalog, exercises, goals, home, preferences, runs, sessions, suunto, templates` |
| שורד refresh | ✅ כן, במכשיר ובדפדפן הזה בלבד | — |
| Export | ✅ קיים | `/backup` · מעטפת `workout-data-system` 1.0.0 (ADR-0031) |
| Import / Restore | ✅ קיים | preview + snapshot לפני כתיבה + מדיניות קונפליקטים מפורשת |
| זיהוי כשל כתיבה | ✅ כל 9 המודולים | `safeStorage` + `reportWrite` (ADR-0032) |
| **תצוגת כשל כתיבה למשתמש** | ✅ **גלובלי, בכל מסך** | `GlobalStorageBanner` ב-`__root` — `memory_only`→`role="status"`, `failed`→`role="alert"` |
| **local schema version** | ✅ **1.0.0** | `fitlog:storage-meta` (ADR-0033) |
| **migration registry** | ✅ `legacy -> 1.0.0` | `src/lib/storage/migrations.ts` — idempotent, לא הרסנית |
| **snapshot לפני מיגרציה** | ✅ עם checksum ו-rollback | `fitlog:migration-snapshot` — נפרד מ-snapshot ה-Restore |
| **future schema version** | ✅ נחסם | גרסה גבוהה מ-1.0.0 → `future_version_blocked`, אין נגיעה בנתונים |
| **Fake Supabase rehearsal** | ✅ **עובר** | `src/lib/migration/` — ענן מדומה בזיכרון, 30 ישויות, 44 בדיקות (ADR-0034) |
| **Readiness Gate** | ✅ **נגזר מיכולות** | `src/lib/readiness/` — 16 בדיקות, 2 gates, 29 בדיקות (ADR-0036) |
| `ready_for_single_device_use` | ✅ **true** | נגזר מ-10 יכולות שהורצו בפועל |
| `ready_for_future_supabase_migration_contract` | ✅ **true** | נגזר מהאמור לעיל + ids/idempotency/סדר/בעלות/קונפליקטים |
| **Import אמיתי מול Supabase** | ❌ טרם | הפער העיקרי שנותר — דורש Auth/RLS ופרויקט אמיתי |
| העברה למכשיר אחר | 🟡 ידני בלבד | דרך קובץ Export/Import; אין sync |

**מסקנה:** שכבת האחסון המקומית **גרסאית, ניתנת לשחזור, וכשלי כתיבה גלויים**, והנתונים **הוכחו** כעומדים בחוזה ההגירה מול ענן מדומה. עדיין אין בסיס נתונים ענני, אין Auth/RLS ואין sync — העברה בין מכשירים היא ייצוא/ייבוא ידני, ונדרש מבחן Import אמיתי מול Supabase. ראה R-22, ADR-0030, ADR-0032, ADR-0033, ADR-0034, ADR-0035, ADR-0036.

## ⚠️ Reconciliation — Product Alignment Audit (2026-07-24)

> החלקים הישנים במסמך זה ("מה קיים בפועל" ואילך) **מיושנים** — הם מתארים מצב מוקדם של 5 routes ו"אין קוד לוגי". המצב האמיתי מתקדם בהרבה. להלן התמונה המאומתת. פירוט מלא: `route-inventory.md`, `entity-inventory.md`, `design-system-audit.md`, `product-alignment-audit.md`.

**מצב אמיתי (מאומת ע"י audit):**
- **54 route modules** + `__root.tsx` (`src/routes/`), 5 טאבים בניווט (`/`, `/running`, `/gym`, `/home`, `/more`), השאר deep-link. (41 מקוריים + 12 domain-goals מ-Phase 1 + `backup.index.tsx` ממסלול A.) **מאומת 2026-07-30** מול `src/routes/` ומול `RootRouteChildren`.
- **שכבת נתונים מלאה** תחת `src/lib/<domain>/` (לא `domain/data/application/features`): `runs`, `suunto`, `catalog`, `exercises`, `templates`, `sessions`, `home`, `goals`, `preferences`, `analytics`, `repo`, `hooks`, `selectors`.
- **Persistence = localStorage** (`fitlog:<domain>:v<n>`), **שורד refresh**. אין backend, אין Supabase, אין auth (במכוון). `activeRepoKind === "mock"`.
- **בדיקות (עודכן 2026-07-26): 366 עוברות** — `test:unit` **305/305** (21 קבצים, `src/lib`, סביבת node) + `test:router` **61/61** (10 קבצים, `src/test`, jsdom, כל קובץ בתהליך Vitest נפרד — ADR-0026).
- **Workout Execution (`/sessions/$id`) — פעיל ושמיש.** ביצוע אימון כוח: סטים בפועל (משקל/חזרות/זמן/**RPE**) בעריכה inline, השלמה/ביטול, הוספה/שכפול/דילוג סט, **דילוג על תרגיל שלם**, החלפת תרגיל, סופרסטים, rest timer, pause/resume, **סיום מלא או חלקי**, ו**סטטוס שמירה אמיתי** (`נשמר במכשיר` רק אחרי אישור ה-repository; אזהרה כשהנתונים בזיכרון בלבד). autosave מלא — האימון שורד refresh. ADR-0027/0028.
- **תיקון חוזה בתיעוד:** `WorkoutSessionSnapshot` **אינו קיים**. החוזה בפועל: `StrengthSession` → `StrengthSessionExercise` (+ `StrengthSessionExerciseSnapshot`) → `StrengthSet`. typecheck (`bun run typecheck`) נקי. build עובר. routeTree.gen.ts דטרמיניסטי. cross-domain isolation נאכף ע"י `goalMatchesDomain` (GoalForm edit + GoalDetailView) ובדוק **גם ברמת render דרך routes אמיתיים**.
- **route structure (עודכן 2026-07-25):** כל route module המשמש מסך עצמאי הוא `*.index.tsx`. **`__root.tsx` הוא ה-layout היחיד** (ה-`<Outlet />` היחיד בריפו); `routeTree.gen.ts` מכיל רק `RootRouteChildren`. ראה ADR-0025.
- שלושת התחומים בנויים במלואם: ריצה (חוץ/הליכון/Suunto/כיול/מסלולים), כוח (תבניות/סופרסטים/אימון פעיל/היסטוריה/analytics), בית (quick entry/סטים גמישים/תבניות). goals engine מלא (26 goal types).
- **אין קוד legacy** מחוץ להיקף (people/transport/roles/PIN/coach/clients/team — נעדרים). **אין secrets/service_role/network egress** (למעט Google Fonts).
- **goals surface (נפתר, Phase 1):** אין מסך יעדים גלובלי. יעדים מנוהלים בתוך כל תחום — 12 domain-goals routes + `DomainPrimaryGoalTile` מחובר ל-3 המסכים. `/goals*` נשמרו כ-compatibility redirects בלבד (לא בניווט). ראה ADR-0021 (פתור).
- **trash/restore (נפתר, Phase 2):** `/trash` מכסה כעת גם gym sessions, home sessions ו-goals (שחזור דו-שלבי). recompute אוטומטי דרך subscribers.
- **i18n:** 404/Error של `__root.tsx` תורגמו לעברית+RTL.
- **Git (מעודכן 2026-07-26, אחרי מיזוג מסלול A):** **`main` = `origin/main` = `0e51653`** — מיזוג **non-fast-forward** של `feat/home-plan-simple-flow` (`8470c4f`) לתוך `main` (`de4c996`). היסטוריית ה-feature נשמרה במלואה (ללא squash, ללא rebase, ללא force). אימות מלא הורץ **על `main` עצמו**: typecheck exit 0 · `test:unit` 305/305 (21 קבצים) · `test:router` 61/61 (10 קבצים) · `bun run test` exit 0 · eslint 0 errors / 8 baseline warnings · build ×2 exit 0 · typecheck אחרי build exit 0 · `routeTree.gen.ts` ללא diff. **לא בוצע deploy. אין Supabase/SDK/Auth/RLS/env/secret. לא נוספה dependency** (`package.json` שונה רק בסקריפטי בדיקות). ה-feature branch **לא נמחק**.
- **היסטוריית Git קודמת (2026-07-25):** **`main` = `origin/main` = `f33d00a`** — עודכן ב-**fast-forward** מ-`feat/domain-alignment-and-restore` (ללא merge commit) ונדחף ללא force. **`origin/main` הוא מקור האמת** לגרסה הנוכחית. אימות מלא הורץ על `main`: typecheck exit 0 · 216 בדיקות · eslint 0 errors / 8 baseline warnings · build ×2 · `routeTree.gen.ts` ללא שינוי. `eca9163` נשמר בהיסטוריה. ה-feature branch **לא נמחק**. **לא בוצע deploy.**
- **היסטוריה קודמת:** branch `feat/domain-alignment-and-restore`, **HEAD = `a4d24e2`**, **ahead 0 / behind 0** מול origin, working tree נקי. **ההתאוששות מהריסטרט הושלמה ונדחפה** — שלושת ה-commits `6fb22c3` (freeze) · `da20f72` (checkpoint) · `a4d24e2` (סגירת חסם הבדיקות) נדחפו ב-fast-forward `5af65bd..a4d24e2`. **לא בוצעו force push, merge או deploy.** `main` המקומי עדיין מקדים את `origin/main` ב-commit אחד ולא נדחף. פרטים מלאים: `SESSION_HANDOFF.md`.
- **אין Supabase / Auth / RLS / migrations / CI-CD / sync engine** בריפו (אומת 2026-07-25). Persistence = localStorage בלבד. אין קובצי `.env` ואין secrets.
- **הערה:** שם התיקייה `expense-guard` הוא scaffold מטעה — הקוד הוא אפליקציית כושר.

---

## עדכון אחרון — Home Strength Module

- `src/lib/home/` — data layer מלא: `types.ts`, `storage.ts`, `repo.ts`, `metrics.ts`, `records.ts`, `hooks.ts`, `seed.ts`, `index.ts`.
- מודלים: `HomeSession`, `HomeExerciseEntry` (+ `snapshot` להיסטוריית substitution), `HomeExerciseSet` (reps/time/tempo/side/added_weight/assistance/round), `HomeTemplate` + entries + versions. Soft-delete בכל הישויות.
- Repo תומך: quick entry (תרגיל יחיד), אימון מלא, autosave, החלפת תרגיל, שכפול/מחיקת סט, ארכוב/שחזור, סבבים (rounds), תבניות ביתיות + גרסאות + הפעלה מתבנית.
- Metrics: `stabilityFromReps` (CV-based), `homeQualityScore` (Completion 0.5 + Stability 0.3 + Data completeness 0.2), `summarizeSets` (avg/median/max/last-to-first ratio). ראה `docs/ai/metrics-home.md`.
- Records: baseline-aware (session ראשון = baseline, לא שיא): `top_reps_in_set`, `total_reps_in_session`, `longest_hold`, `top_reps_with_added_weight`.
- UI: `src/components/home/` — `RepStepper` (−1/+1/+5), `HoldTimer` (timestamp), `HomeSetRow`, `HomeSessionTile[Wrapper]`, `HomeTemplateTile`.
- Routes: `/home` (launchpad עם recent + templates + quick actions), `/home/quick`, `/home/quick/$exerciseId`, `/home/sessions/$id` (ביצוע), `/home/sessions/$id/summary` (עובדתי + PRs + Quality), `/home/history`, `/home/history/$id`, `/home/templates`, `/home/templates/$id`, `/home/templates/$id/edit` (עורך מלא).
- Behavior: Autosave על כל mutation; דיווח עצמאי לכל סט (חזרות שונות); substitution שומר snapshot; skipped סט לא נספר; שפה עובדתית.
- Tests: `src/lib/home/__tests__/home.test.ts` — 20 בדיקות. סה"כ **139/139** עוברות (9 קבצים).
- Typecheck נקי.

---

## סיכום קודם



## סיכום מנהלים

הפרויקט כולל: מערכת עיצוב + shell, Launchpad, קטלוג מקומות/הליכונים/ציוד, מודול ריצה מלא (כולל Suunto + כיול הליכונים), ספריית תרגילים (33 seed + מותאמים), ועכשיו **תבניות אימון כוח מלאות** (בלוקים / סופרסטים / גרסאות / snapshot) עם שלד `sessions` השומר snapshot קפוא לביצוע עתידי. עדיין ללא backend (הכל localStorage), ללא auth. המודול הבא: **מסך ביצוע האימון (Workout Execution)** שיקרא מ־`sessions.$id`.



## מה קיים בפועל

### Design System (חדש)
- **`src/styles.css`** — טוקנים מלאים ב־Tailwind v4 (`@theme inline`):
  - Semantic: `background`, `foreground`, `surface`, `surface-elevated`, `tint`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `border-strong`, `input`, `ring`.
  - Domain: `run`, `gym`, `home`, `goal` (כל אחד עם `-foreground` ו־`-soft`).
  - Status: `success`, `warning`, `info` (כל אחד עם `-foreground` ו־`-soft`).
  - Chart: `chart-1..5` ממופה לצבעי דומיין.
  - Font: `Heebo` נטען דרך `<link>` ב־__root, `--font-sans` + `--font-display`.
  - Shadows: `--shadow-tile`, `--shadow-elevated`, `--shadow-focus`.
  - Utilities: `tile-base`, `tile-interactive`, `safe-top`, `safe-bottom`, `scroll-none`.
- רקע: dark-tinted (`oklch(0.185 0.018 260)`) עם gradient עדין ברקע (primary + goal + run) — **אין רקע לבן דומיננטי**.
- ללא `.dark` block — האפליקציה dark-first בכוונה.
- Reduced motion: מכובד באופן גורף (`@media prefers-reduced-motion`).

### Shell / Navigation (חדש)
- `src/components/shell/AppShell.tsx` — מעטפת עם top bar אופציונלי, main container, bottom nav (mobile), side nav (desktop).
- `src/components/shell/Nav.tsx` — `BottomNav` (5 פריטים) + `SideNav`.
  - פריטים: ראשי · ריצה · חדר כושר · בית · עוד.
  - צבע פעיל לפי דומיין.
- `src/components/shell/PageHeader.tsx` — `PageHeader` + `SectionHeader` עם `grid-cols-[minmax(0,1fr)_auto]` (RTL-safe).
- `src/components/shell/EmptyState.tsx` — קומפקטי, ללא illustration.

### Tile primitives (חדש)
- `src/components/tile/Tile.tsx` — `Tile` (cva variants: default/run/gym/home/goal/warning/success/info × outline/soft/solid × sm/md/lg), `TileLabel`, `TileMetric`, `TileFootnote`, `TileTrend`.
- Selected state + disabled state + focus-visible מובנים.

### Routes
| Route | קובץ | סטטוס |
|---|---|---|
| `/` | `src/routes/index.tsx` | ✅ Home dashboard (3 domain tiles, weekly overview, quick actions, history empty state) |
| `/running` | `src/routes/running.tsx` | ✅ מסך תחום עם 4 metric tiles + empty states |
| `/gym` | `src/routes/gym.tsx` | ✅ מסך תחום עם 4 metric tiles + empty states |
| `/home` | `src/routes/home.tsx` | ✅ מסך תחום (בית + משקל גוף) |
| `/more` | `src/routes/more.tsx` | ✅ הגדרות, מקומות, סל מחזור, ייצוא, AI (כולם מסומנים "בקרוב") |

### __root.tsx
- `<html lang="he" dir="rtl">`.
- Meta: title="Fit Log · אימונים אישיים", theme-color, viewport-fit=cover, og/twitter tags.
- Heebo נטען מ־Google Fonts דרך `<link>` (לא `@import` ב־CSS).

### Framework / Build (ללא שינוי)
TanStack Start + Vite + React 19 + TS + Tailwind v4 + Bun. TanStack Query מותקן אבל טרם בשימוש בפועל.

### עדיין לא קיים
Auth, Supabase, `src/integrations/supabase/*`, `supabase/migrations/`, tests, forms, real data queries.

## מצב לפי מודול

| מודול | סטטוס | הערות |
|---|---|---|
| Routing | ✅ | 5 routes, כל route עם `head()` ייחודי |
| Root layout / providers | ✅ | RTL, Hebrew, dark-tinted, Heebo font |
| Design tokens | ✅ | מרוכזים ב־`src/styles.css` |
| Tile primitives | ✅ | variants + tones + sizes |
| Shell (top+bottom+side) | ✅ | responsive, RTL, safe-area |
| UI primitives (shadcn) | ✅ מוכן | 46 קבצים, נטמעים כשיידרשו |
| Empty states | ✅ | קומפקטי, ללא illustration |
| Auth | ❌ | טרם |
| Backend / DB | ❌ | Lovable Cloud טרם הופעל (ADR-0012) |
| Data model | ❌ | מתועד ב־`data-model.md`, לא ממומש |
| Forms / validation | ❌ | `zod` + `react-hook-form` מותקנים |
| i18n | 🟡 | עברית hard-coded בטקסטים (מקובל ל־single-user) |
| Tests | ❌ | להוסיף כשיהיה קוד עם לוגיקה |

## חסמים אמיתיים

1. **החלטה מוצרית פתוחה** — מאיזה תחום להתחיל את המימוש בפועל (ריצה / חדר כושר / בית).
2. **Lovable Cloud טרם הופעל** — יופעל כשמתחילים לכתוב מיגרציה ראשונה.

## סטטוס בדיקות (2026-07-24)

- ✅ `bunx tsgo --noEmit` — נקי.
- ✅ `bun run lint` — 0 errors (6 warnings בקבצי shadcn ui — לא משפיעים).
- ✅ Prettier — כל הקבצים מפורמטים.
- ✅ Visual QA (Playwright) — screenshots ב־390×844 (mobile), 1280×900 (desktop) לכל 5 המסכים. אין overflow אופקי. Bottom nav במקום, Side nav במקום ב־lg. פונטים נטענים, tiles בצבעי דומיין, gradient רקע עדין.

## מוכנות לשלב מסך הכניסה

✅ **מוכן.** יש מעטפת עקבית, טוקנים מרכזיים, ורכיבי בסיס. מסך `/auth` יבנה על AppShell (עם `topBar={{ back: false }}`) + `Tile` + input primitives של shadcn.
