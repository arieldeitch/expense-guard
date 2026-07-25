# Change Log

## 2026-07-25 · התאוששות מריסטרט — route flattening + router test suite (Claude Code)

**רקע:** ריסטרט לא מתוכנן קטע עבודה לא מחויבת. הענף כבר היה מסונכרן ל-`origin` ב-`5af65bd` לפני הריסטרט (push ב-10:01), כך שההיסטוריה המחויבת לא הייתה בסיכון — רק העבודה שבדיסק.

- **wip `6fb22c3`** · freeze commit: הקפאת כל העבודה הלא-מחויבת כפי שנמצאה, לפני כל תיקון (10 renames, routeTree, harness + 3 test files, devDeps, vitest include).
- **checkpoint `da20f72`** · **fix(routing)** · שיטוח 14 route modules נוספים ל-`*.index.tsx` (ADR-0025). התגלה שקובץ route עם ילדים בשם הופך אוטומטית ל-layout parent; אף route פרט ל-`__root.tsx` אינו מרנדר `<Outlet />`, כלומר אף אחד מהם לא נועד להיות layout. **סה"כ 24 route modules שוטחו.** `routeTree.gen.ts` מכיל כעת רק `RootRouteChildren`. **כל ה-URLs, ה-redirects וה-compat routes נשמרו** (הגנרטור מייצר גם `/x` וגם `/x/`).
- **checkpoint `da20f72`** · **test fixtures** · `src/test/fixtures.ts` — builder מלא ותקף ל-`RunSessionInput`; תיקן שגיאת typecheck **ללא** `any`/cast/`@ts-ignore`. harness: דריסת `scrollTo`/`scrollBy`/`scrollIntoView` ללא תנאי (jsdom מגדיר אותם אך הם זורקים), בידוד מלא של 8 stores, teardown מפורש ל-router/queryClient, `defaultPreload: false`.
- **fix(testing)** · פיצול `systemErrors.test.tsx` לפי תחומי אחריות ל-`systemScreens` / `runningRouteLoaders` / `catalogRouteLoaders` (ADR-0026). `test:router` = רצף `&&` מפורש, קובץ אחד לכל תהליך Vitest. `test:unit` = `src/lib`. `test` = שניהם. **ללא dependency חדשה, ללא custom runner, ללא force-exit, ללא הפחתת כיסוי.**
- **verify** · typecheck ✅ exit 0 · `test:unit` **162/162** (12 קבצים) ✅ · `test:router` **38/38** (5 קבצים) ✅ · `bun run test` ✅ exit 0 · eslint (ללא prettier) **0 errors, 8 warnings** ✅ · build ×2 ✅ · `git diff --exit-code -- src/routeTree.gen.ts` ✅ ריק.
- **סיכון חדש:** R-20 — hang מצטבר ב-Vitest/jsdom בקובץ router-test גדול. **P2, לא חוסם.**
- ללא backend/Supabase/Auth/RLS/CI-CD (לא קיימים בריפו) · ללא המרת CRLF גורפת (R-17) · **ללא push, ללא deploy, ללא עלות חדשה**.

## 2026-07-25 · Phase 1+2 finalize — domain isolation guard + regressions (Claude Code)

- **fix(goals)** · אכיפת cross-domain isolation: helper טהור `goalMatchesDomain(goal, domain)` ב-`goalDomainConfig.ts`; guard ב-`GoalDetailView` (קיים, הועבר ל-helper) וב-`GoalForm` **edit mode** — יעד ששייך לתחום אחר לא ניתן לעריכה במסלול (מונע מעבר domain שקט). מקור האמת ל-domain הוא הישות, לא ה-route/param.
- **tests** · +4 (סה"כ **162/162**): goalMatchesDomain cross-domain, updateGoal לא משנה domain, primary selection מחריג archived/trashed, restore שומר domain+linked ids ולא יוצר קשר שקרי (dependency חסרה) ללא כפילות.
- **verify** · baseline טרי: typecheck ✅ · test 162/162 ✅ · lint 0 errors/8 warnings ✅ · build ✅ · routeTree יציב (build×2 ללא diff; committed==generated; 12 domain-goals רשומים).
- ללא שינוי routes/routeTree · ללא backend/dep חדש · ללא push.

## 2026-07-24 · Phase 1+2 — Domain-scoped goals + Trash/Restore (Claude Code)

**Phase 1 — goal surfaces scoped to domains (החלטת מוצר מאושרת: אין מסך יעדים גלובלי).**
- **חדש** · `src/components/goals/`: `goalLinks.tsx` (Link/redirect helpers type-safe פר-domain), `goalDomainConfig.ts` (labels), `GoalForm.tsx` (יצירה+עריכה, domain נעול → סוגי יעד מוגבלים לתחום), `GoalsListView.tsx`, `GoalDetailView.tsx`, `GoalDomainChooser.tsx`.
- **חדש** · 12 route modules: `{running,gym,home}.goals[.new|.$id|.$id.edit].tsx` — כל route מציג/יוצר/עורך רק יעדי התחום שלו.
- **compat** · `/goals`, `/goals/new`, `/goals/$id` הומרו ל-compatibility redirects: `?domain=` → redirect לתחום; ללא domain → בחירת 3 אריחים; `/goals/$id` → redirect לפי `goal.domain`, יעד חסר → 404 עברית. אין קישור גלובלי בניווט.
- **wiring** · `DomainPrimaryGoalTile` חובר ל-`/running`,`/gym`,`/home` (הוחלף מקטע ה-goals הישן ב-gym שהתבסס על façade ריק). קישורי האריח → routes תחומיים.
- **route-gen fix** · תוקן drift של `routeTree.gen.ts` (R-19): 4 routes (`exercises.$id`,`locations.$id`,`running.$id`,`running.new.$type`) עברו מ-`Route.useLoaderData()` ל-`Route.useParams()` (loaders + notFound guards נשמרו; ערכים זהים). generation כעת דטרמיניסטי ו-typecheck ירוק.
- **script** · נוסף `"typecheck": "tsc --noEmit"` ל-package.json.

**Phase 2 — trash/restore הושלם ל-3 ישויות.**
- **lib** · `listTrashedSessions`+`useTrashedSessions` (sessions), `useTrashedHomeSessions` (home), `useTrashedGoals` (goals).
- **`/trash`** · 3 מקטעים חדשים: אימוני חדר כושר, אימוני בית, יעדים — שחזור דו-שלבי (`ConfirmDialog`).
- **delete-to-trash** · אימון בית: כפתור "מחק לסל" (2-step) ב-summary. יעד: אישור לפני מחיקה ב-`GoalDetailView`. gym כבר היה קיים.
- **recompute** · restore דרך `commit()` → subscribers → analytics/records/summaries/goal-progress מחושבים מחדש מ-raw (ארכיטקטורת `useSyncExternalStore`).

**i18n + hygiene.**
- `__root.tsx` — 404 + error boundary תורגמו לעברית + RTL + `role="alert"`/`aria-live` + focus.
- נוסף `.gitattributes` (LF; ללא renormalize גורף — R-17).
- lint hook false-positive (`goals.new.tsx`) נפתר ע"י named component (ללא disable).

**בדיקות** · +8 (סה"כ **158/158**, 12 קבצים): domain scoping, type restriction, edit, getPrimaryGoal, trash/restore ל-3 ישויות + no-duplicate + source recompute.
**checks** · typecheck ✅ · lint 0 errors/8 warnings (shadcn) · build ✅ · routeTree דטרמיניסטי (build×2 ללא diff).

## 2026-07-24 · Product Alignment Audit (Claude Code)

- **audit** · בוצע audit מלא ללא שינוי פונקציונלי. מופו 41 route modules, ~40 ישויות ב-9 תחומי `src/lib`, App Shell, design system, שכבת נתונים, ואבטחה.
- **docs (חדשים)** · `route-inventory.md`, `entity-inventory.md`, `design-system-audit.md`, `product-alignment-audit.md`, `migration-plan.md`, `claude-session-log.md`.
- **docs (עודכנו)** · `current-state.md` (reconciliation — הסרת טענות מיושנות "אין קוד"), `architecture.md` (מבנה בפועל `src/lib/<domain>` מול המתוכנן), `decisions.md` (ADR-0019 היררכיית מקורות אמת, ADR-0020 audit), `open-tasks.md` (Human Decisions Required), `risks.md` (R-17 CRLF, R-18 goals orphan), `test-plan.md` (עדכון סטטוס בדיקות אמיתי).
- **fix (בטוח)** · 4 שגיאות `prefer-const` (`analytics/exerciseHistory.ts:94`, `progress.ts:28`, `quality.ts:161-162`) — `let`→`const`, ללא שינוי התנהגות.
- **baseline** · `tsc --noEmit` נקי · `vitest` 150/150 (10 קבצים) · `build` עובר · `lint` — ראה R-17 (CRLF מקומי; על LF: 8 warnings + 1 error rules-of-hooks false-positive).
- **ממצא מפתח** · הפרויקט מיושר היטב עם הדרישות; רוב תחומי הליבה כבר בנויים (localStorage). אין קוד legacy (people/transport/roles/PIN/coach — כולם נעדרים). הפער המוצרי היחיד: משטח goals (`/goals` orphan מול "יעדים בתוך התחום"). שם התיקייה `expense-guard` מטעה — הקוד הוא אפליקציית כושר.

## 2026-07-30 · Strength history + analytics

- **analytics** · `src/lib/analytics/` — `formulas.ts` (רשם 1RM: Epley/Brzycki v1), `oneRM.ts` (שער כשירות דטרמיניסטי + `reason` לפסילה), `comparability.ts` (`compareSets` — פסילת חימום, יחידת משקל, פערי חזרות, snapshot תרגיל שונה), `volume.ts` (נורמליזציה ל־kg + `unilateral × 2`), `records.ts` (`detectSessionRecords` עם baseline לאימון ראשון של תרגיל), `quality.ts` (Workout Quality Score מרובה־רכיבים עם נירמול הרכיבים שנעדרים ורשימת excluded), `progress.ts`, `sessionHistory.ts`, `sessionComparison.ts`, `muscleLoad.ts`, `chartData.ts`, `time.ts`.
- **ui** · `src/components/analytics/MiniLineChart.tsx` (SVG מקורי נגיש), `MetricSelector.tsx`, `SessionHistoryTile.tsx`, `QualityBreakdown.tsx` (רכיבים + מוחרגים + תווית תיאורית), `HistoryFiltersSheet.tsx`, `ExerciseHistoryPanel.tsx`.
- **routes** · `/gym/history` (רשימת אריחים + סינון/מיון ב־Sheet), `/gym/history/$id` (סיכום + השוואה לאימון קודם + Quality breakdown), `/gym/compare` (בחירת שני אימונים והשוואת מדדים), `/exercises/$id/history` (מגמות תרגיל עם `MiniLineChart` + `MetricSelector`).
- **integration** · `/gym` → אריח היסטוריה פעיל (לינק ל־`/gym/history`). `/sessions/$id/summary` → כרטיס Quality Breakdown + לינק "השווה לאימון קודם" (`/gym/compare?a=<id>`) + לינק להיסטוריה + PRs אמיתיים בלבד (baseline לא נספר). `/exercises/$id` → `ExerciseHistoryPanel` במקום EmptyState.
- **docs** · `docs/ai/metrics-strength.md` — מקור אמת לכל הנוסחאות, תנאי כשירות, וכללי השוואה.
- **checks** · `bunx tsgo --noEmit` נקי, `bunx vitest run` 119/119 (25 חדשים לאנליטיקה: נוסחאות, כשירות 1RM, comparability, volume, records+baseline, quality נירמול, session comparison, exercise summary).



## 2026-07-29 · Strength Templates + Sessions skeleton

- **data** · `src/lib/templates/` — `types.ts`, `repo.ts`, `storage.ts`, `hooks.ts`, `versions.ts`, `duration.ts`, `muscleLoad.ts`, `compatibility.ts`, `schemas.ts`, `defaults.ts` (3×12, 90s rest), `labels.ts`, `index.ts`. מודל שלוש־שכבתי: `WorkoutTemplate` → `WorkoutTemplateBlock` (single / superset / circuit) → `WorkoutTemplateExercise`. Soft-delete, ארכוב, שכפול (parent_template_id), versioning עם snapshot מלא.
- **sessions** · `src/lib/sessions/` — שלד `startSessionFromTemplate` השומר snapshot קפוא של התבנית ומעלה `usage_count`. עריכה מאוחרת בתבנית לא משנה sessions קיימים.
- **ui** · `src/components/templates/TemplateTile.tsx`, `ExercisePickerSheet.tsx` (בחירה מרובה + יצירת סופרסט מיידית), `TemplateBlockCard.tsx` + `TemplateExerciseRow.tsx` (עורך בלוקים, שינוי סדר בכפתורים בלבד — ללא swipe), `TemplateSummary.tsx` (סיכומי משך משוער, עומס שרירים, אזהרות ציוד חסר במיקום).
- **routes** · `/templates` (טאבים: פעילות / ארכיון / סל), `/templates/$id`, `/templates/$id/edit` (Autosave), `/templates/$id/history` (גרסאות), `/sessions/$id` (שלד מעבר לאימון פעיל). כל route עם `head()` ייחודי.
- **integration** · `/gym` מציג ספירת תבניות + קישור פעיל, `/more` — קישור לתבניות, `/trash` — סעיף שחזור תבניות.
- **checks** · `bunx tsgo` נקי, `bunx eslint --fix` 0 errors (8 warnings shadcn baseline בלבד), `vitest` 94/94 (17 חדשים למודול תבניות + snapshot immutability).



## 2026-07-26 · Catalog UI — Locations / Treadmills / Equipment / Trash

- **routes** · `src/routes/locations.tsx` (רשימת מקומות + חיפוש + סינון visibility), `src/routes/locations.$id.tsx` (טאבים: ציוד / הליכונים + פילטרים אנכיים + קישור עריכה + `notFound`), `src/routes/trash.tsx` (שחזור פר־ישות עם אישור כפול). `head()` ייחודי לכל route + og.
- **tiles** · `src/components/catalog/LocationTile.tsx`, `TreadmillTile.tsx`, `EquipmentTile.tsx` — אריחים במובייל, פעולות ב־Popover (2 קליקים לפחות), badges למועדף / ברירת מחדל / ארכיון / סל.
- **filters** · `src/components/catalog/EquipmentFiltersSheet.tsx` — Sheet אנכי (ללא chips אופקיים) לפי sinning types × availability × favorites × visibility.
- **more** · `src/routes/more.tsx` — הפעלת קטלוג פעיל: קישור למקומות, קישור לסל מחזור עם counter, הסרת הפריטים "בקרוב" הרלוונטיים.
- **soft-delete** · `trash` / `restore` / `archive` / `unarchive` דרך repo קיים; היסטוריה נשמרת.
- **checks** · `bunx tsgo` נקי, `bun run lint` 0 errors, `vitest` 18/18.



## 2026-07-25 · Design System + Shell

- **design** · `src/styles.css` — מערכת טוקנים מלאה: semantic + domain (run/gym/home/goal) + status (success/warning/info) + shadows + fonts + utilities. Dark-tinted background עם gradient עדין. ADR-0014 עד ADR-0018.
- **fonts** · Heebo נטען דרך `<link>` ב־`__root.tsx` (לא `@import` ב־CSS).
- **shell** · `src/components/shell/AppShell.tsx`, `Nav.tsx` (BottomNav mobile + SideNav desktop), `PageHeader.tsx` (PageHeader + SectionHeader RTL-safe), `EmptyState.tsx` (קומפקטי).
- **tiles** · `src/components/tile/Tile.tsx` — cva variants (default/run/gym/home/goal/warning/success/info) × tones (outline/soft/solid) × sizes (sm/md/lg) + `TileLabel` / `TileMetric` / `TileFootnote` / `TileTrend`.
- **routes** · `src/routes/index.tsx` (home dashboard עם 3 domain tiles + weekly overview + quick actions), `running.tsx`, `gym.tsx`, `home.tsx`, `more.tsx` — כולם על `AppShell`, כולם עם `head()` ייחודי + og tags.
- **root** · `<html lang="he" dir="rtl">`, meta מוצריים במקום ברירות Lovable, theme-color, viewport-fit=cover.
- **docs** · עדכון `current-state.md`, `decisions.md` (ADR-0014..0018), `architecture.md`, `open-tasks.md`, `risks.md`, `test-plan.md`.
- **tests** · typecheck נקי, lint 0 errors, visual QA ב־Playwright (mobile 390×844 + desktop 1280×900) ל־5 המסכים. אין horizontal overflow.

## 2026-07-24 · Scan + docs bootstrap

- **docs** · נוצר `docs/ai/` — product-requirements, product-overview, current-state, architecture, data-model, decisions (ADR-0001..0013), open-tasks, risks, benchmark, prompts, change-log, test-plan.
- **docs** · `AGENTS.md` הורחב עם הנחיות מחייבות.
- **scan** · תבנית ריקה של Lovable/TanStack Start. אין קוד מוצרי, אין שגיאות build/lint/typecheck.
- **no code changes** · לא נמצאו imports שבורים / typos / TS errors לתקן.

## מסך ביצוע אימון כוח פעיל
- הרחבת מודלים ב-`src/lib/sessions/` (Session/Exercise/Set), autosave ל-localStorage, טיימר מבוסס timestamp.
- `hooks.ts`: `useSession`, `useSessionBlocks`, `useSessionExercises`, `useExerciseSets`, `useSessionVolume`, `useLiveSessionDuration`, `useRestTimer` + `startRestTimer/adjust/stop`.
- חישובים ב-`calculations.ts`: נפח (kg), סטים completed, PRs מול היסטוריה, previous performance, data completeness.
- רכיבי UI ב-`src/components/session/`: `NumberField`, `SetRow`, `ExerciseCard`, `RestTimer`.
- מסלולים: `/sessions/$id` (ביצוע פעיל), `/sessions/$id/summary` (סיכום עובדתי), `/gym/new` (בחירת מקור: ריק / תבנית / שכפול).
- באנר "אימון פעיל" ב-`/gym` המפנה חזרה למסך הביצוע.
- Typecheck נקי, Lint נקי (למעט אזהרת react-refresh קיימת ב-`toggle.tsx`), 94/94 בדיקות עוברות.

## 2026-08-XX · Home Strength Module

- **data** · `src/lib/home/` — `types.ts`, `storage.ts` (localStorage + subscribers), `repo.ts`, `metrics.ts` (mean/median/CV-based stability + Home Quality Score), `records.ts` (baseline-aware PR detection: top reps in set, total reps, longest hold), `hooks.ts`, `seed.ts`, `index.ts` barrel.
- **models** · `HomeSession` / `HomeExerciseEntry` (with `snapshot` for exercise substitution history) / `HomeExerciseSet` (reps/time/tempo/side/added_weight/assistance/round). Home templates: `HomeTemplate` + `HomeTemplateEntry` + versions. Soft-delete throughout (`deleted_at`).
- **ui** · `src/components/home/` — `RepStepper` (−1/+1/+5 rapid entry), `HoldTimer` (timestamp-based), `HomeSetRow` (unified reps/time/side with per-set variance), `HomeSessionTile`, `HomeSessionTileWrapper`, `HomeTemplateTile`.
- **routes** · `/home` launchpad עם recent + templates + quick actions; `/home/quick` picker; `/home/quick/$exerciseId` shortcut; `/home/sessions/$id` execution; `/home/sessions/$id/summary` factual summary עם PRs + Quality Breakdown; `/home/history` filterable list; `/home/history/$id` redirect; `/home/templates` library; `/home/templates/$id` details; `/home/templates/$id/edit` full editor (reorder, per-entry sets/reps/hold/rest/added_weight, save version, launch session).
- **behavior** · Autosave on every mutation; per-set independent reporting (no forced identical reps); exercise substitution snapshot; skipped-set exclusion from totals; factual language (no cheerleading).
- **tests** · `src/lib/home/__tests__/home.test.ts` — 20 tests (metrics, repo lifecycle, quick entry, substitution, templates, PR baseline behavior, quality score).
- **checks** · `bunx tsgo` נקי; `vitest` 139/139 עוברות (9 test files).

## Goals module — 2026-07-24
- `src/lib/goals/`: types, catalog (26 goal types × 3 domains), calculation (deterministic, formula v1), repo (CRUD + status transitions + versions + snapshots + activity links), hooks (useGoalProgress computes from live runs/sessions/home data), storage (localStorage + subscribers).
- `src/components/goals/DomainPrimaryGoalTile.tsx`: reusable tile with progress bar + primary goal selection.
- `src/routes/goals.tsx`, `goals.$id.tsx`, `goals.new.tsx`: list + filter + create form + detail (progress, projection, manual current, snapshots, versions, lifecycle actions).
- Tests: 11 new (150 total passing). Typecheck + build clean.
- Notes: is_primary is single-per-domain; material field changes bump version + write GoalVersion; snapshots append-only; event goals show days-remaining only (no % progress).
