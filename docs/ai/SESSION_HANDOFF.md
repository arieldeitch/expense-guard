# Session Handoff

> ⚠️ **הסעיף העדכני ביותר הוא זה שמיד למטה.** הסעיפים שאחריו נשמרים כרשומה
> היסטורית; במקרה של סתירה — **הסעיף העליון גובר**.

## ✅ עדכון 2026-07-31 (ב) — אימות End-to-End בדפדפן אמיתי + תיקון hydration

**סוג הסשן:** אימות של האפליקציה **בריצה** (לא רק חבילת הבדיקות) + תיקון מה שהתגלה.

**סביבה:** `bun run dev` → `http://localhost:8080` · **Chrome 150 headless שנשלט דרך CDP** · פרופיל מבודד בתיקייה זמנית · **לא נוספה שום dependency** (אין Playwright/Puppeteer — ההחלטה הקודמת נשמרה; השתמשתי בדפדפן המותקן דרך פרוטוקול הניפוי).

### 🔴 מה שהתגלה — באג אמיתי שהבדיקות לא יכלו לתפוס
**אי-התאמת hydration בכל מסך מבוסס-נתונים.** ה-hooks השתמשו ב-`useSyncExternalStore` **רק כמנגנון מנוי** וקראו את ה-repository ישירות, כך ש-`getServerSnapshot` (ריק) נעקף ובזמן ה-hydration הוחזרו נתונים אמיתיים מ-`localStorage`. React זרק `Hydration failed because the server rendered text didn't match the client` ורינדר מחדש את תת-העץ.

**נמדד ב-7 מסכים:** `/home` · `/home/history` · `/home/sessions/$id` · `/backup` · `/gym/history` · `/gym/compare` · `/home/quick`.

**למה זה נעלם מכל ה-audits הקודמים:** הבדיקות רצות ב-**jsdom ללא SSR**, ועם אחסון ריק אין אי-התאמה בכלל. הבאג קיים **רק** כשיש נתונים אמיתיים בדפדפן אמיתי — כלומר בדיוק בשימוש יומיומי.

**התיקון (ADR-0039):** `src/lib/storage/useHydrated.ts` — גידור **ברמת ה-render בלבד**. הוחל ב-6 קובצי hooks (`home`, `sessions`, `runs`, `goals`, `templates`, `suunto`) וב-5 מסלולים שקראו ל-repository/analytics ישירות ב-render. **`persistence`, schema, מפתחות, IDs — ללא שינוי.** תוצאה: **0 שגיאות hydration ב-24 מסכים.**

### ✅ זרימות שאומתו מקצה לקצה בדפדפן
| זרימה | ראיה |
|---|---|
| דיווח תרגיל בית | 12 חזרות → `סטים: 1/1` → `localStorage` `{sets:1,reps:12,done:true}` → **שרד refresh** → הופיע בהיסטוריה |
| אימון כוח | פתיחה → הוספת תרגיל דרך ה-Sheet → 2 סטים (60×8, 62.5×6) → **נפח 855ק״ג** → שרד refresh → **סיום חלקי** (2 סטים `skipped`) |
| ריצה ידנית | 6.2 ק״מ / 32:10 → **קצב 5:11 מחושב** → נראית ב-`/running/history` |
| ייצוא גיבוי | **קובץ אמיתי** `fitlog-backup-20260731-0841.json` · 96,429 בייט |
| אימות הגיבוי | `validateBackup` → **ok** · 75 רשומות · checksum `75adbe56` **חושב מחדש עצמאית והתאים** · 0 errors / 0 warnings |
| **360px** | 9 מסכים · `scrollW=360, clientW=360` · **אפס גלישה אופקית** |
| רשת | **רק** `localhost:8080` + Google Fonts · **0 קריאות XHR/fetch לנתונים** |

**✅ שני חובות אימות ותיקים נסגרו:** (1) **Visual QA ב-360px** — נמדד סוף-סוף במנוע layout אמיתי, לא ב-jsdom. (2) **R-21 (Radix Sheet)** — הצטמצם למגבלת jsdom בלבד; בדפדפן אמיתי ה-Sheet עובד במלואו.

### ℹ️ ארבעה סעיפים ב-checklist שאינם ישימים — לא כשל, אלא ארכיטקטורה
**Supabase connectivity · משתני סביבה · schema/migrations של DB · auth/RLS** — **אינם קיימים במכוון** (ADR-0012/0030). אומת מחדש: אין `.env`, אין `supabase/`, אין `@supabase` ב-`package.json`, אין CI. הגישה בפועל היא **משתמש יחיד ללא כניסה**, וכל הנתונים ב-`localStorage` של דפדפן אחד.

### 🔴 מה נותר פתוח
- **R-22 — החסם היחיד:** יכולת הגיבוי **הוכחה בפועל** (נוצר קובץ אמיתי ואומת), אבל **המשתמש** טרם שמר קובץ מחוץ לדפדפן. פעולה ידנית.
- **R-28 (חדש, 🟡):** כניסה ל-`/running/new/outdoor` יוצרת טיוטת ריצה **מיד**; נטישה משאירה טיוטות יתומות. נצפו 2 בפועל. החלטת מוצר.
- **R-26 (חדש, 🟢):** `/sessions/$id/summary` מדפיס שגיאת שרת ונופל ל-client rendering. עובד.
- **R-27 (חדש, 🟢):** `exercises`/`catalog` לא מגודרים במכוון (הקטלוג מזורע בשרת).
- **שאלה ארכיטקטונית:** האם להשאיר SSR בכלל? לשרת אין ולא יהיו נתונים. כיבוי SSR מייתר את R-26, R-27 ורוב ADR-0039. **דורש החלטה מפורשת.**

**הפעולה הבאה היחידה:** **הגיבוי הידני (R-22)** — לפתוח `/backup`, לייצא, לשמור מחוץ לדפדפן.

---

## ✅ עדכון 2026-07-31 — התאוששות מריסטרט לילי + סגירת R-24

**סוג הסשן:** התאוששות + תיקון קוד ממוקד. **לא נוצר branch חדש, לא בוצע merge, לא בוצע deploy, לא נוספה dependency, לא נגעו ב-UI.**

### מה באמת קרה בריסטרט (מראיות Git בלבד)
**הריסטרט לא השאיר עבודה חלקית.** working tree היה **נקי לחלוטין** — אין untracked, אין stashes, אין merge/rebase/cherry-pick/bisect פעיל. הדבר היחיד שהופסק היה **ה-push**: ה-commit `16be950` (Recovery Audit של 2026-07-30, docs בלבד) נוצר ב-18:42 ונשאר `ahead 1` מול `origin/main`.

ה-reflog הראה `f70bfc9` ואחריו `commit (amend)` ל-`16be950`. **`git diff f70bfc9 16be950` ריק** — ה-amend תיקן את הודעת ה-commit בלבד (הוסרו תווי `@` תועים שנכנסו בטעות). **לא אבד תוכן, ולא היה צורך בשחזור.**

**נקודת שחזור שנוצרה לפני כל פעולה:** tag `recovery-checkpoint-2026-07-31` + branch `backup/pre-recovery-2026-07-31`, שניהם ב-`16be950`. **לא בוצע reset, clean, checkout הרסני או מחיקה כלשהי.**

### מה הושלם בסשן
1. **R-24 נסגר** (`src/lib/backup/repo.ts`) — השדה תוקן ל-`home_session_id`; נוסף כלל `home.sets → home.entries` על `entry_id`; דילוג ה-`parents.size === 0` הוסר והוחלף בהבחנה מדויקת: אוסף הורים **שאינו קיים במעטפת** לא נבדק (מעטפת חלקית אינה ראיה לשבירה), אוסף **ריק** כן נבדק. ADR-0037.
2. **באג אמיתי שהתגלה תוך כדי אימות ותוקן** (`src/lib/readiness/readinessReport.ts`) — קובץ שנדחה באימות מבצע **אפס פעולות**, ולכן `dependency_order_respected` שלו אמיתי *באופן ריק*. `deriveDependencyOrder` הסיק מכך `dependency_order: true` — ראיה חיובית מאמת ריקה, בניגוד ישיר לעקרון ADR-0036 ("ראיה חסרה = false"). **הבאג היה קיים לפני התיקון של R-24 ורק הוסתר על ידו.**
3. **הגנה כפולה נשמרה** — הבדיקה שמוכיחה שה-import pipeline חוסם בכוחות עצמו עברה להשתמש ב-`exercise_id`, קשר שהאימות אינו מכסה, כדי שהשכבה השנייה תמשיך להיבדק ולא תוסתר ע"י הראשונה.

### אימות (הורץ על `main`, כל התוצאות אמיתיות)
| בדיקה | Exit | תוצאה |
|---|---|---|
| `bun run typecheck` (גם אחרי build) | 0 | PASS |
| `bun run test:unit` | 0 | **314/314** (21 קבצים) — היה 305 |
| `bun run test:router` | 0 | **61/61** (10 קבצים) — ללא שינוי |
| backup · readiness · migration · storage | 0 | **21** (היה 14) · **31** (היה 29) · 44 · 34 |
| `bunx eslint . --rule '{"prettier/prettier":"off"}'` | 0 | **0 errors / 8 baseline warnings** |
| `bun run build` | 0 | PASS · `routeTree.gen.ts` ללא diff |

**סה"כ 375 בדיקות.** prettier מסמן 5 קבצים — **אומת שאותם קבצים בדיוק נכשלים גם ב-`HEAD` שלפני השינוי**, כלומר baseline R-17/CRLF ולא רגרסיה.

### תאימות לאחור
פורמט Export, `schema_version` 1.0.0, מפתחות אחסון, IDs, חתימות API וקודי issue — **ללא שינוי**. נוספה בדיקת רגרסיה מפורשת שגיבוי בית תקין (session → entries → sets) עובר אימות **ומייבא במלואו**.

### 🔴 מה נותר פתוח
- **R-22 — החסם היחיד, ופעולה ידנית של המשתמש:** **טרם נוצר קובץ גיבוי בפועל מחוץ לדפדפן.** יש לפתוח `/backup`, לייצא, ולשמור מחוץ לאחסון הדפדפן. *יכולת גיבוי אינה גיבוי.*
- **R-25 — חדש, נפתח בסשן זה ולא נסגר:** גיבוי עם הפניה שבורה נדחה **כולו**, ואין מסלול "ייבא בכל זאת ודלג על השבורים". דורש UI **והחלטת מוצר** — מחוץ ל-scope של תיקון R-24, ולכן לא בוצע.
- **R-23** — Import אמיתי מול Supabase, דורש Approval Brief.

### 📌 הסכם עבודה חדש (ADR-0038)
**כל הפרומפטים העתידיים ל-Claude Code ייכתבו באנגלית, ו-Claude מקבל אוטונומיה מרבית — ללא בקשות אישור מצטברות.** עצירה רק עבור: credentials/גישה חיצונית חסרים · עלות חדשה · פעולה בלתי הפיכה בפרודקשן · אובדן נתונים הרסני · חשיפת secret · החלטת היקף מוצרית מהותית. `CLAUDE.md` ו-`AGENTS.md` נשארים בתוקף; **`docs/ai/` נשאר בעברית.**

**הפעולה הבאה היחידה:** **הגיבוי הידני (R-22).** רק אחריו — החלטת מוצר על R-25.

---

## ✅ עדכון 2026-07-30 — Recovery Audit אחרי הפסקה: התיעוד אומת מול הריפו

**סוג הסשן:** audit בלבד. **לא פותח פיצ'ר, לא בוצע refactor, לא נוצר branch, לא בוצע merge/deploy/push של קוד.** השינוי היחיד הוא עדכוני `docs/ai/`.

**מצב Git (מאומת):** branch `main` · **HEAD `daba93c`** · `main` = `origin/main`, **ahead 0 / behind 0** · working tree **נקי** בתחילת הסשן ואחרי כל הבדיקות · **אין stashes, אין tags, אין merge/rebase/cherry-pick/bisect פעיל, אין commits מקומיים שלא נדחפו** (`git log --branches --not --remotes` ריק). שני ה-feature branches (`feat/domain-alignment-and-restore`, `feat/home-plan-simple-flow`) **מוזגו ל-`main`** ומסונכרנים 0/0 — לא נמחקו.

**אימות מלא הורץ מחדש על `main` (2026-07-30) — כל התוצאות זהות לתיעוד מ-2026-07-26:**

| בדיקה | Exit | תוצאה |
|---|---|---|
| `bun run typecheck` | 0 | PASS |
| `bun run test:unit` | 0 | **305/305** (21 קבצים) |
| `bun run test:router` | 0 | **61/61** (10 קבצים) |
| `bunx eslint . --rule '{"prettier/prettier":"off"}'` | 0 | **0 errors / 8 baseline warnings** |
| `bun run build` | 0 | PASS · `routeTree.gen.ts` hash ללא שינוי · working tree נשאר נקי |
| `bun run typecheck` אחרי build | 0 | PASS |
| migration · readiness · backup · storage | 0 | 44 · 29 · 14 · 34 |

**נבדק פרטנית ואומת בקוד:** `activeRepoKind === "mock"` · `CLOUD_ENTITIES` = **30 ישויות** · `DEFERRED_MODULES = ["preferences"]` · שני ה-gates נטענים `true` בבדיקות · **אין `@supabase` ב-`package.json` או ב-`src`** · **אין `import.meta.env`/`process.env` בקוד** · אין `createClient` · 47 האזכורים של "Supabase" ב-`src` הם **הערות בלבד** · **אין קובץ `.env`/secret/credential ב-tracking** · אין `supabase/`, אין `migrations/`, **אין CI (`.github` לא קיים)** · `.lovable/project.json` מכיל template/revision בלבד, ללא secrets · **0 TODO/FIXME, 0 בדיקות מדולגות**.

**R-24 אומת כקיים:** `src/lib/backup/repo.ts:256` עדיין `field: "session_id"` בעוד השדה בפועל הוא `home_session_id` (`src/lib/home/types.ts:105`), ו-`repo.ts:300` עדיין מכיל `if (parents.size === 0) continue;`. התיעוד מדויק.

**R-17 אומת כפעיל:** `bun run lint` נכשל (exit 1) עם **30,668 errors / 8 warnings** — כולם `Delete ␍` (CRLF). הפקודה האמיתית לבדיקת קוד היא זו שעם `--rule '{"prettier/prettier":"off"}'`.

**שני פערי תיעוד שתוקנו בסשן זה (בלבד):**
1. **ספירת routes** — `current-state.md` טען **53 route modules**; בפועל **54** (נוסף `backup.index.tsx` במסלול A ולא עודכן). `routeTree.gen.ts` מאשר 54. תוקן.
2. **`open-tasks.md`** — הסעיפים ההיסטוריים בתחתית המסמך סתרו את הסעיף העליון (טענו שכשל כתיבה ב-7 מודולים, ה-rehearsal ו-migration framework עדיין פתוחים, בעוד הם ✅ למעלה). סומנו **Superseded** ולא נמחקו.

**🔴 החסם היחיד — פעולה ידנית של המשתמש, לא של סוכן:** **טרם נוצר קובץ גיבוי בפועל.** יש לפתוח `/backup` בגרסת `main` המאומתת, לייצא, ולשמור את הקובץ **מחוץ לאחסון הדפדפן**. עד אז R-22 פתוח בפועל — *יכולת גיבוי אינה גיבוי*.

**הפעולה הבאה היחידה המומלצת לפיתוח (רק אחרי הגיבוי):** **תיקון R-24 בענף נפרד** — הוא מוגדר, קטן, בעל ראיה, ואינו דורש החלטת מוצר או עלות. פירוט Scope/Acceptance/Rollback ב-`open-tasks.md`. **אין להתחיל את מסלול B (Supabase) ללא Approval Brief.**

---

## ✅ עדכון 2026-07-26 (ג) — מסלול A מוזג ל-`main` ואומת עליו

**`main` = `origin/main` = `0e51653`** (merge commit). `feat/home-plan-simple-flow` (`8470c4f`) מוזג ב-`--no-ff`; **היסטוריית ה-feature נשמרה במלואה** — ללא squash/rebase/amend/force. ה-feature branch **לא נמחק**.

**אימות מלא הורץ על `main` עצמו:** typecheck exit 0 · `test:unit` **305/305** (21 קבצים) · `test:router` **61/61** (10 קבצים) · `bun run test` exit 0 · migration 44/44 · readiness 29/29 · backup 14/14 · storage 34/34 · eslint **0 errors / 8 baseline warnings** · build ×2 exit 0 · typecheck אחרי build exit 0 · `routeTree.gen.ts` ללא diff · working tree נקי.

**אומת שאין חריגת scope:** `package.json` שונה רק בסקריפטי בדיקות (בלוקי התלויות זהים בייט-לבייט); אין `@supabase`, אין `process.env`/`import.meta.env`, אין `fetch`/WebSocket בספריות החדשות, אין `.env`/secret ב-tracking. **לא בוצע deploy.**

**🔴 הפעולה הידנית שנותרה למשתמש:** ליצור **Export ידני מגרסת `main` המאומתת** דרך `/backup` ולשמור את הקובץ **מחוץ לאחסון הדפדפן** — רצוי במכשיר נפרד או בתיקייה מגובה. **טרם בוצע.** עד אז R-22 פתוח בפועל.

**נדחה במכוון (החלטת משתמש):**
- **R-24** — הכלל המת ב-`REFERENCE_RULES` (`field: "session_id"` במקום `home_session_id`) **לא תוקן**. אומת שהוא עדיין קיים על `main` אחרי המיזוג. יטופל **בענף נפרד** עם אסטרטגיית תאימות לאחור, tests ותיעוד — כי התיקון עלול לפסול קובצי גיבוי שהתקבלו עד היום.
- **`preferences`** נשאר מדווח כ-`deferred_entities`, ללא מיפוי לענן.

---

## 🟢 עדכון 2026-07-26 (ב) — מסלול A נסגר לשימוש מקומי (branch `feat/home-plan-simple-flow`)

**מה נסגר:**
1. **Fake Supabase rehearsal** (`src/lib/migration/`) — ענן מדומה בזיכרון. **אין Supabase, SDK, SQL, רשת, env, secret או עלות.** מפת **30 ישויות** נגזרת מהמודל בפועל; **סדר הייבוא מחושב טופולוגית** ואינו רשימה ידנית. הוכח: הורה לפני ילד · ילד יתום נדחה יחד עם ילדיו · ייבוא חוזר = no-op מלא · קונפליקט מפורש ללא דריסה · מזהים, קשרים, סדר וחותמות זמן שורדים.
2. **Ownership** — `authenticatedUserId` הוא מקור הסמכות היחיד. `owner_id`/`user_id` שבקובץ מוסרים מה-payload ונשמרים כ-`source_metadata` בלבד. taxonomy מערכתי מקבל `user_id: null`. שדות סוד לעולם אינם עוברים.
3. **Readiness Gate** (`src/lib/readiness/`) — 16 בדיקות ושני gates, **נגזרים מריצות אמיתיות**. `buildReadinessReport` טהורה; `runReadinessAudit` מריץ יכולות בפועל (rollback אמיתי, שתילת גרסה עתידית, מחיקה ושחזור מלאים, rehearsal כפול). ראיה חסרה = `false`.

**תוצאה:** `ready_for_single_device_use` = **true** · `ready_for_future_supabase_migration_contract` = **true**.

**Git:** `3c4393e` test(migration) · `6ef9cc2` feat(readiness) · docs. ללא amend/rebase/force. **אין merge ל-`main`. אין deploy.**

**בדיקות: 366 עוברות** — `test:unit` 305/305 (21 קבצים) · `test:router` 61/61 (10 קבצים). typecheck exit 0 (גם אחרי build) · eslint 0 errors / 8 baseline · build ×2 · `routeTree.gen.ts` ללא diff.

**Backward compatibility:** **אף קובץ קיים לא שונה** — שתי תיקיות חדשות בלבד. אין שינוי ב-IDs, storage keys, schema 1.0.0, Export format 1.0.0, domain contracts או UI.

**ADR חדשים:** ADR-0034 (rehearsal כתנאי מוקדם) · ADR-0035 (בעלות ב-Export אינה בעלות הרשאה) · ADR-0036 (Readiness Gate נגזר, לא מוצהר).

**🔴 מה שנותר — ואינו חוסם שימוש יומיומי:**
- **Import אמיתי מול Supabase עם Auth/RLS (R-23).** ה-rehearsal מוכיח את **המודל**, לא את **המנוע**: לא נבדקו RLS, FK constraints, טיפוסי עמודות, טרנזקציות ורשת. דורש Approval Brief.
- **R-24 / P1 — `REFERENCE_RULES` ב-`backup/repo.ts` בודק `session_id` עבור `home.entries`, אך השדה בפועל הוא `home_session_id`**, ולכן הכלל אינו יורה לעולם. ה-import pipeline תופס את המקרה בעצמו, ולכן זה אינו חוסם — **לכן לא תוקן** (ההוראה הייתה לא לגעת בשכבת האחסון שהושלמה). התיקון המדויק וההשלכה (גיבויים עם הפניות שבורות ייפסלו) מפורטים ב-`open-tasks.md`.
- **`preferences` אינו ממופה לענן** — singleton (שורת `profiles` לפי user id) ולא אוסף מערכים. מדווח במפורש כ-`deferred_entities` ולכן **אינו נבלע בשקט**. השפעה ידועה: שדה אחד (`landingModule`).
- גיבוי עדיין תלוי במשמעת המשתמש — אין תזכורת ואין גיבוי אוטומטי. ראה R-22.

**הפעולה הבאה המומלצת:** מיזוג ה-feature branch ל-`main`, אימות מלא **על `main` עצמו**, ולאחר מכן **Export ידני ושמירת קובץ הגיבוי מחוץ לדפדפן לפני האימון**.

---

## 🟢 עדכון 2026-07-26 — בטיחות אחסון מקומי הושלמה (branch `feat/home-plan-simple-flow`)

**מה נסגר בסשן הזה:**
1. **התראת כשל כתיבה גלובלית.** `GlobalStorageBanner` ברמת `__root.tsx` — חל על **כל** המסכים. כשל בכל אחד מ-9 מודולי האחסון גלוי למשתמש: `memory_only` → `role="status"` ("חלק מהשינויים לא נשמרו בדפדפן ועלולים להיעלם לאחר רענון.") · `failed` → `role="alert"` ("השמירה נכשלה. הורד גיבוי לפני רענון או סגירת הדפדפן."). אייקון + כותרת מילולית (צבע אינו הסמן היחיד), קישור ל-`/backup`, **banner מתמשך ולא toast**, וכתיבה מוצלחת אחרי כשל מסירה אותו. מסך האימון אינו מצהיר "נשמר במכשיר" כשמודול אחר נכשל.
2. **`fitlog:storage-meta`** — `schema_version` **1.0.0**, `format` `workout-data-system-local`, `updated_at`, ותשעת מודולי האחסון. תשעת המפתחות וה-IDs **ללא שינוי**.
3. **migration registry `legacy -> 1.0.0`** — קורא את כל המפתחות, מאמת parse, שומר שדות לא מוכרים (עובד על מחרוזות גולמיות), לא מוחק, idempotent. הרצה חוזרת = no-op מלא.
4. **snapshot ו-rollback** — `fitlog:migration-snapshot` עם `checksum`, נקרא בחזרה לאימות לפני כל שינוי, **אינו דורס** את snapshot ה-Restore. כשל → אף מפתח מקור לא משתנה, metadata לא נכתב, `migration_failed` מוחזר ומוצג. **metadata נכתב אחרון בלבד.**
5. **גרסה עתידית נחסמת** — `schema_version` גבוה מ-1.0.0 → אין נגיעה בנתונים.

**Git:** 3 commits מעל `4b2b401` — `32c702c` fix(ui) · `e73131e` feat(storage) · docs. **ללא amend/rebase/force. אין merge ל-`main`. אין deploy.**

**בדיקות: 293 עוברות** — `test:unit` 232/232 (17 קבצים) · `test:router` 61/61 (10 קבצים). typecheck exit 0 · eslint 0 errors / 8 baseline warnings · build ×2 · `routeTree.gen.ts` ללא diff.

**⚠️ אי-דיוק ידוע:** הודעת ה-commit `e73131e` אומרת "27 בדיקות חדשות" ב-`localSchema.test.ts`; המספר בפועל הוא **23**. לא בוצע amend. `change-log.md` מכיל את הרישום הנכון.

**🔴 הפעולה הבאה — המשימה השנייה מתוך השתיים: Fake Supabase rehearsal, ואחריה Readiness Gate.** `LOCAL_TO_SUPABASE_MIGRATION_CONTRACT.md` נכתב אך **מעולם לא הורץ**. **אין ליצור פרויקט Supabase** לצורך זה — התרגיל יבש. **מסלול A אינו סגור עד להשלמתו.**

**ADR חדשים:** ADR-0033 (schema מקומי גרסאי, snapshot, rollback, hydration) · **ADR-0032 תועד רטרואקטיבית** — הוא הוזכר בקוד מאז `4b2b401` ולא נכתב מעולם ב-`decisions.md`. **R-22 הוקטן** מ-🔴 High ל-🟡 Medium.

**מגבלה מכוונת (ADR-0033):** המיגרציה רצה ב-`useEffect`, כלומר אחרי ה-render הראשון — כדי למנוע hydration mismatch (אין `localStorage` ב-SSR). `legacy -> 1.0.0` אינה משנה תוכן ולכן אין סיכון ל-cache מיושן. **מיגרציה עתידית שמשנה תוכן חייבת** לעבור ל-entry ה-client או להוסיף ביטול cache למודולים.

---

> ⚠️ **עודכן 2026-07-25 אחרי ריסטרט לא מתוכנן.** הסעיף הבא מתקן טענות שגויות בגוף המסמך
> שמתחתיו.

## 🔴 עדכון התאוששות (2026-07-25) — קרא ראשון

**תיקוני עובדות לגוף המסמך למטה (Git הוא מקור האמת):**
1. **"לא בוצע push / אין upstream" — שגוי.** הענף נדחף ל-`origin` ב-`5af65bd` בשעה 10:01:13 (`git reflog show origin/feat/...` → `update by push`), שמונה דקות אחרי שהמסמך נכתב. upstream מוגדר, ahead/behind = 0/0.
2. **"working tree נקי" — שגוי** נכון לרגע הריסטרט: 24 קבצים משתנים + 4 untracked.
3. **"לא הותקנו dependencies (כולל `@testing-library`)" — שגוי.** `@testing-library/{react,jest-dom,user-event}` + `jsdom` הותקנו כ-devDeps ב-10:02.

**מצב נוכחי — ההתאוששות הושלמה ונדחפה (2026-07-25):**
- **Branch:** `feat/domain-alignment-and-restore` · **HEAD = `a4d24e2`** · **ahead 0 / behind 0** מול `origin/feat/domain-alignment-and-restore`.
- **שלושת commits ההתאוששות נדחפו בהצלחה** (`5af65bd..a4d24e2`, fast-forward):
  - `6fb22c3` — freeze: הקפאת העבודה שנמצאה, לפני כל תיקון
  - `da20f72` — checkpoint: שיטוח routes + fixtures מטופסים
  - `a4d24e2` — סגירת חסם ה-router tests (פיצול `systemErrors.test.tsx`)
- **לא בוצעו force push, merge או deploy.** `main` לא נגעו בו (עדיין `ahead 1` מול `origin/main`, לא נדחף).
- **Working tree נקי** לפני ה-push ואחריו.
- **בדיקות: 200 עוברות** — `bun run test:unit` 162/162 · `bun run test:router` 38/38 · `bun run test` exit 0.
- typecheck exit 0 · eslint (ללא prettier) 0 errors / 8 warnings · build ×2 · `routeTree.gen.ts` דטרמיניסטי.

**⛔ סעיפים מבוטלים (Superseded) בגוף המסמך למטה** — נכתבו לפני ה-push ואינם נכונים עוד:
"מצב מול remote" · "לא בוצע push / rebase / force-push" · "פעולות ידניות שעדיין נדרשות → החלטת push/PR" · "GPT continuation context → **לא pushed**". הם נשמרים כרשומה היסטורית בלבד; **הסעיף הזה גובר עליהם**.

**חסם Router tests — נסגר.** `systemErrors.test.tsx` פוצל לשלושה קבצים לפי תחום אחריות (`systemScreens` / `runningRouteLoaders` / `catalogRouteLoaders`). ראה ADR-0026.

**עדכון 2026-07-25 — Workout Execution הושלם.** `/sessions/$id` שמיש לאימון אמיתי: RPE, דילוג תרגיל, סיום מלא/חלקי, סטטוס שמירה אמיתי, מצב התאוששות, ללא `prompt()`/`confirm()` חוסמים. **216 בדיקות** (170 unit + 46 router). ADR-0027/0028. סיכון חדש R-21 (Radix Sheet ב-harness, P2). פערים שנותרו מפורטים ב-`open-tasks.md` תחת "Workout Execution — פערים שנותרו" (RIR ב-UI, scroll position, בדיקת render לסיום חלקי).

**✅ `main` מסונכרן (2026-07-25).** `main` עודכן ב-**fast-forward** ל-`f33d00a` (ללא merge commit) ונדחף ל-`origin/main`. **`origin/main` הוא כעת מקור האמת** לגרסה שעליה יש לבצע Visual QA. ה-commit `eca9163` נשמר בהיסטוריה. ה-feature branch `feat/domain-alignment-and-restore` **לא נמחק** — יישמר עד שה-Visual QA ב-360px יעבור. אימות מלא הורץ **על `main` עצמו**: typecheck exit 0 · 216 בדיקות · eslint 0 errors · build ×2 · routeTree ללא שינוי. **לא בוצע deploy.**

**🆕 עדכון 2026-07-25 — פישוט תוכניות בית + Audit נתונים (branch `feat/home-plan-simple-flow`).**
בניית תוכנית בית פושטה: picker חדש עם **אחרונים → מועדפים → 6 קבוצות בשפת משתמש**, חיפוש עברית/אנגלית, פילטר ציוד פשוט, **בחירה מרובה**, ו"תרגיל מותאם" בתוך אותו גיליון. קטלוג curated של **34 תרגילים** (המאגר המלא נשמר). יצירה ועריכה כבר חלקו מסך אחד — נשמר. **232 בדיקות.** ADR-0029.

**🔴 החלטה נדרשת — מוכנות נתונים (ADR-0030, R-22).** האפליקציה **אינה** מחוברת לבסיס נתונים ענני: אין Supabase client, env, migrations או Auth/RLS; `activeRepoKind="mock"`; הכול ב-localStorage; **אין export, אין import, אין העברה בין מכשירים**; 7 מתוך 8 מודולי storage בולעים כשל כתיבה בשקט. שימוש מחר בבוקר בטוח **על מכשיר אחד בלבד**.
- **A. שימוש מקומי בטוח במכשיר יחיד + גיבוי** — להוסיף export/import JSON ולהרחיב את `PersistenceStatus` לכל המודולים. ללא עלות, ללא credentials.
- **B. חיבור Supabase מלא** — Auth + RLS + migrations. דורש Approval Brief (CLAUDE.md), יוצר פרויקט/עלות.

**⚠️ חוב אימות פתוח — 360px.** התאמת המסך לרוחב 360px נבדקה **סטטית בלבד** (מבנה ו-CSS). **הקריטריון אינו מאומת** עד ל-Visual QA ידני בדפדפן או ב-Lovable Preview. **הוחלט מפורשות לא** להוסיף בדיקת `scrollWidth` ב-jsdom — jsdom אינו מחשב layout ובדיקה כזו אינה מוכיחה דבר. אין להוסיף Playwright/Cypress ללא אישור.

**סטטוס פערים:** RPE ✅ ממומש · RIR ❌ לא ממומש (משימת המשך) · שמירת מיקום גלילה ו-drag reorder — **אינם חוסמי MVP** · R-21 (Radix Sheet בבדיקות) — **סיכון בדיקות נקודתי, אינו חוסם שימוש בפועל**.

**הפעולה הבאה היחידה המומלצת:** לפתוח את Workout Execution ב-Lovable Preview או בדפדפן ברוחב 360px ולבצע **Visual QA ידני** — זהו קריטריון הקבלה היחיד שנותר בלתי מאומת. רק אחריו לבחור יעד פיתוח מוצר חדש מתוך `open-tasks.md`. **אין להמשיך בחקירת Vitest** (R-20/R-21) — P2, לא חוסמות.

**מה הושלם בהתאוששות:**
- **route layout nesting (ADR-0025)** — התגלה שקובץ route עם ילדים בשם הופך אוטומטית ל-layout parent, ואף route פרט ל-`__root.tsx` אינו מרנדר `<Outlet />`. **24 route modules שוטחו ל-`*.index.tsx`**. URLs, redirects ו-compat routes נשמרו במלואם.
- **router test harness + 38 בדיקות render** — נסגרו הפערים שהיו פתוחים: loaders + `notFound()`, 404 בעברית/RTL/a11y, error boundary, compat redirects, domain isolation ברמת route.
- **`fixtures.ts`** — builder מלא ל-`RunSessionInput`, בלי `any`/cast/`@ts-ignore`.

**מגבלה ידועה (R-20, ADR-0026, P2 — לא חוסמת):** `vitest run src/test` בהפעלה אחת נתקע. הפקודה הקנונית `test:router` מריצה **קובץ אחד לכל תהליך Vitest** ברצף `&&` מפורש. **אין להחזיר glob של `src/test`** ואין להשתמש ב-force-exit. הכיסוי לא הופחת.

**עדיין נכון:** אין Supabase/Auth/RLS/migrations/CI-CD/sync engine. אין `.env` ואין secrets. R-17 (CRLF) פעיל — לא בוצעה המרה גורפת.

---

> מסמך מעבר בין sessions. נכתב לסגירה בטוחה לפני restart. מבוסס על **ראיות repo בלבד**
> (2026-07-25, HEAD `16f4444`). מסמכי מקור האמת האחרים (lowercase) נשארים סמכותיים; זה
> מסמך handoff שמצביע עליהם — לא מקור אמת מתחרה.

## תאריך ומטרת ה-session
- **תאריכים:** 2026-07-24 → 2026-07-25.
- **מטרה:** Phase 1 (יעדים לפי domain) + Phase 2 (trash/restore) + **finalize** (אכיפת domain isolation + regressions), ואז סגירת session בטוחה.

## Branch / Commit — התחלה וסיום
- **Branch:** `feat/domain-alignment-and-restore` (נוצר מ-`main`@`eca9163`).
- **HEAD בסיום:** commit `docs(ai): finalize domain alignment phase` **מעל** `764cfb8` (`fix(goals): enforce cross-domain isolation guard and add regressions`).
- **שרשרת commits (מהחדש לישן):**
  - `docs(ai): finalize domain alignment phase`  ← docs-only (session finalize)
  - `764cfb8` fix(goals): enforce cross-domain isolation guard and add regressions
  - `dcc486f` docs: finalize phase 1 and 2 session handoff
  - `16f4444` fix(ui): localize system errors and stabilize route generation
  - `f66b411` feat(trash): wire restore for sessions and goals
  - `1288e5b` feat(goals): scope goal surfaces to workout domains
  - `eca9163` docs(ai): add product alignment audit and migration plan  ← גם ראש `main` המקומי
  - `82de6bf` בנה מערכת יעדים אישית  ← (origin/main)
- ~~**מצב מול remote:** `origin` = `https://github.com/arieldeitch/expense-guard.git`. ל-`feat/domain-alignment-and-restore` **אין upstream** ו**אינו קיים ב-origin** (לא בוצע push). `main` המקומי (`eca9163`) **מקדים ב-1** את `origin/main` (`82de6bf`) — גם הוא לא נדחף.~~ **⛔ Superseded (2026-07-25):** הענף קיים ב-origin עם upstream ומסונכרן ב-`a4d24e2` (ahead 0/behind 0). ראה סעיף העדכון בראש המסמך. *(החלק על `main` עדיין נכון.)*

## עבודה שהושלמה
**Phase 1 — יעדים לפי domain (החלטת מוצר מאושרת: אין מסך יעדים גלובלי).**
- 6 רכיבים משותפים ב-`src/components/goals/`: `goalLinks.tsx`, `goalDomainConfig.ts`, `GoalForm.tsx`, `GoalsListView.tsx`, `GoalDetailView.tsx`, `GoalDomainChooser.tsx` (+ `DomainPrimaryGoalTile.tsx` עודכן).
- 12 domain-goals routes (מפה מלאה למטה) — thin, נשענים על הרכיבים המשותפים ללא duplication.
- `/goals`, `/goals/new`, `/goals/$id` → compatibility redirects בלבד (לא בניווט).
- `DomainPrimaryGoalTile` חובר ל-`/running`, `/gym`, `/home`.
- תוקן drift של route-tree (ADR-0022) — ראה למטה.

**Phase 2 — trash/restore.**
- `/trash`: +3 מקטעים (gym sessions, home sessions, goals), שחזור דו-שלבי.
- list-trashed hooks: `useTrashedSessions`/`listTrashedSessions`, `useTrashedHomeSessions`, `useTrashedGoals`.
- delete-to-trash דו-שלבי: home summary (חדש), goal detail confirm (חדש), gym (קיים).
- recompute אחרי restore: אוטומטי דרך `commit()` → `useSyncExternalStore` subscribers.

**Finalize (2026-07-25) — domain isolation + regressions.**
- helper טהור `goalMatchesDomain(goal, domain)` (`goalDomainConfig.ts`); guard ב-`GoalDetailView` וב-`GoalForm` (edit) — יעד מתחום אחר לא ניתן להצגה/עריכה במסלול. domain נקבע מהישות, לא מה-param.
- +4 tests (162 סה"כ): cross-domain guard, updateGoal שומר domain, primary מחריג archived/trashed, restore שומר domain+links ללא קשר שקרי.

**i18n + hygiene.** `__root.tsx` 404/error → עברית+RTL+`role="alert"`/`aria-live`+focus; `.gitattributes` (LF, ללא renormalize); lint hook false-positive נפתר ע"י named component; נוסף `typecheck` script.

## קבצים שהשתנו (לפי commit)
- **`1288e5b` feat(goals)** (32 קבצים): 6 רכיבי goals + 12 routes + 3 compat routes + `running/gym/home.tsx` + 4 route fixes (`exercises.$id`,`locations.$id`,`running.$id`,`running.new.$type`) + `src/routeTree.gen.ts` + `package.json` + `src/lib/goals/__tests__/domain-scope.test.ts`.
- **`f66b411` feat(trash)** (7): `lib/goals/hooks.ts`, `lib/home/hooks.ts`, `lib/sessions/hooks.ts`, `lib/sessions/repo.ts`, `routes/trash.tsx`, `routes/home.sessions.$id.summary.tsx`, `lib/__tests__/trash-restore.test.ts`.
- **`16f4444` fix(ui)**: `routes/__root.tsx`, `.gitattributes`, 11 מסמכי `docs/ai/*`.

## החלטות ארכיטקטורה / ADR
- **ADR-0021** — goals surface **פתור**: domain-scoped בלבד; `/goals*` compat; אין מסך גלובלי.
- **ADR-0022** — route-tree drift **פתור**: קריאת `id`/`type` דרך `Route.useParams()` (לא `useLoaderData`) ב-4 routes.
- **ADR-0023** — `typecheck` script + `.gitattributes` (ללא renormalize גורף).

## בדיקות ותוצאות מדויקות (נצפו ב-session זה)
| בדיקה | פקודה | תוצאה |
|---|---|---|
| Typecheck | `bun run typecheck` (`tsc --noEmit`) | ✅ **PASS** (exit 0, גם אחרי build) |
| Tests | `bun run test` (vitest) | ✅ **PASS** — 12 קבצים, **162/162** |
| Lint (אמיתי) | `bunx eslint . --rule '{"prettier/prettier":"off"}'` | ✅ **0 errors, 8 warnings** (react-refresh בקבצי shadcn upstream) |
| Lint (`bun run lint` כפי שהוא) | `bun run lint` | ⚠️ **FAIL מקומית** — אלפי שגיאות `Delete ␍` (CRLF, R-17). לא בעיית קוד. |
| Build | `bun run build` | ✅ **PASS** (exit 0, ×2+) |
| Route-tree determinism | `bun run build` ×2 + `diff`; `git diff --exit-code -- src/routeTree.gen.ts` | ✅ **PASS** — אין diff; committed == generated |

## מצב working-tree וסטטוס commit/push
- Working tree **נקי** (לאחר commit ה-handoff הזה). כל שינויי Phase 1/2 **committed**.
- `.output/`, `.wrangler/`, `node_modules/` — **gitignored** (מאומת). אין artifacts/logs/exports/secrets ב-tracking.
- **Push: לא בוצע.** ראה "פעולות ידניות" למטה.

## מגבלות ידועות
- אין backend/Supabase/Auth/RLS/Storage — localStorage בלבד (במכוון).
- Lint מקומי דורש דגל `prettier/prettier:off` עקב CRLF (R-17).
- סביבת vitest = `node` → אין בדיקות render/route/E2E.

## פריטים לא-מאומתים (unverified)
- **loaders + `notFound()` של 4 ה-routes שתוקנו**: נשמרו ב-source (לא נגעתי בגוף ה-loaders), אך **אין טסט executable** שמוכיח שהם עדיין רצים/זורקים (דורש router harness). → פתוח ב-`open-tasks.md`.
- **render של 404/guard**: לוגיקת domain-match/getGoal→null **נבדקה** (`goalMatchesDomain`), אך ה-**render** של מסך 404/guard דורש router harness → פתוח (חלקי).
- ✅ **domain-isolation (לוגיקה)**: נאכף ע"י `goalMatchesDomain` ב-`GoalDetailView`+`GoalForm` ו**נבדק** ב-`domain-scope.test.ts` (כבר לא unverified).

## סיכונים פעילים (ראה `risks.md`)
- **R-17** CRLF/lint מקומי — פעיל (מיטיגציה: `.gitattributes` נוסף; renormalize גורף נדחה).
- R-01 אובדן נתונים, R-09 תלות ספק (Suunto), R-12 Cloudflare runtime, R-13 secret leakage — פעילים כרגיל.
- **R-18, R-19 — נסגרו** ב-session זה.

## מחוץ להיקף (במפורש)
- אין חיבור Supabase/Auth/RLS/Storage; אין migrations; אין deploy; אין secrets; אין שינויי production. **אין עלות חדשה נוצרה.**
- לא הותקנו dependencies חדשים (כולל `@testing-library`).
- לא בוצע push / rebase / force-push / מחיקת branches.

## פעולות ידניות שעדיין נדרשות
- ~~**החלטת push/PR**: `feat/domain-alignment-and-restore` מקומי בלבד. push דורש הרשאת auth + מדיניות (הנחיות קודמות אסרו push).~~ **⛔ Superseded (2026-07-25):** ה-push בוצע — הענף מסונכרן ב-`a4d24e2`. **נותר פתוח:** `main` המקומי עדיין מקדים את origin ב-commit ה-audit ולא נדחף (החלטת משתמש); פתיחת PR גם היא עדיין החלטת משתמש.

## המסמכים שה-session הבא חייב לקרוא תחילה (לפי סדר)
1. `docs/ai/SESSION_HANDOFF.md` (זה)
2. `docs/ai/product-requirements.md`
3. `docs/ai/current-state.md`
4. `docs/ai/open-tasks.md`
5. `docs/ai/decisions.md` (ADR-0021/0022/0023)
6. `docs/ai/risks.md` (R-17)
7. `docs/ai/route-inventory.md` (סעיף Domain goals) + `docs/ai/migration-plan.md`

## פעולה מומלצת אחת בלבד (הבאה)
לאמת את Phase 1 ו-Phase 2 מראיות ה-repo, לסגור את פערי בדיקות הרגרסיה ו-domain-isolation שנותרו, ורק אז לקבוע את ה-phase המאושר הבא מתוך `open-tasks.md` ו-`SESSION_HANDOFF.md`. **אין להתחיל את ה-phase הבא.**

---

## מפת 12 ה-Goals routes
| Route | קובץ | מטרה |
|---|---|---|
| `/running/goals` · `/gym/goals` · `/home/goals` | `{running,gym,home}.goals.tsx` | רשימת יעדי התחום |
| `/{d}/goals/new` | `{running,gym,home}.goals.new.tsx` | יצירת יעד בתחום |
| `/{d}/goals/$id` | `{running,gym,home}.goals.$id.tsx` | פרטי יעד |
| `/{d}/goals/$id/edit` | `{running,gym,home}.goals.$id.edit.tsx` | עריכת יעד |

**רכיבים משותפים:** `GoalForm` (create+edit, domain נעול), `GoalsListView`, `GoalDetailView`, `GoalDomainChooser`, `goalLinks` (Link/redirect helpers type-safe פר-domain), `goalDomainConfig` (labels), `DomainPrimaryGoalTile`.

**אכיפת הגבלת domain:**
- ה-route מזריק `domain` literal לרכיבים.
- יצירה/עריכה: `GoalForm` נעול ל-domain; `listGoalTypesByDomain(domain)` מגביל את סוגי היעד (route ריצה לא יציע יעד בית וכו').
- פרטים: `GoalDetailView` עם guard `goal.domain !== domain` → מסרב להציג.
- compat `/goals/$id`: redirect לפי `goal.domain`.

## route-tree — סיבת ה-drift, מנגנון canonical, מדיניות
- **סיבת ה-drift:** ה-generator המקומי מקליד `Route.useLoaderData()` כ-`T | undefined`, מחמיר יותר מהעץ המחויב הישן (שנוצר ע"י גרסת generator אחרת). 4 routes שקראו `useLoaderData()` נשברו ב-typecheck לאחר regeneration.
- **מנגנון canonical:** אין CLI/script ל-generator; ה-generation מתבצע בתוך ה-vite build plugin של `@lovable.dev/vite-tanstack-config`. לכן `bun run build` הוא הדרך הקנונית ליצור מחדש את `src/routeTree.gen.ts`.
- **גרסאות (מ-`package.json`, ללא שינוי):** `@tanstack/react-router` ^1.170.16 · `@tanstack/react-start` ^1.168.26 · `@tanstack/router-plugin` ^1.168.18 · `@lovable.dev/vite-tanstack-config` ^2.7.7. `@tanstack/router-generator` מותקן כתלות טרנזיטיבית (לא מוצמד ב-package.json).
- **מדיניות `src/routeTree.gen.ts`:** auto-generated — **לא לערוך ידנית**, לא להעתיק אליו קוד, לא להשבית generation. מיוצר מחדש דרך `bun run build`. **מאומת: הקובץ לא נערך ידנית** ב-session זה (רק נוצר מחדש ע"י ה-build), ו-`git diff --exit-code` לאחר regeneration = ריק (committed == generated, דטרמיניסטי).
- **4 ה-routes ששונו** `useLoaderData()` → `useParams()`: `exercises.$id`, `locations.$id`, `running.$id`, `running.new.$type`. ה-loaders (כולל `notFound()`) **נשארו ללא שינוי בקוד**; הערכים זהים. verify ע"י טסט — **טרם** (unverified).

## אי-התאמות מול הדוח הקודם
- אין אי-התאמה מהותית. נקודות דיוק: (1) הדוח ציין loaders/notFound "נשמרו" — נכון ב-source אך **לא מכוסה בטסט** (מסומן unverified). (2) ספירת routes עודכנה ל-53 ב-`current-state.md`; טבלת `route-inventory.md` המקורית (41 שורות) + סעיף "Domain goals" נפרד משקפים זאת.

## Prompt history (תקציר — ראה `claude-session-log.md` לרישום מפורט)
- **מטרת Phase 1/2:** יעדים לפי domain (ללא מסך גלובלי) + trash/restore מלא ל-3 ישויות; עבודה אוטונומית עד השלמה.
- **פתרון route-tree drift:** הוראה לפתור generation דטרמיניסטית ללא עריכת/שחזור הקובץ הגנרטד → נפתר ע"י `useParams` (ADR-0022).
- **הוראת אימות:** לאמת את הדוח הקודם מראיות repo לפני המשך.
- **הוראת סגירה:** לשמר מצב ב-Git ובתיעוד לפני restart (session זה).
- **מטרת ה-session הבא:** אימות Phase 1/2 מ-repo + סגירת פערי regression/domain-isolation, ואז קביעת ה-phase הבא.

## GPT continuation context
אם ה-continuation הוא ב-GPT/agent אחר (אין מסמך context נפרד ל-GPT — זהו):
- **מקור אמת:** `AGENTS.md` + `docs/ai/*` (lowercase). אל תיצור מסמכי-על מתחרים.
- **מצב (מעודכן 2026-07-25):** Phase 1+2 + finalize + **התאוששות מריסטרט** הושלמו. branch `feat/domain-alignment-and-restore`, **HEAD = `a4d24e2`, pushed, ahead 0/behind 0**. working tree נקי. **200 tests** (162 unit + 38 router). *(הטענה הקודמת "לא pushed" — מבוטלת.)*
- **כללי ברזל:** soft-delete בלבד; אין עלות/secret/Supabase/Auth/RLS ללא Approval Brief מפורש (ראה `CLAUDE.md` הגלובלי + `AGENTS.md`); `routeTree.gen.ts` generated (regenerate ע"י `bun run build`, קרא params דרך `useParams`); yeda רק ע"י המשתמש (אין המצאת יעד/ערך/תאריך).
- **פקודות אימות:** `bun install --frozen-lockfile` → `bun run typecheck` → `bun run test` → `bunx eslint . --rule '{"prettier/prettier":"off"}'` → `bun run build`.
- **פעולה ראשונה מומלצת:** ראה "פעולה מומלצת אחת בלבד" למעלה.
