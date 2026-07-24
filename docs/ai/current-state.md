# Current State — מצב הפרויקט

תאריך סריקה: 2026-07-24

## סיכום מנהלים

הפרויקט נמצא כרגע במצב **תבנית ריקה של Lovable / TanStack Start**. אין קוד מוצר: אין מסכי אימון, אין מודל דאטה, אין Supabase, אין auth, אין תיעוד מוצרי קודם. הריפו מכיל את שלד ה־framework בלבד + ספריית shadcn UI מוכנה לשימוש.

**משמעות:** אין מה "לתקן" או "לשכתב". השלב הבא הוא בנייה מאפס לפי הדרישות ב־`product-requirements.md`.

## מה קיים בפועל

### Framework / Build
- **TanStack Start v1** + Vite 7 + React 19.
- **TypeScript** (`tsconfig.json` תקין, strict מופעל דרך `@tsconfig/*` — לבדוק בעת הצורך).
- **Tailwind v4** דרך `src/styles.css` (native `@import "tailwindcss"`).
- **Bun** כ־package manager (`bun.lock`, `bunfig.toml`).
- ESLint + Prettier מוגדרים.

### Routes
- `src/routes/__root.tsx` — root layout עם QueryClientProvider, HeadContent, NotFound + Error boundaries. **מטא־דאטה עדיין ברירת מחדל של Lovable** ("Lovable App" / "Lovable Generated Project") — יש להחליף כשיוגדר שם המוצר.
- `src/routes/index.tsx` — **placeholder ריק** (`data-lovable-blank-page-placeholder`). לא מוצר.
- `src/routeTree.gen.ts` — נוצר אוטומטית.

### Components
- `src/components/ui/` — **46 קבצי shadcn/ui** מוכנים (accordion, alert-dialog, button, dialog, form, input, select, sheet, tabs, toast, ועוד). זמינים לשימוש, אין מפגש עם דרישות המוצר עדיין.
- **אין** רכיבי מוצר (`components/domain`, `components/features` וכו').

### Hooks / Lib
- `src/hooks/use-mobile.tsx` — hook בסיסי.
- `src/lib/utils.ts` — `cn()` (shadcn).
- `src/lib/error-capture.ts`, `error-page.ts`, `lovable-error-reporting.ts` — תשתית שגיאות של Lovable.

### Integrations / Backend
- `src/integrations/` — **ריק** (התיקייה עצמה קיימת אך בלי קבצים).
- `supabase/` — **לא קיימת**. אין client, אין migrations, אין types, אין edge functions.
- אין `@supabase/supabase-js` ב־`package.json`.

### Auth
- **לא קיים**. אין login, אין guard, אין session state.

### State Management
- **TanStack Query** מותקן וקשור ב־root, אך אין queryOptions או queries בפועל.
- **אין** Redux/Zustand/Jotai. אין צורך כרגע.

### Testing
- **אין קבצי בדיקות** בפרויקט. אין `vitest`/`playwright` config של המשתמש.
- אין CI מוגדר בריפו (לא מצאתי `.github/workflows/`).

### Assets / Media
- `public/favicon.ico` בלבד.
- אין `src/assets/`.

### Env
- **אין** `.env.example`, `.env`, או `.env.*.local`.
- אין secrets מוגדרים דרך Lovable (יש לאמת ב־`fetch_secrets` כשיידרש).

### Docs
- `README.md` — תבנית Lovable ברירת מחדל.
- `AGENTS.md` — הערת Lovable על git בלבד.
- `src/routes/README.md` — הסבר routing של TanStack.
- **אין** `docs/` — נוצר עכשיו במסגרת המשימה.

## מצב לפי מודול

| מודול | סטטוס | הערות |
|---|---|---|
| Routing | ✅ עובד | placeholder בלבד ב־`/` |
| Root layout / providers | ✅ עובד | מטא־דאטה גנרית |
| UI primitives | ✅ מוכן | shadcn מלא, טרם בשימוש מוצרי |
| Auth | ❌ אין | לבנות (Lovable Cloud email+password) |
| Backend / DB | ❌ אין | להפעיל Lovable Cloud כשמתחילים דאטה |
| Data model | ❌ אין | ראה `data-model.md` |
| Screens (אימון) | ❌ אין | אף מסך מוצרי לא קיים |
| Forms / validation | ❌ אין | `zod` + `react-hook-form` מותקנים |
| Media / receipts / assets | ❌ אין | |
| Offline | ❌ אין | לא בהיקף מיידי |
| Analytics | ❌ אין | לא בהיקף מיידי |
| i18n / RTL | ⚠️ חסר | לא הוגדר `dir="rtl"` ולא i18n; נדרש בשלב עיצוב |
| Error handling | ✅ בסיסי | boundaries קיימים ב־root |
| Loading / empty states | ❌ אין | אין תוכן להציג עדיין |
| Tests | ❌ אין | להוסיף כשיהיה קוד מוצרי |

## חיבורים קיימים

אין. אין קריאות רשת, אין Supabase, אין API חיצוני.

## מסכים

| מסך | קיים? | סטטוס |
|---|---|---|
| `/` | כן | placeholder של Lovable |
| כל השאר | לא | — |

**אין** מסכים לא בשימוש, אין nav routes שבורים, אין רכיבים כפולים — כי אין קוד מוצרי כלל.

## חסמים אמיתיים

1. **דרישות המוצר מונחות לפני קוד** — זו נקודת הזינוק. אין חסם טכני, יש חסם החלטה: מאיפה מתחילים (ריצה / חדר כושר / בית)?
2. **Supabase לא מופעל** — יופעל דרך `supabase--enable` כשמתחילים לבנות דאטה. אין חשבון קיים לחבר.
3. **RTL / i18n חסרים** — צריך להיקבע בתחילת שלב העיצוב.
4. **מטא־דאטה גנרית** — יעודכן כשייקבע שם המוצר.

## רמת מוכנות לכל שלב

| שלב | מוכנות |
|---|---|
| תיעוד דרישות | ✅ 100% (מסמך זה + `product-requirements.md`) |
| Design system | 🟡 בסיס shadcn — צריך התאמה RTL/עברית והחלטות ויזואליות |
| Auth | 🔴 טרם התחיל |
| Data layer (Supabase + schema) | 🔴 טרם התחיל |
| מסכי ריצה | 🔴 טרם התחיל |
| מסכי חדר כושר | 🔴 טרם התחיל |
| מסכי בית | 🔴 טרם התחיל |
| AI / הצעות | 🔴 טרם התחיל |
| בדיקות | 🔴 טרם התחיל |

## תיקונים שבוצעו בסריקה הזו

אף אחד. לא נמצאו imports שבורים, routes שבורים, שגיאות TypeScript, typos שמונעים build, או references לקבצים חסרים. הבסיס נקי.
