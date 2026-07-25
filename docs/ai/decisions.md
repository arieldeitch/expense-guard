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
**נימוק:** אכיפה ברמת application/view (לא רק סינון רשימה). **השלכה:** נבדק ב-`domain-scope.test.ts`. (בדיקת ה-render של 404/guard עצמה דורשת router harness — פתוח ב-`open-tasks.md`.)
