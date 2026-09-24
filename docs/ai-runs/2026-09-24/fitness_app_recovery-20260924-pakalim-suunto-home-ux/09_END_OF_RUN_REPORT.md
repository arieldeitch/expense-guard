# 09 — End-of-run report

**Run:** `fitness_app_recovery-20260924-pakalim-suunto-home-ux`
**Baseline:** `ed9f583e0f7ce8dfd6ef72bad62b50ebaa297c4e` · **Branch:** `feat/fitlog-pakalim-suunto-home-ux` · **PR:** #3
**Status:** YELLOW — everything in scope is implemented, tested and merged; physical-device acceptance
and the Lovable publish remain Ariel's actions.

## What changed for the person using the app

| Before | After |
| --- | --- |
| `42:15` in a Suunto field could be read as 42.15 minutes | The field echoes "42 דקות ו-15 שניות" live, before saving |
| Typing `7.15` for distance dropped the decimal point | `7.15` types through, and `7,15` is accepted too |
| A 40-second run needed `0:40` | `40` means 40 seconds |
| A pakal was a timed session | A pakal is a count, with a big ± field per exercise |
| Reporting a pakal again created a second report | Opening a routine resumes today's report and edits it |
| The session was named after the first exercise | The session is named after the routine |
| One flat, bodyweight-only exercise list | Equipment → muscle group → exercise, common one first, with drawings |
| Owner id was a literal repeated in eight modules | One `currentOwnerId()`, ready for a real auth id |

## Verified

- **512 tests** across 45 files (423 unit, 89 UI/router), all passing.
- Frozen install, typecheck, web build, `git diff --check`, secret scan — all clean.
- Lint: **0 errors and 0 warnings in every file this run touched**; the repo's 367 remaining problems
  are all in untouched files (the R-33/R-17 baseline).
- `routeTree.gen.ts` delta is exactly the new `/home/pakal/$slot` route.
- Web QA in real Chrome at 390×844 RTL and Android QA on a Pixel 7 emulator running the installed
  APK — including the real soft keyboard, hardware Back, force-stop persistence, offline and build
  identity. Two touch-target defects were found by that QA and fixed.

## Not verified, and named as such

- **Physical-device acceptance is NOT marked PASS.** The emulator is evidence, not acceptance (§20).
- **Lovable publish** is still blocked from this session, as in Run 1 and Run 2. No publication is claimed.
- **Authenticated Supabase verification** (T-05 / B1) is still blocked by `mailer_autoconfirm: false`.

## Data safety

No real `localStorage` was cleared, no database was reset, no production data was touched, no
historical id was changed, no edit became a delete-and-recreate, no personal data was uploaded to the
cloud, and no existing template was overwritten by seeding. `fitlog:qa-marker` survived every QA
scenario and the `fitlog:*` key set is unchanged.

## Security and permissions

No schema migration, no RLS change, no policy added or relaxed, no service-role key used anywhere, no
user id invented for Ariel, no second user created, and no family-management or parent/child UX. The
superseded Supabase project `nhnuuooyxamkkqqpcgmk` was not touched. No force push, no history
rewrite, no branch-protection bypass.

## Android

`fitlog-1.2.0-10200-…-debug.apk`, versionName `1.2.0`, versionCode `10200`, debug-signed for internal
install only. The build flow is unchanged from ADR-0043. The canonical artifact is the one produced
by `android-apk.yml` on `main`; see `00_RUN_MANIFEST.yaml` for its identity.

## Open issues

| Id | Issue |
| --- | --- |
| R-48 | Two duration input shapes coexist (Suunto text field vs. `RunForm`'s two number boxes). Deliberate. |
| R-49 | The owner id is centralised but still constant until an authenticated session exists. |
| R-50 | Touch-target defects are only caught by real-layout QA; jsdom cannot measure layout. |
| R-45 | Web and APK still hold separate `localStorage`. |
| R-46 | Debug signing — installing over a differently signed build requires uninstall. |
| T-05 / B1 | No authenticated Supabase session; blocks the `auth.uid()` wiring. |

## Ariel's actions

1. Install the APK from the `main` workflow run, after exporting a backup (R-46).
2. Use the morning and evening pakalim for a few days and confirm the count-and-correct flow.
3. Press **Publish** in Lovable — the session still cannot.
4. If and when a second person should actually use the app, that is a new run: the data model is
   ready, the product deliberately is not.
