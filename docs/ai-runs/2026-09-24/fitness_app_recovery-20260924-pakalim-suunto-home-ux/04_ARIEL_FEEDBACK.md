# 04 — Ariel's real-usage feedback

Fourteen items, taken from actually using the 1.1.0 pilot build. Each is a product requirement,
not a suggestion. The verbatim wording lives in `01_OUTBOUND_PROMPT.md` (§3 – §15); this file records
what each item meant in the product, how it was disposed of, and where the proof is.

| # | Feedback | Disposition | Proof |
| --- | --- | --- | --- |
| 1 | Suunto time format is ambiguous — `42:15` could read as 42.15 minutes | Fixed | `duration-contract.test.ts`, `assets/android-qa.txt` (`echo: 42 דקות ו-15 שניות`) |
| 2 | Suunto decimal distance `7.15` is broken — the dot disappears while typing | Fixed | `useNumericText.ts`, web QA `distance typed → 7.15`, Android QA `distance 7.15 -> 7.15` |
| 3 | Run duration should accept bare seconds, without typing `0:` first | Fixed | `parseDurationInput("40") === 40`, Android QA `duration bare 40 -> 40 \| echo: 40 שניות` |
| 4 | Pakalim are counted, not timed — the time model is wrong | Fixed | `/home/pakal/$slot` quantity screen, `pakalim.test.ts` |
| 5 | An existing pakal report must be editable, not re-created | Fixed | Android QA: save → reopen → edit 35 → 25 with `sessions: 1` throughout |
| 6 | A session title must not inherit the exercise name | Fixed | `repo.ts` quick entry now names the session `דיווח מהיר`; `items.test.ts` |
| 7 | The morning and evening pakalim must be persistent routines | Fixed | `PAKAL_DEFINITIONS`, deterministic template ids `tpl_pakal_morning` / `tpl_pakal_evening` |
| 8 | Routine name, exercise list and order must be editable | Fixed | `TemplateTools` rename + reorder/remove controls on the row |
| 9 | Dumbbells and a jump rope belong in the home exercise bank | Fixed | `homeBank.ts` three equipment categories; evening seed includes the rope |
| 10 | Dumbbell exercises should be reachable by muscle group | Fixed | `DUMBBELL_GROUPS` (5 groups); Android QA `muscle groups: [… יד קדמית, כתפיים, יד אחורית, חזה, גב]` |
| 11 | The common exercise for a group should come first | Fixed | `firstSlug` + common-first sort; Android QA shows `כפיפות מרפקים עם משקולות · הנפוץ ביותר` at the top |
| 12 | Show which muscle an exercise targets | Fixed | `MuscleBadge` thumb-sized silhouette on every row and bank item |
| 13 | Show the movement as START and END | Fixed | `ExerciseMovementIllustration`, 10 pose pairs |
| 14 | The data model must be ready for more than one user — with no second-user UX | Fixed at the data layer only | `identity/owner.ts`, `owner.test.ts`; no family/parent-child UI exists |

## What item 14 explicitly did NOT mean

The prompt is unambiguous (§15): **do not create a second user, do not build family-management UX,
do not build parent/child controls, do not add data on behalf of another person.** This run therefore
changed only the ownership *contract* in code. The stored owner value is unchanged (`single-user`),
so no record migrates and nothing on Ariel's device moves. `withOwner()` proves a second owner is
representable; nothing in the app ever calls it outside tests.

## Items that changed shape during implementation

- **#9/#10** — four of the six dumbbell exercises I first proposed already existed in the seed under
  different slugs (`dumbbell-bicep-curls`, `seated-dumbbell-shoulder-press`,
  `overhead-triceps-extension`, `single-arm-dumbbell-row`). Per §10 the catalogue is canonicalised
  rather than duplicated, so only `Wide Push Ups` and `Dumbbell Floor Press` were added and the
  groups point at the existing slugs.
- **#10 "גב"** — `single-arm-dumbbell-row` carries the primary muscle `lats`, not `back`, so a group
  is defined by a *set* of muscle codes (`["back","lats","traps"]`) rather than one.
