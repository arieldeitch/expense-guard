# Architecture

## Stack

- **Framework:** TanStack Start v1 (SSR-capable full-stack React) + Vite 7.
- **Language:** TypeScript (strict).
- **UI:** React 19 + Tailwind CSS v4 + shadcn/ui primitives.
- **Data:** TanStack Query (client cache) → Supabase (Lovable Cloud) [כשיופעל].
- **Forms:** `react-hook-form` + `zod` (מותקנים).
- **Pkg manager:** Bun.
- **Runtime target:** Cloudflare Workers (edge) — עם `nodejs_compat`.

## מבנה בפועל (מאומת 2026-07-24) מול המתוכנן

> ה-audit גילה שהמבנה בפועל **שונה** מהמתוכנן למטה. המימוש אינו לפי `domain/data/application/features` אלא לפי **feature-folder פר-תחום תחת `src/lib/`**:
> ```
> src/lib/<domain>/   (runs, suunto, catalog, exercises, templates,
>                      sessions, home, goals, preferences, analytics)
>   types.ts schemas.ts storage.ts repo.ts hooks.ts selectors.ts seed.ts index.ts
> src/lib/repo/        חוזה Repository מאוחד (façade קריאה-בלבד, mock) — התפר ל-Supabase
> src/lib/analytics/   derived טהור, ללא persistence
> src/components/<domain>/  קומפוננטות UI פר-תחום
> src/components/{shell,tile,ui}/  מעטפת + Tile + shadcn primitives
> src/routes/          41 route modules (file-based)
> ```
> **Persistence אמיתי:** localStorage (`fitlog:<domain>:v<n>`), דפוס `useSyncExternalStore`. לא TanStack Query עדיין (מותקן, לא בשימוש לנתונים). זהו מצב ביניים תקין לפני Supabase — ראה `migration-plan.md` Phase 11-12. הבלוק "מתוכנן" למטה נשאר כיעד ל-server state.
>
> **Goals UI (Phase 1):** רכיבים משותפים ב-`src/components/goals/` (`goalLinks`, `goalDomainConfig`, `GoalForm`, `GoalsListView`, `GoalDetailView`, `GoalDomainChooser`, `DomainPrimaryGoalTile`) מוזרקים ל-12 domain-goals routes (`{running,gym,home}.goals.*`) — ללא duplication. `/goals*` = compatibility redirects בלבד. **Route params:** קרא `id`/`type` דרך `Route.useParams()` (לא `useLoaderData`) כדי להתאים ל-route tree הקנוני (ADR-0022).

## מבנה תיקיות (מתוכנן — יעד ל-Supabase/server-state)

```
src/
  routes/                 file-based routing (TanStack)
    __root.tsx            <html lang="he" dir="rtl">, HeadContent, providers
    index.tsx             / — Home dashboard
    running.tsx           /running
    gym.tsx               /gym
    home.tsx              /home (בית + משקל גוף)
    more.tsx              /more
    _authenticated/       (עתידי) gated subtree — integration-managed
    api/public/*          (עתידי) server routes (webhooks בלבד)
  components/
    ui/                   shadcn primitives
    shell/                AppShell, Nav (Bottom+Side), PageHeader, EmptyState
    tile/                 Tile + variants (המחצית המרכזית של השפה החזותית)
    domain/               (עתידי) run/gym/home-specific composites
  features/               (עתידי) לוגיקה לפי feature
  hooks/                  hooks כלליים
  lib/
    utils.ts              cn()
    query-options/        (עתידי) queryOptions מרוכזים
    validators/           (עתידי) zod schemas
  integrations/
    supabase/             (עתידי) client, client.server, types
  styles.css              tokens + tailwind base + utilities
  server.ts / start.ts    TanStack Start entry
supabase/                 (עתידי) migrations
docs/ai/                  מקור אמת + זיכרון סוכן
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
