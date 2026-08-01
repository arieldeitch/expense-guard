# Risks

> ⚠️ **Filename note.** `RISKS.md` and `risks.md` are the **same file** here (`core.ignorecase = true`).
> Do not create an uppercase `RISKS.md` — it would overwrite this register.
>
> Structured English register below (active risks, verified 2026-08-01 19:02 Asia/Jerusalem at `36b0453`).
> The full Hebrew history follows and is retained. **No risk is closed without evidence.**

---

## Active risk register

### R-36 · Authenticated verification blocked by email confirmation
- **Status:** OPEN · **Probability:** Certain (measured) · **Impact:** Medium
- **Evidence:** `GET /auth/v1/settings` returns `mailer_autoconfirm: false`. A real signup created the user but returned **no `access_token`**; `email_confirmed_at` was `null`.
- **Mitigation:** The app does not depend on the cloud — `resolveRepository()` falls back to local and all data stays in `localStorage`. No regression.
- **Response:** Disable email confirmation in Lovable (OPEN_TASKS **B1**), then run authenticated verification (**B2**).
- **Owner:** user (Lovable), then Claude
- **Next review:** when B1 is confirmed done.

### R-38 · Cross-user authenticated RLS verification incomplete
- **Status:** OPEN · **Probability:** N/A (verification gap, not a known defect) · **Impact:** High if RLS were wrong
- **Evidence:** Anonymous RLS verified live — SELECT returned `[]`, INSERT returned 401 RLS violation, DELETE affected 0 rows. **User A to User B isolation is untested** because no session can be obtained (R-36). The migration asserts 6 `auth.uid()`-scoped policies and 0 DELETE policies.
- **Mitigation:** Static assertions in `src/lib/sync/__tests__/phase1Security.test.ts` scan every migration file.
- **Response:** Two-user verification in **B2**. **Do not claim RLS isolation is proven until then.**
- **Owner:** Claude
- **Next review:** immediately after B1.

### R-39 · Temporary email-confirmation configuration risk
- **Status:** OPEN (anticipatory) · **Probability:** Medium · **Impact:** Medium
- **Trigger:** B1 temporarily weakens signup by removing confirmation. If left off, unverified addresses can create accounts on a live application.
- **Mitigation:** Change only the confirmation setting — not providers, password rules, redirect URLs, schema, RLS, code, routes, or plan.
- **Response:** Restore the intended setting after verification (**B3**) and record the final intended state explicitly.
- **Owner:** user (Lovable)
- **Next review:** immediately after B2 completes.

### R-40 · Stale unconfirmed disposable test user
- **Status:** OPEN · **Probability:** Certain · **Impact:** Low
- **Evidence:** One clearly labelled unconfirmed user matching `fitlog-e2e-*@fitlog-e2e.invalid` exists in `fusrapommtdqwfglkmks`. Its password was never written to the repository, a log, or a commit.
- **Mitigation:** Clearly labelled and unconfirmed, so it holds no session and owns no rows.
- **Response:** Delete through safe supported means during cleanup (**B5**). **Never add a DELETE policy to make cleanup easier.**
- **Owner:** user / Claude
- **Next review:** during B5.

### R-37 · DELETE privilege not explicitly revoked
- **Status:** OPEN (observation) · **Probability:** Low · **Impact:** Low while RLS is enabled
- **Evidence:** The migration grants `select, insert, update` but never runs `revoke delete`; Supabase default grants include DELETE. **Live probe: anonymous DELETE affected zero rows** (`return=representation` returned `[]`), because RLS admits none.
- **Mitigation:** RLS enabled with no DELETE policy — the documented correct pattern.
- **Response:** Consider an explicit `revoke delete` in a future hardening pass. **Do not weaken RLS. Do not add a DELETE policy.**
- **Owner:** Claude
- **Next review:** at the next schema change.

### R-33 / R-17 · CRLF and Prettier lint baseline
- **Status:** OPEN (pre-existing) · **Probability:** Certain · **Impact:** Low
- **Evidence:** `bun run lint` fails with roughly 29,784 `prettier/prettier` carriage-return errors across 245 files. Proven identical on a pristine pre-Supabase tree, so **not a regression**. Root cause: `git add --renormalize` deliberately never run (R-17).
- **Mitigation:** `typecheck`, `test` and `build` are the effective quality gate and are green.
- **Response:** A dedicated renormalization commit, on its own. **Do not normalize opportunistically and do not mix it into feature work.**
- **Owner:** unassigned
- **Next review:** when a dedicated cleanup session is scheduled.

### R-30 · Generated route-tree ordering drift
- **Status:** OPEN (benign) · **Probability:** Certain · **Impact:** Low
- **Evidence:** A local build reorders imports relative to Lovable's generator and re-adds a 10-line `Register` block. **Route set verified identical: 55 modules, 79 paths, diff empty in both directions.**
- **Mitigation:** Compare route sets rather than raw diffs.
- **Response:** **Do not commit ordering-only churn.** Revert `src/routeTree.gen.ts` after local builds.
- **Owner:** Claude
- **Next review:** any Lovable commit touching `package.json` or `bun.lock`.

### R-29 · Local-only, device-specific data
- **Status:** OPEN · **Probability:** Certain · **Impact:** High
- **Evidence:** Real workout data lives only in this browser's `localStorage`. Phase 1 syncs goals only, and no upload has been run.
- **Mitigation:** Manual export from `/backup`; backup round-trip verified by 99 tests.
- **Response:** Export regularly until sync covers more domains. **Do not rely on the cloud for recovery yet.**
- **Owner:** user
- **Next review:** after Phase 1 verification.

### R-41 · Accidental Phase 2 scope expansion
- **Status:** OPEN · **Probability:** Medium · **Impact:** Medium
- **Trigger:** An agent reads `CLOUD_ENTITIES` (30 entities) and assumes it is the target for this phase.
- **Mitigation:** Scope is documented as goals-only in decision D6 and `PROJECT_STATUS.md` section 9.
- **Response:** **No Phase 2 work before authenticated Phase 1 verification succeeds (D10).**
- **Owner:** Claude
- **Next review:** at the N1 decision point.

### R-42 · Accidental reconnection to the superseded Supabase project
- **Status:** OPEN · **Probability:** Low · **Impact:** High
- **Trigger:** Older documentation still names `nhnuuooyxamkkqqpcgmk` as authoritative, and an agent "fixes" configuration to match it.
- **Evidence:** Verified at `36b0453` — the superseded ref appears in **no** source file, config, or migration; only in `docs/ai/*.md` as history.
- **Mitigation:** ADR-0040 marks it Superseded; `PROJECT_STATUS.md` carries an explicit warning.
- **Response:** **Leave `nhnuuooyxamkkqqpcgmk` untouched.** Never edit `.env` to repoint — it is platform-managed and overridden at build time (D4).
- **Owner:** Claude
- **Next review:** at any backend or configuration change.

### R-43 · Accidental silent upload or mutation of local data
- **Status:** OPEN · **Probability:** Low · **Impact:** High
- **Trigger:** A future change makes upload automatic, or a sync path writes to a `fitlog:*` domain key.
- **Evidence:** Upload is explicit today; sync state is isolated in `fitlog:sync-state:v1`, which is not a `StorageModule` and is therefore invisible to backup, schema version, snapshots and rollback. No real user data has been uploaded.
- **Mitigation:** Tests assert domain keys are byte-identical across a recorded upload.
- **Response:** **Never upload the user's real data without explicit confirmation. Never clear or rewrite `fitlog:*`.**
- **Owner:** Claude
- **Next review:** at any change under `src/lib/sync/`.

### R-35 · Hand-written Supabase types — CLOSED (2026-08-01)
- **Status:** CLOSED with evidence
- **Evidence:** `src/lib/supabase/tables.ts` deleted; all shapes derive from the generated `types.ts`; regression test `generatedTypes.test.ts` added and passing.

---

מפת סיכונים אקטיבית. עדכון בכל החלטה שמפחיתה או מוסיפה סיכון.

## R-35 · טיפוסי Supabase ידניים — ✅ **סגור** (2026-08-01 ד)
`src/lib/supabase/tables.ts` נמחק. כל הקוד משתמש ב-`Database` המיוצר. אין עותק שני של הסכמה, אין `any`, אין cast על תוצאות query. בדיקת רגרסיה: `src/lib/sync/__tests__/generatedTypes.test.ts`.

## R-36 · Auth דורש אישור אימייל — 🟠 Medium (נפתח 2026-08-01 ד)
**תרחיש:** `mailer_autoconfirm: false` בפרויקט הסמכותי. הרשמה יוצרת משתמש אך **אינה מחזירה session** עד אישור במייל. לכן **אף מסלול מאומת לא נבדק מקצה לקצה** — לא `ensureProfile`, לא העלאה, לא RLS עם משתמש, לא ה-no-op בריצה שנייה.
**מיטיגציה:** האפליקציה אינה נשענת על הענן — `resolveRepository()` נופל למקומי, וכל הנתונים ב-`localStorage`. אין רגרסיה. נדרשת פעולה אנושית אחת (ראה T-05).
**נלווה:** קיים משתמש בדיקה אחד לא מאומת `fitlog-e2e-*@fitlog-e2e.invalid` — ניתן למחוק.

## R-37 · הרשאת DELETE ברירת-מחדל לא נשללה — 🟡 Low (נפתח 2026-08-01 ד)
**תרחיש:** המיגרציה מעניקה `select, insert, update` בלבד, אך **אינה מבצעת `revoke delete`**. ב-Supabase יש הרשאות ברירת מחדל לתפקידי `anon`/`authenticated`, ולכן DELETE מוענק. **אומת בפועל:** DELETE אנונימי החזיר **0 שורות** (`[]`) — RLS ללא policy של delete אינו מתיר אף שורה. **זו ההתנהגות הנכונה והמתועדת**, והמחיקה בלתי אפשרית כל עוד RLS דלוק.
**מיטיגציה:** אין לכבות RLS. אין להוסיף policy של delete. שקול `revoke delete` מפורש בהקשחה עתידית — **לא שינוי דחוף.**

## R-34 · Phase 1 כתוב אך לא מוחל — פער בין הקוד ל-DB — 🟠 Medium (נפתח 2026-08-01)
**תרחיש:** הקוד של Phase 1 (Auth, adapter, העלאה) קיים ועובר את כל הבדיקות, אבל **המיגרציה לא הוחלה** על `nhnuuooyxamkkqqpcgmk`. משתמש שילחץ "התחבר" יקבל שגיאה, ו"העלה יעדים" ייכשל עם `relation "goals" does not exist`.
**מדוע לא High:** האפליקציה **אינה נשענת על הענן**. `resolveRepository()` נופל חזרה ל-repo המקומי בכל כשל, `AccountTile` מציג הודעת שגיאה בעברית ואינו חוסם מסך, וכל הנתונים נשארים ב-`localStorage`. **אין רגרסיה במסלול המקומי** — 409 בדיקות עוברות.
**מיטיגציה:** להחיל את המיגרציה (דורש גישה מורשית — ראה T-04). עד אז אין להבטיח למשתמש שהתחברות עובדת.

## R-35 · טיפוסי Supabase מוצהרים ידנית עד להחלת המיגרציה — 🟡 Low (נפתח 2026-08-01)
**תרחיש:** `src/integrations/supabase/types.ts` (מיוצר ע"י Lovable) **ריק**, ולכן `src/lib/supabase/tables.ts` מצהיר את צורת השורות ידנית. אם המיגרציה תוחל בשינוי כלשהו מול קובץ ה-SQL, הטיפוסים הידניים יסטו מהמציאות **בלי ש-tsc יתלונן**.
**מיטיגציה:** אחרי החלת המיגרציה — לתת ל-Lovable לייצר מחדש את `types.ts`, למחוק את `tables.ts` ולהחליף את הייבוא. שתי פונקציות ה-write שם משתמשות ב-structural type צר (**לא `any`**), כך שהארגומנט עדיין נבדק מול צורת השורה.

## R-33 · `lint` נכשל ב-`origin/main` בגלל CRLF — 🟡 Low-Medium (נפתח 2026-08-01)
**תרחיש:** `bun run lint` מחזיר **29,784 שגיאות `prettier/prettier "Delete ␍"` ב-245 קבצים**. זהו **מצב קיים מראש ב-`origin/main`, לא רגרסיה** — הוכח ע"י הרצת lint על `681d40c` נקי (בלי שני קובצי הקונפיג): תוצאה **זהה בייט-לבייט**. השורש הוא **R-17**: ה-blobs מכילים CRLF ו-`git add --renormalize` מעולם לא הורץ במכוון.
**מדוע לא תוקן:** תיקון = נגיעה ב-245 קבצי מקור. זה חורג מכל משימת קונפיגורציה, ו-R-17 קובע במפורש שה-renormalize ייעשה ב-commit ייעודי בלבד.
**מיטיגציה:** אין להסתמך על `lint` כשער איכות עד ל-renormalize ייעודי. `typecheck`, `test` ו-`build` **כן** ירוקים ומהווים את השער בפועל.

## R-31 · `origin/main` מחובר ל-backend הלא נכון — 🟢 מופחת, פתוח חלקית (עודכן 2026-08-01 ג)
**עדכון 2026-08-01 (ג):** ה-merge ל-`main` בוצע ונדחף (`3775ff4`). **43 דקות לאחר מכן Lovable עדיין לא בנה מחדש** — ה-bundle החי הוא `index-Dm-gL1BL.js` וללא Supabase כלל. **מסקנה חדשה: Lovable אינו בונה מחדש אוטומטית מדחיפת GitHub.** שאלת הדריסה עדיין פתוחה ותיענה רק אחרי בנייה יזומה ב-Lovable.

### הנוסח הקודם
**עודכן:** ✅ **הריפו הועבר** לפרויקט הסמכותי `nhnuuooyxamkkqqpcgmk` (commit `67438e7`). ה-bundle שנבנה ומוגש מכיל **רק** את הפרויקט החדש; אפס מופעים של הישן.
**מה שנשאר פתוח:** ה-**פריסה**. האפליקציה החיה עדיין נבנתה לפני שה-backend נוסף — היא **אינה מכילה קוד Supabase כלל** (נסרקו כל 21 ה-chunks). לכן לא ניתן עדיין לדעת אם Lovable דורס את `.env` בזמן build. **הסיכון ייסגר רק אחרי בנייה חדשה של Lovable שתאומת כמצביעה על `nhnuuooyxamkkqqpcgmk`.**
**הנחיה שנשארת בתוקף:** אין ליצור schema/טבלאות/Auth/RLS לפני שהפריסה אומתה.

### הנוסח המקורי (2026-08-01, לפני המעבר)
**תרחיש:** `origin/main` (`681d40c`) מצביע על פרויקט Lovable Cloud **`fusrapommtdqwfglkmks`** במקום על הפרויקט הסמכותי **`nhnuuooyxamkkqqpcgmk`**. אם ייווצר schema או יתחבר משתמש **לפני** המעבר — ייווצרו נתונים אמיתיים ב-backend הלא נכון, וההעברה תהפוך ממעבר קונפיגורציה למיגרציית נתונים.
**מדוע לא High:** ה-backend הלא נכון **ריק ואומת כריק** (0 טבלאות, 0 משתמשים, 0 buckets, 0 מיגרציות, 0 Edge Functions), ו-`supabase`/`supabaseAdmin` הם **Proxy עצל** שלא מופעל באף מסלול — אין query ואין UI של Auth. הנתונים האמיתיים ב-`localStorage`, ואינם מושפעים.
**מיטיגציה:** לבצע את מעבר הקונפיגורציה **לפני** כל יצירת schema/Auth/RLS. לא ליצור טבלאות ולא להתחבר עד שהמעבר הושלם ואומת.

## R-32 · `.env` מסומן ב-Git — 🟡 Low-Medium · **פתוח** (נפתח 2026-08-01, אומת מחדש אחרי המעבר)
**סטטוס אחרי המעבר:** אומת מחדש ב-`67438e7` — `.env` מכיל **רק** `sb_publishable_*`. סריקת סודות על כל הקבצים ה-tracked ועל `.output` לא מצאה אף `sb_secret_*`, `sbp_*` או service-role. **הסיכון לא השתנה ולא נסגר.**
**תרחיש:** Lovable הוסיף `.env` **כקובץ tracked** (אינו ב-`.gitignore`). כרגע הוא מכיל **רק** מפתחות `sb_publishable_*` — ציבוריים מעצם הגדרתם, ולכן **אין דליפת סוד**. הסיכון הוא עתידי: אם Lovable או סוכן יכתבו לשם `SUPABASE_SERVICE_ROLE_KEY` או `sb_secret_*`, הסוד ייכנס להיסטוריית Git ציבורית באופן בלתי הפיך.
**מיטיגציה:** `client.server.ts` קורא `SUPABASE_SERVICE_ROLE_KEY` מ-`process.env` **בלבד** — אין נתיב קוד שמצפה לו ב-`.env`. לבדוק את `.env` בכל commit של Lovable. **לעולם לא לכתוב לשם ערך `sb_secret_*` או service role.**

## R-01 · אובדן נתונים — 🔴 High
**תרחיש:** מחיקה קשיחה בטעות; overwrite של סט קיים; מיגרציה שמפילה עמודה.
**מיטיגציה:** soft delete בלבד; 2 פעולות למחיקה; audit_log; מיגרציות דורשות `UP` + `DOWN` הפיך ובחינת diff ידנית; אף פעם אין `DROP COLUMN` / `TRUNCATE` בלי אישור מפורש.

## R-02 · שכתוב לא נחוץ של קוד שעובד — 🟠 Medium
**תרחיש:** AI עתידי מבצע refactor רחב "לסדר קוד" ושובר behavior עדין.
**מיטיגציה:** ADR-0011; AGENTS.md מחייב קריאה של docs/ai לפני עריכה; שינויים מגיעים כ־PR קטן במקום refactor רחב.

## R-03 · RTL שבור — 🟠 Medium
**תרחיש:** רכיבי shadcn משתמשים ב־`left`/`right` קשיחים במקום `start`/`end`; icons שלא מתהפכים; פופאובים שנפתחים לכיוון הלא נכון.
**מיטיגציה:** `dir="rtl"` ברמת HTML מהיום הראשון; ריבוי logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) ב־Tailwind; QA מובייל ב־RTL לכל מסך חדש.

## R-04 · Mobile UX degradation — 🟠 Medium
**תרחיש:** רכיב שנבנה בראש desktop גורם לגלילה אופקית / מסתיר תוכן במובייל.
**מיטיגציה:** preview נבדק ב־viewport מובייל כברירת מחדל; אין `min-width` שגורם overflow; אין רכיב שדורש swipe.

## R-05 · Schema drift — 🟠 Medium
**תרחיש:** שינוי טבלה בלי עדכון types / query-options; RLS policy שנוסף בלי GRANT מתאים.
**מיטיגציה:** כל מיגרציה כוללת GRANT + RLS + policies באותו קובץ; types מתחדשים אוטומטית ע"י Lovable Cloud; קוד שמפרסם למיגרציה חייב לעדכן also queryOptions.

## R-06 · הזיות AI על המוצר — 🟠 Medium
**תרחיש:** agent עתידי מוסיף feature מחוץ להיקף ("מסך חברים", "badges") כי "משתמשים אוהבים".
**מיטיגציה:** AGENTS.md אוסר במפורש; product-requirements.md מגדיר מחוץ־להיקף באופן מפורש; שינוי היקף = עדכון requirements קודם.

## R-07 · מדיה — עלות + זליגה — 🟡 Medium
**תרחיש:** קבצי וידאו/תמונה גדולים ב־Storage → עלות; bucket ציבורי → זליגת קבצי משתמש.
**מיטיגציה:** buckets פרטיים בלבד; Signed URLs עם TTL קצר; אכיפת mime/size בשרת; דחיית העלאת מדיה עד שיש צורך אמיתי.

## R-08 · עלות בלתי צפויה — 🟡 Medium
**תרחיש:** הפעלת שירות בתשלום (AI, OCR, geocoding) שלא אושר.
**מיטיגציה:** ADR-0003 + AGENTS.md — אין enable של שירות בתשלום ללא אישור מפורש; AI Gateway של Lovable כברירת מחדל (ללא חיוב חיצוני).

## R-09 · תלות ספק חיצוני — 🟡 Medium
**תרחיש:** ייבוא מ־Suunto מסתמך על פורמט שהם משנים; API שנעלם.
**מיטיגציה:** לשמור raw import (`suunto_readings`) — אפשר לחשב מחדש; יבוא ידני של קבצים במקום OAuth ל־Suunto Cloud בהתחלה.

## R-10 · Offline — 🟢 Low כרגע
**תרחיש:** משתמש מדווח סטים בבטן חדר כושר ללא רשת → אובדן דיווח.
**מיטיגציה עתידית:** draft ב־localStorage לטופס פעיל; sync אחרי חזרה online. **לא** מיושם כעת.

## R-11 · מחיקה ושחזור — 🟡 Medium
**תרחיש:** UI לא חושף מסך שחזור → משתמש חושב שהדאטה אבד.
**מיטיגציה:** לכל domain — טאב "פריטים שנמחקו" עם restore.

## R-12 · Cloudflare Workers runtime — 🟡 Medium
**תרחיש:** התקנה של package Node-only (sharp, canvas, child_process) → build עובר, runtime מתפוצץ בפרודקשן.
**מיטיגציה:** בדיקת compatibility לפני `bun add`; העדפה ל־WASM / pure JS; אסור להוסיף `ssr.external` ב־Vite config.

## R-13 · Secret leakage — 🟢 Low
**תרחיש:** service_role key מגיע ל־client bundle דרך import טרנזיטיבי; env מודפס ללוג.
**מיטיגציה:** `client.server` מיובא רק בתוך handlers עם `await import(...)`; אין `console.log(process.env)`; secrets דרך `add_secret`, לא `.env` committed.

## R-14 · duplicate `/` route — 🟢 Low
**תרחיש:** יצירת `_authenticated/index.tsx` בזמן ש־`index.tsx` קיים → build fail.
**מיטיגציה:** בכל יצירת gate: home מוגן מקבל שם path (`/dashboard`), לא index.

## R-15 · צבע דומיין כמידע יחיד — 🟡 Medium (הוסף 2026-07-25)
**תרחיש:** משתמש עיוור צבעים לא מזהה אריח ריצה מ־gym כי הצבע לבד מוביל.
**מיטיגציה:** מיושם כבר ב־Home + domain routes — כל אריח דומיין נושא **גם** icon (Footprints/Dumbbell/HeartPulse) **וגם** label ("תחום" eyebrow + שם). אין להוסיף אריח שמסתמך על צבע לבד.

## R-16 · Bottom nav מפריע ל־sticky action buttons — 🟢 Low (הוסף 2026-07-25)
**תרחיש:** בעמוד עם CTA sticky (למשל "סיים אימון") — יסתתר מאחורי BottomNav.
**מיטיגציה:** `main` ב־`AppShell` מקבל `pb-28` (מקום ל־56px nav + safe-area + מרווח). Sticky CTA עתידי — מומלץ להשתמש ב־`bottom-[calc(theme(spacing.20)+env(safe-area-inset-bottom))]`.

## R-17 · CRLF / line-endings שובר lint מקומית ב-Windows — 🟡 Medium (הוסף 2026-07-24)
**תרחיש:** `core.autocrlf=true` **ללא `.gitattributes`** → checkout ב-Windows מייצר CRLF, אך prettier/ESLint מצפים ל-LF. תוצאה: `bun run lint` מדווח ~39,760 שגיאות `Delete ␍` מקומית, בעוד על CI/Lovable (LF) הבעיה אינה קיימת.
**עובדות baseline (2026-07-24):** על LF הבדיקה מציגה **13 בעיות** בלבד: 8 warnings (`react-refresh/only-export-components` בקבצי shadcn ui) + 1 error `react-hooks/rules-of-hooks` (false-positive של TanStack ב-`goals.new.tsx` — `Route.useSearch` בפונקציה בשם `component`). (4 שגיאות `prefer-const` תוקנו ב-audit.)
**מיטיגציה מומלצת (לא בוצעה — דורשת renormalize מכוון):** `.gitattributes` עם `* text=auto eol=lf` **נוסף** (2026-07-25), אך `git add --renormalize .` **טרם הורץ** במכוון. **אזהרה:** renormalize נוגע בכל קובץ (diff ענק) ועלול להשפיע על Lovable sync — לבצע רק בהחלטה מכוונת, לא כתיקון אגבי. עד אז: להריץ lint עם `--rule '{"prettier/prettier":"off"}'` לבדיקת בעיות אמיתיות בלבד.
**סטטוס מאומת 2026-07-30:** `bun run lint` → **exit 1, 30,676 problems (30,668 errors / 8 warnings)**, כולם `Delete ␍`. הפקודה עם `prettier/prettier:off` → **exit 0, 0 errors / 8 warnings**. הסיכון **פעיל וללא שינוי באופיו**; המספר המדויק משתנה עם גודל הריפו (היה ~39,760 ב-2026-07-24) ואינו אינדיקטור לבריאות הקוד. **אין CI בריפו** (`.github` לא קיים), ולכן אי-אפשר "להסתמך על CI".

## R-20 · Vitest/jsdom — hang מצטבר בקובץ router-test גדול — 🟡 Medium · **P2, לא חוסם** (הוסף 2026-07-25)
**תרחיש:** קובץ router-test אחד שמצטברות בו הרבה בדיקות render (memory router + route tree מלא) עלול לא לסיים: hang + `Worker exited unexpectedly`. נצפה ב-`systemErrors.test.tsx` (8 בדיקות) — עקבי, גם בהרצה של הקובץ לבדו.
**reproduction (היסטורי):** `bunx vitest run src/test/systemErrors.test.tsx` → exit 124. הקובץ פוצל ואינו קיים עוד; לשחזור יש לאחד מחדש את `systemScreens` + `runningRouteLoaders` + `catalogRouteLoaders` לקובץ אחד.
**מה נשלל:** pool `forks` ו-`threads` (שניהם נתקעו) · heap יציב ~90–130MB (לא OOM) · custom process runner קובץ-לתהליך (לא הסתיים דטרמיניסטית; הוסר) · תתי-קבוצות עם `-t` עברו תמיד.
**מיטיגציה (בתוקף):** ADR-0026 — פיצול לפי תחומי אחריות + `test:router` כרצף `&&` מפורש, קובץ אחד לתהליך. **כל 5 הקבצים עוברים ומסתיימים; 38 בדיקות; אין force-exit ואין הפחתת כיסוי.**
**סטטוס:** לא חוסם פיתוח. אין ראיה להשפעה מוצרית — הבאג הוא בתשתית הבדיקות, לא במוצר. **אין לטפל לפני משימות הליבה ללא ראיה להשפעה מוצרית.**
**סימן אזהרה להמשך:** אם קובץ router-test חדש מתקרב לגודל שנצפה כבעייתי — לפצל מראש לפי אחריות.

## R-21 · Radix Sheet/Dialog אינו ניתן לרינדור בבדיקות ה-harness — 🟡 Medium · **P2, לא חוסם** (הוסף 2026-07-25)
**תרחיש:** בדיקת render שפותחת `Sheet` (Radix Dialog) נתקעת ב-harness הנוכחי — גם כשהיא הבדיקה **היחידה** בקובץ. נצפה במסך Workout Execution (גיליון "סיום אימון חלקי").
**מה נוסה:** `pointerEventsCheck: 0` ב-`userEvent.setup()` (לא עזר) · פיצול לפי flow עד בדיקה בודדת בקובץ (לא עזר). לא בוצעה חקירה מעבר לכך — ראה R-20.
**השלכה על כיסוי:** ההתנהגות עצמה **מכוסה במלואה** ברמת ה-repository (`workout-execution.test.ts` — status, שימור סטים וערכים, דילוגים). מה שחסר הוא רק שכבת ה-render של הלחיצה בתוך ה-portal.
**מיטיגציה:** בדיקות של flows שנשענים על Sheet נכתבות ברמת repository. אין להוסיף force-exit ואין לדלג על בדיקות.
**סטטוס:** לא חוסם פיתוח. אין ראיה לתקלה מוצרית — הרכיב עובד בדפדפן.
**✅ אומת בפועל 2026-07-31 (הצטמצם ל-מגבלת jsdom בלבד):** ב-Chrome אמיתי ה-`ExercisePickerSheet` **נפתח, מציג את הקטלוג, תומך בבחירה מרובה, וכפתור "הוספת N תרגילים" מוסיף את התרגיל לאימון** — כל הזרימה עברה מקצה לקצה. **זהו באג בסביבת הבדיקות, לא במוצר.** אין לתעדף אותו כבאג מוצר.

## R-18 · goals surface orphan סותר §6 — ✅ נפתר (Phase 1, 2026-07-24)
**היה:** `/goals` גלובלי מנותק מהניווט; `DomainPrimaryGoalTile` לא מרונדר.
**נפתר:** יעדים מנוהלים לפי domain (12 routes), `/goals*` = compat redirects, `DomainPrimaryGoalTile` מחובר ל-3 המסכים. ראה ADR-0021.

## R-19 · `routeTree.gen.ts` drift ב-build מקומי → typecheck נשבר — ✅ נפתר (Phase 1, 2026-07-24)
**היה:** build מקומי חידש את `routeTree.gen.ts` בגרסה ששברה typecheck ב-4 routes שהשתמשו ב-`Route.useLoaderData()`.
**סיבה:** ה-generator המקומי מקליד loader data כ-`| undefined` (מחמיר יותר מהעץ המחויב הישן).
**נפתר (ADR-0022):** 4 ה-routes עברו ל-`Route.useParams()` (ערכים זהים, loaders+notFound נשמרו). כעת generation **דטרמיניסטי** (build×2 ללא diff) ו-typecheck ירוק על העץ הקנוני. אין צורך ב-`git checkout` של הקובץ. עדיין: `routeTree.gen.ts` auto-generated — לא לערוך ידנית.

## R-22 · אין גיבוי, ייצוא או העברה בין מכשירים — 🟡 Medium · **הוקטן 2026-07-26** (הוסף 2026-07-25)
**תרחיש מקורי:** כל הנתונים ב-localStorage של דפדפן אחד. ניקוי היסטוריה/אתר, מצב פרטי, מכסה מלאה או מעבר מכשיר → **אובדן מלא ובלתי הפיך**. אין export, אין import/restore, אין sync.

**מה נסגר:**
- Export/Import/Restore מקומי עם אימות, preview ו-snapshot לפני כתיבה (ADR-0031, `/backup`).
- כל 9 מודולי האחסון עוברים דרך `safeStorage` ומדווחים כשל (ADR-0032).
- **כשל כתיבה מכל מודול גלוי למשתמש בכל מסך** — `GlobalStorageBanner` ברמת `__root`, עם קישור למסך הגיבוי (ADR-0033).
- **schema מקומי גרסאי** (`fitlog:storage-meta` 1.0.0) + registry מיגרציות + snapshot ו-rollback + חסימת גרסה עתידית (ADR-0033).

- **Fake Supabase rehearsal ו-Readiness Gate** — ✅ **בוצעו 2026-07-26.** החוזה מורץ מול ענן מדומה בכל ריצת בדיקות; שני ה-gates נגזרים מיכולות שהורצו בפועל ושניהם `true`. ADR-0034/0035/0036.

**מה עדיין פתוח:**
- **אין sync ואין ענן.** העברה בין מכשירים היא ייצוא/ייבוא **ידני** של קובץ. מכשיר שאבד לפני שהמשתמש ייצא — הנתונים שבו אבדו.
- **הגיבוי תלוי במשמעת המשתמש.** אין תזכורת, אין גיבוי אוטומטי, ואין אימות שהקובץ אכן נשמר מחוץ למכשיר.

- **🔴 טרם בוצע Export ידני מגרסת `main` המאומתת.** היכולת קיימת ואומתה, אך **קובץ גיבוי בפועל מחוץ למכשיר עדיין לא נוצר**. עד שזה יקרה, הסיכון המעשי לא ירד — יכולת אינה גיבוי.
- **אומת מחדש 2026-07-30 (Recovery Audit):** היכולת עדיין תקינה על `main` (`daba93c`) — backup 14/14, storage 34/34, שני ה-gates `true`. **אין ראיה בריפו שהמשתמש ייצא קובץ**, ומטבע הדברים לא ניתן לאמת זאת מהריפו. **R-22 נשאר החסם היחיד בפועל** ודורג כפריט 0 ב-`open-tasks.md`. חלפו ~4 ימים של שימוש אפשרי ללא גיבוי מאומת.

**פעולה נדרשת לפני הסתמכות ארוכת-טווח:** ייצוא ידני מגרסת `main` (merge `0e51653`) דרך `/backup`, ושמירת הקובץ מחוץ לאחסון הדפדפן — רצוי במכשיר נפרד או בתיקייה מגובה. מעבר לענן דורש Approval Brief. ראה `open-tasks.md`.

## R-23 · ה-rehearsal מוכיח את המודל, לא את המנוע — 🟡 Medium (הוסף 2026-07-26)
**תרחיש:** `InMemoryCloudRepository` מוכיח שהנתונים המקומיים עומדים בחוזה ההגירה — סדר תלויות, שימור מזהים, idempotency, בעלות וקונפליקטים. הוא **אינו** מוכיח שהם יעברו מנוע אמיתי.
**מה לא נבדק:** RLS policies · FK constraints שנאכפים ע"י ה-DB · טיפוסי עמודות (numeric precision, JSONB, timestamptz) · טרנזקציות ו-rollback ברמת ה-DB · רשת, timeouts וייבוא חלקי · גדלי payload.
**מיטיגציה:** ה-rehearsal מצמצם משמעותית את מרחב ההפתעות — כשל מודל יתגלה בזול לפני שנוצרת עלות. ADR-0034 מגדיר במפורש מה הוא לא מוכיח.
**פעולה נדרשת:** מבחן Import אמיתי מול Supabase עם Auth/RLS, לפני הסתמכות על ההגירה. דורש Approval Brief.

## R-24 · אימות ההפניות ב-`validateBackup` חלקי — ✅ **נסגר (2026-07-31)** (הוסף 2026-07-26)
**היה:** `REFERENCE_RULES` (`src/lib/backup/repo.ts`) בדק `session_id` עבור `home.entries`, אך השדה בפועל הוא **`home_session_id`** — ולכן הכלל **לא ירה מעולם**. בנוסף כל כלל דילג כשאין אף רשומת הורה (`if (parents.size === 0) continue`), כך ש"כל ההורים נמחקו" לא נתפס. לא היה כלל ל-`home.sets → home.entries`.
**מה שנשאר חשוף:** `importBackup` המקומי (Restore) הסתמך על `validateBackup`, ולכן ייבא entries יתומים למכשיר.
**התיקון (ADR-0037):** השדה תוקן ל-`home_session_id` · נוסף כלל `home.sets → home.entries` על `entry_id` · דילוג ה-`parents.size === 0` הוסר, והוחלף בהבחנה בין אוסף הורים **חסר מהמעטפת** (לא נבדק — מעטפת חלקית אינה ראיה) לאוסף **ריק** (כן נבדק).
**ראיה:** `src/lib/backup/__tests__/backup.test.ts` — 21 בדיקות (היה 14), מהן 7 חדשות: רגרסיה שגיבוי בית תקין עובר ומייבא במלואו · entry יתום נפסל · set יתום נפסל · מחיקת כל ההורים נתפסת · מעטפת ללא אוסף ההורים אינה מייצרת שגיאה מומצאת · קובץ שבור אינו נכתב כלל.
**שינוי התנהגות מכוון:** גיבוי עם הפניה שבורה במודול הבית **נפסל כעת** במקום להתקבל. תאימות לאחור נשמרה בכל השאר — פורמט, `schema_version`, מפתחות, IDs, API וקודי issue ללא שינוי.
**נגזרת:** ראה **R-25** — אין עדיין מסלול "ייבא בכל זאת".

## R-25 · גיבוי שנפסל אינו ניתן לשחזור חלקי — 🟡 Medium (הוסף 2026-07-31)
**תרחיש:** אחרי ADR-0037, קובץ גיבוי עם ולו הפניה שבורה אחת נדחה **כולו**. משתמש שזהו הגיבוי היחיד שלו אינו יכול לחלץ ממנו **דבר** — גם לא את הרשומות התקינות. זו החמרה מכוונת מול המצב הקודם (שבו הקובץ התקבל וייצר נתונים יתומים), אך היא מחליפה סוג נזק בסוג נזק.
**למה לא טופל כאן:** מסלול "ייבא בכל זאת, דלג על הרשומות השבורות ודווח מה נשמט" דורש **UI חדש** במסך `/backup` והוא **החלטת מוצר** — מחוץ ל-scope שהוגדר לתיקון R-24 (`repo.ts` + בדיקות בלבד).
**מיטיגציה בפועל:** `previewImport` כבר מחזיר את דוח האימות המלא כולל `scope` ו-`ids` של כל הפניה שבורה, כך שהמידע לשחזור ידני קיים ואינו אבוד.
**פעולה נדרשת:** החלטת מוצר האם להוסיף `merge_skip_broken` כמצב ייבוא מפורש (opt-in, לעולם לא ברירת מחדל) עם דוח מפורש של מה נשמט.

## R-26 · `notFound()` נזרק ב-render של השרת — ✅ **נסגר (2026-07-31 ג)** (הוסף 2026-07-31)
**היה:** **שבעה** מסלולים זרקו `notFound()` **מתוך הרכיב**. בשרת אין `localStorage`, ולכן הישות תמיד חסרה שם והזריקה קרתה בכל טעינה. ב-dev זה הופיע כ-`Switched to client rendering because the server rendering errored: {isNotFound: true}`, וב-**build לפרודקשן** כ-**`Minified React error #419`** — כלומר גבול ה-Suspense נפל ו-React רינדר את כל תת-העץ מחדש בלקוח.
**המסלולים:** `sessions.$id.summary` · `gym.history.$id` · `exercises.$id.history` · `locations.$id` · `templates.$id.index` · `templates.$id.edit` · `templates.$id.history`.
**התיקון (ADR-0039):** `if (!hydrated) return null;` **לפני** הזריקה — שכבת render בלבד, ללא שינוי בניתוב, ב-persistence או ב-API.
**מה נשמר:** ה-404 האמיתי עובד כרגיל — כתובת עם מזהה שאינו קיים מציגה "העמוד לא נמצא".
**ראיה:** סריקת 24 מסכים על ה-build לפרודקשן → **0 שגיאות hydration ו-0 חריגות**; `#419` נעלם מ-`/sessions/$id/summary`. `bun run test` 375/375.
**נגזרת שתועדה:** אזהרת console אחת שנותרת על **כתובת שגויה בלבד** (`The above error occurred in the <X> component… CatchBoundaryImpl`) — **אומת כקיים גם לפני השינוי** (הושווה מול הקוד המקורי), ולכן **אינו רגרסיה**. נובע מכך ש-`notFound()` נזרק מתוך render; ה-error boundary מטפל וה-404 מוצג.

## R-27 · `exercises`/`catalog` אינם מגודרים ב-hydration — 🟢 Low (הוסף 2026-07-31)
**תרחיש:** בשרת `readExercisesState()` מחזיר קטלוג **מזורע** ולא ריק, ולכן גידור ל-`[]` היה יוצר אי-התאמה חדשה במקרה הנפוץ (ADR-0039). התוצאה: אחרי שהמשתמש **מתאים אישית** את הקטלוג — סימון מועדף, תרגיל מותאם, מחיקה — ייתכן הבדל בין הפלט של השרת ללקוח, שיחזיר שגיאת hydration למסכי הקטלוג.
**השפעה בפועל:** נמוכה — שגיאת console ורינדור מחדש של תת-העץ, ללא אובדן נתונים. **לא נצפתה בפועל** באימות של 2026-07-31 (הקטלוג לא הותאם אישית).
**תיקון אפשרי:** לחשוף קורא "שקול-שרת" (`applySeed(EMPTY)`) ולגדר אליו, או לכבות SSR למסכי הקטלוג.

## R-28 · כניסה למסך ריצה חדשה יוצרת טיוטה מיד — 🟡 Medium (הוסף 2026-07-31)
**תרחיש:** ניווט ל-`/running/new/outdoor` יוצר **מיד** רשומת ריצה בסטטוס `draft` ומפנה ל-`/running/{id}/edit`. משתמש שנכנס ומתחרט משאיר טיוטה יתומה. **נצפה בפועל:** באימות של 2026-07-31 נוצרו **2 טיוטות יתומות** מעצם הכניסה למסך.
**השפעה:** היסטוריית הריצה מתמלאת ברשומות "טיוטה" ריקות; ספירות ומדדים עלולים להיות מטעים. אין אובדן נתונים.
**מיטיגציה קיימת:** הטיוטות גלויות ומסומנות `טיוטה` בהיסטוריה, וניתן למחוק אותן (soft delete).
**תיקון אפשרי:** ליצור את הרשומה רק בשמירה הראשונה, או לנקות טיוטות ריקות ביציאה. **החלטת מוצר — לא בוצע.**
## R-29 · תקופת שימוש אמיתי ללא סנכרון — 🔴 High · **פעיל מ-2026-07-31**
**הקשר:** Fit Log פורסם (https://fitlog-workout.lovable.app) והמשתמש **מתחיל להשתמש בו מספר ימים** לפני שמתחילה עבודת הסנכרון ל-Supabase. במהלך התקופה הזו נצברים **נתוני אימון אמיתיים** — לא נתוני בדיקה.
**התרחיש:** האחסון הוא **localStorage של דפדפן ומכשיר מסוימים**. אין sync, אין גיבוי אוטומטי, אין עותק בענן. ניקוי נתוני אתר, מצב פרטי, החלפת דפדפן, החלפת מכשיר או מכסת אחסון מלאה → **אובדן מלא של כל מה שנצבר בתקופה**.
**למה זה חמור יותר מ-R-22 עכשיו:** עד היום הנתונים היו נתוני בדיקה שניתן לשחזר. מעכשיו הם **תיעוד אימונים אמיתי שאין לו מקור אחר**.
**מיטיגציה זמינה ומאומתת:** מסך `/backup` מייצא קובץ JSON מאומת (checksum + validation, 0 שגיאות באימות אמיתי). **זו המיטיגציה היחידה שקיימת.**
**פעולה נדרשת מהמשתמש:** **לייצא גיבוי ולשמור אותו מחוץ לדפדפן — באופן קבוע במהלך תקופת השימוש**, לא פעם אחת. ראה R-22.
**סטטוס:** פעיל וללא סגירה עד שיוקם סנכרון. **אין להתחיל עבודת Supabase לפני שהמשתמש מסיים את תקופת השימוש ומדווח על חיכוכים.**

## R-30 · נעיצת `@lovable.dev/vite-tanstack-config` ל-2.8.3 — 🟢 Low (הוסף 2026-07-31)
**תרחיש:** Lovable נעץ ב-`7542ad8` את `@lovable.dev/vite-tanstack-config` מ-`^2.7.7` לגרסה מדויקת **`2.8.3`**. נעיצה מדויקת מקפיאה גם תיקוני באגים — עדכון עתידי יגיע רק מ-Lovable.
**מה אומת ולא הונח:** ה-diff נבדק (שורה אחת ב-`package.json` + `bun.lock`), ההתקנה בוצעה בפועל (`bun install --frozen-lockfile` → 2.8.3 החליף את 2.7.7), וכל שערי האימות הורצו מחדש: typecheck 0 · **375 בדיקות** · eslint 0 errors / 8 baseline · build 0 · `routeTree.gen.ts` ללא drift. **אין שינוי מוצר או runtime.**
**סיכון שנותר:** ה-config הזה מייצר את `routeTree.gen.ts` ואת תצורת ה-nitro. שינוי גרסה עתידי מצד Lovable **עלול** לשנות את העץ או את ה-build. **אחרי כל commit של Lovable שנוגע ב-`package.json`/`bun.lock` יש להריץ build + typecheck + `git diff -- src/routeTree.gen.ts`.**
**אין לשנות את הנעיצה ידנית** — היא מנוהלת ע"י Lovable.