# מקורות שנקראו
- `AGENTS.md`, `docs/ai/PROJECT_STATUS.md`, `docs/ai/SESSION_HANDOFF.md`, `docs/ai/open-tasks.md`, `docs/ai/risks.md`, `docs/ai/decisions.md` (ADR-0038…0041), הקפסולה הקודמת `docs/ai-runs/2026-09-20/…recovery-race-project/` (כולל 09/10 והמשך Claude Code).
- מקורות OS: `OS_ACCESS_RECEIPT.json` בקפסולה הקודמת (Start Here 1.1 / CURRENT_OS_VERSION 1.0.0 — פער גרסה עדיין פתוח); לא שונו הרשאות.
- מצב `main` אומת ישירות: `1722d53` (= `origin/main`), עץ עבודה נקי; live: `/`, `/running/project`, `/history` → 200 (אריאל פרסם את PR #1 ב-Lovable אחרי הריצה הקודמת).
- מבנה ה-build אומת לפני בחירת Android: `@lovable.dev/vite-tanstack-config` 2.8.4 → TanStack Start 1.168 + nitro (cloudflare-module) בפרודקשן; אין `index.html` סטטי — לכן SPA shell נפרד (`vite.android.config.ts`).
- מחקר: ידע מוצרי על Suunto, Garmin Connect, Strava, Nike Run Club, Adidas Running, Hevy, Strong, Fitbod (ראה `03_BEST_PRACTICES_RESEARCH.md`). לא הועתקו מסכים או מותג.
- Capacitor 8.5.2 / @capacitor/android 8.5.2 (registry): compileSdk 36, Java 21, AGP 8.13.0 — נבדק מתוך ה-tarball לפני ההתקנה.
