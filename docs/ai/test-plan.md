# Test Plan

## ✅ ראיות אימות — ה-build לפרודקשן, 2026-07-31 (ג)

**סביבה:** `bun run build` → `.output` (nitro preset **`cloudflare-module`**) שהוגש ב-`http://localhost:4173` דרך **adapter של Bun בתיקייה זמנית** המשחזר את חוזה ה-Worker (`fetch(request, env, ctx)` + binding `ASSETS` מ-`.output/public`). **ללא wrangler, ללא dependency חדשה, ה-adapter אינו בריפו.** Chrome 150 headless דרך CDP · Windows 11 · branch `main`.

> ℹ️ `npx vite preview` **אינו** מגיש את ה-build הזה — נבדק ונמצא לא מתאים ל-preset של Worker.

### שערי אימות
| בדיקה | Exit | תוצאה |
|---|---|---|
| `bun run typecheck` (גם אחרי build) | **0** | PASS |
| `bun run test` | **0** | **314/314 unit + 61/61 router** = 375 |
| `bunx eslint . --rule '{"prettier/prettier":"off"}'` | **0** | **0 errors / 8 baseline warnings** |
| `bun run build` | **0** | PASS |
| `git diff --exit-code -- src/routeTree.gen.ts` | **0** | אין drift |

> ⚠️ ריצת eslint ראשונה החזירה **error אחד** — `react-hooks/rules-of-hooks` ב-`locations.$id.tsx`: `useMemo` היה **אחרי** יציאה מוקדמת. הגארד החדש חשף סכנה שהייתה קיימת קודם (ה-`throw` הישן הסתיר אותה מהכלל). ה-`useMemo` הועבר לפני הגארד → חזרה ל-baseline. **נרשם ולא הושתק.**

### מה נמדד על ה-build לפרודקשן
| בדיקה | תוצאה |
|---|---|
| ניווט ישיר + refresh | 13 מסלולים עמוקים → **200 עם SSR HTML** |
| כתובת לא קיימת | **404 אמיתי** (לא SPA fallback) |
| קבצים סטטיים | `/favicon.ico` (`image/x-icon`), `/assets/*.js` (`text/javascript`) — מוגשים לפני ה-worker |
| שגיאות | **0 hydration, 0 חריגות** ב-24 מסכים · **`#419` נעלם** |
| בית | 12 חזרות → `סטים: 1/1` → `{sets:1,reps:12,done:true}` → שרד refresh |
| כוח | 2 סטים (60×8, 62.5×6) → **855ק״ג** → שרד refresh → סיום חלקי (`completed` + 2 `skipped`) |
| ריצה | 6.2 ק״מ / 32:10 → קצב **5:11** → בהיסטוריה |
| ייצוא גיבוי | `fitlog-backup-20260731-1305.json` · **95,118 בייט** |
| אימות הגיבוי | `validateBackup` **ok** · 74 רשומות · checksum `253f4906` **חושב מחדש והתאים** · 0 errors / 0 warnings |
| 360px | 9 מסכים · `scrollWidth === clientWidth === 360` |
| SSR של 7 המסלולים המגודרים | כולם **200 ללא דף שגיאת שרת** |

**מגבלת כלי (לא מצב האפליקציה):** לקראת סוף הסשן ה-CDP הפסיק לייצר page target וניסיונות אתחול חוזרים לא עזרו. **זו תקלה בכלי האימות הזמני** — באותו זמן ה-build המשיך להחזיר 200 בכל בדיקת HTTP. **`/locations/$id`** נותר ללא אימות דרך דפדפן ומכוסה ע"י: תגובת SSR תקינה ב-HTTP · גארד **זהה בייט-לבייט** שאומת ב-6 המסלולים האחרים · בדיקות ה-router (`catalogRouteLoaders`) · typecheck/tests/build ירוקים.

**נותר `לא אומת`:** הרצה על Cloudflare אמיתי (wrangler/deploy) · מכשיר מגע אמיתי · דפדפנים שאינם Chromium.

---

## ✅ ראיות אימות — End-to-End בדפדפן אמיתי, 2026-07-31 (ב)

**סביבה:** `bun run dev` → `http://localhost:8080` (SSR פעיל) · **Chrome 150.0.7871.188 headless, נשלט דרך CDP** · פרופיל מבודד · Windows 11 · branch `main`. **לא נוספה dependency** — נעשה שימוש בדפדפן המותקן דרך `--remote-debugging-port`.

### פקודות ותוצאות (אחרי התיקון)
| בדיקה | Exit | תוצאה |
|---|---|---|
| `bun run typecheck` | **0** | PASS |
| `bun run test:unit` | **0** | **314/314** (21 קבצים) — **3 ריצות עוקבות** |
| `bun run test:router` | **0** | **61/61** (10 קבצים) |
| `bunx eslint . --rule '{"prettier/prettier":"off"}'` | **0** | **0 errors / 8 baseline warnings** |
| `bun run build` | **0** | PASS |
| `git diff --exit-code -- src/routeTree.gen.ts` | **0** | אין drift |

> ⚠️ **שתי ריצות נכשלו באופן חולף תחת עומס — שתיהן שוחזרו כירוקות אחרי הורדת העומס. נרשם ולא הושתק:**
> 1. `test:unit` — 283 בדיקות + "2 errors", exit 1, בזמן ש-Chrome headless ושרת ה-dev רצו במקביל (זמן environment קפץ מ-~26ש׳ ל-107ש׳). **3 ריצות עוקבות אחריה: 314/314 exit 0.**
> 2. `test:router:workout-editing` — `Test timed out in 5000ms`, כשכל הקובץ לקח **104ש׳** במקום ~15ש׳. אחרי סגירת שרת ה-dev: **3/3 עוברות ב-14.98ש׳**, ו-`bun run test` המלא **exit 0**.
>
> שתיהן מתאימות לאופי **R-20** (שבירות תשתית הבדיקות תחת עומס) ולא לרגרסיה מהשינוי: הקוד שהשתנה הוא שכבת render בלבד, והכשלים נעלמו כשהמכונה התפנתה. **מסקנה מעשית: אין להריץ את חבילת הבדיקות במקביל לשרת dev/דפדפן headless.**

### אימות בדפדפן — מה נמדד בפועל
| בדיקה | תוצאה |
|---|---|
| עליית האפליקציה | HTTP **200**, SSR מחזיר HTML, `dir="rtl"` `lang="he"` |
| טעינת מסלולים | **24 מסכים** נטענו · 0 חריגות JS · 0 בקשות כושלות |
| **שגיאות hydration** | **0** (לפני התיקון: **7 מסכים**) |
| דיווח תרגיל בית | 12 חזרות → `סטים: 1/1` → `{sets:1,reps:12,done:true}` → שרד refresh → בהיסטוריה |
| אימון כוח | 2 סטים (60×8, 62.5×6) → נפח **855ק״ג** → שרד refresh → סיום חלקי (2 `skipped`, status `completed`) |
| ריצה ידנית | 6.2 ק״מ / 32:10 → קצב **5:11** → נראית בהיסטוריה |
| ייצוא גיבוי | `fitlog-backup-20260731-0841.json` · **96,429 בייט** |
| אימות הגיבוי | `validateBackup` **ok** · 75 רשומות · checksum `75adbe56` **חושב מחדש והתאים** · 0 errors / 0 warnings |
| ספירות בגיבוי | `exercises 61 · sessions 8 · home 3 · runs 3` |
| **360px** | 9 מסכים · `scrollWidth === clientWidth === 360` · **אפס גלישה** |
| התמדה מקומית | 6 מפתחות `fitlog:*` · `storage-meta` schema **1.0.0** · snapshot מיגרציה קיים |
| תעבורת רשת | **רק** `localhost:8080` (1568) + `fonts.googleapis.com` (6) + `fonts.gstatic.com` (20) · **0 XHR/fetch לנתונים** |

**בדיקות שלא ניתן היה להריץ:** DB/RLS/migrations בענן — **אין תשתית כזו בריפו** (ADR-0012/0030). auth — **אין מסך כניסה במכוון**. **אין בדיקה שנחסמה מסיבה טכנית.**

**נותר `לא אומת`:** התנהגות ב-build פרודקשן מוגש (נבדק `bun run build` בלבד, לא preview חי) · מכשיר מגע אמיתי · דפדפנים שאינם Chromium.

---

## ✅ ראיות אימות — התאוששות + סגירת R-24, 2026-07-31 (branch `main`)

כל הפקודות הורצו **על `main` עצמו**. working tree נקי לפני העבודה, ומכיל רק את 6 הקבצים שנערכו אחריה.

| פקודה | Exit | מספר בדיקות | תוצאה |
|---|---|---|---|
| `bun run typecheck` | **0** | — | PASS |
| `bun run test:unit` | **0** | **314/314** (21 קבצים) | PASS — היה 305 |
| `bun run test:router` | **0** | **61/61** (10 קבצים) | PASS — ללא שינוי |
| `bunx vitest run src/lib/backup` | **0** | **21/21** | PASS — היה 14 (+7) |
| `bunx vitest run src/lib/readiness` | **0** | **31/31** | PASS — היה 29 (+2) |
| `bunx vitest run src/lib/migration` | **0** | **44/44** | PASS — אותו מספר, 2 בדיקות נכתבו מחדש |
| `bunx vitest run src/lib/storage` | **0** | **34/34** | PASS — ללא שינוי |
| `bunx eslint . --rule '{"prettier/prettier":"off"}'` | **0** | — | **0 errors / 8 baseline warnings** |
| `bun run build` | **0** | — | PASS |
| `git diff --exit-code -- src/routeTree.gen.ts` | **0** | — | PASS — אין drift |
| `bun run typecheck` אחרי build | **0** | — | PASS |

**סה"כ `bun run test` = 375** (היה 366).

**prettier — נבדק ולא רגרסיה:** `bunx prettier --check` מסמן 5 מהקבצים שנערכו. אומת ש**אותם 5 קבצים בדיוק נכשלים גם בגרסת `HEAD` שלפני השינוי** (הוצאו עם `git show HEAD:<path>` ונבדקו בנפרד), וכן ש-2 קבצים שלא נגעתי בהם נכשלים גם הם. זהו baseline R-17/CRLF ולא פורמט שנוצר בסשן זה. `git diff --stat` = 223 הוספות / 34 מחיקות — **אין שכתוב שורות מלא**, כלומר סופי השורות נשמרו.

**שלוש בדיקות שנשברו במהלך העבודה ומה נעשה בהן — לא הושתקו:**
1. `importPipeline` › "ילד עם הורה חסר נדחה" — נשבר כי האימות תופס כעת את המקרה ולכן ה-pipeline נעצר לפניו ו-`rejected` נשאר 0. **נכתבה מחדש עם `exercise_id`** — קשר שהאימות אינו מכסה — כך ששכבת ההגנה השנייה נבדקת בפועל.
2. `importPipeline` › "פער מוכח" — תיעדה במפורש את הבאג. **נכתבה מחדש** כדי לאמת שהאימות תופס והקובץ נדחה לפני שנכתבת שורה.
3. `readinessAudit` › "נתונים שבורים → cloud gate false" — חשפה **באג אמיתי** (`dependency_order` = true מאפס פעולות). הקוד תוקן, הבדיקה עודכנה, **ונוספה בדיקה שנייה** שממשיכה לכסות את מסלול `dependency_failures` האמיתי.

**בדיקות שלא הורצו:** אין בדיקות DB/RLS/migration בענן — לא קיימות בריפו. אין E2E/Playwright — נדחה במפורש. אין CI. **אין בדיקה שלא הורצה מסיבה של חסם או timeout.**

---

## ✅ ראיות אימות — Recovery Audit 2026-07-30 (HEAD `daba93c`, branch `main`)

כל הפקודות הורצו **על `main` עצמו**, working tree נקי לפני ואחרי.

| פקודה | Exit | מספר בדיקות | תוצאה | שינויים שנוצרו |
|---|---|---|---|---|
| `bun run typecheck` | **0** | — | PASS | אין |
| `bun run test:unit` | **0** | **305/305** (21 קבצים) | PASS | אין |
| `bun run test:router` | **0** | **61/61** (10 קבצים) | PASS | אין |
| `bunx vitest run src/lib/migration` | **0** | 44/44 (2 קבצים) | PASS | אין |
| `bunx vitest run src/lib/readiness` | **0** | 29/29 (2 קבצים) | PASS | אין |
| `bunx vitest run src/lib/backup` | **0** | 14/14 (1 קובץ) | PASS | אין |
| `bunx vitest run src/lib/storage` | **0** | 34/34 (2 קבצים) | PASS | אין |
| `bunx eslint . --rule '{"prettier/prettier":"off"}'` | **0** | — | **0 errors / 8 warnings** (react-refresh, shadcn) | אין |
| `bun run lint` (כפי שהוא) | **1** | — | ⚠️ **FAIL — 30,668 errors `Delete ␍`** (CRLF, R-17). לא בעיית קוד. | אין |
| `bun run build` | **0** | — | PASS | `.output/`, `.wrangler/` (gitignored). **`routeTree.gen.ts` — hash זהה לפני ואחרי** |
| `bun run typecheck` אחרי build | **0** | — | PASS | אין |

**פירוט 61 בדיקות ה-router (נספר מהפלט):** `systemScreens` 2 · `runningRouteLoaders` 4 · `catalogRouteLoaders` 2 · `domainGoalRoutes` 19 · `compatRoutes` 11 · `workoutExecution` 4 · `workoutExecutionEditing` 3 · `workoutExecutionAddSet` 1 · `homePlanPicker` 2 · `globalPersistenceWarning` 13. **סה"כ `bun run test` = 366.**

**בדיקות שלא הורצו:** אין בדיקות DB/RLS/migration בענן — **לא קיימות בריפו** (אין `supabase/`). אין E2E/Playwright — נדחה במפורש. אין CI — `.github` לא קיים. **אין בדיקה שלא הורצה מסיבה של חסם או timeout.**

**חוב אימות שנותר `לא אומת`:** Visual QA ב-360px (דורש דפדפן אמיתי; jsdom אינו מחשב layout) · Import אמיתי מול Supabase (R-23) · לחיצה בתוך Radix Sheet ב-render (R-21).

---

## סטטוס בפועל (מאומת 2026-07-24)

> **עדכון 2026-07-26 (סגירת מסלול A)** — נוספו `src/lib/migration/` ו-`src/lib/readiness/`:
> - **`inMemoryCloudRepository.test.ts` (11)** — מפתח יציב ולא index · unchanged מול conflict · קונפליקט אינו משנה את הרשומה הקיימת · הורה חסר אינו נכתב · inspection ו-reset.
> - **`importPipeline.test.ts` (33)** — אימות ושלמות (פורמט זר, checksum שגוי, מזהים כפולים) · **סדר תלויות טופולוגי** ואימות שכל הורה נכתב לפני ילדו · ילד יתום נדחה יחד עם ילדיו · שימור `sequence` ו-`set_number` · **ownership**: user מאומת בלבד, `user_id` זדוני בקובץ אינו משפיע, שני משתמשים אינם חולקים בעלות, taxonomy מערכתי ללא בעלות, שדות סוד אינם עוברים · **idempotency**: ייבוא שני ושלישי = no-op מלא · **conflicts**: מדווח עם entity+id, אינו נדרס, אינו מכפיל · דטרמיניזם של `operation_id` · unsupported entities.
> - **`readinessReport.test.ts` (20)** — ללא ראיות כל 16 הבדיקות `false` · כל יכולת חסרה מפילה את ה-gate הנכון · rehearsal/ownership/dependency/idempotency/conflict כושלים מפילים את gate הענן בלבד · מבנה 16 הבדיקות.
> - **`readinessAudit.test.ts` (9, jsdom)** — הרצה מקצה לקצה מול אחסון אמיתי מבודד: שני ה-gates נפתחים · הראיות אינן ריקות · האחסון חוזר למצבו · ההיררכיה משוחזרת בענן · ownership · שימור חותמות זמן וסטטוסים · דטרמיניזם · נתונים שבורים מפילים את gate הענן.
>
> **מה ה-rehearsal לא מכסה (ADR-0034, R-23):** RLS, Auth, FK constraints של מנוע אמיתי, טרנזקציות, טיפוסי עמודות, רשת. נדרש מבחן Import אמיתי מול Supabase.
>
> **הבדיקות מחולקות לשתי משפחות:**
> - **`bun run test:unit`** → `vitest run src/lib` — **305 בדיקות, 21 קבצים**, סביבת `node` (קבצים בודדים מצהירים `jsdom` ברמת קובץ). יציב ומהיר.
> - **`bun run test:router`** → **רצף `&&` מפורש, קובץ אחד לכל תהליך Vitest** — **61 בדיקות, 10 קבצים**, סביבת `jsdom` (`// @vitest-environment jsdom` ברמת קובץ):
>   `systemScreens` (2) · `runningRouteLoaders` (4) · `catalogRouteLoaders` (2) · `domainGoalRoutes` (19) · `compatRoutes` (11) · `workoutExecution` (4) · `workoutExecutionEditing` (3) · `workoutExecutionAddSet` (1) · `homePlanPicker` (2) · **`globalPersistenceWarning` (13)**.
> - **`bun run test`** = `test:unit && test:router` → **366 בדיקות**, exit 0.
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
