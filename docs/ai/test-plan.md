# Test Plan

## סטטוס בפועל (מאומת 2026-07-24)

> **עדכון 2026-07-26 (בטיחות אחסון מקומי)** — הבדיקות מחולקות לשתי משפחות:
> - **`bun run test:unit`** → `vitest run src/lib` — **232 בדיקות, 17 קבצים**, סביבת `node` (קבצים בודדים מצהירים `jsdom` ברמת קובץ). יציב ומהיר.
> - **`bun run test:router`** → **רצף `&&` מפורש, קובץ אחד לכל תהליך Vitest** — **61 בדיקות, 10 קבצים**, סביבת `jsdom` (`// @vitest-environment jsdom` ברמת קובץ):
>   `systemScreens` (2) · `runningRouteLoaders` (4) · `catalogRouteLoaders` (2) · `domainGoalRoutes` (19) · `compatRoutes` (11) · `workoutExecution` (4) · `workoutExecutionEditing` (3) · `workoutExecutionAddSet` (1) · `homePlanPicker` (2) · **`globalPersistenceWarning` (13)**.
> - **`bun run test`** = `test:unit && test:router` → **293 בדיקות**, exit 0.
>
> **בטיחות אחסון מקומי — היכן נבדק מה:**
> - **`src/lib/storage/__tests__/safeStorage.test.ts` (11)** — סיווג כשלי כתיבה, registry, `getWorstStorageStatus`, התאוששות.
> - **`src/lib/storage/__tests__/localSchema.test.ts` (23)** — metadata (legacy / פגום / מבנה / השוואת גרסאות) · registry `legacy -> 1.0.0` (קריאת כל 9 המפתחות, parse, idempotency) · הרצה מלאה (metadata **רק** אחרי הצלחה, שדות לא מוכרים נשמרים, אין מחיקה, מכשיר ריק, no-op חוזר) · snapshot (שדות, checksum תקין, אינו דורס את snapshot ה-Restore, כשל ביצירה עוצר לפני שינוי) · rollback (החזרה מדויקת, כשל באמצע אינו משנה מקור ואינו כותב metadata) · חסימות (גרסה עתידית, אחסון לא זמין, payload שבור).
> - **`src/test/globalPersistenceWarning.test.tsx` (13)** — render אמיתי מול route tree: כשל ב-catalog/home/templates/goals/runs/preferences מוצג · `saved` אינו מציג banner · `memory_only` = `role="status"` · `failed` = `role="alert"` · התאוששות מסירה את ההתראה · קישור `/backup` נגיש · כותרת מילולית (צבע אינו הסמן היחיד) · ההתראה מוצגת גם במסך שאינו מסך האימון.
>
> **פער ידוע:** המיגרציה רצה ב-`useEffect` ולכן אינה נבדקת "לפני ה-render הראשון". זו מגבלה מכוונת ומתועדת ב-ADR-0033 (hydration), ולא פער כיסוי — ההרצה עצמה מכוסה במלואה ברמת היחידה.
>
> **Workout Execution — היכן נבדק מה:** שימור נתונים בדילוג/סיום חלקי/החלפת תרגיל, וסטטוס ההתמדה — ברמת **repository** (`src/lib/sessions/__tests__/workout-execution.test.ts`). טעינה, שרידות ב-localStorage, סטטוס שמירה, מצב התאוששות, ועריכת סט (משקל/RPE/השלמה/הוספה) — ברמת **render**. **פער ידוע:** בדיקת render שפותחת Radix Sheet נתקעת (R-21), ולכן הלחיצה בתוך גיליון הסיום החלקי אינה מכוסה ב-render — רק ההתנהגות ברמת repository.
>
> **למה רצף מפורש ולא glob:** הרצת כל `src/test` בהפעלת Vitest אחת נתקעת (`Worker exited unexpectedly`). ראה ADR-0026 + R-20. **אין להחזיר `vitest run src/test` כפקודה קנונית** ואין להשתמש ב-force-exit. הכיסוי לא הופחת.
>
> **מה ה-router tests מכסים כעת** (פערים שהיו פתוחים ונסגרו): render אמיתי מול route tree האמיתי · loaders + `notFound()` של 4 ה-routes שתוקנו ב-ADR-0022 · 404 בעברית + RTL + a11y · error boundary · compat redirects של `/goals*` · domain isolation ברמת route (detail + edit) על 12 domain-goals routes.
>
> החלק "כרגע" למטה **מיושן**. המצב האמיתי (עודכן Phase 1+2 finalize):
- **162 בדיקות עוברות** (`vitest run`), **12 קבצי בדיקה**. `goals/__tests__/domain-scope.test.ts` (domain scoping, type restriction, edit, getPrimaryGoal, **cross-domain isolation `goalMatchesDomain`, updateGoal לא משנה domain, primary מחריג archived/trashed, restore שומר domain+links ללא קשר שקרי**, goal trash/restore) + `lib/__tests__/trash-restore.test.ts` (gym/home session trash/restore, no-duplicate, source recompute).
- **typecheck** (`bun run typecheck`) — נקי. **build** — עובר. **routeTree.gen.ts דטרמיניסטי** (build×2 ללא diff). **lint** — 0 errors, 8 warnings (shadcn upstream); ראה `risks.md` R-17 (CRLF מקומי — הרץ עם `--rule '{"prettier/prettier":"off"}'`).
- סביבת הבדיקות: **vitest `node`** (ללא DOM). לכן הבדיקות ברמת לוגיקה/repo. **חסר (עתידי):** בדיקות render/route (דורש `@testing-library` + jsdom + router test setup — לא הותקן במכוון, אין dep חדש), E2E (Playwright), RLS (אין DB). התנהגות ה-redirect/route מאומתת ע"י typecheck + חוזי הנתונים (`getGoal().domain`, `listGoalTypesByDomain`, `listGoalsByDomain`).
- הפקודות: `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`.

---

## כרגע (מיושן — נשמר להשוואה)

**אין קוד מוצרי → אין בדיקות פונקציונליות.** רק בדיקות שלד: build עובר, typecheck נקי, lint נקי.

## מסגרת מתוכננת

| שכבה | כלי | היקף |
|---|---|---|
| Unit | Vitest | פונקציות pure, helpers, validators (zod) |
| Component | Vitest + `@testing-library/react` | רכיבי UI קריטיים (`Tile`, `DeleteWithConfirm`, טפסי דיווח סט) |
| Integration | Vitest + msw/מוקים | queryOptions + server functions (מוקים ל־Supabase) |
| E2E | Playwright דרך shell | זרימות critical: login → דיווח סט → הופעה בהיסטוריה |
| RLS | server-side query tests | לוודא ש־user A לא רואה דאטה של user B (גם באפליקציה חד־משתמש — נאכף כשמידה עתידית) |

## מה חובה לבדוק (כשיש קוד)

### Data integrity
- soft delete מסמן `deleted_at` ולא מוחק שורה.
- שחזור מאפס `deleted_at`.
- `numeric` נשמר בלי איבוד דיוק (משקל 87.5 חוזר 87.5, לא 87.4999...).
- כל insert מספרי כולל `unit` + `source`.

### RLS
- `SELECT`/`INSERT`/`UPDATE`/`DELETE` — כל אחד עם `owner_id=auth.uid()`.
- attempt ל־`owner_id` שגוי → נדחה.
- `WITH CHECK` נאכף ב־INSERT וב־UPDATE.

### Auth
- login עם credentials תקינים → session נשמר → redirect ל־dashboard.
- login שגוי → הודעת שגיאה נגישה (`aria-live`).
- logout → cancel queries, clear cache, redirect ל־`/auth`, replace history.
- route מוגן ללא session → redirect ל־`/auth`.

### UI
- כל מסך נטען ב־RTL בלי גלילה אופקית ב־viewport מובייל (מדגם: 360×640, 390×844).
- אין רכיב שדורש swipe לפעולה קריטית.
- כל query view מציג loading, empty, error states.

### AI
- הצעות AI נשמרות עם `status='pending'` ולא נכנסות ל־production data אלא אחרי approve.
- זריקת JSON לא תקין מה־LLM → הצעה מסומנת `expired` בלי לפגוע במשתמש.

## מה **לא** בודקים

- ביצועים ברמת ms (אין SLA).
- browser matrix מלא (מוצר אישי → Safari iOS + Chrome desktop למפתח מספיקים).
- accessibility תקן מלא WCAG AA כרגע — נדרש בסיס (`aria-label`, keyboard nav, contrast) אך לא תעודה.

## הפעלה

```sh
bun run lint         # (מוגדר: eslint .)
bunx tsgo            # type check (מהיר יותר מ־tsc --noEmit)
bun run build        # וידוא build עובר
# בעתיד:
# bun run test       # vitest
# bunx playwright test
```

## סטטוס נוכחי

- ✅ `bun run build` — עובר (שלד ריק).
- ✅ typecheck — נקי.
- ✅ lint — נקי (או מותאם לתבנית).
- ❌ בדיקות פונקציונליות — אין. אין קוד לבדוק.

---

## עדכון 2026-07-25 — QA ידני שהורץ

### Visual QA (Playwright, headless)
- ✅ `/`, `/running`, `/gym`, `/home`, `/more` — mobile 390×844.
- ✅ `/` — desktop 1280×900 (SideNav מופיע, BottomNav מוסתר).
- ✅ אין horizontal overflow באף מסך.
- ✅ RTL: nav צד ב־end (ימין), chevron של back מסתובב אוטומטית (`rtl:rotate-180`).
- ✅ Domain tiles: run coral, gym cyan, home green, goal violet — כולם מלווים ב־icon+label.
- ✅ Bottom nav: 5 פריטים, safe-bottom padding, active state צבוע לפי דומיין.
- ✅ Empty states: קומפקטיים, ללא illustration גדול.
- ✅ אין רקע לבן דומיננטי — background dark-tinted עם gradient עדין.

### QA שעדיין חסר (כשיהיה קוד לוגי)
- keyboard nav מלא, screen reader labels, touch target measurement, dialogs/drawers, reduced motion בפועל.

### QA טכני
- ✅ `bunx tsgo --noEmit` — נקי.
- ✅ `bun run lint` — 0 errors, 6 warnings (shadcn `only-export-components` — לא נדרש לתקן).
- ✅ Prettier — כולם מפורמטים.

## Screens בכיסוי QA

| Route | Mobile | Desktop |
|---|---|---|
| `/` | ✅ | ✅ |
| `/running` | ✅ | — |
| `/gym` | ✅ | — |
| `/home` | ✅ | — |
| `/more` | ✅ | — |
