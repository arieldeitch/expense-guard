# Session Handoff

> ⚠️ **הסעיף העדכני ביותר הוא זה שמיד למטה (2026-07-26).** הסעיפים שאחריו נשמרים
> כרשומה היסטורית; במקרה של סתירה — **הסעיף העליון גובר**.

## 🟢 עדכון 2026-07-26 — בטיחות אחסון מקומי הושלמה (branch `feat/home-plan-simple-flow`)

**מה נסגר בסשן הזה:**
1. **התראת כשל כתיבה גלובלית.** `GlobalStorageBanner` ברמת `__root.tsx` — חל על **כל** המסכים. כשל בכל אחד מ-9 מודולי האחסון גלוי למשתמש: `memory_only` → `role="status"` ("חלק מהשינויים לא נשמרו בדפדפן ועלולים להיעלם לאחר רענון.") · `failed` → `role="alert"` ("השמירה נכשלה. הורד גיבוי לפני רענון או סגירת הדפדפן."). אייקון + כותרת מילולית (צבע אינו הסמן היחיד), קישור ל-`/backup`, **banner מתמשך ולא toast**, וכתיבה מוצלחת אחרי כשל מסירה אותו. מסך האימון אינו מצהיר "נשמר במכשיר" כשמודול אחר נכשל.
2. **`fitlog:storage-meta`** — `schema_version` **1.0.0**, `format` `workout-data-system-local`, `updated_at`, ותשעת מודולי האחסון. תשעת המפתחות וה-IDs **ללא שינוי**.
3. **migration registry `legacy -> 1.0.0`** — קורא את כל המפתחות, מאמת parse, שומר שדות לא מוכרים (עובד על מחרוזות גולמיות), לא מוחק, idempotent. הרצה חוזרת = no-op מלא.
4. **snapshot ו-rollback** — `fitlog:migration-snapshot` עם `checksum`, נקרא בחזרה לאימות לפני כל שינוי, **אינו דורס** את snapshot ה-Restore. כשל → אף מפתח מקור לא משתנה, metadata לא נכתב, `migration_failed` מוחזר ומוצג. **metadata נכתב אחרון בלבד.**
5. **גרסה עתידית נחסמת** — `schema_version` גבוה מ-1.0.0 → אין נגיעה בנתונים.

**Git:** 3 commits מעל `4b2b401` — `32c702c` fix(ui) · `e73131e` feat(storage) · docs. **ללא amend/rebase/force. אין merge ל-`main`. אין deploy.**

**בדיקות: 293 עוברות** — `test:unit` 232/232 (17 קבצים) · `test:router` 61/61 (10 קבצים). typecheck exit 0 · eslint 0 errors / 8 baseline warnings · build ×2 · `routeTree.gen.ts` ללא diff.

**⚠️ אי-דיוק ידוע:** הודעת ה-commit `e73131e` אומרת "27 בדיקות חדשות" ב-`localSchema.test.ts`; המספר בפועל הוא **23**. לא בוצע amend. `change-log.md` מכיל את הרישום הנכון.

**🔴 הפעולה הבאה — המשימה השנייה מתוך השתיים: Fake Supabase rehearsal, ואחריה Readiness Gate.** `LOCAL_TO_SUPABASE_MIGRATION_CONTRACT.md` נכתב אך **מעולם לא הורץ**. **אין ליצור פרויקט Supabase** לצורך זה — התרגיל יבש. **מסלול A אינו סגור עד להשלמתו.**

**ADR חדשים:** ADR-0033 (schema מקומי גרסאי, snapshot, rollback, hydration) · **ADR-0032 תועד רטרואקטיבית** — הוא הוזכר בקוד מאז `4b2b401` ולא נכתב מעולם ב-`decisions.md`. **R-22 הוקטן** מ-🔴 High ל-🟡 Medium.

**מגבלה מכוונת (ADR-0033):** המיגרציה רצה ב-`useEffect`, כלומר אחרי ה-render הראשון — כדי למנוע hydration mismatch (אין `localStorage` ב-SSR). `legacy -> 1.0.0` אינה משנה תוכן ולכן אין סיכון ל-cache מיושן. **מיגרציה עתידית שמשנה תוכן חייבת** לעבור ל-entry ה-client או להוסיף ביטול cache למודולים.

---

> ⚠️ **עודכן 2026-07-25 אחרי ריסטרט לא מתוכנן.** הסעיף הבא מתקן טענות שגויות בגוף המסמך
> שמתחתיו.

## 🔴 עדכון התאוששות (2026-07-25) — קרא ראשון

**תיקוני עובדות לגוף המסמך למטה (Git הוא מקור האמת):**
1. **"לא בוצע push / אין upstream" — שגוי.** הענף נדחף ל-`origin` ב-`5af65bd` בשעה 10:01:13 (`git reflog show origin/feat/...` → `update by push`), שמונה דקות אחרי שהמסמך נכתב. upstream מוגדר, ahead/behind = 0/0.
2. **"working tree נקי" — שגוי** נכון לרגע הריסטרט: 24 קבצים משתנים + 4 untracked.
3. **"לא הותקנו dependencies (כולל `@testing-library`)" — שגוי.** `@testing-library/{react,jest-dom,user-event}` + `jsdom` הותקנו כ-devDeps ב-10:02.

**מצב נוכחי — ההתאוששות הושלמה ונדחפה (2026-07-25):**
- **Branch:** `feat/domain-alignment-and-restore` · **HEAD = `a4d24e2`** · **ahead 0 / behind 0** מול `origin/feat/domain-alignment-and-restore`.
- **שלושת commits ההתאוששות נדחפו בהצלחה** (`5af65bd..a4d24e2`, fast-forward):
  - `6fb22c3` — freeze: הקפאת העבודה שנמצאה, לפני כל תיקון
  - `da20f72` — checkpoint: שיטוח routes + fixtures מטופסים
  - `a4d24e2` — סגירת חסם ה-router tests (פיצול `systemErrors.test.tsx`)
- **לא בוצעו force push, merge או deploy.** `main` לא נגעו בו (עדיין `ahead 1` מול `origin/main`, לא נדחף).
- **Working tree נקי** לפני ה-push ואחריו.
- **בדיקות: 200 עוברות** — `bun run test:unit` 162/162 · `bun run test:router` 38/38 · `bun run test` exit 0.
- typecheck exit 0 · eslint (ללא prettier) 0 errors / 8 warnings · build ×2 · `routeTree.gen.ts` דטרמיניסטי.

**⛔ סעיפים מבוטלים (Superseded) בגוף המסמך למטה** — נכתבו לפני ה-push ואינם נכונים עוד:
"מצב מול remote" · "לא בוצע push / rebase / force-push" · "פעולות ידניות שעדיין נדרשות → החלטת push/PR" · "GPT continuation context → **לא pushed**". הם נשמרים כרשומה היסטורית בלבד; **הסעיף הזה גובר עליהם**.

**חסם Router tests — נסגר.** `systemErrors.test.tsx` פוצל לשלושה קבצים לפי תחום אחריות (`systemScreens` / `runningRouteLoaders` / `catalogRouteLoaders`). ראה ADR-0026.

**עדכון 2026-07-25 — Workout Execution הושלם.** `/sessions/$id` שמיש לאימון אמיתי: RPE, דילוג תרגיל, סיום מלא/חלקי, סטטוס שמירה אמיתי, מצב התאוששות, ללא `prompt()`/`confirm()` חוסמים. **216 בדיקות** (170 unit + 46 router). ADR-0027/0028. סיכון חדש R-21 (Radix Sheet ב-harness, P2). פערים שנותרו מפורטים ב-`open-tasks.md` תחת "Workout Execution — פערים שנותרו" (RIR ב-UI, scroll position, בדיקת render לסיום חלקי).

**✅ `main` מסונכרן (2026-07-25).** `main` עודכן ב-**fast-forward** ל-`f33d00a` (ללא merge commit) ונדחף ל-`origin/main`. **`origin/main` הוא כעת מקור האמת** לגרסה שעליה יש לבצע Visual QA. ה-commit `eca9163` נשמר בהיסטוריה. ה-feature branch `feat/domain-alignment-and-restore` **לא נמחק** — יישמר עד שה-Visual QA ב-360px יעבור. אימות מלא הורץ **על `main` עצמו**: typecheck exit 0 · 216 בדיקות · eslint 0 errors · build ×2 · routeTree ללא שינוי. **לא בוצע deploy.**

**🆕 עדכון 2026-07-25 — פישוט תוכניות בית + Audit נתונים (branch `feat/home-plan-simple-flow`).**
בניית תוכנית בית פושטה: picker חדש עם **אחרונים → מועדפים → 6 קבוצות בשפת משתמש**, חיפוש עברית/אנגלית, פילטר ציוד פשוט, **בחירה מרובה**, ו"תרגיל מותאם" בתוך אותו גיליון. קטלוג curated של **34 תרגילים** (המאגר המלא נשמר). יצירה ועריכה כבר חלקו מסך אחד — נשמר. **232 בדיקות.** ADR-0029.

**🔴 החלטה נדרשת — מוכנות נתונים (ADR-0030, R-22).** האפליקציה **אינה** מחוברת לבסיס נתונים ענני: אין Supabase client, env, migrations או Auth/RLS; `activeRepoKind="mock"`; הכול ב-localStorage; **אין export, אין import, אין העברה בין מכשירים**; 7 מתוך 8 מודולי storage בולעים כשל כתיבה בשקט. שימוש מחר בבוקר בטוח **על מכשיר אחד בלבד**.
- **A. שימוש מקומי בטוח במכשיר יחיד + גיבוי** — להוסיף export/import JSON ולהרחיב את `PersistenceStatus` לכל המודולים. ללא עלות, ללא credentials.
- **B. חיבור Supabase מלא** — Auth + RLS + migrations. דורש Approval Brief (CLAUDE.md), יוצר פרויקט/עלות.

**⚠️ חוב אימות פתוח — 360px.** התאמת המסך לרוחב 360px נבדקה **סטטית בלבד** (מבנה ו-CSS). **הקריטריון אינו מאומת** עד ל-Visual QA ידני בדפדפן או ב-Lovable Preview. **הוחלט מפורשות לא** להוסיף בדיקת `scrollWidth` ב-jsdom — jsdom אינו מחשב layout ובדיקה כזו אינה מוכיחה דבר. אין להוסיף Playwright/Cypress ללא אישור.

**סטטוס פערים:** RPE ✅ ממומש · RIR ❌ לא ממומש (משימת המשך) · שמירת מיקום גלילה ו-drag reorder — **אינם חוסמי MVP** · R-21 (Radix Sheet בבדיקות) — **סיכון בדיקות נקודתי, אינו חוסם שימוש בפועל**.

**הפעולה הבאה היחידה המומלצת:** לפתוח את Workout Execution ב-Lovable Preview או בדפדפן ברוחב 360px ולבצע **Visual QA ידני** — זהו קריטריון הקבלה היחיד שנותר בלתי מאומת. רק אחריו לבחור יעד פיתוח מוצר חדש מתוך `open-tasks.md`. **אין להמשיך בחקירת Vitest** (R-20/R-21) — P2, לא חוסמות.

**מה הושלם בהתאוששות:**
- **route layout nesting (ADR-0025)** — התגלה שקובץ route עם ילדים בשם הופך אוטומטית ל-layout parent, ואף route פרט ל-`__root.tsx` אינו מרנדר `<Outlet />`. **24 route modules שוטחו ל-`*.index.tsx`**. URLs, redirects ו-compat routes נשמרו במלואם.
- **router test harness + 38 בדיקות render** — נסגרו הפערים שהיו פתוחים: loaders + `notFound()`, 404 בעברית/RTL/a11y, error boundary, compat redirects, domain isolation ברמת route.
- **`fixtures.ts`** — builder מלא ל-`RunSessionInput`, בלי `any`/cast/`@ts-ignore`.

**מגבלה ידועה (R-20, ADR-0026, P2 — לא חוסמת):** `vitest run src/test` בהפעלה אחת נתקע. הפקודה הקנונית `test:router` מריצה **קובץ אחד לכל תהליך Vitest** ברצף `&&` מפורש. **אין להחזיר glob של `src/test`** ואין להשתמש ב-force-exit. הכיסוי לא הופחת.

**עדיין נכון:** אין Supabase/Auth/RLS/migrations/CI-CD/sync engine. אין `.env` ואין secrets. R-17 (CRLF) פעיל — לא בוצעה המרה גורפת.

---

> מסמך מעבר בין sessions. נכתב לסגירה בטוחה לפני restart. מבוסס על **ראיות repo בלבד**
> (2026-07-25, HEAD `16f4444`). מסמכי מקור האמת האחרים (lowercase) נשארים סמכותיים; זה
> מסמך handoff שמצביע עליהם — לא מקור אמת מתחרה.

## תאריך ומטרת ה-session
- **תאריכים:** 2026-07-24 → 2026-07-25.
- **מטרה:** Phase 1 (יעדים לפי domain) + Phase 2 (trash/restore) + **finalize** (אכיפת domain isolation + regressions), ואז סגירת session בטוחה.

## Branch / Commit — התחלה וסיום
- **Branch:** `feat/domain-alignment-and-restore` (נוצר מ-`main`@`eca9163`).
- **HEAD בסיום:** commit `docs(ai): finalize domain alignment phase` **מעל** `764cfb8` (`fix(goals): enforce cross-domain isolation guard and add regressions`).
- **שרשרת commits (מהחדש לישן):**
  - `docs(ai): finalize domain alignment phase`  ← docs-only (session finalize)
  - `764cfb8` fix(goals): enforce cross-domain isolation guard and add regressions
  - `dcc486f` docs: finalize phase 1 and 2 session handoff
  - `16f4444` fix(ui): localize system errors and stabilize route generation
  - `f66b411` feat(trash): wire restore for sessions and goals
  - `1288e5b` feat(goals): scope goal surfaces to workout domains
  - `eca9163` docs(ai): add product alignment audit and migration plan  ← גם ראש `main` המקומי
  - `82de6bf` בנה מערכת יעדים אישית  ← (origin/main)
- ~~**מצב מול remote:** `origin` = `https://github.com/arieldeitch/expense-guard.git`. ל-`feat/domain-alignment-and-restore` **אין upstream** ו**אינו קיים ב-origin** (לא בוצע push). `main` המקומי (`eca9163`) **מקדים ב-1** את `origin/main` (`82de6bf`) — גם הוא לא נדחף.~~ **⛔ Superseded (2026-07-25):** הענף קיים ב-origin עם upstream ומסונכרן ב-`a4d24e2` (ahead 0/behind 0). ראה סעיף העדכון בראש המסמך. *(החלק על `main` עדיין נכון.)*

## עבודה שהושלמה
**Phase 1 — יעדים לפי domain (החלטת מוצר מאושרת: אין מסך יעדים גלובלי).**
- 6 רכיבים משותפים ב-`src/components/goals/`: `goalLinks.tsx`, `goalDomainConfig.ts`, `GoalForm.tsx`, `GoalsListView.tsx`, `GoalDetailView.tsx`, `GoalDomainChooser.tsx` (+ `DomainPrimaryGoalTile.tsx` עודכן).
- 12 domain-goals routes (מפה מלאה למטה) — thin, נשענים על הרכיבים המשותפים ללא duplication.
- `/goals`, `/goals/new`, `/goals/$id` → compatibility redirects בלבד (לא בניווט).
- `DomainPrimaryGoalTile` חובר ל-`/running`, `/gym`, `/home`.
- תוקן drift של route-tree (ADR-0022) — ראה למטה.

**Phase 2 — trash/restore.**
- `/trash`: +3 מקטעים (gym sessions, home sessions, goals), שחזור דו-שלבי.
- list-trashed hooks: `useTrashedSessions`/`listTrashedSessions`, `useTrashedHomeSessions`, `useTrashedGoals`.
- delete-to-trash דו-שלבי: home summary (חדש), goal detail confirm (חדש), gym (קיים).
- recompute אחרי restore: אוטומטי דרך `commit()` → `useSyncExternalStore` subscribers.

**Finalize (2026-07-25) — domain isolation + regressions.**
- helper טהור `goalMatchesDomain(goal, domain)` (`goalDomainConfig.ts`); guard ב-`GoalDetailView` וב-`GoalForm` (edit) — יעד מתחום אחר לא ניתן להצגה/עריכה במסלול. domain נקבע מהישות, לא מה-param.
- +4 tests (162 סה"כ): cross-domain guard, updateGoal שומר domain, primary מחריג archived/trashed, restore שומר domain+links ללא קשר שקרי.

**i18n + hygiene.** `__root.tsx` 404/error → עברית+RTL+`role="alert"`/`aria-live`+focus; `.gitattributes` (LF, ללא renormalize); lint hook false-positive נפתר ע"י named component; נוסף `typecheck` script.

## קבצים שהשתנו (לפי commit)
- **`1288e5b` feat(goals)** (32 קבצים): 6 רכיבי goals + 12 routes + 3 compat routes + `running/gym/home.tsx` + 4 route fixes (`exercises.$id`,`locations.$id`,`running.$id`,`running.new.$type`) + `src/routeTree.gen.ts` + `package.json` + `src/lib/goals/__tests__/domain-scope.test.ts`.
- **`f66b411` feat(trash)** (7): `lib/goals/hooks.ts`, `lib/home/hooks.ts`, `lib/sessions/hooks.ts`, `lib/sessions/repo.ts`, `routes/trash.tsx`, `routes/home.sessions.$id.summary.tsx`, `lib/__tests__/trash-restore.test.ts`.
- **`16f4444` fix(ui)**: `routes/__root.tsx`, `.gitattributes`, 11 מסמכי `docs/ai/*`.

## החלטות ארכיטקטורה / ADR
- **ADR-0021** — goals surface **פתור**: domain-scoped בלבד; `/goals*` compat; אין מסך גלובלי.
- **ADR-0022** — route-tree drift **פתור**: קריאת `id`/`type` דרך `Route.useParams()` (לא `useLoaderData`) ב-4 routes.
- **ADR-0023** — `typecheck` script + `.gitattributes` (ללא renormalize גורף).

## בדיקות ותוצאות מדויקות (נצפו ב-session זה)
| בדיקה | פקודה | תוצאה |
|---|---|---|
| Typecheck | `bun run typecheck` (`tsc --noEmit`) | ✅ **PASS** (exit 0, גם אחרי build) |
| Tests | `bun run test` (vitest) | ✅ **PASS** — 12 קבצים, **162/162** |
| Lint (אמיתי) | `bunx eslint . --rule '{"prettier/prettier":"off"}'` | ✅ **0 errors, 8 warnings** (react-refresh בקבצי shadcn upstream) |
| Lint (`bun run lint` כפי שהוא) | `bun run lint` | ⚠️ **FAIL מקומית** — אלפי שגיאות `Delete ␍` (CRLF, R-17). לא בעיית קוד. |
| Build | `bun run build` | ✅ **PASS** (exit 0, ×2+) |
| Route-tree determinism | `bun run build` ×2 + `diff`; `git diff --exit-code -- src/routeTree.gen.ts` | ✅ **PASS** — אין diff; committed == generated |

## מצב working-tree וסטטוס commit/push
- Working tree **נקי** (לאחר commit ה-handoff הזה). כל שינויי Phase 1/2 **committed**.
- `.output/`, `.wrangler/`, `node_modules/` — **gitignored** (מאומת). אין artifacts/logs/exports/secrets ב-tracking.
- **Push: לא בוצע.** ראה "פעולות ידניות" למטה.

## מגבלות ידועות
- אין backend/Supabase/Auth/RLS/Storage — localStorage בלבד (במכוון).
- Lint מקומי דורש דגל `prettier/prettier:off` עקב CRLF (R-17).
- סביבת vitest = `node` → אין בדיקות render/route/E2E.

## פריטים לא-מאומתים (unverified)
- **loaders + `notFound()` של 4 ה-routes שתוקנו**: נשמרו ב-source (לא נגעתי בגוף ה-loaders), אך **אין טסט executable** שמוכיח שהם עדיין רצים/זורקים (דורש router harness). → פתוח ב-`open-tasks.md`.
- **render של 404/guard**: לוגיקת domain-match/getGoal→null **נבדקה** (`goalMatchesDomain`), אך ה-**render** של מסך 404/guard דורש router harness → פתוח (חלקי).
- ✅ **domain-isolation (לוגיקה)**: נאכף ע"י `goalMatchesDomain` ב-`GoalDetailView`+`GoalForm` ו**נבדק** ב-`domain-scope.test.ts` (כבר לא unverified).

## סיכונים פעילים (ראה `risks.md`)
- **R-17** CRLF/lint מקומי — פעיל (מיטיגציה: `.gitattributes` נוסף; renormalize גורף נדחה).
- R-01 אובדן נתונים, R-09 תלות ספק (Suunto), R-12 Cloudflare runtime, R-13 secret leakage — פעילים כרגיל.
- **R-18, R-19 — נסגרו** ב-session זה.

## מחוץ להיקף (במפורש)
- אין חיבור Supabase/Auth/RLS/Storage; אין migrations; אין deploy; אין secrets; אין שינויי production. **אין עלות חדשה נוצרה.**
- לא הותקנו dependencies חדשים (כולל `@testing-library`).
- לא בוצע push / rebase / force-push / מחיקת branches.

## פעולות ידניות שעדיין נדרשות
- ~~**החלטת push/PR**: `feat/domain-alignment-and-restore` מקומי בלבד. push דורש הרשאת auth + מדיניות (הנחיות קודמות אסרו push).~~ **⛔ Superseded (2026-07-25):** ה-push בוצע — הענף מסונכרן ב-`a4d24e2`. **נותר פתוח:** `main` המקומי עדיין מקדים את origin ב-commit ה-audit ולא נדחף (החלטת משתמש); פתיחת PR גם היא עדיין החלטת משתמש.

## המסמכים שה-session הבא חייב לקרוא תחילה (לפי סדר)
1. `docs/ai/SESSION_HANDOFF.md` (זה)
2. `docs/ai/product-requirements.md`
3. `docs/ai/current-state.md`
4. `docs/ai/open-tasks.md`
5. `docs/ai/decisions.md` (ADR-0021/0022/0023)
6. `docs/ai/risks.md` (R-17)
7. `docs/ai/route-inventory.md` (סעיף Domain goals) + `docs/ai/migration-plan.md`

## פעולה מומלצת אחת בלבד (הבאה)
לאמת את Phase 1 ו-Phase 2 מראיות ה-repo, לסגור את פערי בדיקות הרגרסיה ו-domain-isolation שנותרו, ורק אז לקבוע את ה-phase המאושר הבא מתוך `open-tasks.md` ו-`SESSION_HANDOFF.md`. **אין להתחיל את ה-phase הבא.**

---

## מפת 12 ה-Goals routes
| Route | קובץ | מטרה |
|---|---|---|
| `/running/goals` · `/gym/goals` · `/home/goals` | `{running,gym,home}.goals.tsx` | רשימת יעדי התחום |
| `/{d}/goals/new` | `{running,gym,home}.goals.new.tsx` | יצירת יעד בתחום |
| `/{d}/goals/$id` | `{running,gym,home}.goals.$id.tsx` | פרטי יעד |
| `/{d}/goals/$id/edit` | `{running,gym,home}.goals.$id.edit.tsx` | עריכת יעד |

**רכיבים משותפים:** `GoalForm` (create+edit, domain נעול), `GoalsListView`, `GoalDetailView`, `GoalDomainChooser`, `goalLinks` (Link/redirect helpers type-safe פר-domain), `goalDomainConfig` (labels), `DomainPrimaryGoalTile`.

**אכיפת הגבלת domain:**
- ה-route מזריק `domain` literal לרכיבים.
- יצירה/עריכה: `GoalForm` נעול ל-domain; `listGoalTypesByDomain(domain)` מגביל את סוגי היעד (route ריצה לא יציע יעד בית וכו').
- פרטים: `GoalDetailView` עם guard `goal.domain !== domain` → מסרב להציג.
- compat `/goals/$id`: redirect לפי `goal.domain`.

## route-tree — סיבת ה-drift, מנגנון canonical, מדיניות
- **סיבת ה-drift:** ה-generator המקומי מקליד `Route.useLoaderData()` כ-`T | undefined`, מחמיר יותר מהעץ המחויב הישן (שנוצר ע"י גרסת generator אחרת). 4 routes שקראו `useLoaderData()` נשברו ב-typecheck לאחר regeneration.
- **מנגנון canonical:** אין CLI/script ל-generator; ה-generation מתבצע בתוך ה-vite build plugin של `@lovable.dev/vite-tanstack-config`. לכן `bun run build` הוא הדרך הקנונית ליצור מחדש את `src/routeTree.gen.ts`.
- **גרסאות (מ-`package.json`, ללא שינוי):** `@tanstack/react-router` ^1.170.16 · `@tanstack/react-start` ^1.168.26 · `@tanstack/router-plugin` ^1.168.18 · `@lovable.dev/vite-tanstack-config` ^2.7.7. `@tanstack/router-generator` מותקן כתלות טרנזיטיבית (לא מוצמד ב-package.json).
- **מדיניות `src/routeTree.gen.ts`:** auto-generated — **לא לערוך ידנית**, לא להעתיק אליו קוד, לא להשבית generation. מיוצר מחדש דרך `bun run build`. **מאומת: הקובץ לא נערך ידנית** ב-session זה (רק נוצר מחדש ע"י ה-build), ו-`git diff --exit-code` לאחר regeneration = ריק (committed == generated, דטרמיניסטי).
- **4 ה-routes ששונו** `useLoaderData()` → `useParams()`: `exercises.$id`, `locations.$id`, `running.$id`, `running.new.$type`. ה-loaders (כולל `notFound()`) **נשארו ללא שינוי בקוד**; הערכים זהים. verify ע"י טסט — **טרם** (unverified).

## אי-התאמות מול הדוח הקודם
- אין אי-התאמה מהותית. נקודות דיוק: (1) הדוח ציין loaders/notFound "נשמרו" — נכון ב-source אך **לא מכוסה בטסט** (מסומן unverified). (2) ספירת routes עודכנה ל-53 ב-`current-state.md`; טבלת `route-inventory.md` המקורית (41 שורות) + סעיף "Domain goals" נפרד משקפים זאת.

## Prompt history (תקציר — ראה `claude-session-log.md` לרישום מפורט)
- **מטרת Phase 1/2:** יעדים לפי domain (ללא מסך גלובלי) + trash/restore מלא ל-3 ישויות; עבודה אוטונומית עד השלמה.
- **פתרון route-tree drift:** הוראה לפתור generation דטרמיניסטית ללא עריכת/שחזור הקובץ הגנרטד → נפתר ע"י `useParams` (ADR-0022).
- **הוראת אימות:** לאמת את הדוח הקודם מראיות repo לפני המשך.
- **הוראת סגירה:** לשמר מצב ב-Git ובתיעוד לפני restart (session זה).
- **מטרת ה-session הבא:** אימות Phase 1/2 מ-repo + סגירת פערי regression/domain-isolation, ואז קביעת ה-phase הבא.

## GPT continuation context
אם ה-continuation הוא ב-GPT/agent אחר (אין מסמך context נפרד ל-GPT — זהו):
- **מקור אמת:** `AGENTS.md` + `docs/ai/*` (lowercase). אל תיצור מסמכי-על מתחרים.
- **מצב (מעודכן 2026-07-25):** Phase 1+2 + finalize + **התאוששות מריסטרט** הושלמו. branch `feat/domain-alignment-and-restore`, **HEAD = `a4d24e2`, pushed, ahead 0/behind 0**. working tree נקי. **200 tests** (162 unit + 38 router). *(הטענה הקודמת "לא pushed" — מבוטלת.)*
- **כללי ברזל:** soft-delete בלבד; אין עלות/secret/Supabase/Auth/RLS ללא Approval Brief מפורש (ראה `CLAUDE.md` הגלובלי + `AGENTS.md`); `routeTree.gen.ts` generated (regenerate ע"י `bun run build`, קרא params דרך `useParams`); yeda רק ע"י המשתמש (אין המצאת יעד/ערך/תאריך).
- **פקודות אימות:** `bun install --frozen-lockfile` → `bun run typecheck` → `bun run test` → `bunx eslint . --rule '{"prettier/prettier":"off"}'` → `bun run build`.
- **פעולה ראשונה מומלצת:** ראה "פעולה מומלצת אחת בלבד" למעלה.
