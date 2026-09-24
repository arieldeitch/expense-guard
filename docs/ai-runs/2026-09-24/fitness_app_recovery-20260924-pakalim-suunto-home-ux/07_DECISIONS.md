# 07 — Accepted decisions

Four architectural decisions were taken in this run and written into `docs/ai/decisions.md`.
Everything else was ordinary implementation and needed no ADR.

| ADR | Decision | Where it lives |
| --- | --- | --- |
| **ADR-0044** | One duration/decimal input contract. A bare number is **seconds**; `mm:ss` and `hh:mm:ss` are the only other accepted shapes; pace delegates to the same parser; a live verbal echo shows the app's reading before saving; raw text is preserved while typing so `7.` can become `7.15`. | `src/lib/runs/calc.ts`, `src/lib/forms/useNumericText.ts`, `src/components/inputs/NumericField.tsx` |
| **ADR-0045** | Pakalim are quantity-based. Two persistent routines with deterministic template ids; opening a routine resumes today's report instead of creating a new one; the session name is a snapshot of the routine name, never the exercise name. | `src/lib/home/pakalim.ts`, `src/routes/home.pakal.$slot.tsx`, `src/components/home/PakalCard.tsx` |
| **ADR-0046** | The home exercise bank is organised equipment → muscle group → exercise, a group is keyed on a **set** of muscle codes, the common exercise sorts first, and illustrations are presentational when they sit next to their own label. | `src/lib/exercises/homeBank.ts`, `src/components/home/HomeExerciseAdder.tsx`, `MuscleBadge.tsx`, `ExerciseMovementIllustration.tsx` |
| **ADR-0047** | One ownership contract. `currentOwnerId()` is the only place the owner id is decided and the only place `auth.uid()` will ever go; the stored value stays `single-user` so nothing migrates; a record with no `owner_id` is treated as the local owner's; the product exposes no second user. | `src/lib/identity/owner.ts` |

## Behaviour changes that are deliberate, not accidental

| Before | After | Why |
| --- | --- | --- |
| `parsePaceMSS("30")` → 1800 s/km | → 30 s/km | A bare number is seconds everywhere. Covered by `calc.test.ts` and `duration-contract.test.ts`. |
| A quick entry named the session after the exercise | named `דיווח מהיר` | Feedback item 6. |
| Home reports listed by exercise | listed by routine, exercises as context | Feedback items 4–7. |

## Decisions explicitly NOT taken

- No `users` table, no profile switcher, no `owner_id` migration — §15 and §16.
- No Supabase policy, RLS or schema change of any kind.
- `RunForm`'s two-box `DurationField` was left alone: two labelled integers cannot be misread, so
  the text contract adds nothing there.
- No release keystore was created and none was added to the repo — §20, R-46 unchanged.
