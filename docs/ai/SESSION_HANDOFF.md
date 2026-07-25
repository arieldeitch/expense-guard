# Session Handoff

> מסמך מעבר בין sessions. נכתב לסגירה בטוחה לפני restart. מבוסס על **ראיות repo בלבד**
> (2026-07-25, HEAD `16f4444`). מסמכי מקור האמת האחרים (lowercase) נשארים סמכותיים; זה
> מסמך handoff שמצביע עליהם — לא מקור אמת מתחרה.

## תאריך ומטרת ה-session
- **תאריכים:** 2026-07-24 → 2026-07-25.
- **מטרה:** ביצוע Phase 1 (יישור ניווט/route/copy + יעדים לפי domain) ו-Phase 2 (trash/restore מלא), ואז סגירת session בטוחה.

## Branch / Commit — התחלה וסיום
- **Branch:** `feat/domain-alignment-and-restore` (נוצר מ-`main`@`eca9163`).
- **HEAD בסיום:** `16f4444` — `fix(ui): localize system errors and stabilize route generation`.
- **שרשרת commits (מהחדש לישן):**
  - `16f4444` fix(ui): localize system errors and stabilize route generation
  - `f66b411` feat(trash): wire restore for sessions and goals
  - `1288e5b` feat(goals): scope goal surfaces to workout domains
  - `eca9163` docs(ai): add product alignment audit and migration plan  ← גם ראש `main` המקומי
  - `82de6bf` בנה מערכת יעדים אישית  ← (origin/main)
- **מצב מול remote:** `origin` = `https://github.com/arieldeitch/expense-guard.git`. ל-`feat/domain-alignment-and-restore` **אין upstream** ו**אינו קיים ב-origin** (לא בוצע push). `main` המקומי (`eca9163`) **מקדים ב-1** את `origin/main` (`82de6bf`) — גם הוא לא נדחף.

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
| Tests | `bun run test` (vitest) | ✅ **PASS** — 12 קבצים, **158/158** |
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
- **loaders + `notFound()` של 4 ה-routes שתוקנו**: נשמרו ב-source (לא נגעתי בגוף ה-loaders), אך **אין טסט executable** שמוכיח שהם עדיין רצים/זורקים. → פתוח ב-`open-tasks.md`.
- **domain-isolation ברמת route** (כניסה ל-`/running/goals/$id` עם יעד gym): קיים guard `goal.domain !== domain` ב-`GoalDetailView`, **ללא טסט**.
- **מזהה חסר/שגוי** ב-routes תחומיים ובקומפט: התנהגות 404 קיימת בקוד, **ללא טסט**.

## סיכונים פעילים (ראה `risks.md`)
- **R-17** CRLF/lint מקומי — פעיל (מיטיגציה: `.gitattributes` נוסף; renormalize גורף נדחה).
- R-01 אובדן נתונים, R-09 תלות ספק (Suunto), R-12 Cloudflare runtime, R-13 secret leakage — פעילים כרגיל.
- **R-18, R-19 — נסגרו** ב-session זה.

## מחוץ להיקף (במפורש)
- אין חיבור Supabase/Auth/RLS/Storage; אין migrations; אין deploy; אין secrets; אין שינויי production. **אין עלות חדשה נוצרה.**
- לא הותקנו dependencies חדשים (כולל `@testing-library`).
- לא בוצע push / rebase / force-push / מחיקת branches.

## פעולות ידניות שעדיין נדרשות
- **החלטת push/PR**: `feat/domain-alignment-and-restore` מקומי בלבד. push דורש הרשאת auth + מדיניות (הנחיות קודמות אסרו push). גם `main` המקומי מקדים את origin ב-commit ה-audit. אם רוצים לשמר בענן — לדחוף ידנית או לפתוח PR (החלטת משתמש). כניסה אינטראקטיבית: `! git push -u origin feat/domain-alignment-and-restore`.

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
- **מצב:** Phase 1+2 הושלמו ו-committed ב-branch `feat/domain-alignment-and-restore` (HEAD `16f4444`), **לא pushed**. working tree נקי.
- **כללי ברזל:** soft-delete בלבד; אין עלות/secret/Supabase/Auth/RLS ללא Approval Brief מפורש (ראה `CLAUDE.md` הגלובלי + `AGENTS.md`); `routeTree.gen.ts` generated (regenerate ע"י `bun run build`, קרא params דרך `useParams`); yeda רק ע"י המשתמש (אין המצאת יעד/ערך/תאריך).
- **פקודות אימות:** `bun install --frozen-lockfile` → `bun run typecheck` → `bun run test` → `bunx eslint . --rule '{"prettier/prettier":"off"}'` → `bun run build`.
- **פעולה ראשונה מומלצת:** ראה "פעולה מומלצת אחת בלבד" למעלה.
