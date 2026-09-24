# 08 — Implementation evidence

Baseline `ed9f583e0f7ce8dfd6ef72bad62b50ebaa297c4e` · branch `feat/fitlog-pakalim-suunto-home-ux`.

## Commits

| Commit | What |
| --- | --- |
| `5c2c89e` | `fix(input)` — one duration contract and decimals that survive typing |
| `c13695d` | `feat(pakalim)` — fixed morning/evening routines, quantity-first reports, editable in place |
| `e4b669b` | `feat(exercises)` — home bank by equipment and muscle group, with muscle and movement drawings |
| `55c95ee` | `refactor(identity)` — one ownership contract so the data model is not single-user |
| `87aa7e1` | `test` — register the pakalim UI suite in the router chain |
| `d6403e9` | `chore(android)` — version 1.2.0 (versionCode 10200) |
| `ae74039` | `fix(pakalim)` — 44px touch targets for the reorder and remove controls (found by emulator QA) |
| `b851b55` | `fix(exercises)` — 44px tap targets for the exercise-bank breadcrumb (found by web QA) |

41 files changed, ~2 545 insertions, ~207 deletions.

## New modules

| File | Role |
| --- | --- |
| `src/lib/runs/calc.ts` (rewritten section) | `parseDurationInput` · `parsePaceMSS` (delegates) · `formatDurationInput` · `describeDuration` · `parseDecimal` |
| `src/lib/forms/useNumericText.ts` | keeps raw text while a numeric field has focus |
| `src/components/inputs/NumericField.tsx` | `DecimalField`, `DurationTextField` (live echo in `role="status"`, `aria-describedby`) |
| `src/lib/home/pakalim.ts` | routine definitions, idempotent seeding, resume-or-create, pure `pakalLines`, `setPakalQuantity`, `pakalTotal` |
| `src/routes/home.pakal.$slot.tsx` | the quantity screen |
| `src/components/home/PakalCard.tsx` | home entry point per routine |
| `src/components/home/HomeExerciseAdder.tsx` | equipment → muscle group → exercise picker |
| `src/lib/exercises/homeBank.ts` | categories, `DUMBBELL_GROUPS`, common-first sort, `bodyRegionOfExercise` |
| `src/components/exercises/MuscleBadge.tsx` | thumb-sized target silhouette |
| `src/components/exercises/ExerciseMovementIllustration.tsx` | START→END pose pairs, 10 movements |
| `src/lib/identity/owner.ts` | the single ownership contract |

## Tests added

| Suite | Count | Proves |
| --- | --- | --- |
| `src/lib/runs/__tests__/duration-contract.test.ts` | 9 | `42:15` is never 42.15; bare `40` is 40 s; round-trip; invalid input returns `null`; pace shares the contract; `7.15` survives |
| `src/lib/home/__tests__/pakalim.test.ts` | 10 | idempotent seeding, resume-not-recreate, quantity writes, totals, rename, reorder |
| `src/lib/exercises/__tests__/home-bank.test.ts` | 7 | three categories, five dumbbell groups non-empty, common exercise first, body-region mapping |
| `src/lib/identity/__tests__/owner.test.ts` | 7 | stored id unchanged, one source per domain, two owners representable, no list mixes owners, system catalogue shared, legacy record visible |
| `src/test/pakalimUx.test.tsx` | 8 | the screen end to end; registered as `test:router:pakalim` |

## Gates

| Gate | Result |
| --- | --- |
| frozen install (`bun install --frozen-lockfile`) | PASS |
| `bun run typecheck` | PASS |
| unit tests | **423 passed / 31 files** |
| UI + router tests | **89 passed / 14 files** (total **512 / 45 files**) |
| `bun run build` (web) | PASS |
| lint, files this run changed | **0 errors, 0 warnings** (measured from `eslint . -f json`, split by `git diff --name-only`) |
| lint, whole repo | 367 problems, **all of them in files this run did not touch** — the R-33/R-17 CRLF/Prettier baseline. Since every changed file is clean, the branch cannot have raised the count. |
| `git diff --check` | clean |
| secret scan | clean |
| `routeTree.gen.ts` | delta is exactly the new `/home/pakal/$slot` route (R-30 sorted-diff rule) |
| Supabase / RLS / migrations / dependencies / lockfile | **no change** |

## Web QA — real Chrome, 390×844, RTL, he-IL, Asia/Jerusalem

Full log: `assets/web-qa.txt`. Screenshots: `assets/web/p01…p15`.

- Routine cards read `פק״לים בוקר · 3 תרגילים · טרם דווח היום`.
- Quantity typed → saved (`31r`), session named `פק״לים בוקר`, template `tpl_pakal_morning`.
- Bank: `ציוד ‹ דאמבלים ‹ יד קדמית`, with `כפיפות מרפקים עם משקולות · הנפוץ ביותר` first.
- Save → reopen shows `31`, editing to `25` leaves **`sessions: 1`** — an edit, not a new report.
- Suunto: `7.15` types fully · `42:15` echoes `42 דקות ו-15 שניות` · bare `40` echoes `40 שניות` ·
  `1.5` shows the invalid message · blur canonicalises to `42:15`.
- History row: `פק״לים בוקר · 4 תרגילים · 1 סטים · 25 חזרות · שכיבות סמיכה · כפיפות בטן רגילות`
  — the routine is the title, the exercises are context.
- No horizontal overflow on any screen, no page errors, `fitlog:qa-marker` still `untouched`,
  key set unchanged.

## Android QA — Pixel 7 emulator, API 36, installed APK

Full log: `assets/android-qa.txt` and `assets/android-recheck.txt`. Screenshots: `assets/android/a01…a20`.

| Check | Result |
| --- | --- |
| Native context | `Capacitor.isNativePlatform() === true`, width 412dp, no horizontal overflow |
| Routine cards | both present with the "not reported today" footnote |
| Real soft keyboard | IME opened on the quantity field; `inputMode=numeric`; `adb input text 35` reached the field and saved `reps: 35` |
| Exercise bank | `ציוד → דאמבלים → יד קדמית/כתפיים/יד אחורית/חזה/גב`, common exercise first |
| Save → reopen → edit | `sessions: 1` before and after; `35` → `25` in place |
| Hardware Back | stayed in the app at `/home` (`mCurrentFocus` still `MainActivity`) |
| Suunto in the APK | `7.15` typed fully; `42:15` → `42 דקות ו-15 שניות`; `40` → `40 שניות`; `1.5` → invalid message; blur → `42:15` |
| Force-stop persistence | `{home:1, sets:4, runs:1, marker:"untouched"}` identical before and after |
| Offline (Wi-Fi + data off) | `/home` rendered fully, no errors |
| Build identity | `versionCode=10200`, `versionName=1.2.0`; the About tile reads `Fit Log 1.2.0` |
| Touch targets after the fix | `under44: []` on the pakal screen, row height 74px |
| Page errors | none |

**Physical-device acceptance is NOT claimed.** Per §20 the emulator is evidence, not acceptance.

## APK built from this branch

```json
{
  "file": "fitlog-1.2.0-10200-ae740393c0-debug.apk",
  "version_name": "1.2.0",
  "version_code": 10200,
  "commit": "ae740393c0",
  "variant": "debug",
  "signing": "debug keystore (internal install only, NOT Play Store)",
  "sha256": "bfdbccc715a785c4092815eaddd79112c3654200cbd56acf85301aa2be1c7fcd"
}
```

Installing it over the emulator's CI-signed 1.1.0 build failed with
`INSTALL_FAILED_UPDATE_INCOMPATIBLE` — the documented R-46 signature mismatch, not a regression.
Uninstall + clean install succeeded. The canonical artifact for Ariel remains the one produced by
`android-apk.yml` on `main` after merge.

## Data safety

- No `localStorage` was cleared on any real device. Web QA used a throwaway Chrome profile; Android
  QA used the emulator's own app data.
- `fitlog:qa-marker` survived every scenario, and the `fitlog:*` key set is unchanged.
- No schema migration, no RLS change, no policy added, no data uploaded to Supabase.
- `ensurePakalTemplate` does not overwrite an existing template (§16).
- Editing a report mutates the existing session; it never deletes and re-creates (§16).
