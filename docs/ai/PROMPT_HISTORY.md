# Fit Log — Prompt History (session-level)

> Distinct from [`prompts.md`](./prompts.md), which tracks **in-application** AI prompts (currently none).
> This file records the *working agreements and session objectives* given to Claude Code, so a future
> session understands the mandate it inherits.
>
> **Never record here:** passwords, secrets, tokens, API keys, disposable-user credentials, or sensitive
> payloads. None appear in this file.

---

## 2026-08-01 — Autonomous end-of-session documentation update

**What the user requested:** an autonomous end-of-session documentation update — inspect the repository's
actual current state and refresh all persistent project knowledge so the next session can resume with
maximum context and no ambiguity.

**Authorization explicitly granted:**
- Create, edit, rename, reorganize and update documentation, including everything under `docs/ai/`.
- Create missing documentation files.
- Run safe read-only and validation commands.
- Stage, commit, and push documentation changes to the existing tracked remote branch.
- Resolve routine documentation inconsistencies independently.

**Explicitly prohibited:** pausing for incremental approval, or requesting permission for reads, writes,
documentation edits, commits, pushes, Git inspection, or safe validation commands.

**Task type:** **documentation only.** No application code, migration, generated file, dependency, lockfile,
route, schema, RLS policy, or Production setting was to be modified — and none was.

**Standing constraints reaffirmed:** do not normalize CRLF (R-33/R-17) · do not commit route-tree
ordering-only churn (R-30) · do not weaken RLS or add a DELETE policy (R-37, D9) · do not expand product
scope · do not start Phase 2 · do not touch the superseded Supabase project.

**Final next-session objective recorded:**

> Temporarily disable email confirmation in Lovable, then run authenticated end-to-end Phase 1 verification
> with disposable users.

---

## Standing working agreement (ADR-0038, reaffirmed 2026-07-31)

- Prompts to Claude Code are written in **English**; `docs/ai/` remains in **Hebrew**.
- Claude works with **maximum reasonable autonomy** — no cumulative approval requests mid-task. Reversible
  steps (edits, tests, commits, pushes to an existing branch, documentation, fixing defects found during
  verification) proceed without pausing; the task is completed and reported once at the end.
- The stop-list in `AGENTS.md` is **complete and was not relaxed**: missing external permission, a required
  secret the user must supply, new cost, irreversible deletion, a change to a core product requirement, or
  an unresolvable conflict with `product-requirements.md`.

## Tooling constraint (recorded 2026-07-31)

The user works **only through Claude Code or Lovable**. Claude must not direct the user to any other tool —
no external CLI, no provider dashboard, no other IDE, no software installation. A task requiring a different
tool is a **stop**: describe the situation and offer a route that runs inside Claude Code or Lovable.
