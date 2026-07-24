# Design System &amp; App Shell Audit

עודכן: 2026-07-24 (Product Alignment Audit). מקור: `src/styles.css`, `src/components/shell/*`, `src/components/tile/*`, `src/components/ui/*`, `src/routes/__root.tsx`.

---

## חלק א' — App Shell &amp; Navigation

| רכיב | קובץ | ממצא | סיווג |
|---|---|---|---|
| **TopBar** | `shell/AppShell.tsx` | sticky, `grid-cols-[auto_minmax(0,1fr)_auto]` (back/כותרת/action), `h-14`, translucent `bg-background/70 backdrop-blur-xl`, `safe-top`, back עם `ChevronRight` + `rtl:rotate-180` ו-touch 44px. מוצג רק כשמועבר `topBar`. | **DIRECTLY_USABLE** |
| **BottomNav** | `shell/Nav.tsx` | קבוע תחתון, `lg:hidden`, `safe-bottom`, `grid-cols-5`, touch 56px, active לפי צבע דומיין + glow. פריטים: `/` ראשי · `/running` (run) · `/gym` (gym) · `/home` (home) · `/more`. תואם היקף מדויק. | **DIRECTLY_USABLE** |
| **SideNav** | `shell/Nav.tsx` | `aside` קבוע, `hidden lg:block`, `w-64`, `end-0` + `border-s` (RTL-correct — בשמאל ב-RTL). AppShell שומר מקום עם `lg:pe-64`. | **DIRECTLY_USABLE** |
| **PageHeader / SectionHeader** | `shell/PageHeader.tsx` | grid overflow-safe, `truncate`, spacing לוגי, eyebrow/title/description/action. | **DIRECTLY_USABLE** |
| **EmptyState** | `shell/EmptyState.tsx` | קומפקטי, `tile-base`, אייקון קטן + כותרת, `role="status"`, ללא illustration/שיווק — תואם "no cheerleader". | **DIRECTLY_USABLE** |
| **QuickAddSheet (חוצה-תחומים)** | — | **לא קיים.** אין FAB/כפתור מרכזי. quick-add פר-תחום דרך `DomainSummaryTile` (`+` ל-`/running/new` וכו') + עמודי "new". sheets ייעודיים קיימים (LocationForm/TreadmillForm/EquipmentForm/ExerciseForm/pickers — כולם `side="bottom"`). | **NEEDS_ADAPTATION** (אם quick-add חוצה-תחומים הוא יעד מוצר; אחרת הדפוס הפר-תחומי מכוון) |
| **Cross-module search** | — | **לא קיים.** shadcn `Command`/`CommandDialog` קיים אך לא בשימוש. חיפוש רק מקומי לכל רשימה. | פער (ייתכן מכוון ל-single-user) |
| **Route guards (auth/PIN/role)** | — | **אין.** רק `beforeLoad`/redirect לשכתובי route (`home.new`→quick, `home.history.$id`→summary) ו-redirect חד-פעמי בעמוד `/` לפי `landingModule`. | תואם single-user |
| **404 / Error** | `__root.tsx` | `NotFoundComponent`/`ErrorComponent` **באנגלית בלבד** ("Page not found") באפליקציה עברית/RTL, פריסת רקע ריק גדול. גם מחווט `reportLovableError`. | **MISALIGNED_WITH_PRODUCT** (שפה + whitespace) |

**RTL:** `<html lang="he" dir="rtl">` + `viewport-fit=cover`. רכיבי shell משתמשים ב-logical properties עקבי (`ms-/me-`, `ps-/pe-`, `start/end`, `rtl:rotate-180`). שימוש בתכונות פיזיות מוגבל בעיקר ל-primitives של shadcn שלא נגעו בהם (`pl-8 pr-2`, `text-left`, `left-4`) — ברירות מחדל של הספרייה, לא באגי RTL באפליקציה. שימוש קל לא-לוגי ב-routes: `gym.history.$id.tsx` משתמש ב-`text-right` (נכון חזותית ב-RTL אך לא לוגי). מספרים: כלל גלובלי `[dir="rtl"] input[type=number] / .ltr-nums { direction: ltr; text-align: right }`.

**Safe-area:** `@utility safe-top`/`safe-bottom` עם `max(env(safe-area-inset-*), 0px)`, מיושם ב-TopBar/BottomNav. `theme-color #1a1d2b`, `min-h-dvh`.

**Horizontal overflow:** סיכון נמוך. `min-w-0`, `truncate`, `line-clamp`, `grid-cols-[minmax(0,1fr)_auto]` בכל ה-shell/headers. `MiniLineChart` SVG `width="100%"`. הטבלה היחידה (`gym.history.$id.tsx`) עטופה ב-`overflow-auto`.

**Dead buttons / "בקרוב":** `more.tsx` → `DisabledItemTile` עם 3 אריחי "בקרוב" מכוונים (הגדרות פרופיל, ייצוא נתונים, הגדרות AI). `DataSourceTile` אינפורמטיבי ("עדיין לא מחובר ל-backend", badge `mock`). אין כפתורים מתים אחרים.

---

## חלק ב' — Design System

מקור: `src/styles.css` (Tailwind v4, `@theme inline` + `@utility`) + `src/components/tile/*`.

### מערכת טוקנים OKLCH
כל הצבעים **OKLCH**. שכבות:
- **Semantic:** `background`, `foreground`, `surface`/`-foreground`/`-elevated`, `tint`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `border-strong`, `input`, `ring`. בסיס = כחול-פחם עמוק (`--background: oklch(0.185 0.018 260)`) — במכוון "לא שחור טהור", foreground כמעט-לבן (לא לבן טהור).
- **Domain (run/gym/home/goal):** לכל אחד base + `-foreground` + `-soft`. run=כתום(55), gym=כחול(210), home=ירוק(155), goal=סגול(295). מכויל למשטחים כהים.
- **Status:** `success`(155), `warning`(85), `info`(235), `destructive`(22) — כל אחד עם `-foreground`+`-soft`.
- **Chart:** `chart-1..5` ממופה ל-run/gym/home/goal + סגול חמישי.
- Radii: `--radius: 1rem` (sm…3xl). 3 shadow tokens (`color-mix`). פונט: **Heebo** (עברית) sans+display, JetBrains Mono ל-mono.

### Dark-first
**Dark-first ו-dark-only במכוון.** רק ערכי `:root`. `body::before` radial-gradient glow מונע "voids שחורים" — מקיים ישירות "אין רקע לבן גדול". Light mode הושמט במכוון (ADR-0014).

### Tile — שפת הבסיס (`components/tile/Tile.tsx`)
`Tile` דרך CVA: **variant** (`default|run|gym|home|goal|warning|success|info`) × **tone** (`outline|soft|solid`) × **size** (`sm|md|lg`). `interactive` (hover elevation, `active:scale`), `selected` (ring), `disabled`, keyboard-accessible (`role=button`, Enter/Space, `aria-pressed`), polymorphic `as`. תת-חלקים: `TileLabel`, `TileMetric` (`ltr-nums`), `TileFootnote`, `TileTrend` (▲/▼/◆ עם aria). `DomainSummaryTile` = ה-hero בעמוד הראשי (אייקון + מדד ראשי + משני + פעילות אחרונה + יעד פעיל יחיד עם progress bar `inlineSize`). **אריחים הם באמת ה-primitive הדיפולטי** — תואם חזק ל-"tiles, not lists".

### רשימות/כרטיסים/טבלאות/דיאלוגים/sheets
- **Tiles שולטים.** רשימות רק היכן שמתאים (תוצאות חיפוש, pickers).
- **Sheets** = משטח מודל ראשי, עקבי `side="bottom"` (למרות ש-`ui/sheet.tsx` default הוא `right`).
- טבלאות: שימוש אמיתי אחד (`gym.history.$id.tsx`), עטוף `overflow-auto`.
- Popovers לתפריטי שורה (`EquipmentTile`/`LocationTile`/`TreadmillTile`, `dir="rtl"`).

### shadcn/ui primitives קיימים
accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip. **סט shadcn מלא; רבים לא בשימוש** (command, menubar, navigation-menu, carousel, sidebar, resizable, input-otp, chart/recharts).

### IconButton / StatusBadge / FormField
- **IconButton:** אין רכיב משותף. מוגדר מקומית וכפול ב-`TemplateBlockCard.tsx` + `TemplateExerciseRow.tsx`. ← לקדם ל-primitive.
- **StatusBadge:** אין ייעודי. shadcn `Badge` קיים אך **ללא variants דומיין/סטטוס**; צ'יפים hand-rolled inline (סיכון drift).
- **FormField:** shadcn `ui/form.tsx` קיים אך אימוץ לא-עקבי מול שדות hand-built (`NumberField`, `RepStepper`).

### Charts
- ה-chart העיקרי = **SVG מותאם ללא תלות** `MiniLineChart` (`components/analytics/`): mobile-first, `width="100%"`, RTL-aware (`ltr-nums`), `role="img"` + `aria-label` + fallback טקסטואלי, hover/tap. a11y חזק.
- **recharts** מיובא רק ב-`ui/chart.tsx` (shadcn) ש**אינו מרונדר בשום מקום**.

### a11y
`aria-hidden` על אייקונים דקורטיביים, `aria-label` על אייקון-בלבד, `role="status"` (EmptyState), `role="progressbar"` (goal bar), `role="img"`+fallback (chart), keyboard ב-Tile, `:focus-visible` גלובלי, `prefers-reduced-motion`.

### התאמה לדרישות (§3)
**ALIGNED:** mobile-first, עברית+RTL, אין גלילה אופקית, אין swipe קריטי, אין feed/מסך "היום", tiles כדיפולט, whitespace מצומצם, טקסט קריא, צבעוניות+גבולות `border-strong`+`rounded-2xl`, אייקונים ברורים, ללא cheerleading, יעד מוצג באריח דומיין.

**GAPS:**
1. אין **IconButton** משותף (כפול ב-2 קבצי templates).
2. אין **StatusBadge/domain-badge** primitive; `Badge` חסר variants → צ'יפים inline (drift).
3. **FormField** קיים אך אימוץ לא-עקבי.
4. **404/Error** באנגלית + whitespace גדול — misaligned.
5. אין **cross-module search** ואין **global QuickAdd** ב-shell (ייתכן מכוון — דרושה החלטה מוצרית).
6. **שטח shadcn מת** גדול (command/menubar/navigation-menu/sidebar/carousel/resizable/chart-recharts) — ניתן לגיזום.
7. שכבת הדאטה **mock** (`activeRepoKind === "mock"`) — design system שלם אך לא מגובה backend.
