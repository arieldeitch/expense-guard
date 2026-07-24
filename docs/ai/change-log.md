# Change Log

## 2026-07-25 · Design System + Shell

- **design** · `src/styles.css` — מערכת טוקנים מלאה: semantic + domain (run/gym/home/goal) + status (success/warning/info) + shadows + fonts + utilities. Dark-tinted background עם gradient עדין. ADR-0014 עד ADR-0018.
- **fonts** · Heebo נטען דרך `<link>` ב־`__root.tsx` (לא `@import` ב־CSS).
- **shell** · `src/components/shell/AppShell.tsx`, `Nav.tsx` (BottomNav mobile + SideNav desktop), `PageHeader.tsx` (PageHeader + SectionHeader RTL-safe), `EmptyState.tsx` (קומפקטי).
- **tiles** · `src/components/tile/Tile.tsx` — cva variants (default/run/gym/home/goal/warning/success/info) × tones (outline/soft/solid) × sizes (sm/md/lg) + `TileLabel` / `TileMetric` / `TileFootnote` / `TileTrend`.
- **routes** · `src/routes/index.tsx` (home dashboard עם 3 domain tiles + weekly overview + quick actions), `running.tsx`, `gym.tsx`, `home.tsx`, `more.tsx` — כולם על `AppShell`, כולם עם `head()` ייחודי + og tags.
- **root** · `<html lang="he" dir="rtl">`, meta מוצריים במקום ברירות Lovable, theme-color, viewport-fit=cover.
- **docs** · עדכון `current-state.md`, `decisions.md` (ADR-0014..0018), `architecture.md`, `open-tasks.md`, `risks.md`, `test-plan.md`.
- **tests** · typecheck נקי, lint 0 errors, visual QA ב־Playwright (mobile 390×844 + desktop 1280×900) ל־5 המסכים. אין horizontal overflow.

## 2026-07-24 · Scan + docs bootstrap

- **docs** · נוצר `docs/ai/` — product-requirements, product-overview, current-state, architecture, data-model, decisions (ADR-0001..0013), open-tasks, risks, benchmark, prompts, change-log, test-plan.
- **docs** · `AGENTS.md` הורחב עם הנחיות מחייבות.
- **scan** · תבנית ריקה של Lovable/TanStack Start. אין קוד מוצרי, אין שגיאות build/lint/typecheck.
- **no code changes** · לא נמצאו imports שבורים / typos / TS errors לתקן.
