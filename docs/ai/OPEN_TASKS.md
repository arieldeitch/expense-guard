# Fit Log — Open Tasks

**Last verified:** 2026-08-01 19:02 Asia/Jerusalem · at commit `36b0453`

> Prioritized and dependency-aware. The Hebrew [`open-tasks.md`](./open-tasks.md) remains the historical
> backlog (T-01…T-05 and older items); this file is the **active, ordered** view.
> Deferred scope below is **not** active work and must not be started early.

---

## BLOCKING — must happen first, in this order

### B1. Temporarily disable email confirmation in Lovable
**Owner:** user (Lovable) · **Blocks:** B2, B3, B4, B5 · **Status:** open, not done

Email confirmation is currently required (`mailer_autoconfirm: false`), so signup returns no session and no
authenticated test is possible. The copy-ready instruction is in
[`SESSION_HANDOFF.md` §12](./SESSION_HANDOFF.md).

**This has not been done.** Do not assume otherwise.

### B2. Run authenticated two-user Phase 1 verification
**Owner:** Claude (next session) · **Depends on:** B1 · **Status:** blocked

Create **two** clearly labelled disposable users and only minimal disposable records, then verify:

- authenticated profile creation — exactly one `profiles` row per user
- authenticated goal upload through the real application flow
- stable local goal ID preserved as the cloud primary key, full payload intact
- `user_id` derived from the authenticated session, not from the file
- idempotency: a second upload is a no-op — no duplicate, no overwrite
- per-user uploaded-ID tracking in `fitlog:sync-state:v1`
- **User A cannot read User B's profile**
- **User A cannot read User B's goals**
- **User A cannot update User B's records**
- **User B cannot read or update User A's records**
- anonymous access remains blocked
- sign-out returns the app to the local repository fallback
- **no existing local data is cleared, rewritten, or silently uploaded**
- backup export and validation remain compatible

### B3. Restore the intended email-confirmation setting
**Owner:** user (Lovable) · **Depends on:** B2 · **Status:** pending

If the approved plan requires confirmation to be on in production, re-enable it after B2 completes. Record
the final intended state so it is not left ambiguous.

### B4. Record evidence, close or update risks
**Owner:** Claude · **Depends on:** B2 · **Status:** pending

Update [`RISKS.md`](./RISKS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) and the Hebrew record with the
measured results. **Do not close a risk without evidence.** Directly affected: **R-36**, **R-38**, **R-39**.

### B5. Clean up disposable test data
**Owner:** Claude · **Depends on:** B2 · **Status:** pending

Remove disposable test records and users **only through safe supported means**. Never weaken RLS and never
add a DELETE policy merely to simplify cleanup.

---

## NEXT — only after the blocking chain completes

### N1. Decide the next Phase 1 or Phase 2 step
**Depends on:** B2–B5 · **Status:** not started

Evaluate only once authenticated Phase 1 verification has actually succeeded. This is a decision point, not
an implementation task, and needs an Approval Brief per `CLAUDE.md` if it touches schema, RLS, migrations or
environment.

---

## DEFERRED — Phase 2, not active work

Listed so scope stays explicit. **None of this is in progress, and none may start before B2 succeeds.**

Run synchronization · strength workout synchronization · home exercise synchronization · template
synchronization · exercise catalog synchronization · location and equipment synchronization · dashboard
cloud state · realtime · Storage buckets · Edge Functions · social Auth · magic links / OTP · full
conflict-resolution UI · full multi-device synchronization · Phase 2 schema · migration of the user's real
local data.

---

## MAINTENANCE OBSERVATIONS — not scheduled

| Item | Note |
|---|---|
| **R-33 / R-17** — CRLF lint baseline | Pre-existing, predates Supabase work. Needs a dedicated renormalization commit. **Do not mix into feature work; do not normalize the repository opportunistically.** |
| **R-30** — route-tree ordering drift | Local and Lovable generators order imports differently; the route set is identical. **Do not commit ordering-only churn.** |
| **R-37** — DELETE privilege not revoked | RLS is on and there is no DELETE policy; anonymous DELETE affected zero rows. Consider an explicit `revoke delete` in a future hardening pass. **Not urgent.** |
| Stale disposable user | One unconfirmed `fitlog-e2e-*@fitlog-e2e.invalid` user exists in the authoritative project. Safe to delete. |

---

## Superseded

- **T-01** — switch to `nhnuuooyxamkkqqpcgmk`. Superseded by **ADR-0040**.
- **T-02** — verify Lovable deployment override. Answered: Lovable injects runtime env that overrides `.env`, and a GitHub push alone does not rebuild.
- **T-04** — apply the Phase 1 migration. **Done** — applied to `fusrapommtdqwfglkmks` and verified against the database.
- **T-05** — folded into **B1/B2** above.
