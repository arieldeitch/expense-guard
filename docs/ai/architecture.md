# Architecture

## Stack

- **Framework:** TanStack Start v1 (SSR-capable full-stack React) + Vite 7.
- **Language:** TypeScript (strict).
- **UI:** React 19 + Tailwind CSS v4 + shadcn/ui primitives.
- **Data:** TanStack Query (client cache) → Supabase (Lovable Cloud) [כשיופעל].
- **Forms:** `react-hook-form` + `zod` (מותקנים).
- **Pkg manager:** Bun.
- **Runtime target:** Cloudflare Workers (edge) — עם `nodejs_compat`.

## מבנה תיקיות (מתוכנן)

```
src/
  routes/                 file-based routing (TanStack)
    __root.tsx            shell + providers + head defaults
    index.tsx             landing / entry
    _authenticated/       gated subtree (integration-managed)
      route.tsx           ssr:false gate → /auth
      dashboard.tsx       ...
    api/public/*          server routes (webhooks בלבד, אם נדרש)
  components/
    ui/                   shadcn primitives (קיים)
    domain/               רכיבים לתחום מסוים (ריצה/כוח/בית)
    shared/               רכיבים חוצי־תחום
  features/               לוגיקה לפי feature (עתידי, אם יגדל)
  hooks/                  hooks כלליים
  lib/
    utils.ts              cn()
    query-options/        queryOptions מרוכזים לפי entity
    validators/           zod schemas משותפים
  integrations/
    supabase/             client, client.server, types (נוצר עם Lovable Cloud)
  styles.css              tokens + tailwind base
  server.ts / start.ts    TanStack Start entry
supabase/
  migrations/             SQL migrations (Lovable Cloud managed)
docs/
  ai/                     מקור אמת + זיכרון סוכן
public/                   נכסים סטטיים
```

## שכבות

1. **Presentation** — `routes/*` + `components/*`. אין fetch ישיר, אין SQL. צורכת queryOptions בלבד.
2. **Query / Cache** — `lib/query-options/*` מגדיר `queryOptions({ queryKey, queryFn })`. ה־`queryFn` קורא ל־server function.
3. **Server functions** — `*.functions.ts` ב־`src/lib/` (או ליד ה־route). קוראים ל־Supabase דרך helper.
4. **Data access** — `src/integrations/supabase/client` בצד לקוח (למקרים ספציפיים כמו realtime); `requireSupabaseAuth` middleware בצד שרת לזרימות מוגנות; `client.server` (service role) רק לפעולות פריבילגיות (יובא בתוך handler).
5. **DB** — Postgres דרך Supabase, RLS מופעל בכל טבלה עסקית, ownership לפי `auth.uid()`.

## Data flow (קריאה)

```
Component → useSuspenseQuery(qo) → queryFn → createServerFn.handler
         → supabase (with bearer via middleware) → RLS → Postgres
```

## Data flow (כתיבה)

```
Component → useMutation({ mutationFn: useServerFn(fn) })
         → invalidateQueries([entity]) on success
         → server function validates (zod) → supabase → RLS
         → audit_log insert (trigger או server-side)
```

## Auth (מתוכנן)

- Lovable Cloud (Supabase managed) — email + password בלבד לשלב ראשון (single-user).
- `_authenticated/route.tsx` — integration-managed gate, `ssr: false`, redirect ל־`/auth`.
- `src/start.ts` — `functionMiddleware` מצרף bearer לכל server fn קריאה.
- root `onAuthStateChange` → `router.invalidate()` + `queryClient.invalidateQueries()` (לא ב־`SIGNED_OUT`).

## Storage (מתוכנן, כשיידרש)

- Bucket פרטי בלבד לקבלות/מדיה של תרגילים.
- Signed URLs בלבד — אין קישורים ציבוריים.
- הגבלות מסוג + גודל נאכפות בשרת (server fn) ולא בלקוח בלבד.

## Routing

- File-based. כל route ב־`createFileRoute("<path>")`. מסלולים חדשים = קבצים חדשים.
- דפי מוצר מוגנים תחת `_authenticated/`.
- אין hash-anchors לניווט בין תחומים — כל תחום = route משלו עם `head()` ייחודי.

## State management

- **Server state:** TanStack Query בלבד. אין העתק ב־localStorage.
- **URL state:** search params של TanStack Router (validated עם zod).
- **Client state:** `useState` / `useReducer` מקומיים. אין Redux/Zustand אלא אם יתגלה צורך אמיתי.
- **Draft state / offline fallback:** localStorage מותר רק לטיוטת טופס פעיל (למשל דיווח סט באמצע אימון) — לא כמקור אמת מקביל.

## Test setup (מתוכנן)

- `vitest` + `@testing-library/react` ליחידות ו־UI.
- Playwright דרך shell לזרימות end-to-end.
- בדיקות RLS: server function tests הרצות מול Supabase local אם נאושר, אחרת query-plan reviews ידניים.

## Deployment

- Lovable hosting. preview URL + published URL אוטומטיים.
- אין _redirects / netlify.toml / vercel.json.
- Cloudflare Workers runtime — הגבלות מפורטות ב־`risks.md`.
