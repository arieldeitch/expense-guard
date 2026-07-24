# Current State — מצב הפרויקט

תאריך עדכון: 2026-07-29 (שלב Templates + Sessions skeleton)

## סיכום מנהלים

הפרויקט כולל: מערכת עיצוב + shell, Launchpad, קטלוג מקומות/הליכונים/ציוד, מודול ריצה מלא (כולל Suunto + כיול הליכונים), ספריית תרגילים (33 seed + מותאמים), ועכשיו **תבניות אימון כוח מלאות** (בלוקים / סופרסטים / גרסאות / snapshot) עם שלד `sessions` השומר snapshot קפוא לביצוע עתידי. עדיין ללא backend (הכל localStorage), ללא auth. המודול הבא: **מסך ביצוע האימון (Workout Execution)** שיקרא מ־`sessions.$id`.



## מה קיים בפועל

### Design System (חדש)
- **`src/styles.css`** — טוקנים מלאים ב־Tailwind v4 (`@theme inline`):
  - Semantic: `background`, `foreground`, `surface`, `surface-elevated`, `tint`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `border-strong`, `input`, `ring`.
  - Domain: `run`, `gym`, `home`, `goal` (כל אחד עם `-foreground` ו־`-soft`).
  - Status: `success`, `warning`, `info` (כל אחד עם `-foreground` ו־`-soft`).
  - Chart: `chart-1..5` ממופה לצבעי דומיין.
  - Font: `Heebo` נטען דרך `<link>` ב־__root, `--font-sans` + `--font-display`.
  - Shadows: `--shadow-tile`, `--shadow-elevated`, `--shadow-focus`.
  - Utilities: `tile-base`, `tile-interactive`, `safe-top`, `safe-bottom`, `scroll-none`.
- רקע: dark-tinted (`oklch(0.185 0.018 260)`) עם gradient עדין ברקע (primary + goal + run) — **אין רקע לבן דומיננטי**.
- ללא `.dark` block — האפליקציה dark-first בכוונה.
- Reduced motion: מכובד באופן גורף (`@media prefers-reduced-motion`).

### Shell / Navigation (חדש)
- `src/components/shell/AppShell.tsx` — מעטפת עם top bar אופציונלי, main container, bottom nav (mobile), side nav (desktop).
- `src/components/shell/Nav.tsx` — `BottomNav` (5 פריטים) + `SideNav`.
  - פריטים: ראשי · ריצה · חדר כושר · בית · עוד.
  - צבע פעיל לפי דומיין.
- `src/components/shell/PageHeader.tsx` — `PageHeader` + `SectionHeader` עם `grid-cols-[minmax(0,1fr)_auto]` (RTL-safe).
- `src/components/shell/EmptyState.tsx` — קומפקטי, ללא illustration.

### Tile primitives (חדש)
- `src/components/tile/Tile.tsx` — `Tile` (cva variants: default/run/gym/home/goal/warning/success/info × outline/soft/solid × sm/md/lg), `TileLabel`, `TileMetric`, `TileFootnote`, `TileTrend`.
- Selected state + disabled state + focus-visible מובנים.

### Routes
| Route | קובץ | סטטוס |
|---|---|---|
| `/` | `src/routes/index.tsx` | ✅ Home dashboard (3 domain tiles, weekly overview, quick actions, history empty state) |
| `/running` | `src/routes/running.tsx` | ✅ מסך תחום עם 4 metric tiles + empty states |
| `/gym` | `src/routes/gym.tsx` | ✅ מסך תחום עם 4 metric tiles + empty states |
| `/home` | `src/routes/home.tsx` | ✅ מסך תחום (בית + משקל גוף) |
| `/more` | `src/routes/more.tsx` | ✅ הגדרות, מקומות, סל מחזור, ייצוא, AI (כולם מסומנים "בקרוב") |

### __root.tsx
- `<html lang="he" dir="rtl">`.
- Meta: title="Fit Log · אימונים אישיים", theme-color, viewport-fit=cover, og/twitter tags.
- Heebo נטען מ־Google Fonts דרך `<link>` (לא `@import` ב־CSS).

### Framework / Build (ללא שינוי)
TanStack Start + Vite + React 19 + TS + Tailwind v4 + Bun. TanStack Query מותקן אבל טרם בשימוש בפועל.

### עדיין לא קיים
Auth, Supabase, `src/integrations/supabase/*`, `supabase/migrations/`, tests, forms, real data queries.

## מצב לפי מודול

| מודול | סטטוס | הערות |
|---|---|---|
| Routing | ✅ | 5 routes, כל route עם `head()` ייחודי |
| Root layout / providers | ✅ | RTL, Hebrew, dark-tinted, Heebo font |
| Design tokens | ✅ | מרוכזים ב־`src/styles.css` |
| Tile primitives | ✅ | variants + tones + sizes |
| Shell (top+bottom+side) | ✅ | responsive, RTL, safe-area |
| UI primitives (shadcn) | ✅ מוכן | 46 קבצים, נטמעים כשיידרשו |
| Empty states | ✅ | קומפקטי, ללא illustration |
| Auth | ❌ | טרם |
| Backend / DB | ❌ | Lovable Cloud טרם הופעל (ADR-0012) |
| Data model | ❌ | מתועד ב־`data-model.md`, לא ממומש |
| Forms / validation | ❌ | `zod` + `react-hook-form` מותקנים |
| i18n | 🟡 | עברית hard-coded בטקסטים (מקובל ל־single-user) |
| Tests | ❌ | להוסיף כשיהיה קוד עם לוגיקה |

## חסמים אמיתיים

1. **החלטה מוצרית פתוחה** — מאיזה תחום להתחיל את המימוש בפועל (ריצה / חדר כושר / בית).
2. **Lovable Cloud טרם הופעל** — יופעל כשמתחילים לכתוב מיגרציה ראשונה.

## סטטוס בדיקות (2026-07-24)

- ✅ `bunx tsgo --noEmit` — נקי.
- ✅ `bun run lint` — 0 errors (6 warnings בקבצי shadcn ui — לא משפיעים).
- ✅ Prettier — כל הקבצים מפורמטים.
- ✅ Visual QA (Playwright) — screenshots ב־390×844 (mobile), 1280×900 (desktop) לכל 5 המסכים. אין overflow אופקי. Bottom nav במקום, Side nav במקום ב־lg. פונטים נטענים, tiles בצבעי דומיין, gradient רקע עדין.

## מוכנות לשלב מסך הכניסה

✅ **מוכן.** יש מעטפת עקבית, טוקנים מרכזיים, ורכיבי בסיס. מסך `/auth` יבנה על AppShell (עם `topBar={{ back: false }}`) + `Tile` + input primitives של shadcn.
