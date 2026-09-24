# 05 — Revision prompts and responses

None. This run received a single prompt (`01_OUTBOUND_PROMPT.md`) and ran to completion
autonomously under §25's no-stop rule. No clarifying question was sent to Ariel and no revision
prompt was received.

Every ambiguity was resolved from the code, the documentation or a test, and each resolution is
recorded where it was made:

| Ambiguity | Resolved by | Recorded in |
| --- | --- | --- |
| Which dumbbell exercises to add, when four already existed under other slugs | Reading `src/lib/exercises/seed.ts` — canonicalise, do not duplicate (§10) | `04_ARIEL_FEEDBACK.md`, ADR-0046 |
| Whether a muscle group is one code or several | `single-arm-dumbbell-row` carries `lats`, not `back` — a one-code group returned nothing | ADR-0046 |
| Whether "multi-user ready" implies a migration | §15 forbids inventing a user id; keeping the stored value means no migration is needed | ADR-0047 |
| Whether `RunForm`'s two-box duration field should also become text | It is structurally unambiguous, so changing it would be churn | `07_DECISIONS.md` |
