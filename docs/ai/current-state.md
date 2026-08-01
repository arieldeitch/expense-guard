# Current State — מצב הפרויקט

תאריך עדכון: **2026-08-01** (Phase 1 מומש בריפו; המיגרציה טרם הוחלה)

---

## 🟡 מצב 2026-08-01 (ג) — Phase 1 מומש במלואו בריפו, לא הוחל על ה-DB

> **הסעיף הזה גובר על הסעיפים שמתחתיו.**

### מה הוחלט
**`nhnuuooyxamkkqqpcgmk` הוא הפרויקט הסמכותי.** ה-merge ל-`main` בוצע (`3775ff4`, non-fast-forward, ההיסטוריה נשמרה) ונדחף.

### מה קיים עכשיו בקוד — Phase 1
| רכיב | קובץ | מצב |
|---|---|---|
| Auth (אימייל+סיסמה בלבד) | `src/lib/supabase/session.ts` | ✅ מומש |
| Schema + RLS | `supabase/migrations/20260801090000_phase1_profiles_and_goals.sql` | ✅ נכתב · ❌ **לא הוחל** |
| Repository adapter | `src/lib/repo/supabase.ts` + `resolveRepository()` | ✅ מומש |
| העלאה idempotent | `src/lib/sync/` | ✅ מומש |
| מצב סנכרון | `fitlog:sync-state:v1` | ✅ מפתח **נפרד** |
| UI | `src/components/account/AccountTile.tsx` בתוך `/more` | ✅ ללא route חדש |

### היקף מכוון — **לא** כל מודל הנתונים
Phase 1 מכסה **goals בלבד**. `sessions` · `runs` · `templates` · `catalog` · `exercises` נשארים **מקומיים בלבד**. `CLOUD_ENTITIES` (30 ישויות) **לא** מומש. `listActivities` מחזיר `[]` — **זהה למה שה-mock מחזיר היום**, ולכן אין רגרסיה.

### אבטחה — מה נאכף במיגרציה
RLS מופעל **באותה מיגרציה** שיוצרת כל טבלה · כל policy מסונן ב-`auth.uid()` · `goals.user_id` עם `default auth.uid()` כך שלקוח **אינו יכול** להחדיר שורה בבעלות אחר · `GRANT` הוא `select, insert, update` **בלבד** · **אין policy של delete כלל** → מחיקה בלתי אפשרית דרך ה-API (soft delete בלבד) · **אין trigger על `auth.users`** — במקומו `ensureProfile()` בצד לקוח.

### שמירת נתונים מקומיים
`fitlog:sync-state:v1` **אינו `StorageModule`** ולכן אינו נראה ל-backup, לגרסת ה-schema המקומית, ל-snapshot או ל-rollback. **אף מפתח `fitlog:*` של דומיין לא נקרא, נמחק, נדרס או הוסר.** הצלחה מוסיפה סמן בלבד. פורמט הגיבוי ללא שינוי.

### ראיות אימות (על `2a93716`)
typecheck exit 0 (וגם אחרי build) · **test:unit 348** ב-23 קבצים (מ-314 ב-21 — **+34 חדשות**) · **test:router 61** ב-10 קבצים · build exit 0 · 7 מסלולים → **200 עם SSR HTML** · ה-bundle שהוגש מכיל **רק** `nhnuuooyxamkkqqpcgmk` · סריקת סודות נקייה · **אין token/session ב-SSR HTML** · `routeTree.gen.ts` — רק בלוק R-30 המוכר, **אפס שינוי routes**.

### 🔴 שני חסמים
1. **המיגרציה לא הוחלה.** אין גישה מורשית ל-DB: Supabase CLI מחזיר **403** על ה-ref (מחובר לארגון אחר), ותוסף ה-Chrome אינו מחובר. **לא נכתב דבר לאף DB.**
2. **Lovable לא בנה מחדש.** 43 דקות אחרי הדחיפה ל-`main`, ה-bundle החי עדיין `index-Dm-gL1BL.js` — **ללא Supabase כלל**. הפריסה עדיין על הגרסה שלפני החיבור.

**לכן:** אין schema · אין טבלאות · אין RLS פעיל · אין משתמשי Auth · אין sync בפועל. הקוד מוכן; ה-DB ריק.

---

## ✅ מצב 2026-08-01 (ב) — הריפו מחובר לפרויקט הסמכותי

> **הסעיף הזה גובר על סעיף הביקורת שמתחתיו.** הביקורת תיארה את הבעיה; כאן היא נפתרה **בריפו**.

### ההחלטה
**`nhnuuooyxamkkqqpcgmk` הוא פרויקט ה-Supabase הסמכותי של Fit Log.** הפרויקט של Lovable Cloud, `fusrapommtdqwfglkmks`, אינו בשימוש — הוא **לא נמחק ולא נותק**, בהתאם להוראה.

### מה שונה — שני קבצים, חמישה ערכים
| קובץ | שינוי |
|---|---|
| `.env` | `SUPABASE_PROJECT_ID` · `SUPABASE_URL` · `SUPABASE_PUBLISHABLE_KEY` + שלוש המראות `VITE_*` |
| `supabase/config.toml` | `project_id = "nhnuuooyxamkkqqpcgmk"` |

**אפס שינוי בקוד האפליקציה.** לא נדרש תיקון תאימות: כל ה-integration מונע-env, ולכן החלפת הערכים הספיקה. commit: **`67438e7`**.

### אימות המפתח — לפני שנכתב לאנשהו
`/auth/v1/health` → **200**, ו-`/auth/v1/settings` החזיר קונפיגורציה אמיתית (`email: true`). ה-**401 על `/rest/v1/` אינו תקלה** — המפתח של הפרויקט הישן מחזיר בדיוק את אותה תשובה (`Secret API key required`), כי כך מתנהג פורמט המפתח האטום החדש באותו endpoint.

### ראיות אימות
| בדיקה | תוצאה |
|---|---|
| `bun install --frozen-lockfile` | ✅ `@supabase/supabase-js` 2.111.0 · `@lovable.dev/vite-tanstack-config` **2.8.4** |
| `typecheck` | ✅ exit 0 — וגם שוב אחרי build |
| `bun run test` | ✅ exit 0 — **375 בדיקות** (314 unit ב-21 קבצים + 61 router) |
| backup + storage + migration | ✅ **99 בדיקות ב-5 קבצים** — ה-round-trip של הגיבוי עובר |
| `build` | ✅ exit 0 |
| הרצת ה-build לפרודקשן | ✅ `/`, `/home`, `/backup`, `/gym`, `/running`, `/more` → **200 עם SSR HTML** (adapter של Bun **מחוץ לריפו**, ללא wrangler) |
| ה-bundle שהוגש לדפדפן | ✅ מכיל **רק** `https://nhnuuooyxamkkqqpcgmk.supabase.co` והמפתח החדש · **0 מופעים** של ה-ref הישן |
| סריקת סודות | ✅ אין `sb_secret_*` / `sbp_*` / service-role בשום קובץ tracked או ב-`.output`. כל מופע של `sb_secret_` הוא **הליטרל של הבדיקה** ב-`isNewSupabaseApiKey()` |
| נתונים מקומיים | ✅ `fitlog:*` **לא נקרא, לא נכתב, לא הועבר** |
| DB | ✅ **אפס כתיבות.** רק שתי קריאות GET ל-endpoints ציבוריים |

### שני מצבים קיימים שנמדדו ובמכוון לא תוקנו
1. **`lint` נכשל — קיים מראש, לא נגרם מהמעבר.** 29,784 שגיאות `prettier/prettier "Delete ␍"` ב-245 קבצים. **הוכח:** הוצאת שני קובצי הקונפיג ל-stash והרצת lint על `681d40c` נקי נתנה **תוצאה זהה בייט-לבייט** — 29792 problems / 29784 errors / 8 warnings. זהו **R-17** (renormalize מעולם לא הורץ במכוון). `.env` ו-`config.toml` אינם עוברים lint בכלל.
2. **drift ב-`routeTree.gen.ts`.** build מקומי מחזיר את בלוק ה-`Register` בן 10 השורות ש-`681d40c` של Lovable הסיר — **בדיוק מה ש-R-30 חזה** לנעיצה 2.8.3→2.8.4. הוחזר לקדמותו כדי שה-commit יישאר מצומצם לשני קבצי הקונפיג; typecheck עובר בשתי הצורות.

### 🔎 ממצא פריסה — ה-backend השגוי **מעולם לא הגיע לפרודקשן**
האפליקציה החיה ב-**https://fitlog-workout.lovable.app** **אינה מכילה קוד Supabase כלל.** נסרקו **כל 21 ה-chunks** וה-HTML: **0 מופעים** של `supabase`, **0** של `fusrapommtdqwfglkmks`, **0** של `nhnuuooyxamkkqqpcgmk`. גודל ה-bundle החי 391KB מול 601KB בבנייה המקומית. **Lovable לא בנה מחדש מאז `bdcfdae`.**

**לכן:** האם Lovable דורס את `.env` בהזרקת env בזמן build — **עדיין לא ניתן לקבוע**. השאלה תיהפך לניתנת-לצפייה רק אחרי הבנייה הבאה של Lovable. **אין להניח תשובה לכאן או לכאן.**

### מה עדיין **לא** קיים — ללא שינוי
**אין schema · אין טבלאות · אין מיגרציות · אין RLS · אין Auth ואין Auth UI · אין Storage · אין Edge Functions · אין sync.** `types.ts` עדיין ריק. `supabase`/`supabaseAdmin` הם **Proxy עצל** שלא נקרא באף מסלול. **הנתונים ב-`localStorage` בלבד.**

### סטטוס סיכונים
- **R-31 — מופחת, לא סגור.** הריפו כבר לא מצביע על ה-backend השגוי. נשאר פתוח עד שהפריסה של Lovable תאומת.
- **R-32 — נשאר פתוח.** `.env` עדיין tracked. כרגע מכיל **רק** מפתחות ציבוריים.

---

## 🔴 מצב 2026-08-01 — backend של Lovable Cloud חובר ל-`origin/main` שלא בכוונה

> **הסעיף הזה גובר על כל אמירה "אין Supabase בריפו" שמופיעה מטה.** האמירות ההן היו נכונות עד `0b0d000`; הן **אינן נכונות יותר** ל-`origin/main`.

### מה קרה — עובדות מ-Git, לא הערכה
`origin/main` התקדם מ-**`0b0d000`** ל-**`681d40c`** בשמונה commits של Lovable, ובהם **`bdcfdae` — "יצר backend Lovable Cloud חדש"** ו-**`681d40c` — "Verified Supabase connection"**. ה-`main` המקומי נשאר ב-`0b0d000` והוא **אב קדמון** של `681d40c` (fast-forward אפשרי, אין divergence).

### מה נוסף בפועל (11 קבצים, +447/−14)
| קובץ | תפקיד |
|---|---|
| `.env` | **מסומן ב-Git (tracked)**. 6 משתנים: `SUPABASE_PROJECT_ID` / `URL` / `PUBLISHABLE_KEY` + מראות `VITE_*`. |
| `supabase/config.toml` | שורה אחת: `project_id = "fusrapommtdqwfglkmks"` |
| `src/integrations/supabase/client.ts` | client ציבורי, **נוצר עצלנית דרך Proxy** |
| `src/integrations/supabase/client.server.ts` | client עם service role — קורא `SUPABASE_SERVICE_ROLE_KEY` מ-`process.env` **בלבד** |
| `src/integrations/supabase/auth-middleware.ts` | `requireSupabaseAuth` (server) |
| `src/integrations/supabase/auth-attacher.ts` | `attachSupabaseAuth` (client) |
| `src/integrations/supabase/types.ts` | טיפוסים מיוצרים — **`Tables`/`Views`/`Functions`/`Enums` ריקים לחלוטין** (schema ריק, `PostgrestVersion: 14.15`) |
| `src/start.ts` | נוסף `functionMiddleware: [attachSupabaseAuth]` |
| `package.json` / `bun.lock` | נוסף `@supabase/supabase-js ^2.111.0`; `@lovable.dev/vite-tanstack-config` `2.8.3` → **`2.8.4`** |
| `src/routeTree.gen.ts` | −10 שורות (רגנרציה) |

### 🔑 ממצא מפתח — אין secret בריפו
ב-`.env` יש **רק מפתחות ציבוריים** בפורמט `sb_publishable_*`. **אין `SUPABASE_SERVICE_ROLE_KEY` ואין `sb_secret_*` בריפו.** מפתח ה-service role נצרך מ-`process.env` בזמן ריצה בלבד (הזרקה של Lovable). זו **אינה** דליפת סוד.

### 🔑 ממצא מפתח — היקף המעבר הוא שני קבצים בלבד
סריקה על `origin/main` הראתה ש-`fusrapommtdqwfglkmks` מופיע **אך ורק** ב-`.env` ו-`supabase/config.toml`. **אין ולו מזהה פרויקט אחד קשיח ב-`src/`** — כל קוד ה-integration נשען על משתני סביבה (`VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` בלקוח, `SUPABASE_*` בשרת). לכן המעבר לפרויקט הסמכותי הוא **שינוי קונפיגורציה ציבורית בלבד** — ללא נגיעה בקוד.

### מצב זמן ריצה — האפליקציה עדיין לא נוגעת ב-backend
`supabase` ו-`supabaseAdmin` שניהם **Proxy עצל**: ה-client נוצר רק בגישה ראשונה לתכונה. אין קריאת query, אין UI של Auth, ואין טבלאות. **הנתונים עדיין ב-`localStorage` בלבד.** `fitlog:*` לא נוגע.

### החסם היחיד
**המפתח הציבורי (`publishable`) של `nhnuuooyxamkkqqpcgmk` אינו נגיש מכאן.** Supabase CLI **מותקן ומחובר** (v2.101.0) אך החשבון המחובר מחזיר **403** על שני ה-refs — הוא רואה רק את ארגון `jauaspogygzagvdgwzwi`, ושני הפרויקטים אינם בו. סריקה של `C:\Users\user\Desktop` לא מצאה את ה-ref בשום פרויקט מקומי אחר. שני הפרויקטים **חיים** (`/rest/v1/` → 401, כצפוי ללא מפתח).

### מה **לא** נעשה בביקורת הזו
לא נוצר schema · לא נוצרו RLS/Auth/מיגרציות · לא נגענו באף DB · לא נמחק ולא נותק ה-backend הריק · לא שונה `.env` · לא בוצע push · לא הותקנה dependency · `main` המקומי לא הוזז (יש tag `checkpoint/pre-supabase-switch-audit`).

---

## 🚀 מצב 2026-07-31 (סגירה) — Fit Log פורסם ונמצא בשימוש יומיומי

**כתובת חיה:** **https://fitlog-workout.lovable.app** — אומת 200 עם SSR, כולל ניווט ישיר ל-`/home` ו-`/backup`.

### Git — מצב מאומת
| | |
|---|---|
| `origin/main` = local `main` | **`904d50f`** |
| **בסיס המוכנות לפרודקשן** | **`fc9089b`** — כל האימות המלא בוצע עליו |
| commit של Lovable | **`7542ad8`** — *"Work in progress"*, **build tooling בלבד** |
| commit נוסף של Lovable | `904d50f` — *"Checked GitHub branch status"*, **diff ריק לחלוטין מול `7542ad8`** (no-op) |

**מה `7542ad8` שינה — אומת בקוד, לא הונח:** `package.json` בלבד — `@lovable.dev/vite-tanstack-config` מ-`^2.7.7` ל-**`2.8.3`** (נעיצה מדויקת) + `bun.lock` תואם. **אין שינוי מוצר, אין שינוי runtime, אין תלות חדשה.**

**אומת מחדש על `904d50f` עם 2.8.3 בפועל** (`bun install --frozen-lockfile` → הותקן 2.8.3): typecheck exit 0 (גם אחרי build) · `bun run test` exit 0 — **375 בדיקות** (314 unit + 61 router) · eslint **0 errors / 8 baseline warnings** · `bun run build` exit 0 · `routeTree.gen.ts` **ללא drift** · working tree נקי. **הנעיצה אינה משנה התנהגות.**

### מה אומת בסשנים של היום (על `fc9089b`)
build לפרודקשן · ניווט ישיר ו-refresh · כל המסלולים הראשיים · פריסת 360px · סריקת console (0 שגיאות ב-24 מסכים) · התמדה ב-localStorage · ייצוא גיבוי ואימותו · כל זרימות הליבה (בית · כוח · ריצה · היסטוריה · גיבוי).

### ארכיטקטורה — ללא שינוי, במכוון
> ⚠️ **גובר ע"י הסעיף של 2026-08-01 שלמעלה.** נכון ל-`0b0d000` בלבד. ב-`origin/main` (`681d40c`) **כן** קיימים `@supabase/supabase-js`, `.env`, `supabase/config.toml` ו-`src/integrations/supabase/*`. עדיין אין schema, Auth, RLS או sync.

**משתמש יחיד · localStorage בלבד.** **אין** Supabase · אין authentication · אין RLS · אין migrations · אין cloud sync · אין CI. **הנתונים שייכים לדפדפן ולמכשיר הנוכחיים בלבד** — אין סנכרון ואין גיבוי אוטומטי מחוץ למכשיר.

### הצעד הבא — המתנה מכוונת
המשתמש **ישתמש באפליקציה מספר ימים** לפני תחילת עבודת הסנכרון ל-Supabase. **אין להתחיל עבודת Supabase כעת.** אין לשנות SSR, ארכיטקטורת אחסון, routes, schemas, פורמט הגיבוי או התנהגות מוצר.

---

## ✅ מצב 2026-07-31 (ג) — פרודקשן אומת, מוכן ל-Lovable

**מה נבדק:** פלט ה-build עצמו (`.output`, preset `cloudflare-module`) שהוגש דרך adapter קטן ב-Bun (תיקייה זמנית, **לא בריפו**) שמשחזר את חוזה ה-Worker + binding `ASSETS`. **ללא wrangler וללא dependency חדשה.**

| בדיקה | תוצאה |
|---|---|
| ניווט ישיר + refresh | ✅ 13 מסלולים עמוקים → **200 עם SSR HTML** |
| כתובת לא קיימת | ✅ **404 אמיתי** (לא SPA fallback של 200) |
| קבצים סטטיים | ✅ content-type נכון, מוגשים לפני ה-worker |
| שגיאות בפרודקשן | ✅ **0 hydration, 0 חריגות** ב-24 מסכים |
| זרימות ליבה | ✅ בית · כוח (855ק״ג, סיום חלקי) · ריצה (קצב 5:11) · היסטוריה |
| ייצוא גיבוי | ✅ קובץ אמיתי 95,118 בייט · `validateBackup` **ok** · checksum `253f4906` חושב מחדש והתאים · 0 errors/warnings |
| 360px | ✅ 9 מסכים, אפס גלישה אופקית |
| התנהגות אחסון | ✅ **ללא שינוי** — אותם 6 מפתחות, schema 1.0.0, אותם IDs ופורמט Export |
| מוכנות Lovable | ✅ `.lovable/project.json` תקין · artifacts ב-gitignore · אין secrets · עץ נקי ומסונכרן |

**תוקן בסשן:** (1) 7 מסלולים זרקו `notFound()` ב-render של השרת → `Minified React error #419` בפרודקשן; נוסף גארד `if (!hydrated) return null` (ADR-0039). **R-26 נסגר.** (2) סכנת סדר-hooks סמויה ב-`locations.$id.tsx` (`useMemo` אחרי יציאה מוקדמת) — תוקנה.

**⚠️ הבחנה:** בסוף הסשן הדפדפן ההדמייתי (CDP) הפסיק לייצר page target — **תקלה בכלי האימות בלבד**; ה-build המשיך לענות 200 בו-זמנית. `/locations/$id` מכוסה ע"י SSR תקין ב-HTTP + גארד זהה שאומת ב-6 מסלולים + בדיקות router + כל שערי האימות.

**המלצה ארכיטקטונית שלא בוצעה:** ייתכן ש-SSR מיותר ל-MVP הנוכחי (localStorage בלבד, משתמש יחיד). **לבחון בנפרד.**

---

## ✅ מצב 2026-07-31 (ב) — האפליקציה אומתה **בריצה**, לא רק בבדיקות

**סביבה שנבדקה:** `bun run dev` → `http://localhost:8080` · **Chrome 150 headless דרך CDP** (פרופיל מבודד, ללא dependency חדשה) · Windows 11 · Bun · branch `main`.

**מה עובד — אומת בדפדפן, לא הוסק מבדיקות:**

| יכולת | תוצאה |
|---|---|
| עליית האפליקציה | ✅ SSR מחזיר 200, `dir="rtl"`, `lang="he"` |
| טעינת מסלולים | ✅ **24 מסכים** נטענים, 0 חריגות JS, 0 בקשות כושלות |
| גישת משתמש יחיד | ✅ אין auth **במכוון** (ADR-0012/0030) — אין מסך כניסה, `activeRepoKind="mock"` |
| דיווח תרגיל בית | ✅ 12 חזרות → נשמר → **שרד refresh** → הופיע בהיסטוריה |
| אימון כוח | ✅ פתיחה → הוספת תרגיל → 2 סטים (60×8, 62.5×6) → **נפח 855ק״ג** → שרד refresh → **סיום חלקי** (2 סטים דולגו) |
| ריצה ידנית | ✅ 6.2 ק״מ / 32:10 → **קצב 5:11 מחושב** → נראית בהיסטוריה |
| ייצוא גיבוי | ✅ **קובץ אמיתי** `fitlog-backup-20260731-0841.json`, 96,429 בייט |
| אימות הגיבוי | ✅ `validateBackup` → **ok**, 75 רשומות, checksum `75adbe56` **חושב מחדש והתאים**, 0 errors / 0 warnings |
| התמדה מקומית | ✅ 6 מפתחות `fitlog:*`, `storage-meta` schema **1.0.0**, snapshot מיגרציה קיים |
| **פריסת 360px** | ✅ **9 מסכים, אפס גלישה אופקית** — נמדד `scrollWidth` מול `clientWidth` בדפדפן אמיתי |
| שגיאות console/רשת | ✅ **0** אחרי התיקון (היו 7 שגיאות hydration) |
| תעבורת רשת | ✅ **רק** `localhost:8080` + Google Fonts. **0 קריאות XHR/fetch לנתונים** |

**🔴 הבאג המרכזי שהתגלה ותוקן — אי-התאמת hydration.** ה-hooks קראו את ה-repository ישירות ב-render ועקפו את `getServerSnapshot`, ולכן בכל מסך שיש בו נתונים React זרק `Hydration failed` ורינדר מחדש את תת-העץ. **הבדיקות לא יכלו לתפוס זאת** — הן רצות ב-jsdom ללא SSR ועם אחסון ריק. תוקן ע"י `useHydrated()` (ADR-0039). **0 שגיאות ב-24 מסכים** אחרי התיקון.

**מה שאינו קיים — במכוון, אומת מחדש:** אין Supabase client · אין `.env` ואין משתני סביבה · אין `supabase/` ואין migrations ענן · אין Auth/RLS · אין CI. ארבעת סעיפי ה-checklist האלה **אינם ישימים** לארכיטקטורה הנוכחית (localStorage בלבד, מכשיר יחיד).

**סיכונים שנפתחו ולא נסגרו:** R-26 (`/sessions/$id/summary` — `notFound()` ב-SSR, נופל ל-client rendering) · R-27 (`exercises`/`catalog` לא מגודרים במכוון) · R-28 (טיוטות ריצה יתומות).

**החסם היחיד נותר R-22:** יכולת הגיבוי **הוכחה בפועל**, אך המשתמש טרם שמר קובץ מחוץ לדפדפן.

---

## ✅ מצב 2026-07-31 — התאוששות הושלמה, R-24 נסגר

**Git:** branch `main` · working tree נקי · **אין stashes, אין untracked, אין פעולה פעילה**. הריסטרט לא השאיר קבצים חלקיים. מה שהופסק היה **push בלבד**: ה-commit `16be950` נוצר ב-2026-07-30 ולא נדחף. נוצרו tag `recovery-checkpoint-2026-07-31` ו-branch `backup/pre-recovery-2026-07-31` לפני כל פעולה.

**מה נסגר:** **R-24** — `REFERENCE_RULES` ב-`src/lib/backup/repo.ts` תוקן ל-`home_session_id`, נוסף כלל `home.sets → home.entries`, ודילוג ה-`parents.size === 0` הוסר. ADR-0037.

**באג שהתגלה תוך כדי אימות ותוקן:** `deriveDependencyOrder` ב-`src/lib/readiness/readinessReport.ts` הסיק `dependency_order: true` מקובץ שנדחה באימות ולכן ביצע **אפס פעולות** — ראיה חיובית מאמת ריקה, בניגוד לעקרון ADR-0036. הבאג היה קיים קודם והוסתר ע"י R-24.

**בדיקות: 375 עוברות** — `test:unit` **314/314** (21 קבצים) · `test:router` **61/61** (10 קבצים) · backup **21** · readiness **31** · migration **44** · storage **34**. typecheck exit 0 (גם אחרי build) · eslint 0 errors / 8 baseline warnings · build exit 0 · `routeTree.gen.ts` ללא diff.

**תאימות לאחור נשמרה:** פורמט Export, `schema_version` 1.0.0, מפתחות אחסון, IDs, חתימות API וקודי issue — ללא שינוי. **לא נגעו ב-UI, לא נוספה dependency, לא בוצע deploy.**

**סיכון חדש שנפתח ולא נסגר:** **R-25** — גיבוי עם הפניה שבורה נדחה כולו, ואין מסלול "ייבא בכל זאת ודלג על השבורים". דורש UI והחלטת מוצר.

**החסם היחיד נותר R-22:** טרם נוצר קובץ גיבוי בפועל מחוץ לדפדפן — פעולה ידנית של המשתמש.

---

## ✅ אימות מצב 2026-07-30 (Recovery Audit)

**Git:** `main` · HEAD **`daba93c`** · `main` = `origin/main` (0/0) · working tree נקי · אין stashes/tags/commits לא-דחופים · שני ה-feature branches מוזגו ומסונכרנים.

**כל הבדיקות הורצו מחדש על `main` והתוצאות זהות לתיעוד מ-2026-07-26:** typecheck exit 0 (גם אחרי build) · `test:unit` **305/305** (21 קבצים) · `test:router` **61/61** (10 קבצים) · migration 44 · readiness 29 · backup 14 · storage 34 · eslint **0 errors / 8 baseline warnings** · build exit 0 עם `routeTree.gen.ts` ללא שינוי.

**אומת בקוד:** `activeRepoKind === "mock"` · `CLOUD_ENTITIES` = 30 · `DEFERRED_MODULES = ["preferences"]` · **אין `@supabase`, אין `createClient`, אין `import.meta.env`/`process.env`, אין `.env`/secret ב-tracking, אין `supabase/`, אין CI** · 47 אזכורי "Supabase" ב-`src` הם הערות בלבד · 0 TODO/FIXME · 0 בדיקות מדולגות.

**תוקן בסשן זה:** ספירת ה-routes — היה כתוב **53**, בפועל **54 route modules** + `__root.tsx` (נוסף `backup.index.tsx` במסלול A ולא עודכן). מאושר מול `src/routes/` ומול `RootRouteChildren` ב-`routeTree.gen.ts`.

**החסם היחיד:** R-22 — **טרם נוצר קובץ גיבוי בפועל מחוץ לדפדפן.** פעולה ידנית של המשתמש.

---

## 🗄️ מוכנות נתונים (עודכן 2026-07-26) — **local בלבד, לא בסיס נתונים ענני**

| רכיב | מצב | ראיה |
|---|---|---|
| Supabase client | ❌ אין | אין import; אזכורים בקוד הם הערות בלבד |
| env contract | ❌ אין | אין `.env`; אין `import.meta.env`/`process.env` בקוד |
| Migrations (ענן) | ❌ אין | אין `supabase/` ואין `migrations/` |
| Auth / RLS | ❌ אין | אין מסך auth, אין policies |
| Active repository | `mock` | `activeRepoKind === "mock"` |
| Persistence | localStorage · 9 מפתחות `fitlog:*` | `catalog, exercises, goals, home, preferences, runs, sessions, suunto, templates` |
| שורד refresh | ✅ כן, במכשיר ובדפדפן הזה בלבד | — |
| Export | ✅ קיים | `/backup` · מעטפת `workout-data-system` 1.0.0 (ADR-0031) |
| Import / Restore | ✅ קיים | preview + snapshot לפני כתיבה + מדיניות קונפליקטים מפורשת |
| זיהוי כשל כתיבה | ✅ כל 9 המודולים | `safeStorage` + `reportWrite` (ADR-0032) |
| **תצוגת כשל כתיבה למשתמש** | ✅ **גלובלי, בכל מסך** | `GlobalStorageBanner` ב-`__root` — `memory_only`→`role="status"`, `failed`→`role="alert"` |
| **local schema version** | ✅ **1.0.0** | `fitlog:storage-meta` (ADR-0033) |
| **migration registry** | ✅ `legacy -> 1.0.0` | `src/lib/storage/migrations.ts` — idempotent, לא הרסנית |
| **snapshot לפני מיגרציה** | ✅ עם checksum ו-rollback | `fitlog:migration-snapshot` — נפרד מ-snapshot ה-Restore |
| **future schema version** | ✅ נחסם | גרסה גבוהה מ-1.0.0 → `future_version_blocked`, אין נגיעה בנתונים |
| **Fake Supabase rehearsal** | ✅ **עובר** | `src/lib/migration/` — ענן מדומה בזיכרון, 30 ישויות, 44 בדיקות (ADR-0034) |
| **Readiness Gate** | ✅ **נגזר מיכולות** | `src/lib/readiness/` — 16 בדיקות, 2 gates, 29 בדיקות (ADR-0036) |
| `ready_for_single_device_use` | ✅ **true** | נגזר מ-10 יכולות שהורצו בפועל |
| `ready_for_future_supabase_migration_contract` | ✅ **true** | נגזר מהאמור לעיל + ids/idempotency/סדר/בעלות/קונפליקטים |
| **Import אמיתי מול Supabase** | ❌ טרם | הפער העיקרי שנותר — דורש Auth/RLS ופרויקט אמיתי |
| העברה למכשיר אחר | 🟡 ידני בלבד | דרך קובץ Export/Import; אין sync |

**מסקנה:** שכבת האחסון המקומית **גרסאית, ניתנת לשחזור, וכשלי כתיבה גלויים**, והנתונים **הוכחו** כעומדים בחוזה ההגירה מול ענן מדומה. עדיין אין בסיס נתונים ענני, אין Auth/RLS ואין sync — העברה בין מכשירים היא ייצוא/ייבוא ידני, ונדרש מבחן Import אמיתי מול Supabase. ראה R-22, ADR-0030, ADR-0032, ADR-0033, ADR-0034, ADR-0035, ADR-0036.

## ⚠️ Reconciliation — Product Alignment Audit (2026-07-24)

> החלקים הישנים במסמך זה ("מה קיים בפועל" ואילך) **מיושנים** — הם מתארים מצב מוקדם של 5 routes ו"אין קוד לוגי". המצב האמיתי מתקדם בהרבה. להלן התמונה המאומתת. פירוט מלא: `route-inventory.md`, `entity-inventory.md`, `design-system-audit.md`, `product-alignment-audit.md`.

**מצב אמיתי (מאומת ע"י audit):**
- **54 route modules** + `__root.tsx` (`src/routes/`), 5 טאבים בניווט (`/`, `/running`, `/gym`, `/home`, `/more`), השאר deep-link. (41 מקוריים + 12 domain-goals מ-Phase 1 + `backup.index.tsx` ממסלול A.) **מאומת 2026-07-30** מול `src/routes/` ומול `RootRouteChildren`.
- **שכבת נתונים מלאה** תחת `src/lib/<domain>/` (לא `domain/data/application/features`): `runs`, `suunto`, `catalog`, `exercises`, `templates`, `sessions`, `home`, `goals`, `preferences`, `analytics`, `repo`, `hooks`, `selectors`.
- **Persistence = localStorage** (`fitlog:<domain>:v<n>`), **שורד refresh**. אין backend, אין Supabase, אין auth (במכוון). `activeRepoKind === "mock"`.
- **בדיקות (עודכן 2026-07-26): 366 עוברות** — `test:unit` **305/305** (21 קבצים, `src/lib`, סביבת node) + `test:router` **61/61** (10 קבצים, `src/test`, jsdom, כל קובץ בתהליך Vitest נפרד — ADR-0026).
- **Workout Execution (`/sessions/$id`) — פעיל ושמיש.** ביצוע אימון כוח: סטים בפועל (משקל/חזרות/זמן/**RPE**) בעריכה inline, השלמה/ביטול, הוספה/שכפול/דילוג סט, **דילוג על תרגיל שלם**, החלפת תרגיל, סופרסטים, rest timer, pause/resume, **סיום מלא או חלקי**, ו**סטטוס שמירה אמיתי** (`נשמר במכשיר` רק אחרי אישור ה-repository; אזהרה כשהנתונים בזיכרון בלבד). autosave מלא — האימון שורד refresh. ADR-0027/0028.
- **תיקון חוזה בתיעוד:** `WorkoutSessionSnapshot` **אינו קיים**. החוזה בפועל: `StrengthSession` → `StrengthSessionExercise` (+ `StrengthSessionExerciseSnapshot`) → `StrengthSet`. typecheck (`bun run typecheck`) נקי. build עובר. routeTree.gen.ts דטרמיניסטי. cross-domain isolation נאכף ע"י `goalMatchesDomain` (GoalForm edit + GoalDetailView) ובדוק **גם ברמת render דרך routes אמיתיים**.
- **route structure (עודכן 2026-07-25):** כל route module המשמש מסך עצמאי הוא `*.index.tsx`. **`__root.tsx` הוא ה-layout היחיד** (ה-`<Outlet />` היחיד בריפו); `routeTree.gen.ts` מכיל רק `RootRouteChildren`. ראה ADR-0025.
- שלושת התחומים בנויים במלואם: ריצה (חוץ/הליכון/Suunto/כיול/מסלולים), כוח (תבניות/סופרסטים/אימון פעיל/היסטוריה/analytics), בית (quick entry/סטים גמישים/תבניות). goals engine מלא (26 goal types).
- **אין קוד legacy** מחוץ להיקף (people/transport/roles/PIN/coach/clients/team — נעדרים). **אין secrets/service_role/network egress** (למעט Google Fonts).
- **goals surface (נפתר, Phase 1):** אין מסך יעדים גלובלי. יעדים מנוהלים בתוך כל תחום — 12 domain-goals routes + `DomainPrimaryGoalTile` מחובר ל-3 המסכים. `/goals*` נשמרו כ-compatibility redirects בלבד (לא בניווט). ראה ADR-0021 (פתור).
- **trash/restore (נפתר, Phase 2):** `/trash` מכסה כעת גם gym sessions, home sessions ו-goals (שחזור דו-שלבי). recompute אוטומטי דרך subscribers.
- **i18n:** 404/Error של `__root.tsx` תורגמו לעברית+RTL.
- **Git (מעודכן 2026-07-26, אחרי מיזוג מסלול A):** **`main` = `origin/main` = `0e51653`** — מיזוג **non-fast-forward** של `feat/home-plan-simple-flow` (`8470c4f`) לתוך `main` (`de4c996`). היסטוריית ה-feature נשמרה במלואה (ללא squash, ללא rebase, ללא force). אימות מלא הורץ **על `main` עצמו**: typecheck exit 0 · `test:unit` 305/305 (21 קבצים) · `test:router` 61/61 (10 קבצים) · `bun run test` exit 0 · eslint 0 errors / 8 baseline warnings · build ×2 exit 0 · typecheck אחרי build exit 0 · `routeTree.gen.ts` ללא diff. **לא בוצע deploy. אין Supabase/SDK/Auth/RLS/env/secret. לא נוספה dependency** (`package.json` שונה רק בסקריפטי בדיקות). ה-feature branch **לא נמחק**.
- **היסטוריית Git קודמת (2026-07-25):** **`main` = `origin/main` = `f33d00a`** — עודכן ב-**fast-forward** מ-`feat/domain-alignment-and-restore` (ללא merge commit) ונדחף ללא force. **`origin/main` הוא מקור האמת** לגרסה הנוכחית. אימות מלא הורץ על `main`: typecheck exit 0 · 216 בדיקות · eslint 0 errors / 8 baseline warnings · build ×2 · `routeTree.gen.ts` ללא שינוי. `eca9163` נשמר בהיסטוריה. ה-feature branch **לא נמחק**. **לא בוצע deploy.**
- **היסטוריה קודמת:** branch `feat/domain-alignment-and-restore`, **HEAD = `a4d24e2`**, **ahead 0 / behind 0** מול origin, working tree נקי. **ההתאוששות מהריסטרט הושלמה ונדחפה** — שלושת ה-commits `6fb22c3` (freeze) · `da20f72` (checkpoint) · `a4d24e2` (סגירת חסם הבדיקות) נדחפו ב-fast-forward `5af65bd..a4d24e2`. **לא בוצעו force push, merge או deploy.** `main` המקומי עדיין מקדים את `origin/main` ב-commit אחד ולא נדחף. פרטים מלאים: `SESSION_HANDOFF.md`.
- **אין Supabase / Auth / RLS / migrations / CI-CD / sync engine** בריפו (אומת 2026-07-25). Persistence = localStorage בלבד. אין קובצי `.env` ואין secrets.
- **הערה:** שם התיקייה `expense-guard` הוא scaffold מטעה — הקוד הוא אפליקציית כושר.

---

## עדכון אחרון — Home Strength Module

- `src/lib/home/` — data layer מלא: `types.ts`, `storage.ts`, `repo.ts`, `metrics.ts`, `records.ts`, `hooks.ts`, `seed.ts`, `index.ts`.
- מודלים: `HomeSession`, `HomeExerciseEntry` (+ `snapshot` להיסטוריית substitution), `HomeExerciseSet` (reps/time/tempo/side/added_weight/assistance/round), `HomeTemplate` + entries + versions. Soft-delete בכל הישויות.
- Repo תומך: quick entry (תרגיל יחיד), אימון מלא, autosave, החלפת תרגיל, שכפול/מחיקת סט, ארכוב/שחזור, סבבים (rounds), תבניות ביתיות + גרסאות + הפעלה מתבנית.
- Metrics: `stabilityFromReps` (CV-based), `homeQualityScore` (Completion 0.5 + Stability 0.3 + Data completeness 0.2), `summarizeSets` (avg/median/max/last-to-first ratio). ראה `docs/ai/metrics-home.md`.
- Records: baseline-aware (session ראשון = baseline, לא שיא): `top_reps_in_set`, `total_reps_in_session`, `longest_hold`, `top_reps_with_added_weight`.
- UI: `src/components/home/` — `RepStepper` (−1/+1/+5), `HoldTimer` (timestamp), `HomeSetRow`, `HomeSessionTile[Wrapper]`, `HomeTemplateTile`.
- Routes: `/home` (launchpad עם recent + templates + quick actions), `/home/quick`, `/home/quick/$exerciseId`, `/home/sessions/$id` (ביצוע), `/home/sessions/$id/summary` (עובדתי + PRs + Quality), `/home/history`, `/home/history/$id`, `/home/templates`, `/home/templates/$id`, `/home/templates/$id/edit` (עורך מלא).
- Behavior: Autosave על כל mutation; דיווח עצמאי לכל סט (חזרות שונות); substitution שומר snapshot; skipped סט לא נספר; שפה עובדתית.
- Tests: `src/lib/home/__tests__/home.test.ts` — 20 בדיקות. סה"כ **139/139** עוברות (9 קבצים).
- Typecheck נקי.

---

## סיכום קודם



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
