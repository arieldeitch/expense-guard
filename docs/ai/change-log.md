# Change Log

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
