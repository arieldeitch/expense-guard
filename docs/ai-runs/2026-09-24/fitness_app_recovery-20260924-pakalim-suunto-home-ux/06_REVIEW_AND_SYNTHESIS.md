# 06 — Review and synthesis

## The three input bugs were one bug

Items 1–3 arrived as three separate complaints. Reading the code showed a single shape:

1. `parseDurationInput`'s predecessor treated a bare number as **minutes**, so `40` became 2400 s and
   a 40-second interval was impossible to enter without the `0:` prefix.
2. A **second** pace parser existed with its own rules, so the same text meant two things depending
   on which field it landed in.
3. The distance input was a controlled field that ran `Number(e.target.value)` on every keystroke.
   `"7."` is not a finite number in a way that survives the round trip, so the dot was erased and
   `7.15` could never be typed — only pasted.

So the fix is not three fixes. It is one parser (`parseDurationInput`), one decimal parser
(`parseDecimal`), one hook that keeps raw text while the field has focus (`useNumericText`), and two
field components that every Suunto numeric input now uses. Everything else follows from that.

**Why an echo, not just a stricter parser.** A parser can only reject what is malformed. `42:15` is
*well formed* under both readings — the danger is that the app silently picks the wrong one. The live
echo ("42 דקות ו-15 שניות") makes the app's reading visible before the save, which is the only thing
that actually prevents a wrong record.

## Pakalim: the bug was the model, not the screen

Items 4–8 look like five UI requests. They are one modelling error: a pakal was stored as a timed
session, and a "report" was a fresh session each time. Once the routine has a **stable template id**
and "open" means *resume today's report if one exists*, items 5 (editable), 7 (persistent) and 8
(editable name/list/order) stop being features and become consequences. Item 6 (title inheriting the
exercise name) was a separate, small defect in `startQuickEntry` and was fixed there.

Two implementation constraints shaped the result:

- **Seeding must never run during render.** The first attempt called `ensurePakalTemplate()` inside
  the component body and produced React's "cannot update a component while rendering a different
  component" warning. Seeding moved into `useEffect`, and `pakalLines()` was made pure — a set row is
  created on the first edit, not on first read.
- **Subscribing to `entries` alone is not enough.** Quantities live on `sets`, so a `useMemo` keyed
  on entries showed stale numbers after typing. `useHomeSessionLines()` subscribes to both.

## Exercise bank: canonicalise, never duplicate

The obvious way to satisfy items 9–11 is to add the named exercises to the seed. That would have
created four duplicate catalogue rows, because `dumbbell-bicep-curls`,
`seated-dumbbell-shoulder-press`, `overhead-triceps-extension` and `single-arm-dumbbell-row` already
existed. §10 of the prompt calls for canonicalisation, so the groups point at the existing slugs and
only two genuinely new exercises were seeded. A group is keyed on a **set** of muscle codes because
the catalogue's primary muscle for a row is `lats`, not `back` — a single-code group returned an
empty list.

## Illustrations: decorative by default

`MuscleBadge` and `ExerciseMovementIllustration` first used `role="img"` with an `aria-label`. Inside
a button that pollutes the accessible name — "יד קדמית" became "יד קדמית, חזה קדמי" — and broke
name-based queries. The right answer is not to loosen the queries but to mark an illustration that
merely repeats adjacent text as presentational. Hence the `decorative` prop.

An early attempt also **overwrote** the existing 418-line `MuscleMap.tsx`. It was restored from git
and a separate compact component was written instead; `MuscleMap.tsx` is unchanged on this branch.

## Multi-user readiness: the smallest change that is actually readiness

The temptation is to add a `users` table, a profile switcher, or an `owner_id` migration. All three
are forbidden by §15 and all three would be premature. What is genuinely blocking a second user is
that the owner id was a literal string repeated across eight storage modules. Centralising it in
`currentOwnerId()` means the future `auth.uid()` wiring is a one-line change in one file, and the
stored value stays `single-user`, so **no record migrates**. `visibleToCurrentOwner()` treats a
record with no `owner_id` as the local owner's, so legacy data cannot disappear.

Nothing in the app calls `withOwner()`. It exists so the contract tests can prove the model holds two
owners without a second user ever existing in the product.

## What was deliberately not done

| Not done | Why |
| --- | --- |
| Second user, family management, parent/child UX | §15 forbids it explicitly. |
| `owner_id` migration or schema change | The stored value is unchanged, so there is nothing to migrate. §16 forbids destructive migration. |
| Supabase policy or RLS edits | §15: do not weaken existing `user_id`/`auth.uid()` policies, do not add a permissive policy to make a test pass. |
| Converting `RunForm`'s `DurationField` to the text contract | Two labelled integer boxes are structurally unambiguous; changing it would be churn without a defect. |
| "Fixing" the repo-wide lint/CRLF baseline | §19 forbids unrelated formatting churn. Three files reformatted by a directory-wide `eslint --fix` were reverted. |
| Uploading any of Ariel's data to the cloud | §16 forbids it, including as part of a test. |
