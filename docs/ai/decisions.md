# Architecture Decisions Record (ADR)

רשומה כרונולוגית של החלטות שנקבעו. כל החלטה: הקשר → החלטה → נימוק → השלכה.

---

## ADR-0001 · 2026-07-24 · אימוץ TanStack Start כשלד יחיד

**הקשר:** התבנית מגיעה מ־Lovable עם TanStack Start v1. שקילת החלפה תדרוש עבודה מסיבית.
**החלטה:** נשארים עם TanStack Start + TanStack Router + TanStack Query. אין React Router DOM.
**נימוק:** מוצק ל־SSR, תואם ל־Lovable hosting (Cloudflare Workers), file-based routing, ותמיכה מובנית ב־loaders + Query.
**השלכה:** כל routing ו־data loading לפי הדפוסים של TanStack.

## ADR-0002 · 2026-07-24 · Bun כ־package manager יחיד

**הקשר:** קיים `bun.lock` ו־`bunfig.toml`.
**החלטה:** משתמשים ב־Bun בלבד. אין npm/yarn/pnpm בפרויקט הזה.

## ADR-0003 · 2026-07-24 · Supabase (Lovable Cloud) כ־backend יחיד

**הקשר:** צריך DB + auth + storage. אין רצון להוסיף עלות או ספק חיצוני.
**החלטה:** Lovable Cloud (Supabase managed) — יופעל **רק** כשמתחילים לכתוב דאטה, לא לפני.
**נימוק:** מובנה ב־Lovable, ללא עלות אישית, RLS ראוי לאפליקציה חד־משתמש.

## ADR-0004 · 2026-07-24 · Email + Password לאותנטיקציה (בלבד)

**הקשר:** אפליקציית single-user. אין צורך ב־OAuth ציבורי, magic link, או OTP.
**החלטה:** `supabase.auth.signInWithPassword` בלבד. אין הרשמה ציבורית. חשבון ראשוני נוצר ידנית או תחת flag `VITE_ALLOW_INITIAL_SIGNUP=true`.
**נימוק:** פשטות, בטיחות, ללא תלות שירות מייל חיצוני, ללא UX של המתנה לקישור.

## ADR-0005 · 2026-07-24 · TanStack Query כמקור אמת יחיד לנתוני שרת

**הקשר:** צריך למנוע כפילות state.
**החלטה:** TanStack Query. localStorage מותר רק לטיוטת טופס פעיל (draft של דיווח סט).
**נימוק:** מונע 3 טעויות קלאסיות: caching ידני, stale views, sync bugs.

## ADR-0006 · 2026-07-24 · Soft delete + שתי פעולות למחיקה

**הקשר:** דרישת מוצר קריטית — לא לאבד נתונים.
**החלטה:** `deleted_at timestamptz null` בכל טבלה עסקית. מחיקה = 2 clicks לפחות. מסך "פריטים שנמחקו" עם שחזור.
**נימוק:** מונע אובדן דאטה, מאפשר undo, מייצר trust.

## ADR-0007 · 2026-07-24 · `numeric` בלבד למספרים

**הקשר:** משקלים, מרחקים, זמנים, סכומים — כולם קריטיים לדיוק.
**החלטה:** `numeric(precision, scale)` בלבד. **לא** `float`/`double precision`.
**נימוק:** float יוצר טעויות עיגול שמצטברות בגרפים ובחישובי PR.

## ADR-0008 · 2026-07-24 · יחידה + מקור + timestamp בכל מדידה

**החלטה:** לכל שדה מספרי משמעותי — עמודות משלימות (`unit`, `source`, `recorded_at`).

## ADR-0009 · 2026-07-24 · Raw נפרד מ־derived

**החלטה:** קריאות Suunto ב־`suunto_readings`. מקטעים מחושבים ב־`run_segments`. אף פעם לא מערבבים.
**נימוק:** מאפשר חישוב מחדש עם אלגוריתם עתידי טוב יותר, בלי אובדן המקור.

## ADR-0010 · 2026-07-24 · Mobile-first, RTL, אריחים לפני רשימות

**החלטה:** עיצוב מתחיל מ־mobile viewport. `dir="rtl"` ברמת ה־html. ברירת מחדל לתצוגת רשומות = grid של tiles.

## ADR-0011 · 2026-07-24 · אין שכתוב רחב בשלב הסריקה

**החלטה:** בשלב זה — רק תיקוני בסיס בטוחים (imports שבורים, TS errors, typos). אין refactor. אין מחיקות.

## ADR-0012 · 2026-07-24 · Lovable Cloud לא מופעל בשלב זה

**הקשר:** אין דאטה לכתוב עדיין. Enable יוצר פרויקט Supabase מיידית.
**החלטה:** נדחה עד שיש מיגרציה ראשונה מוכנה. יופעל בתחילת המשימה הבאה ("bootstrap data layer").
**נימוק:** מונע פרויקט Supabase יתום. מונע ניסיון ליצור schema לפני שהמודל אושר.

## ADR-0013 · 2026-07-24 · תיעוד `docs/ai/` הוא מקור האמת

**החלטה:** כל AI/agent עתידי חייב לקרוא את `docs/ai/*` לפני עריכה. שינוי דרישה מהותית — קודם עדכון `product-requirements.md`, אחר כך קוד.

## ADR-0014 · 2026-07-25 · Dark-tinted background, אין `.dark` class

**החלטה:** האפליקציה dark-first. `:root` מגדיר עולם dark-tinted יחיד, ללא toggle. אין `.dark { ... }` block.
**נימוק:** המוצר single-user, אין דרישה לתאורה משתנה, פשטות tokens, ומצווה "אין רקע לבן דומיננטי" מתקיימת by construction. Toggle יתווסף רק בבקשה מפורשת.

## ADR-0015 · 2026-07-25 · Heebo כפונט יחיד (עברית + לטינית)

**החלטה:** `Heebo` (Google Fonts) לכל הממשק — sans + display. Weights 400-900. נטען דרך `<link>` ב־`__root.tsx`.
**נימוק:** תמיכה עברית מצוינת, קריא במובייל, weights רבים (מאפשר heirarchy דרך משקל), חינמי ובטוח. Fallback ל־ui-sans-serif.

## ADR-0016 · 2026-07-25 · Tile כדפוס בסיס מוצרי

**החלטה:** `<Tile>` הוא הרכיב היחיד להצגת "פריט" ברשימה, במטריצה, במסך. variants=domain, tones=(outline|soft|solid), sizes=(sm|md|lg). רשימות טקסט ארוכות אסורות כברירת מחדל.
**נימוק:** דורש `product-requirements.md` §3 ("אריחים לפני רשימות"). מרכזי המימוש → קל להחליף עיצוב בעתיד בקובץ אחד.

## ADR-0017 · 2026-07-25 · צבע דומיין = זהות ויזואלית מובחנת

**החלטה:** לכל דומיין צבע יחודי + soft variant + foreground:
- Running → coral/amber (`--run`)
- Gym → cyan/teal (`--gym`)
- Home → fresh green (`--home`)
- Goals → violet (`--goal`)

**נימוק:** מבחין תחומים ב־glance מבלי לקרוא טקסט. אך **אף פעם לא לבד** — תמיד בליווי icon+label (ראה `risks.md` §צבע כמידע יחיד).

## ADR-0018 · 2026-07-25 · AppShell כמעטפת יחידה — לא layout פר-עמוד

**החלטה:** כל route מייבא `<AppShell>` ומוסר לו `topBar` אם צריך. אין `<html>` / `<body>` / navigation ידניים בעמודים.
**נימוק:** מונע דריפט בין עמודים; שינוי חוצה-מסך נעשה בקובץ אחד; RTL/safe-area מטופלים במרכז.

## ADR-0019 · 2026-07-24 · היררכיית מקורות אמת

**הקשר:** ריבוי מקורות (הנחיות משתמש, `docs/ai/*`, מסמכי Lovable, קוד מדורות קודמים) עלול לסתור.
**החלטה:** סדר עדיפויות מחייב בעת סתירה:
1. הנחיות המשתמש העדכניות.
2. `docs/ai/product-requirements.md`.
3. החלטות מאושרות ב-`docs/ai/decisions.md`.
4. קוד עובד + בדיקות עוברות.
5. מסמכי `LOVABLE_*` (אם קיימים — כרגע **אינם קיימים** ברפו).
6. קוד מדורות קודמים.

**השלכה:** כאשר מסמך/דוח (למשל דוח Lovable) סותר את דרישות המוצר — **לא משנים את הדרישה**, מתעדים את הסתירה ומסמנים migration. הערה: דוח ה-handover של Lovable תיאר מבנה (`domain/data/application/features`, `/search`, `/design-system`, QuickAdd-6, peopleDirectory/transport) שה-audit מצא שאינו תואם לקוד בפועל — הקוד (מקור 4) גובר.

## ADR-0020 · 2026-07-24 · Product Alignment Audit — סריקה ללא שינוי פונקציונלי

**הקשר:** נדרש יישור מוצרי לפני פיתוח נוסף.
**החלטה:** בוצע audit קריאה-בלבד; תיעוד ב-`docs/ai/` (route/entity/design/alignment/migration/session-log); תיקונים בטוחים בלבד (`prefer-const` ×4). אין מחיקת routes/entities, אין שינוי schema/navigation/design, אין חיבור backend, אין פעולות Git מרוחקות.
**נימוק:** ADR-0011 (אין שכתוב רחב בשלב סריקה) + הנחיות המשתמש. **השלכה:** כל החלטה מוצרית שהתגלתה רוכזה תחת `open-tasks.md → Human Decisions Required` במקום ליישום.

## ADR-0021 · 2026-07-24 · goals surface — **פתור**: יעדים מנוהלים לפי domain

**הקשר:** §6 מחייב "יעד מוצג בתוך התחום, אין עמוד יעדים גלובלי".
**החלטה (מאושרת ע"י המשתמש, Phase 1):** **אין מסך יעדים גלובלי בחוויית המשתמש.** יעדים מנוהלים בתוך כל תחום (12 domain-goals routes). `/goals`, `/goals/new`, `/goals/$id` נשמרים **זמנית** כ-compatibility redirects בלבד ומפנים ל-domain המתאים; אינם בניווט. המשתמש בלבד יוצר יעד; אין המצאת ערך/תאריך/milestone.
**נימוק:** תואם §6; שימור מנוע `lib/goals` הבדוק + `DomainPrimaryGoalTile` דרך רכיבים משותפים ללא duplication.
**השלכה:** `DomainPrimaryGoalTile` מחובר ל-3 המסכים; goal detail כולל edit; type-restriction לפי domain (`listGoalTypesByDomain`).

## ADR-0022 · 2026-07-24 · route-gen drift (R-19) — פתור ע"י `useParams`

**הקשר:** `routeTree.gen.ts` שנוצר מחדש ע"י ה-generator המקומי שבר typecheck ב-4 routes שהשתמשו ב-`Route.useLoaderData()` (הוקלד `| undefined`), בעוד הגרסה המחויבת הישנה (generator שונה) לא.
**החלטה:** לא לשחזר generated ישן ולא לערוך אותו ידנית. במקום — לתקן את ה-source: `exercises.$id`, `locations.$id`, `running.$id`, `running.new.$type` עברו לקרוא `id`/`type` מ-`Route.useParams()` (ה-loaders + `notFound()` נשמרו; ערכים זהים).
**נימוק:** `useParams()` מוקלד נכון בעץ הקנוני; אין שינוי התנהגות. **השלכה:** generation דטרמיניסטי (build×2 ללא diff), typecheck ירוק. R-19 סגור.

## ADR-0023 · 2026-07-24 · `typecheck` script + `.gitattributes`

**החלטה:** נוסף `"typecheck": "tsc --noEmit"` ל-package.json (ללא שינוי compiler options). נוסף `.gitattributes` (`* text=auto eol=lf`) לייצוב CRLF (R-17) — **ללא** renormalize גורף (נדחה ל-commit ייעודי אם יידרש).

## ADR-0024 · 2026-07-25 · אכיפת domain isolation ליעדים (לא רק UI filtering)

**הקשר:** יעדים מנוהלים לפי domain; יש למנוע צפייה/עריכה של יעד מתחום אחר במסלול תחום שגוי, ומניעת דריסת ה-domain שמסופק ע"י ה-route.
**החלטה:** **מקור האמת ל-domain הוא הישות** (`goal.domain`), לא ה-route/query-param. helper טהור `goalMatchesDomain(goal, domain)` (`components/goals/goalDomainConfig.ts`) אוכף זאת: `GoalDetailView` ו-`GoalForm` (edit) מסרבים להציג/לערוך יעד שאינו תואם; `updateGoal` שומר domain; יצירה מגבילה סוגים ל-`listGoalTypesByDomain(domain)`; compat `/goals/$id` מפנה לפי `goal.domain`.
**נימוק:** אכיפה ברמת application/view (לא רק סינון רשימה). **השלכה:** נבדק ב-`domain-scope.test.ts`. (בדיקת ה-render של 404/guard נסגרה ב-ADR-0025/0026 — `domainGoalRoutes.test.tsx`.)

## ADR-0025 · 2026-07-25 · שיטוח route modules ל-`*.index.tsx` (route layout nesting)

**הקשר:** ב-flat file routing של TanStack, קובץ `foo.tsx` שקיים לצדו `foo.bar.tsx` הופך **אוטומטית ל-layout parent** של `foo.bar`. הילד מרונדר בתוך ה-`<Outlet />` של האב — ואם לאב אין `Outlet`, תוכן הילד פשוט לא מוצג. הדפוס הזה נוצר בלי כוונה ב-24 יחסי parent-child.

**ראיה:** אף קובץ route בריפו **אינו** מרנדר `<Outlet />` פרט ל-`__root.tsx` (`grep -rln "Outlet" src/routes/`). כלומר אף אחד מה-parents האלה לא נועד להיות layout. הבאג התגלה כשה-router render harness החדש הפיל שתי בדיקות (`/exercises/$id`, `/locations/$id`) שחיפשו טקסט not-found שהיה קיים ב-source אך לא הגיע ל-DOM.

**החלטה:** כל route module המשמש **מסך עצמאי** מומר ל-`*.index.tsx` עם `createFileRoute("/x/")`. סה"כ **24 קבצים** (10 לפני הריסטרט: goals/gym/home/running + וריאנטי goals; 14 בהתאוששות: exercises, exercises.$id, locations, templates, templates.$id, home.templates, home.templates.$id, gym.history, home.history, home.quick, home.sessions.$id, running.$id, running.new, sessions.$id).

**נשארו layouts במכוון:** **רק `__root.tsx`** — הוא ה-shell היחיד עם `<Outlet />` אמיתי. לאחר השינוי `routeTree.gen.ts` מכיל אך ורק `RootRouteChildren`.

**שימור URL:** ה-generator מייצר גם `/x` וגם `/x/` לאותו route, ולכן **כל ה-URLs הציבוריים, ה-redirects וה-compat routes נשמרו ללא שינוי**. אין צורך ב-redirect חדש.

**כלל להמשך:** קובץ route שאין בו `<Outlet />` ושקיימים לו ילדים בשם — חייב להיות `*.index.tsx`. אחרת נוצר layout שקט ששובר את הילדים.

## ADR-0026 · 2026-07-25 · Router tests רצים כל קובץ בתהליך Vitest נפרד

**הקשר:** אחרי הוספת ה-router render harness, הרצת כל `src/test` בהפעלת Vitest אחת לא הסתיימה: hang + `Worker exited unexpectedly`. הבדיקות עצמן עברו.

**מה נבדק ונשלל:** pool `forks` מול `threads` (שניהם נתקעו) · heap יציב (~90–130MB, לא OOM) · custom process runner (`scripts/run-isolated-router-tests.ts`) שהריץ קובץ-לתהליך — **גם הוא לא הסתיים דטרמיניסטית ולכן הוסר**.

**תיקון עובדתי:** ההנחה שנרשמה בשלב ביניים — "כל קובץ עובר בנפרד" — **הייתה שגויה**. מה שעבר בפועל היה **תתי-קבוצות** שנבחרו עם `-t`. הקובץ המלא `systemErrors.test.tsx` (8 בדיקות) נתקע **עקבית**, גם כשהורץ לבדו.

**החלטה:** `systemErrors.test.tsx` פוצל לפי תחומי אחריות לשלושה קבצים — `systemScreens` (root 404 + error boundary), `runningRouteLoaders` (loaders של routes ריצה), `catalogRouteLoaders` (exercises/locations). הפיצול **פתר** את הבעיה: כל חמשת קובצי ה-router עוברים ומסתיימים. הפקודה הקנונית `test:router` היא **רצף `&&` מפורש**, קובץ אחד לכל תהליך Vitest — ללא glob של `src/test`, ללא custom runner, ללא force-exit.

**כיסוי:** ללא הפחתה — 8 הבדיקות עברו verbatim (2+4+2), assertions ללא שינוי. סה"כ router tests: **38**.

**נימוק:** גבול העומס הוא ברמת קובץ-בדיקה בודד; פיצול לפי אחריות הוא גם שיפור מבני לגיטימי בפני עצמו ולא עקיפה. חקירת root-cause נשארת **P2** ואינה חוסמת פיתוח (ראה `risks.md` R-20).

## ADR-0027 · 2026-07-25 · סיום אימון חלקי — `completed` + סטים דולגים

**הקשר:** אימון חלקי הוא מצב לגיטימי ונפוץ. נדרש "status מתאים" לסיום עם סטים פתוחים, בלי לאבד את מה שבוצע ובלי להוסיף status חדש לחוזה.

**החלטה:** `finishSessionPartial(id)` מסמן כל סט שלא הושלם ולא דולג כ**דולג** (`skipSet` משנה דגלים בלבד — הערכים שהוזנו נשמרים), ואז מסיים כרגיל. הסטטוס הסופי הוא **`completed`** — האימון אכן הסתיים. `abandoned` נשאר שמור ליציאה ללא סיום, ו-`draft` לשמירה והמשך.

**נימוק:** אין צורך ב-status חדש (אין שינוי חוזה). ה"חלקיות" נמדדת עובדתית דרך `SessionVolume.completionRate` ו-`skippedSets`, ללא ניסוח שיפוטי. **אין אובדן נתונים** — שום סט אינו נמחק.

**חלופה שנדחתה:** status `partial` נפרד — היה מחייב שינוי חוזה, מיגרציה של נתונים קיימים, וטיפול בכל צרכן קיים (analytics, history, summary) ללא ערך מוסף מדיד.

## ADR-0028 · 2026-07-25 · סטטוס התמדה אמיתי (`PersistenceStatus`)

**הקשר:** `writeSessionsState` **בלע** כשלי כתיבה ל-localStorage (מכסה מלאה / מצב פרטי) ונפל בשקט ל-in-memory. ה-UI הציג "נשמר אוטומטית" קבוע — כלומר הכריז על הצלחה גם כשהנתונים **לא** היו שורדים refresh. זהו סיכון אובדן נתונים אמיתי (R-01).

**החלטה:** ה-store עוקב אחרי `PersistenceStatus = "idle" | "saved" | "memory"` ומודיע ל-subscribers בשינוי. `usePersistenceStatus()` חושף זאת ל-UI. מסך האימון מציג "נשמר במכשיר" **רק** אחרי כתיבה מוצלחת, ואזהרה מפורשת ("לא ישרוד רענון") כשהמצב `memory`. טקסט **ואייקון**, לא צבע בלבד.

**נימוק:** "ה-UI יציג הצלחה רק לאחר שה-Repository אישר שמירה". אין backend, ולכן `saved` = נכתב ל-localStorage; `memory` הוא מצב השגיאה האמיתי היחיד הקיים כרגע.

## ADR-0029 · 2026-07-25 · בניית תוכנית בית — מסך אחד, קטלוג curated

**הקשר:** בניית תוכנית בית דרשה חיפוש בעברית בלבד, בחירה בודדת שסוגרת את החלון אחרי כל תרגיל, ללא קבוצות, ללא "אחרונים", וללא פילטר ציוד. המאגר המלא כולל תרגילי מכון ומטא-דאטה עשיר שאינם רלוונטיים בזמן בחירה מהירה.

**החלטות:**
1. **יצירה ועריכה משתמשות באותו מסך** — `/home/templates/$id/edit`. היצירה כבר עברה דרכו (`createHomeTemplate` → ניווט), ולכן אין Wizard ואין שני מודלי UI.
2. **בחירת תרגיל:** סדר **אחרונים → מועדפים → 6 קבוצות בשפת משתמש** (חזה ודחיפה · גב ומשיכה · רגליים וישבן · ליבה · כתפיים וידיים · גוף מלא ותנועה). חיפוש עברית/אנגלית. פילטר ציוד פשוט בן 5 ערכים.
3. **אין מטא-דאטה מלא ב-picker** — שם עברי, שם אנגלי משני, ציוד וסימון "כבר בתוכנית" בלבד. הוראות/טעויות/מדיה שייכים למסך התרגיל.
4. **בחירה מרובה** לפני סגירה — אישור אחד מוסיף את כל הנבחרים.
5. **קטלוג curated** של 34 תרגילים כברירת מחדל; המאגר המלא נשאר קיים. זהו **סינון תצוגה**, לא מחיקה.
6. **"תרגיל מותאם" נפתח בתוך אותו גיליון** — אין dialog בתוך dialog.
7. ה-picker מומש כאלמנט ממוקם רגיל ולא כ-Radix Sheet — כך הוא **ניתן לבדיקת render** (עוקף את R-21).

**תאימות:** `id` של תרגיל = `stableId("ex", slugify(name_en))`. לכן **אסור לשנות `name_en` של תרגיל קיים** — זה ישנה ID וישבור תוכניות שמורות. נוספו 16 תרגילים חדשים בלבד. נבדק ב-`home-catalog.test.ts`.

**"אחרונים"** נגזר מנתונים קיימים (session entries + template entries) — **ללא storage key חדש**.

## ADR-0030 · 2026-07-25 · מוכנות מקומית ≠ מוכנות בסיס נתונים ענני

**החלטה:** התיעוד יבדיל תמיד בין **local persistence** (localStorage במכשיר אחד) לבין **cloud database**. אין להצהיר "בסיס הנתונים מוכן" כשהאחסון הוא localStorage בלבד.

**מצב עובדתי (2026-07-25):** אין Supabase client · אין `.env` ואין שימוש ב-`import.meta.env`/`process.env` · אין migrations · אין Auth/RLS · `activeRepoKind === "mock"` · 9 מפתחות localStorage · **אין export ואין import/restore** · אין schema-version framework · אין גיבוי לפני שינוי schema · **הנתונים אינם ניתנים להעברה למכשיר אחר**.

**השלכה:** שימוש אמיתי מחר בבוקר בטוח **על מכשיר אחד בלבד**. ניקוי דפדפן, מצב פרטי או מכסה מלאה = אובדן. ראה R-22.

## ADR-0031 · 2026-07-25 · LocalRepository הוא adapter של מודל portable

**החלטה:**
1. **`LocalRepository` (localStorage) הוא adapter זמני** של מודל נתונים portable — לא הפורמט הקנוני. הפורמט הקנוני הוא מעטפת ה-Backup (`workout-data-system`, `schema_version` 1.0.0).
2. **Export/Import הוא מקור ההעברה העתידי ל-Supabase.** אותו קובץ שמשמש גיבוי מקומי ישמש לייבוא לענן, ללא הזנה מחדש.
3. **IDs נשמרים** — ה-`id` המקומי יהיה ה-primary key בענן. אין יצירת מזהים מחדש.
4. **ownership תיקבע בשרת לפי `auth.uid()`** — `owner_id` שבקובץ אינו סמכות הרשאה.
5. **מיגרציות schema מקומיות הן versioned ו-idempotent**, עם snapshot לפני כל כתיבה.

**מדיניות קונפליקטים:** `merge_keep_local` היא ברירת המחדל ואינה דורסת. דריסה (`merge_prefer_backup`) או החלפה (`replace`) דורשות בחירה מפורשת.

**ראה:** `docs/ai/LOCAL_TO_SUPABASE_MIGRATION_CONTRACT.md`.

## ADR-0032 · 2026-07-25 · `safeStorage` — אין כשל כתיבה שקט (תיעוד רטרואקטיבי)

> נכתב 2026-07-26. ה-ADR הוזכר בקוד (`src/lib/storage/safeStorage.ts`) מאז commit `4b2b401` אך לא תועד כאן. התוכן מתאר את מה שממומש בפועל, לא החלטה חדשה.

**הקשר:** שמונה מתשעת מודולי האחסון עטפו את `localStorage.setItem` ב-`catch {}` שקט. מכסה מלאה או מצב פרטי הפילו את הכתיבה, האפליקציה המשיכה מהזיכרון, והמשתמש לא ידע דבר עד לרענון הבא.

**החלטה:** primitive יחיד `safeWriteStorage(key, value)` המחזיר תוצאה typed — `saved` (שורד refresh) · `memory_only` (אין אחסון או מכסה מלאה; הקורא שומר fallback בזיכרון) · `failed` (הערך אינו ניתן לסריאליזציה — אין מה לשמור). כל `writeXState` עובר דרכו ומדווח ל-registry מרכזי דרך `reportWrite(module, result)`. `getWorstStorageStatus()` מחזיר את המצב הגרוע ביותר מבין המודולים.

**כלל מחייב:** **ה-UI אינו רשאי להציג "נשמר" לפני `saved`.**

## ADR-0033 · 2026-07-26 · schema מקומי גרסאי, מיגרציות ו-snapshot

**הקשר:** ל-localStorage לא הייתה גרסה. כל שינוי במבנה נתונים מקומי היה או שינוי שובר בשקט, או קוד coercion מצטבר לנצח. במקביל, כשל הכתיבה **דווח** (ADR-0032) אך הוצג רק במסך Workout Execution — כשל ב-catalog/home/templates/goals/runs/preferences היה בלתי נראה.

### החלטות

1. **`fitlog:storage-meta` הוא metadata בלבד.** מכיל `format` (`workout-data-system-local`), `schema_version`, `updated_at` ורשימת תשעת מודולי האחסון. **אינו מכיל נתוני משתמש** ואינו ממזג מפתחות. תשעת המפתחות (`fitlog:<module>:v<n>`) וכל ה-IDs **אינם משתנים**.
2. **metadata חסר או פגום = `legacy`.** מכשיר שקדם ל-framework עובר מיגרציה; metadata שאינו JSON תקין או שה-`format` שלו זר נחשב חסר. עדיף להריץ מיגרציה idempotent מאשר לנחש.
3. **גרסה עתידית נחסמת.** `schema_version` גבוה מזה שהאפליקציה מכירה (או שאינו ניתן לפענוח) → `future_version_blocked`: **אין נגיעה בנתונים**, אין metadata חדש, והמשתמש מקבל הודעה עובדתית. הנחת "ננסה בכל זאת" הייתה הופכת נתונים חדשים לבלתי קריאים.
4. **registry מפורש, לא גילוי אוטומטי.** `LOCAL_MIGRATIONS` הוא מערך של `{id, from, to, run}` והשרשרת נבנית ממנו. המיגרציה הראשונה `legacy -> 1.0.0` היא **נורמליזציה**: קוראת את כל תשעת המפתחות, מאמתת שכל payload ניתן ל-parse, וכותבת מחדש בסריאליזציה קנונית.
5. **המיגרציות עובדות על מחרוזות גולמיות**, לא דרך ה-repositories. `readCatalogState()` וחבריו מבצעים coercion לטיפוסי המודול ומשמיטים שדות לא מוכרים — בדיוק מה שמיגרציה אסור שתעשה. לכן נוספו `safeWriteRawStorage` / `safeRemoveStorage`.
6. **סדר הפעולות קבוע:** snapshot מאומת → חישוב מלא בזיכרון → הגנת אי-מחיקה → כתיבה → **metadata אחרון**. metadata הוא ההצהרה "הנתונים תואמים לגרסה הזו", ולכן אסור שיקדים את הנתונים.
7. **כשל אינו משאיר מצב ביניים.** כשל ביצירת ה-snapshot או בחישוב → אף מפתח מקור לא נגע. כשל באמצע הכתיבה → `rollbackFromSnapshot` מחזיר את כל המפתחות (מפתח שלא היה קיים — נמחק). בכל מקרה מוחזר `migration_failed`, ה-snapshot **נשמר** כראיה, ו-metadata אינו נכתב.
8. **snapshot המיגרציה נפרד מ-snapshot ה-Restore.** `fitlog:migration-snapshot` מול `fitlog:backup-snapshot:*` (ADR-0031) — מטרות שונות, ואסור שאחד ידרוס את השני. ה-snapshot כולל `checksum` (FNV-1a) ונקרא בחזרה מיד אחרי הכתיבה: snapshot שלא ניתן לאמת אינו גיבוי.
9. **הרצה חוזרת על 1.0.0 היא no-op מלא** — ללא snapshot, ללא כתיבה, ללא metadata חדש.

### התראת אחסון גלובלית

`GlobalStorageBanner` ברמת `__root` (חל על כל המסכים, לא רק על AppShell). מציג התראה **אחת** לפי חומרה יורדת: כשל מיגרציה / גרסה עתידית → כשל כתיבה (`failed`) → `memory_only` → אחסון לא זמין. `memory_only` הוא `role="status"`, `failed` הוא `role="alert"`, ובשניהם אייקון וכותרת מילולית כדי שהחומרה לא תסומן בצבע בלבד. **אין toast בכל שינוי** — זהו banner מתמשך שנעלם כשכתיבה מוצלחת מנקה את ה-registry. מסך האימון אינו מצהיר "נשמר במכשיר" כאשר מודול אחר נכשל.

### מגבלה ידועה (מודעת)

המיגרציה רצה ב-`useEffect` של הרכיב הגלובלי, כלומר **אחרי** ה-render הראשון ואחרי שה-loaders רצו. הרצה מוקדמת יותר (בזמן render) הייתה יוצרת hydration mismatch, כי ב-SSR אין `localStorage`. מכיוון שמיגרציית `legacy -> 1.0.0` **אינה משנה תוכן**, cache של מודול שכבר נקרא אינו יכול להיות שגוי. **מיגרציה עתידית שמשנה תוכן חייבת** לעבור ל-entry ה-client או להוסיף מנגנון ביטול cache למודולים — אחרת תיווצר אי-התאמה בין ה-cache בזיכרון לנתונים בדיסק.

**חלופה שנדחתה:** גרסה פר-מפתח (`fitlog:catalog:v2` וכו') כמנגנון הגרסאות היחיד. היא כבר קיימת בשמות המפתחות אך אינה מספיקה: אין בה נקודה אחת לתיאום, אין snapshot חוצה-מודולים, ואי אפשר לחסום "גרסה עתידית" ברמת המכשיר.

## ADR-0034 · 2026-07-26 · Fake cloud rehearsal הוא תנאי מוקדם למוכנות הגירה

**הקשר:** `LOCAL_TO_SUPABASE_MIGRATION_CONTRACT.md` תיאר טבלת מיפוי, סדר ייבוא ומדיניות קונפליקטים — אך **מעולם לא הורץ**. חוזה שלא הורץ הוא הנחה, לא ראיה. במקביל, הדרך היחידה "לבדוק" אותו באמת נראתה כמו יצירת פרויקט Supabase — כלומר עלות, credentials ו-Auth, לפני שיש החלטה מוצרית.

**החלטה:** בונים **ענן מדומה בזיכרון** (`InMemoryCloudRepository`) ומריצים אליו ייבוא מלא. **אין Supabase, אין SDK, אין SQL, אין רשת, אין env, אין secret, אין עלות.** ה-rehearsal הוא תנאי מוקדם: אין להצהיר על מוכנות להגירה לפני שהוא עובר.

**מה ה-rehearsal מוכיח:**
1. סדר הייבוא **נגזר טופולוגית** ממפת הישויות (`CLOUD_ENTITIES`) ואינו רשימה ידנית — הורה תמיד לפני ילד.
2. ילד עם הורה חסר **נדחה ואינו נכתב**, ומדווח ב-`dependency_failures`.
3. ייבוא חוזר של אותו קובץ הוא no-op מלא: 0 רשומות חדשות, אותן ספירות, אותם קשרים, אותו סדר, אותן חותמות זמן.
4. אותו id עם תוכן שונה הוא **conflict מפורש** — הרשומה הקיימת אינה משתנה, לא נוצר id חדש, ואין כפילות.
5. אוסף שאין לו mapping מדווח כ-`unsupported_entities` ולא נבלע בשקט.

**מה הוא במפורש לא מוכיח:** RLS, Auth, FK constraints של מנוע אמיתי, טרנזקציות, טיפוסי עמודות, רשת, ביצועים. **נדרש עדיין מבחן Import אמיתי מול Supabase עם Auth/RLS.**

**נימוק:** מה שאפשר להוכיח בזול צריך להיות מוכח לפני שמוציאים כסף. אם המודל המקומי אינו עומד בחוזה, עדיף לגלות זאת בבדיקה בזיכרון מאשר מול פרויקט ענן חי.

## ADR-0035 · 2026-07-26 · בעלות ב-Export אינה בעלות הרשאה

**הקשר:** קובץ הגיבוי מכיל `owner_id` (ורוב הישויות) או `user_id` (ב-`Goal`). הערך הנוכחי הוא הקבוע `"single-user"`. הפיתוי המובן הוא להעביר את השדה כמות שהוא לענן.

**החלטה — שלוש שכבות שאסור לבלבל ביניהן:**

| שכבה | מקור | תפקיד |
|---|---|---|
| **record identity** | ה-`id` שבקובץ | שורד את ההגירה **ללא שינוי**. הוא ה-primary key גם בענן. |
| **cloud ownership** | **אך ורק** `authenticatedUserId` | קובע למי הרשומה שייכת. נכתב בשרת לפי ה-session המאומת. |
| **source metadata** | ה-`owner_id`/`user_id` שבקובץ | נשמר תחת `source_metadata.source_owner_id` **לתיעוד בלבד**. |

**אכיפה:** ה-pipeline **מסיר** את שדה הבעלות המקומי מגוף ה-payload וכותב `user_id = authenticatedUserId`. קובץ שהוזן בו `user_id` זר אינו משפיע על הבעלות בענן — יש בדיקה ייעודית לכך. שני ייבואים עם משתמשים שונים מייצרים בעלות שונה לאותם מזהים עסקיים.

**taxonomy מערכתי:** רשומה עם `is_system === true` (muscle groups, תרגילי seed) מקבלת `user_id: null` ואינה בבעלות משתמש. תרגיל מותאם של המשתמש (`is_system: false`) כן מקבל בעלות. זה **מדייק** את טבלת החוזה, שרשמה `auth.uid()` באופן גורף.

**בנוסף:** שדות שנראים כסוד (`token`, `secret`, `api_key`, `service_role`, `password`, `credential` ונגזרותיהם) **לעולם** אינם עוברים ל-payload, גם אם הופיעו בקובץ.

## ADR-0036 · 2026-07-26 · Readiness Gate נגזר מיכולות, לא מוצהר

**הקשר:** קל לכתוב `readinessReport` שמחזיר `true` כי הקוד "קיים". זה בדיוק סוג הביטחון השקרי שמסלול A נועד לחסל — במיוחד כשמדובר בשאלה "האם מותר לי לסמוך על האפליקציה הזו עם הנתונים שלי".

**החלטה:** הפרדה חדה בין **גזירה** ל**ראיה**.
- `buildReadinessReport(evidence)` היא **פונקציה טהורה**. היא רק גוזרת 16 בדיקות ושני gates. אין בה קבוע `true` ואין בה ידע על איך משיגים ראיה.
- `runReadinessAudit()` מייצר את הראיות בכך שהוא **מריץ את היכולות בפועל** — כולל rollback אמיתי אחרי שינוי אמיתי, שתילת גרסה עתידית, מחיקה ושחזור מלאים, ו-rehearsal כפול.
- **ראיה חסרה = `false`.** ריצה שלא בוצעה אינה יכולה לייצר `true`.

**שני ה-gates:**
- `ready_for_single_device_use` — 10 יכולות: דיווח כתיבה מכל 9 המודולים · כשלים גלויים ב-UI · גרסת schema · snapshot · rollback · חסימת גרסה עתידית · Export · Restore · Round-trip · integrity.
- `ready_for_future_supabase_migration_contract` — כל האמור לעיל **וגם** stable ids · idempotency · סדר תלויות · ownership · זיהוי קונפליקטים · rehearsal.

**מגבלה מכוונת:** `runReadinessAudit` **כותב ל-localStorage** ולכן מיועד לסביבת אימות מבודדת (חבילת הבדיקות). אף רכיב UI אינו קורא לו, ואין מסך "מוכנות" באפליקציה. בסיום הוא מחזיר את תשעת המפתחות למצבם.

**חלופה שנדחתה:** לחשב את ה-gate מקיום קבצים/מודולים (`typeof runLocalMigrations === "function"`). זה מוכיח שקוד נכתב, לא שהוא עובד — כלומר בדיוק ההיפך מהמטרה.


## ADR-0037 · 2026-07-31 · אימות הפניות בגיבוי בודק את השדה האמיתי, ואמת ריקה אינה ראיה

**הקשר:** `REFERENCE_RULES` ב-`src/lib/backup/repo.ts` בדק `session_id` עבור `home.entries`, בעוד השדה בפועל הוא `home_session_id` (`HomeExerciseEntry`). הכלל לא ירה מעולם. בנוסף כל כלל דילג בשקט כשאוסף ההורים היה ריק (`if (parents.size === 0) continue`), ולא היה כלל ל-`home.sets -> home.entries`. זהו R-24.

**ההחלטה:**
1. השדה תוקן ל-`home_session_id`, ונוסף כלל `home.sets -> home.entries` על `entry_id`.
2. דילוג ה-`parents.size === 0` הוסר. במקומו נשמרת הבחנה מדויקת יותר: אוסף הורים **שאינו קיים כלל במעטפת** אינו נבדק (מעטפת חלקית אינה ראיה לשבירה), אך אוסף **ריק** כן נבדק — "כל ההורים נעלמו" הוא בדיוק המקרה שנבלע.
3. `dangling_reference` נשאר בחומרת `error`, זהה לחמשת הכללים שכבר עבדו. לא נוצרה מדיניות חדשה — קשרי הבית פשוט מתנהגים כמו קשרי `sessions`.

**שינוי התנהגות מכוון:** קובץ גיבוי שנוצר עד היום ומכיל הפניה שבורה במודול הבית **ייפסל כעת ב-Restore** במקום להתקבל ולייצר רשומות יתומות במכשיר. זו ההתנהגות הנכונה — ייבוא נתונים שבורים גרוע מדחייה מפורשת.

**מה נשמר בתאימות לאחור:** פורמט ה-Export, `schema_version` 1.0.0, מפתחות האחסון, ה-IDs, חתימות ה-API הציבוריות וקודי ה-issue — **ללא שינוי**. גיבוי תקין עובר ומייבא בדיוק כמקודם (מכוסה בבדיקת רגרסיה מפורשת).

**תוצאת לוואי שהתגלתה באימות — תוקנה:** קובץ שנדחה באימות אינו מבצע פעולה כלשהי, ולכן `dependency_order_respected` שלו אמיתי **באופן ריק** ו-`dependency_failures` ריק. `deriveDependencyOrder` ב-`src/lib/readiness/readinessReport.ts` היה מסיק מכך `dependency_order: true` — ראיה חיובית מתוך אפס פעולות, בניגוד ישיר לעקרון ADR-0036 ("ראיה חסרה = false"). נוסף תנאי `first.total_operations === 0 -> false`.

**הגנה כפולה נשמרה:** ה-import pipeline של ה-rehearsal ממשיך לחסום הפניות שבורות דרך גרף התלויות שלו, ללא תלות באימות. הבדיקה שמוכיחה זאת עברה להשתמש ב-`exercise_id` — קשר ש-`REFERENCE_RULES` אינו מכסה — כדי ששכבת ההגנה השנייה תמשיך להיבדק בפועל ולא תוסתר ע"י השכבה הראשונה.

**חלופה שנדחתה:** להוריד את `dangling_reference` ל-`warning` כדי שקובץ שבור ימשיך להתקבל. נדחתה — היא הופכת את האימות להצהרה חסרת שיניים ומחזירה בדיוק את הבעיה שהכלל נועד למנוע.

**סיכון ידוע שנותר (לא נסגר):** אין מסלול "ייבא בכל זאת, דלג על השבורים". משתמש שכל הגיבוי שלו שבור אינו יכול לשחזר ממנו דבר. זה **לא** טופל כאן — הוא דורש UI והחלטת מוצר. מתועד ב-`open-tasks.md` וב-R-25.

## ADR-0038 · 2026-07-31 · הסכם עבודה — פרומפטים באנגלית ואוטונומיה מלאה

**ההחלטה (הנחיית המשתמש):** כל הפרומפטים העתידיים ל-Claude Code ייכתבו **באנגלית**, ו-Claude יקבל **אוטונומיה מרבית — ללא בקשות אישור מצטברות** במהלך משימה.

**מה זה כן אומר:** אין לעצור באמצע כדי לאשר צעדים הפיכים — עריכות קוד, בדיקות, commit, push לענף קיים, עדכוני תיעוד ותיקוני באגים שהתגלו תוך כדי אימות. יש להשלים את המשימה עד הסוף ולדווח בסיום.

**מה זה אינו מבטל:** כללי `CLAUDE.md` הגלובליים ו-`AGENTS.md` נשארים בתוקף במלואם. עצירה נדרשת רק עבור: credentials או גישה חיצונית חסרים · עלות חדשה · פעולה בלתי הפיכה בפרודקשן · אובדן נתונים הרסני · חשיפה או החלפה של secret · **החלטת היקף מוצרית מהותית**. Approval Brief עדיין נדרש לשינויי Supabase/auth/RLS/schema/migrations/env/deploy.

**שפת התיעוד לא השתנתה:** `docs/ai/` נשאר בעברית. ההחלטה נוגעת לשפת הפרומפט בלבד.

## ADR-0039 · 2026-07-31 · קריאת אחסון מקומי ב-render נדחית עד אחרי ה-hydration

**הקשר:** האפליקציה מוגשת ב-SSR (TanStack Start + nitro). בשרת **אין `localStorage`**, ולכן כל מסך מבוסס-נתונים מרונדר בשרת כ**ריק**. ה-hooks של המודולים משתמשים ב-`useSyncExternalStore` עם `getServerSnapshot` תקין — אבל **מתעלמים מערך ההחזרה** ומשתמשים בו רק כמנגנון מנוי:

```ts
export function useHomeSessions() {
  useHome((s) => s.sessions);   // ערך ההחזרה נזרק
  return listHomeSessions();    // קורא localStorage ישירות
}
```

בזמן ה-hydration React משתמש ב-`getServerSnapshot` (ריק), אך `listHomeSessions()` קורא את `localStorage` ומחזיר נתונים אמיתיים. התוצאה: **`Hydration failed because the server rendered text didn't match the client`** בכל מסך שיש בו נתונים, ו-React מרנדר את כל תת-העץ מחדש.

**נמדד בדפדפן אמיתי (Chrome 150, headless, CDP) לפני התיקון:** שגיאת hydration ב-`/home`, `/home/history`, `/home/sessions/$id`, `/backup`, `/gym/history`, `/gym/compare`, `/home/quick`. עם אחסון ריק אין שגיאה — ולכן היא **לא התגלתה** בבדיקות (שרצות ב-jsdom ללא SSR) ולא ב-audit קודם.

**ההחלטה:** `useHydrated()` (`src/lib/storage/useHydrated.ts`) — `useSyncExternalStore` שמחזיר `false` ב-SSR **וב-render ה-hydration**, ו-`true` רק אחרי ה-mount. כל hook או רכיב שקורא את ה-repository ב-render מחזיר ערך ריק עד שה-hydration הסתיים, ואז React מבצע עדכון רגיל עם הנתונים האמיתיים.

**שכבת render בלבד.** `readXState()`, `commit()` וכל פונקציות ה-repository ממשיכות לקרוא ולכתוב נתונים אמיתיים תמיד — מטפלי אירועים, mutations ו-loaders **אינם מושפעים**. אין שינוי ב-persistence, ב-schema, במפתחות או ב-IDs.

**איפה הוחל:** `home`, `sessions`, `runs`, `goals`, `templates`, `suunto` (hooks) + `home.index.tsx`, `home.quick.index.tsx`, `gym.history.index.tsx`, `gym.compare.tsx`, `backup.index.tsx` (קריאות ישירות ל-repository/analytics ב-render).

**איפה **לא** הוחל, במכוון — `exercises` ו-`catalog`:** בשרת `readExercisesState()` מחזיר קטלוג **מזורע** (seed), ולא ריק. גידור ל-`[]` היה **יוצר** אי-התאמה חדשה במקרה הנפוץ. הפער הנותר צר: רק אחרי שהמשתמש **מתאים אישית** את הקטלוג (מועדפים, תרגיל מותאם, מחיקה) ייתכן הבדל בין השרת ללקוח. מתועד כ-R-27.

**חלופה שנדחתה — לכבות SSR למסלולים האלה.** היא פותרת את הבעיה מהשורש (לשרת אין ולא יהיו נתונים), אך זו החלטה ארכיטקטונית שמשנה את התנהגות ה-deploy, ולכן דורשת החלטה מפורשת. נרשמה כאפשרות ב-`open-tasks.md`.

**חלופה שנדחתה — גידור גלובלי בתוך `readXState()`.** היה פותר הכול בעריכה אחת למודול, אבל היה משקר גם ל-**route loaders** (שרצים לפני ה-render) ועלול לגרום ל-`notFound()` שגוי ולכתיבת state ריק. שכבת ה-hook בטוחה יותר.