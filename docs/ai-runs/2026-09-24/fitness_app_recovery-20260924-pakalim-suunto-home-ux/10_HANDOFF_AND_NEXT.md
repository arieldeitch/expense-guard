# 10 — Handoff and next

## Where the next session starts

Read `00_RUN_MANIFEST.yaml`, then `09_END_OF_RUN_REPORT.md`. The repo-level entry points
(`docs/ai/PROJECT_STATUS.md`, `docs/ai/SESSION_HANDOFF.md`, `docs/ai/current-state.md`) carry the same
state in their active-update section.

## The four contracts a future change must not break

| Contract | Where | What breaks if it is ignored |
| --- | --- | --- |
| A bare number is **seconds** | `parseDurationInput` in `src/lib/runs/calc.ts` | Two parsers again, and `42:15` becomes ambiguous again |
| Opening a routine **resumes** today's report | `openPakalSession` in `src/lib/home/pakalim.ts` | Every correction creates a duplicate report |
| `LOCAL_OWNER_ID` stays `"single-user"` | `src/lib/identity/owner.ts` | Existing records stop matching their owner and a migration becomes mandatory |
| Illustrations next to their own label are `decorative` | `MuscleBadge`, `ExerciseMovementIllustration` | Accessible names get polluted and name-based queries break |

## Wiring a real auth id later (R-49)

`currentOwnerId()` is the only place that decides ownership, so the change is:

1. Return the authenticated user's id when a session exists, and `LOCAL_OWNER_ID` when it does not.
2. Decide what happens to records already stamped `"single-user"` — adopt them on first sign-in, or
   keep them local. **This is a product decision, not a code detail**, and it needs Ariel.
3. `visibleToCurrentOwner()` already treats an ownerless legacy record as the local owner's, so
   nothing disappears during the transition.

Blocked until T-05 / B1: `mailer_autoconfirm: false` means no authenticated session can be obtained.

## What a "second user" run would need, if it is ever asked for

This run deliberately built none of it. A future run would need: a real auth id (above), a decision on
record adoption, a way to scope the shared exercise catalogue (already marked `SYSTEM_OWNER_ID`), and
an explicit product decision about what the second person can see. **None of that should be started
without Ariel asking for it** — §15 of this run's prompt forbade it outright.

## Next actions

| Who | Action |
| --- | --- |
| Ariel | Export a backup, install the APK from the `main` workflow run, use the pakalim for a few days |
| Ariel | Press **Publish** in Lovable — the session cannot |
| Ariel | Decide whether the two duration input shapes (R-48) are confusing in practice |
| Next session | If new screens are added, run the QA script's touch-target audit — jsdom will not catch a 32px button (R-50) |
| Next session | If Ariel disables email confirmation, run the authenticated Supabase verification (T-05 / B1) |
