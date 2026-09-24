# 03 — Best-practices research

No new app survey was run. Run 2 (`docs/ai-runs/2026-09-21/…-compact-ux-android-apk/03_BEST_PRACTICES_RESEARCH.md`)
surveyed eight fitness apps and produced the compact design language, the five-destination
navigation and the history centre that this run builds on; that research is still current and this
run's requirements are Ariel's own observed usage, not a gap in the market scan.

Two narrow points were checked against established practice rather than invented:

| Question | What the practice is | Where it landed |
| --- | --- | --- |
| How should a duration field disambiguate `42:15`? | Show the parsed value back in words next to the field, live, before submit — the same technique date pickers use for ambiguous `dd/mm` vs `mm/dd`. | `DurationTextField`'s `role="status"` echo (ADR-0044) |
| Why does a controlled numeric input eat a decimal point? | A controlled field that round-trips through `Number()` on every keystroke cannot represent the intermediate state `"7."`. The standard fix is to hold the raw string while the field has focus and parse on blur. | `useNumericText` (ADR-0044) |
| Minimum touch target | 44×44 CSS px, already the project's rule from ADR-0042. | Enforced by the QA audit; two defects found and fixed (`ae74039`, `b851b55`) |
