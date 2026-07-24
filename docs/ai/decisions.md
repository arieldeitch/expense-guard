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
