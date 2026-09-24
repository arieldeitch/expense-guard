# 02 — Input sources

## Canonical, read before any change

| Source | What it settled |
| --- | --- |
| `git remote -v` → `arieldeitch/expense-guard` | Repository identity confirmed against §0 of the prompt. |
| `origin/main` = `ed9f583e0f7ce8dfd6ef72bad62b50ebaa297c4e` | Matches the HEAD the prompt states. Fast-forward only, no force. |
| `CLAUDE.md` | Bun is the package manager, `bun.lock` is authoritative, ADRs live in `docs/ai/decisions.md`. |
| `docs/AI_RUN_CONTEXT_LEDGER.yaml` | Run chain and the previous capsule to continue from. |
| `docs/PROJECT_LAST_UPDATE_LEDGER.yaml` | Last project update event (Run 2). |
| `docs/ai/current-state.md`, `PROJECT_STATUS.md`, `OPEN_TASKS.md`, `SESSION_HANDOFF.md`, `CHANGELOG.md` | State at the end of Run 2 and the open items this run inherits. |
| `docs/ai-runs/2026-09-21/…-compact-ux-android-apk/` | The previous capsule: compact design system, five-destination navigation, Capacitor shell, APK contract, R-45/R-46/R-47. |
| `docs/ai/decisions.md` ADR-0038 … ADR-0043 | Autonomy contract, SSR 404 rule, authoritative Supabase project, race project, compact UX, Android/Capacitor. |
| `docs/ai/risks.md` | R-17/R-33 (lint/CRLF baseline), R-30 (routeTree ordering drift), R-45 (web/APK data split), R-46 (debug keystore), R-47 (Heebo from network), T-05 (no authenticated Supabase session). |
| `docs/ai/android.md` | `bun run android:apk`, the SPA-shell build, JDK 21, SDK 36, the debug-signing contract. |

## External sources

| Source | Result |
| --- | --- |
| Control Tower / Chief of Staff outbox | Not reachable from this session. Recorded as an unsent, prepared event per §24 of the prompt — `pending` stays `pending`. |
| Lovable project `2b79da21-331d-4a52-bd0f-e49f64b4e79d` | Publish still blocked from this session (same failure class as Run 1 and Run 2). No publication is claimed. |
| Supabase `fusrapommtdqwfglkmks` | Read-only use. No migration applied, no RLS change, no personal data uploaded (§15, §16). |
| Superseded Supabase `nhnuuooyxamkkqqpcgmk` | Untouched, as required since Run 1. |

## Why no Docker and no data reset

§16 of the prompt forbids clearing real `localStorage`, resetting the database or overwriting existing
templates in seed; §6 forbids Docker. All QA ran against a throwaway Chrome profile (web) and the
emulator's own app data (Android) — never Ariel's device or the cloud.
