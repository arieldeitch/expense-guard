# Fit Log — Project Status

**Last verified:** 2026-08-01 19:02 Asia/Jerusalem (UTC+03:00)
**Verified against:** working tree at commit `36b0453`, inspected directly — not carried over from chat history.

> **Reading order.** This file plus [`SESSION_HANDOFF.md`](./SESSION_HANDOFF.md) are the entry point for a new session.
> The detailed Hebrew record remains authoritative for history and product rules:
> [`current-state.md`](./current-state.md), [`decisions.md`](./decisions.md), [`risks.md`](./risks.md),
> [`open-tasks.md`](./open-tasks.md), [`change-log.md`](./change-log.md),
> [`product-requirements.md`](./product-requirements.md).
> Where this file and an older Hebrew section disagree about *current* state, **this file wins**; for product
> rules and history, the Hebrew files win.

---

## 1. Live application

| | |
|---|---|
| URL | **https://fitlog-workout.lovable.app** |
| Lovable project | **Fit Log** |
| Published | Yes — Phase 1 code is live |
| User workflow | **Claude Code and Lovable only.** No external CLI, dashboard, or IDE (`AGENTS.md`) |

## 2. Git state — verified

| | |
|---|---|
| Branch | `main` |
| HEAD | **`36b0453`** |
| `origin/main` | **`36b0453`** |
| Ahead / behind | `0 / 0` |
| Working tree | clean, no untracked files |
| HEAD subject | `fix(supabase): close R-35 on the generated types, and drop a duplicate migration that would break db reset` |
| Preceding commit | `d479acd` — `Realigned to fusrapommtdqwfglkmks` |

Other branches on the remote (preserved, not merged targets): `chore/supabase-authoritative-switch`, `feat/supabase-phase1`, `feat/domain-alignment-and-restore`, `feat/home-plan-simple-flow`.

## 3. Authoritative backend

| | |
|---|---|
| Project ref | **`fusrapommtdqwfglkmks`** |
| Type | Lovable-managed Supabase |
| Region | `eu-north-1` |
| Decision | **ADR-0040** |
| `supabase/config.toml` | `project_id = "fusrapommtdqwfglkmks"` — verified |
| `.env` | platform-managed; **not hand-edited** |

> ⚠️ **`nhnuuooyxamkkqqpcgmk` is SUPERSEDED.** It must remain **untouched** — not deleted, not disconnected,
> not modified. Do not reconnect to it. It appears in `docs/ai/*.md` only as historical record; it appears in
> **no** source file, config, or migration (verified).

## 4. Phase 1 — implementation status

**Implemented, migrated, published, and partially verified.** Authenticated end-to-end verification is **not** complete (§8).

| Area | State | Evidence |
|---|---|---|
| Email/password Auth | ✅ implemented | `src/lib/supabase/session.ts` |
| Session inspection | ✅ | `getSession`, `getAuthState`, `getCurrentUser` |
| Sign-up / sign-in / sign-out | ✅ | `signUp`, `signIn`, `signOut` |
| Idempotent profile creation | ✅ | `ensureProfile()` — client-side, no `auth.users` trigger |
| `profiles` + `goals` tables | ✅ applied | `supabase/migrations/20260801061825_486870dc-0260-4071-96de-b93bc78f7927.sql` |
| RLS | ✅ SELECT / INSERT / UPDATE | 2 × `enable row level security`, 6 policies, all `auth.uid()`-scoped |
| DELETE policy | ✅ **none, by design** | 0 `for delete` policies — soft delete only |
| Supabase repository adapter | ✅ | `src/lib/repo/supabase.ts`, selected via `resolveRepository()` |
| Local repository fallback | ✅ active | `src/lib/repo/index.ts` — falls back when unconfigured / signed out / erroring |
| Explicit goal upload | ✅ | `src/lib/sync/` — never automatic |
| Stable local IDs as cloud PKs | ✅ | `goals.id text primary key`, never regenerated |
| Sync state, stored separately | ✅ | `fitlog:sync-state:v1` — not a `StorageModule` |
| Generated types in use | ✅ (R-35 closed) | `src/integrations/supabase/types.ts`; the hand-written shim is deleted |

### Local-first and signed-out behaviour

- The app is **fully usable signed out**; that is its state right now.
- `localStorage` remains the primary store. **No `fitlog:*` domain key has been read destructively, rewritten, cleared, or removed.**
- **The user's real local data has never been uploaded.** Upload is explicit and has not been run against a real session.
- Backup/export format is unchanged and remains compatible.

## 5. Schema and RLS summary

Two tables, `public.profiles` and `public.goals`.

- `profiles.id` → `auth.users(id)`, cascade on delete.
- `goals.id` is `text primary key` — the stable localStorage id.
- `goals.user_id uuid not null default auth.uid()` — a client cannot forge ownership.
- Full local record preserved losslessly in `goals.payload jsonb`; `source_metadata` holds the local owner as **documentation only**, never as authorisation.
- Sync columns: `updated_at`, `client_updated_at`, `content_checksum`, `op_id`.
- `numeric` throughout; no `float` / `real` / `double precision`.
- `GRANT` is `select, insert, update` only. See **R-37** on DELETE privileges not being explicitly revoked.
- **No trigger on `auth.users`** — profile rows are created client-side by `ensureProfile()`.

## 6. Verified test and build baseline

> **Not re-run during this documentation task.** These figures were measured at **commit `36b0453`** — the
> commit currently checked out — during the session of 2026-08-01 (ד). No code has changed since, so the
> baseline still applies. Source: `docs/ai/change-log.md`, entry 2026-08-01 (ד).

| Check | Result |
|---|---|
| `bun install --frozen-lockfile` | passed, no changes |
| `bun run typecheck` | passed (also after build) |
| Unit tests | **355 passing across 24 files** |
| Router tests | **61 passing across 10 files** |
| **Total** | **416 passing** |
| Focused: Auth, generated types, repository, RLS, import, dedup, sync-state, fallback | passing (41) |
| Backup, storage, migration | **99 passing** |
| Selector / repository-contract | **12 passing** |
| `bun run build` | passed |
| Secret scan | clean |
| Live routes | HTTP 200 |
| Locally served production routes | HTTP 200 with SSR HTML |
| Superseded ref in live HTML and chunks | absent |
| Authoritative ref in live runtime | present |
| Signed-out local fallback | works |
| Backup round-trip | passes |

Structural counts re-confirmed during this documentation pass: **24** unit test files under `src/lib`, **10** router test files under `src/test`.

## 7. Deployment and publication facts

- Lovable publishes the live app; **a GitHub push alone does not trigger a rebuild** (measured previously).
- Lovable injects Supabase runtime environment values at build time, and those **override** repository `.env` (ADR-0040).
- `.env` is platform-managed and must not be hand-edited to point elsewhere.
- Git remains the source of truth for **code and migrations**; `docs/ai/` is the persistent project memory.

## 8. Outstanding blocker — exact

**Authenticated verification is blocked by email confirmation.**

- Email/password signup is **enabled**.
- Email confirmation is **currently required** — `mailer_autoconfirm: false`.
- A disposable, clearly labelled unconfirmed test user was created; **no authenticated session was returned**.
- Claude had **no mailbox access and did not invent confirmation**.
- **Cross-user authenticated RLS verification remains incomplete.**

**This setting has NOT been changed.** Do not record or assume otherwise.

Still unverified, and must not be claimed: authenticated profile creation, authenticated goal upload, duplicate prevention against a real database, per-user uploaded-ID tracking, User A ↔ User B isolation in both directions, signed-out fallback after a real session ends, and absence of silent local mutation during a real upload.

## 9. Phase 2 — not started

**No Phase 2 work has begun, and none may begin before authenticated Phase 1 verification succeeds.**

Explicitly out of scope today: run sync · strength workout sync · home exercise sync · template sync · exercise catalog sync · location/equipment sync · dashboard cloud state · realtime · Storage buckets · Edge Functions · social Auth · magic links / OTP · full conflict-resolution UI · full multi-device sync · Phase 2 schema · migration of the user's real local data.

## 10. Known baseline issues

| ID | Summary |
|---|---|
| **R-33 / R-17** | Large pre-existing CRLF/Prettier lint failure that predates Supabase work. Fixing it causes broad unrelated churn. **Do not normalize the repository.** |
| **R-30** | Generated route-tree ordering drift between the local and Lovable generators. Route **set** is identical (55 modules, 79 paths). **Do not commit ordering-only churn.** |
| **R-37** | DELETE privileges never explicitly revoked, though RLS is on and there is no DELETE policy. Anonymous DELETE affected **zero rows**. Observation, not a blocker. **Do not weaken RLS or add a DELETE policy to simplify cleanup.** |

## 11. Product constraints held authoritative

Less talking, more data · self-comparison only · no social ranking · no motivational cheerleading · no guilt-based language · mobile-first · one-handed use · quick data entry · partial workouts are valid data · work travel is a normal context · raw data must not be overwritten · no significant one-click deletion · local data must never be silently deleted · no new cost, subscription, service, dependency, or plan upgrade without explicit approval · Supabase introduced gradually · local-first and backward compatibility preserved.
