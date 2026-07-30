# Change Log

## 2026-07-30 · Recovery Audit — אימות התיעוד מול הריפו (Claude Code)

- **סוג:** audit + **docs בלבד**. אין שינוי קוד, אין branch חדש, אין merge, אין push של קוד, אין deploy, אין dependency, אין Supabase/env/secret.
- **Git במצב פתיחה וסגירה** · `main` · HEAD `daba93c` · `main` = `origin/main` (ahead 0 / behind 0) · working tree **נקי** · אין stashes/tags · אין merge/rebase/cherry-pick/bisect פעיל · `git log --branches --not --remotes` **ריק** (אין commits לא-דחופים) · שני ה-feature branches מוזגו ל-`main` ומסונכרנים 0/0, לא נמחקו.
- **אימות מלא הורץ מחדש על `main`; כל התוצאות זהות לתיעוד מ-2026-07-26** · typecheck exit 0 · `test:unit` **305/305** (21 קבצים) · `test:router` **61/61** (10 קבצים: 2·4·2·19·11·4·3·1·2·13) · migration 44/44 · readiness 29/29 · backup 14/14 · storage 34/34 · eslint `--rule '{"prettier/prettier":"off"}'` **0 errors / 8 warnings** · `bun run build` exit 0 · `git hash-object src/routeTree.gen.ts` **זהה לפני ואחרי ה-build** · typecheck אחרי build exit 0 · working tree נשאר נקי (הפלט ל-`.output/`/`.wrangler/` gitignored).
- **אימות scope ואבטחה** · אין `@supabase` ב-`package.json` ולא ב-`src` · אין `createClient` · אין `import.meta.env`/`process.env` · 47 אזכורי "Supabase" ב-`src` הם **הערות בלבד** · אין `.env`/secret/credential/`.pem`/`.key` ב-tracking · אין `supabase/`, אין `migrations/` · **אין CI** (`.github` לא קיים) · `.lovable/project.json` = schemaVersion/template/revision בלבד · **0 TODO/FIXME** · **0 בדיקות מדולגות** (`.skip`/`.only`/`.todo`) · `activeRepoKind === "mock"` · `CLOUD_ENTITIES` = 30 · `DEFERRED_MODULES = ["preferences"]`.
- **תיקון תיעוד #1 — ספירת routes** · `current-state.md` טען **53 route modules**; בפועל **54** + `__root.tsx`. הפער נוצר כשנוסף `backup.index.tsx` במסלול A והספירה לא עודכנה. מאושר מול `src/routes/` ומול `RootRouteChildren` ב-`routeTree.gen.ts` (54 ילדים). תוקן.
- **תיקון תיעוד #2 — סתירה פנימית ב-`open-tasks.md`** · הסעיפים ההיסטוריים בתחתית טענו שכשל כתיבה ב-7 מודולים, migration framework, Fake Supabase rehearsal ובדיקות UI ל-Export/Restore **עדיין פתוחים**, בעוד הסעיף העליון מסמן אותם ✅. סומנו **Superseded** עם ראיה, **ולא נמחקו**. נוסף באנר "הסעיפים העליונים גוברים" בראש המסמך.
- **תיקון תיעוד #3 — R-17** · המספר המתועד (~39,760) עודכן למדידה בפועל: `bun run lint` → exit 1, **30,668 errors / 8 warnings**, כולם `Delete ␍`. נוספה העובדה ש**אין CI**, ולכן ההמלצה הישנה "להסתמך על CI" אינה ישימה.
- **אומת כקיים ולא תוקן — R-24** · `src/lib/backup/repo.ts:256` עדיין `field: "session_id"` בעוד השדה בפועל הוא `home_session_id` (`src/lib/home/types.ts:105`); `repo.ts:300` עדיין `if (parents.size === 0) continue;`. התיעוד היה **מדויק**. התיקון נשאר משימת המשך בענף נפרד — **דורש אישור** כי ישנה התנהגות אימות.
- **החסם היחיד שנותר — R-22** · אין ראיה בריפו שנוצר קובץ גיבוי בפועל מחוץ לדפדפן. דורג כפריט 0 ב-`open-tasks.md`.
- **מסמכים שעודכנו:** `SESSION_HANDOFF.md` · `current-state.md` · `open-tasks.md` · `risks.md` · `change-log.md` · `test-plan.md` · `claude-session-log.md` · `prompts.md`. **`decisions.md` לא עודכן — לא התקבלה ולא התגלתה החלטה חדשה** (אין להמציא ADR).

## 2026-07-26 · מיזוג מסלול A ל-`main` (Claude Code)

- **merge** · `feat/home-plan-simple-flow` (`8470c4f`) מוזג ל-`main` (`de4c996`) ב-**merge commit `0e51653`** עם `--no-ff`. **היסטוריית ה-feature נשמרה במלואה** — ללא squash, ללא rebase, ללא amend, ללא force. `origin/main` לא התקדם בינתיים ולכן לא היו קונפליקטים.
- **verify (הורץ על `main` עצמו, לא הוסק מה-feature branch)** · `bun run typecheck` exit 0 · `bun run test:unit` **305/305** (21 קבצים) · `bun run test:router` **61/61** (10 קבצים) · `bun run test` exit 0 · `src/lib/migration` 44/44 · `src/lib/readiness` 29/29 · `src/lib/backup` 14/14 · `src/lib/storage` 34/34 · `bunx eslint . --rule '{"prettier/prettier":"off"}'` **0 errors / 8 baseline warnings** · `bun run build` ×2 exit 0 · `bun run typecheck` אחרי build exit 0 · `git diff --exit-code -- src/routeTree.gen.ts` exit 0 · working tree נקי.
- **scope verification** · `package.json` שונה **רק בסקריפטי בדיקות**; בלוקי `dependencies`/`devDependencies` **זהים בייט-לבייט** ל-`de4c996`. אין import של `@supabase`, אין `process.env`/`import.meta.env`, אין `fetch`/WebSocket ב-`src/lib/migration` ו-`src/lib/readiness`, ואין קובצי `.env`/secret/credential ב-tracking.
- **R-24 נשאר ללא שינוי במכוון** · `REFERENCE_RULES` ב-`src/lib/backup/repo.ts` עדיין מכיל `field: "session_id"` עבור `home.entries` (אומת על `main` לאחר המיזוג). Restore מקומי עדיין מקבל `home.entries` יתומים; ה-import pipeline של ה-rehearsal חוסם אותם בנפרד. התיקון יטופל **בענף נפרד** עם אסטרטגיית תאימות לאחור מפורשת, כי הוא עלול לפסול קובצי גיבוי שהתקבלו עד היום.
- **`preferences`** נשאר מדווח במפורש כ-`deferred_entities` ואינו ממופה לענן.
- **R-22 נשאר פתוח** · עמידות הגיבוי תלויה בשמירה ידנית של הקובץ מחוץ למכשיר.
- **לא בוצע:** deploy · פרויקט Supabase · SDK · Auth/RLS · migrations בענן · env/secret/credentials · dependency חדשה · tag · force-push · שינוי היסטוריה.

## 2026-07-26 · סגירת מסלול A — Fake Supabase rehearsal + Readiness Gate (Claude Code)

- **test(migration)** · `InMemoryCloudRepository` — ענן מדומה בזיכרון. **אין Supabase, SDK, SQL, רשת, env, secret או עלות.** טבלאות כמפות לפי primary key יציב (אף פעם לא index של מערך); אותו id + אותו תוכן = no-op · תוכן שונה = conflict **ללא דריסה** · הורה חסר = הרשומה אינה נכתבת.
- **test(migration)** · `cloudSchema.ts` — מפת **30 ישויות ענן** נגזרת מהמודל בפועל: מפתח יציב, קשרי הורה, שדה סדר, סוג בעלות. **סדר הייבוא מחושב טופולוגית** מהקשרים ואינו רשימה ידנית; self-reference (`home_templates.parent_template_id`) מוחרג ואינו יוצר מעגל.
- **test(migration)** · `importPipeline.ts` — parse → validate → integrity (checksum + total_records) → normalize → map → graph → topological sort → operations → execute → report. `operation_id` דטרמיניסטי (`table#id`). דוח מלא: total/inserted/unchanged/conflicts/rejected, per-entity, dependency failures, unsupported entities, deferred entities, ownership.
- **test(migration)** · ownership — `authenticatedUserId` הוא **מקור הסמכות היחיד**. `owner_id`/`user_id` שבקובץ מוסרים מגוף ה-payload ונשמרים כ-`source_metadata` בלבד. taxonomy מערכתי (`is_system`) מקבל `user_id: null`; תרגיל מותאם מקבל בעלות. שדות סוד (`token`/`secret`/`api_key`/`service_role`/...) לעולם אינם עוברים.
- **feat(readiness)** · `buildReadinessReport` — **פונקציה טהורה** שגוזרת 16 בדיקות ושני gates. ראיה חסרה, ריצה שלא בוצעה או יכולת כושלת = `false`. אין קבוע `true` ואין הסקה מקיום קובץ.
- **feat(readiness)** · `runReadinessAudit` — מייצר ראיות בכך שהוא **מריץ את היכולות בפועל**: כתיבה דרך כל 9 ה-writers · הסלמה והתאוששות ב-registry · מיגרציה + גרסת schema · אימות snapshot · **rollback אמיתי אחרי שינוי אמיתי** · שתילת גרסה עתידית ואימות חסימה · Export → מחיקה מלאה → Restore → Export והשוואת checksum · rehearsal כפול · בדיקת קונפליקט. בסיום מחזיר את תשעת המפתחות למצבם. ⚠️ מיועד לסביבת אימות מבודדת; **אף רכיב UI אינו קורא לו**.
- **תוצאה:** `ready_for_single_device_use` = **true** · `ready_for_future_supabase_migration_contract` = **true**. שניהם נגזרו מריצה, לא הוצהרו.
- **backward compatibility** · **אף קובץ קיים לא שונה.** שתי תיקיות חדשות בלבד (`src/lib/migration/`, `src/lib/readiness/`). אין שינוי ב-IDs, storage keys, schema 1.0.0, Export format 1.0.0, domain contracts או UI. כל 293 הבדיקות הקודמות ממשיכות לעבור.
- **docs** · ADR-0034 (rehearsal כתנאי מוקדם) · ADR-0035 (בעלות ב-Export אינה בעלות הרשאה) · ADR-0036 (Readiness Gate נגזר, לא מוצהר). R-23 ו-R-24 נפתחו.
- **tests** · +73 (סה"כ **366**): `inMemoryCloudRepository` (11) · `importPipeline` (33) · `readinessReport` (20) · `readinessAudit` (9).
- **verify** · typecheck exit 0 (גם אחרי build) · `test:unit` 305/305 · `test:router` 61/61 · `bun run test` exit 0 · eslint 0 errors / 8 baseline warnings · build ×2 exit 0 · `git diff --exit-code -- src/routeTree.gen.ts` ריק.
- **ממצא (P1, לא תוקן — R-24)** · `REFERENCE_RULES` ב-`backup/repo.ts` בודק `session_id` עבור `home.entries`, אך השדה בפועל הוא `home_session_id` — הכלל אינו יורה לעולם. ה-import pipeline תופס את המקרה בעצמו ולכן זה **אינו חוסם** את ה-rehearsal; לא שיניתי את שכבת הגיבוי שהושלמה. יש בדיקה שמתעדת את הפער, והתיקון מפורט ב-`open-tasks.md`.
- **fix(migration) `dc4b57b`** · `preferences` קיים ב-Export ואמור להפוך לשורת `profiles`, אך הוא **singleton** ולא אוסף מערכים — וה-pipeline, שעובד ברמת אוספים, דילג עליו **בלי לדווח**. זה סתר את ההבטחה ש"ישות ללא mapping מדווחת ולא נבלעת". נוספו `DEFERRED_MODULES` ושדה `deferred_entities` בדוח, ובדיקה שמוודאת דיווח ושאין טבלת `profiles` בענן. השפעה ידועה: שדה אחד (`landingModule`).
- **docs `3fefdcc`** · תיקון ספירת בדיקות אחרי התוספת (366 = 305 unit + 61 router; `importPipeline` 33).
- **לא בוצע:** חיבור Supabase · SDK · Auth/RLS · env/secret · deploy · dependency חדשה · שינוי UI · merge ל-`main`.

## 2026-07-26 · בטיחות אחסון מקומי — התראה גלובלית + schema גרסאי (Claude Code)

- **fix(ui)** · `GlobalStorageBanner` ברמת `__root` — **כשל כתיבה מכל אחד מ-9 המודולים גלוי בכל מסך**, לא רק ב-Workout Execution. `memory_only` → `role="status"` + "חלק מהשינויים לא נשמרו בדפדפן ועלולים להיעלם לאחר רענון." · `failed` → `role="alert"` + "השמירה נכשלה. הורד גיבוי לפני רענון או סגירת הדפדפן." אייקון + כותרת מילולית (צבע אינו הסמן היחיד) + קישור ל-`/backup`. **banner מתמשך, לא toast בכל שינוי**; כתיבה מוצלחת אחרי כשל מסירה אותו אוטומטית.
- **fix(ui)** · מסך האימון אינו מצהיר "נשמר במכשיר" כאשר `getWorstStorageStatus()` אינו `saved` — גם אם מודול ה-sessions עצמו נשמר.
- **feat(storage)** · `fitlog:storage-meta` — `format` `workout-data-system-local`, `schema_version` **1.0.0**, `updated_at` ISO-8601 UTC, ורשימת תשעת מודולי האחסון. **תשעת המפתחות וה-IDs ללא שינוי.** metadata חסר/פגום = legacy · גרסה עתידית = **חסום** (`future_version_blocked`, אין נגיעה בנתונים).
- **feat(storage)** · registry מפורש `legacy -> 1.0.0`. המיגרציה קוראת את כל תשעת המפתחות, מאמתת parse, וכותבת מחדש בסריאליזציה קנונית. **עובדת על מחרוזות גולמיות** ולא דרך ה-repositories — ולכן שדות לא מוכרים נשמרים במלואם. אין מחיקה, idempotent, הרצה חוזרת = no-op מלא.
- **feat(storage)** · snapshot מאומת לפני כל שינוי — `snapshot_id`, `created_at`, `from_version`, `target_version`, `keys`, `checksum` (FNV-1a). נכתב ל-`fitlog:migration-snapshot` ו**נקרא בחזרה לאימות**; snapshot שלא ניתן לאמת עוצר את המיגרציה. **אינו דורס** את snapshot ה-Restore (`fitlog:backup-snapshot:*`).
- **feat(storage)** · סדר קבוע: snapshot → חישוב בזיכרון → הגנת אי-מחיקה → כתיבה → **metadata אחרון**. כשל בחישוב או ב-snapshot → אף מפתח מקור לא נגע. כשל באמצע הכתיבה → `rollbackFromSnapshot` מלא. בכל כשל: `migration_failed`, ה-snapshot נשמר, metadata לא נכתב.
- **feat(storage)** · `safeWriteRawStorage` / `safeRemoveStorage` / `isStorageAvailable` ב-`safeStorage`; `STORAGE_KEY` נחשף מ-9 מודולי האחסון כדי שמפת המפתחות לא תשוכפל ותסטה.
- **refactor** · `checksumOf`/`stableStringify` אוחדו ל-`src/lib/storage/checksum.ts` — הגדרה אחת, משותפת עם מודול הגיבוי.
- **docs** · ADR-0033 (schema מקומי גרסאי) · **ADR-0032 תועד רטרואקטיבית** — הוא הוזכר בקוד מאז `4b2b401` ולא נכתב מעולם ב-`decisions.md`. R-22 הוקטן מ-🔴 High ל-🟡 Medium.
- **tests** · +36 (סה"כ **293**): `lib/storage/__tests__/localSchema.test.ts` (**23**) — legacy→1.0.0, metadata רק אחרי הצלחה, no-op חוזר, snapshot ו-checksum, rollback, כשל באמצע שאינו משנה מקור, שדות לא מוכרים, גרסה עתידית, אחסון לא זמין · `test/globalPersistenceWarning.test.tsx` (**13**) — כשל ב-catalog/home/templates/goals/runs/preferences, `saved` ללא banner, התאוששות, קישור גיבוי נגיש.
- **verify** · typecheck exit 0 (גם אחרי build) · `test:unit` 232/232 · `test:router` 61/61 · `bun run test` exit 0 · eslint 0 errors / 8 baseline warnings · build ×2 exit 0 · `git diff --exit-code -- src/routeTree.gen.ts` ריק.
- **תיקון עובדתי:** הודעת ה-commit `feat(storage)` אומרת "27 בדיקות חדשות" ב-`localSchema.test.ts`. המספר בפועל הוא **23** (נמדד: `vitest run src/lib/storage/__tests__/localSchema.test.ts`). לא בוצע amend; הרישום כאן הוא הנכון.
- **לא בוצע:** Fake Supabase rehearsal · Readiness Gate · חיבור Supabase · שינוי בממשק תוכניות הבית · dependency חדשה · merge ל-`main` · deploy.

## 2026-07-25 · גיבוי ושחזור מקומי (מסלול A, חלקי) (Claude Code)

- **feat(backup)** · מעטפת קנונית versioned (`workout-data-system` / `schema_version` 1.0.0) עם `entity_counts` ו-checksum (FNV-1a, ללא dependency). כל 9 מודולי `fitlog:*` נכללים.
- **feat(backup)** · `validateBackup` — format, schema version, מזהים כפולים, **dangling references** (template entries, session entries/exercises/sets/blocks), שדות חסרים, חותמות זמן. **Export מסרב לייצר קובץ שנכשל באימות.**
- **feat(backup)** · `previewImport` (added/unchanged/conflicts) · `importBackup` עם **snapshot אוטומטי לפני כל כתיבה**; `merge_keep_local` הוא ברירת המחדל ו**אינו דורס** קונפליקטים; `merge_prefer_backup`/`replace` דורשים בחירה מפורשת. ייבוא שנכשל באימות **אינו כותב דבר**.
- **fix** · זיהוי שדה זהות פר-אוסף — `sessions.timers` ממופתח ב-`session_id` ולא ב-`id`. הבדיקות תפסו זאת (כל שורת timer דווחה כחסרת מזהה).
- **feat(ui)** · route `/backup` — counts, הורדת קובץ (שם עם תאריך ושעה), שחזור עם preview וטיפול מפורש בקונפליקטים. מקושר מ-`/more` במקום אריח "בקרוב".
- **docs** · `LOCAL_TO_SUPABASE_MIGRATION_CONTRACT.md` — מיפוי מלא של 16 ישויות: טבלה עתידית, PK, ownership, תלות, סדר ייבוא, מדיניות קונפליקט, טרנספורמציה. ADR-0031.
- **tests** · +14 (סה"כ **246**): round-trip מלא (export → ניקוי → import → אותם IDs/קשרים/ערכים/סדר/checksum), idempotency בייבוא משולש, זיהוי קונפליקט ואי-דריסה, snapshot קריא, ייבוא כושל שאינו משנה נתונים, 5 מצבי כשל באימות.
- **verify** · typecheck exit 0 · `test:unit` 198/198 · `bun run test` exit 0 · eslint 0 errors / 8 baseline · build ×2 · routeTree דטרמיניסטי.
- **לא הושלם במסלול A:** הרחבת `PersistenceStatus` ל-7 מודולי storage · migration framework versioned · Fake Supabase rehearsal · בדיקות UI ל-Export/Restore. ראה `open-tasks.md`.

## 2026-07-25 · פישוט תוכניות בית + Audit מוכנות נתונים (Claude Code)

- **feat(exercises)** · `homeCatalog.ts` — קטלוג curated: **34 תרגילים ב-6 קבוצות בשפת משתמש**, פילטר ציוד פשוט (5 ערכים), חיפוש עברית/אנגלית. Seed: **+16 תרגילי בית נפוצים**. **אין שינוי `name_en` קיים** ולכן אין שינוי ID ואין שבירת תוכניות שמורות. ADR-0029.
- **feat(home)** · `HomeExercisePicker` — אחרונים → מועדפים → קבוצות · **בחירה מרובה** (אישור אחד) · ללא מטא-דאטה מלא · "תרגיל מותאם" **בתוך אותו גיליון** (אין dialog בתוך dialog) · יעדי מגע 44px+ · aria-labels. מחליף picker שהיה חיפוש-עברית-בלבד, בחירה בודדת, ללא קבוצות.
- **feat(home)** · `useRecentHomeExerciseIds` — "אחרונים" נגזר מנתונים קיימים, **ללא storage key חדש**.
- **audit** · דוח מוכנות נתונים עובדתי (ADR-0030): אין Supabase client · אין env · אין migrations · אין Auth/RLS · `activeRepoKind="mock"` · 9 מפתחות localStorage · **אין export/import** · **אין העברה בין מכשירים**. R-22 נפתח כ-🔴 High.
- **tests** · +18 (סה"כ **232**): `exercises/__tests__/home-catalog.test.ts` (16) — כל slug נפתר, אין כפילויות, גבול 30–36, יציבות ID; `test/homePlanPicker.test.tsx` (2) — קבוצות, בחירה מרובה, חיפוש he/en.
- **verify** · typecheck exit 0 · `test:unit` 184/184 · `bun run test` exit 0 · eslint 0 errors / 8 baseline · build ×2 · routeTree ללא שינוי.
- **לא בוצע:** Supabase/Auth/RLS/migration/deploy · לא נוספה dependency · לא שונה חוזה domain.

## 2026-07-25 · סנכרון `main` לקראת Visual QA (Claude Code)

- **git** · `main` עודכן ב-**fast-forward** מ-`feat/domain-alignment-and-restore` ל-**`f33d00a`**. `main` היה **ancestor** מלא של ה-feature branch (אומת ב-`git merge-base --is-ancestor` על `main`, `origin/main` ו-`eca9163`), ולכן **לא נוצר merge commit ולא היו conflicts**. לא נדרש branch גיבוי.
- **שימור היסטוריה** · `eca9163` (docs של ה-audit, ה-commit שהיה ahead ב-`main`) נשמר במלואו בהיסטוריה. ה-feature branch **לא נמחק** — יישמר עד שה-Visual QA ב-360px יעבור.
- **אימות על `main` עצמו** · typecheck exit 0 · `test:unit` 170/170 (13 קבצים) · `test:router` 46/46 (8 קבצים) · `bun run test` **216/216** exit 0 · eslint **0 errors**, 8 baseline warnings (shadcn) · build ×2 · `git diff --exit-code -- src/routeTree.gen.ts` ריק · working tree נקי.
- **push** · `git push origin main` ללא force. `origin/main` הוא כעת **מקור האמת** לגרסה שעליה יבוצע Visual QA.
- **פתוח:** Visual QA ב-360px (בדפדפן/Lovable Preview) — הקריטריון היחיד שנותר בלתי מאומת. **לא בוצע deploy.**

## 2026-07-25 · Workout Execution — השלמת פערים (Claude Code)

**מצב קודם:** המסך `/sessions/$id` היה **קיים ומלא ברובו** (לא skeleton): כותרת, בלוקים/סופרסטים, עריכת משקל/חזרות inline דרך `NumberField` (`inputMode="decimal"`), השלמה/ביטול סט, הוספה/שכפול/דילוג סט, החלפת תרגיל, rest timer, pause/resume, autosave. הפער היה בקצוות. **הערה:** `WorkoutSessionSnapshot` שהוזכר בתיעוד **אינו קיים**; החוזה בפועל הוא `StrengthSession` → `StrengthSessionExercise` (עם `StrengthSessionExerciseSnapshot`) → `StrengthSet`.

- **feat(repo)** · `skipExercise` / `unskipExercise` — דילוג על תרגיל שלם. סטים שבוצעו **אינם נמחקים ואינם משתנים**; רק סטים פתוחים מסומנים כדולגו (`skipSet` שומר ערכים).
- **feat(repo)** · `finishSessionPartial` — סיום חלקי. מה שבוצע נשמר, הנותר מסומן כדולג, הסטטוס `completed`. ADR-0027. ללא שינוי חוזה.
- **fix(persistence)** · `writeSessionsState` **בלע** כשלי כתיבה ל-localStorage ונפל בשקט ל-in-memory, בעוד ה-UI הכריז "נשמר אוטומטית". נוסף `PersistenceStatus` (`idle`/`saved`/`memory`) + `usePersistenceStatus`; המסך מציג "נשמר במכשיר" רק אחרי אישור ה-repository, ואזהרה מפורשת כשהנתונים בזיכרון בלבד. טקסט+אייקון, לא צבע בלבד. ADR-0028. הוסר `writeSessionsStateWithStamp` המת.
- **feat(ui)** · RPE ניתן לעריכה בכל סט (`StrengthSet.rpe` כבר היה בחוזה) · דילוג/ביטול דילוג על תרגיל + צ׳יפ "דולג" וספירה · כל `prompt()`/`confirm()` החוסמים הוחלפו בפאנלים inline / bottom sheets · פעולות הרסניות מופרדות חזותית ומסבירות שהמידע עובר לסל המחזור · אימון חסר מציג מצב התאוששות מוסבר במקום `notFound()` גנרי · תוקן `useMemo` מותנה.
- **tests** · **+16** (סה"כ **216**): `sessions/__tests__/workout-execution.test.ts` (8, unit) + `workoutExecution` (4) / `workoutExecutionEditing` (3) / `workoutExecutionAddSet` (1) ב-`src/test`. כל קובץ router בתהליך נפרד (ADR-0026).
- **verify** · typecheck exit 0 · `test:unit` 170/170 (13 קבצים) · `test:router` 46/46 (8 קבצים) · `bun run test` exit 0 · eslint 0 errors / 8 baseline warnings · build ×2 · `routeTree.gen.ts` ללא שינוי.
- **סיכון חדש:** R-21 — בדיקות render שפותחות Radix Sheet נתקעות ב-harness. ההתנהגות מכוסה ברמת repository. P2, לא חוסם.
- ללא dependency חדשה · ללא backend/Supabase · ללא שינוי חוזה domain · ללא שינוי URL/routes · **ללא deploy**.

## 2026-07-25 · התאוששות מריסטרט — route flattening + router test suite (Claude Code)

**רקע:** ריסטרט לא מתוכנן קטע עבודה לא מחויבת. הענף כבר היה מסונכרן ל-`origin` ב-`5af65bd` לפני הריסטרט (push ב-10:01), כך שההיסטוריה המחויבת לא הייתה בסיכון — רק העבודה שבדיסק.

- **wip `6fb22c3`** · freeze commit: הקפאת כל העבודה הלא-מחויבת כפי שנמצאה, לפני כל תיקון (10 renames, routeTree, harness + 3 test files, devDeps, vitest include).
- **checkpoint `da20f72`** · **fix(routing)** · שיטוח 14 route modules נוספים ל-`*.index.tsx` (ADR-0025). התגלה שקובץ route עם ילדים בשם הופך אוטומטית ל-layout parent; אף route פרט ל-`__root.tsx` אינו מרנדר `<Outlet />`, כלומר אף אחד מהם לא נועד להיות layout. **סה"כ 24 route modules שוטחו.** `routeTree.gen.ts` מכיל כעת רק `RootRouteChildren`. **כל ה-URLs, ה-redirects וה-compat routes נשמרו** (הגנרטור מייצר גם `/x` וגם `/x/`).
- **checkpoint `da20f72`** · **test fixtures** · `src/test/fixtures.ts` — builder מלא ותקף ל-`RunSessionInput`; תיקן שגיאת typecheck **ללא** `any`/cast/`@ts-ignore`. harness: דריסת `scrollTo`/`scrollBy`/`scrollIntoView` ללא תנאי (jsdom מגדיר אותם אך הם זורקים), בידוד מלא של 8 stores, teardown מפורש ל-router/queryClient, `defaultPreload: false`.
- **fix(testing)** · פיצול `systemErrors.test.tsx` לפי תחומי אחריות ל-`systemScreens` / `runningRouteLoaders` / `catalogRouteLoaders` (ADR-0026). `test:router` = רצף `&&` מפורש, קובץ אחד לכל תהליך Vitest. `test:unit` = `src/lib`. `test` = שניהם. **ללא dependency חדשה, ללא custom runner, ללא force-exit, ללא הפחתת כיסוי.**
- **verify** · typecheck ✅ exit 0 · `test:unit` **162/162** (12 קבצים) ✅ · `test:router` **38/38** (5 קבצים) ✅ · `bun run test` ✅ exit 0 · eslint (ללא prettier) **0 errors, 8 warnings** ✅ · build ×2 ✅ · `git diff --exit-code -- src/routeTree.gen.ts` ✅ ריק.
- **סיכון חדש:** R-20 — hang מצטבר ב-Vitest/jsdom בקובץ router-test גדול. **P2, לא חוסם.**
- ללא backend/Supabase/Auth/RLS/CI-CD (לא קיימים בריפו) · ללא המרת CRLF גורפת (R-17) · ללא deploy, ללא עלות חדשה. ~~ללא push~~ → **עודכן, ראה למטה**.

**עדכון 2026-07-25 (אחרי הרשומה לעיל) — Push של ההתאוששות:** שלושת commits ההתאוששות — `6fb22c3` (freeze) · `da20f72` (checkpoint) · `a4d24e2` (`fix(testing): split cumulative router error suite`) — **נדחפו ל-`origin/feat/domain-alignment-and-restore`** ב-fast-forward `5af65bd..a4d24e2`. הענף **ahead 0 / behind 0**, working tree נקי לפני ואחרי. **ללא force push, ללא merge, ללא deploy**; `main` לא נגעו בו. ההערה "ללא push" ברשומה לעיל וב-commit messages הייתה נכונה לרגע כתיבתן — **מבוטלת מכאן ואילך**.

## 2026-07-25 · Phase 1+2 finalize — domain isolation guard + regressions (Claude Code)

- **fix(goals)** · אכיפת cross-domain isolation: helper טהור `goalMatchesDomain(goal, domain)` ב-`goalDomainConfig.ts`; guard ב-`GoalDetailView` (קיים, הועבר ל-helper) וב-`GoalForm` **edit mode** — יעד ששייך לתחום אחר לא ניתן לעריכה במסלול (מונע מעבר domain שקט). מקור האמת ל-domain הוא הישות, לא ה-route/param.
- **tests** · +4 (סה"כ **162/162**): goalMatchesDomain cross-domain, updateGoal לא משנה domain, primary selection מחריג archived/trashed, restore שומר domain+linked ids ולא יוצר קשר שקרי (dependency חסרה) ללא כפילות.
- **verify** · baseline טרי: typecheck ✅ · test 162/162 ✅ · lint 0 errors/8 warnings ✅ · build ✅ · routeTree יציב (build×2 ללא diff; committed==generated; 12 domain-goals רשומים).
- ללא שינוי routes/routeTree · ללא backend/dep חדש · ללא push.

## 2026-07-24 · Phase 1+2 — Domain-scoped goals + Trash/Restore (Claude Code)

**Phase 1 — goal surfaces scoped to domains (החלטת מוצר מאושרת: אין מסך יעדים גלובלי).**
- **חדש** · `src/components/goals/`: `goalLinks.tsx` (Link/redirect helpers type-safe פר-domain), `goalDomainConfig.ts` (labels), `GoalForm.tsx` (יצירה+עריכה, domain נעול → סוגי יעד מוגבלים לתחום), `GoalsListView.tsx`, `GoalDetailView.tsx`, `GoalDomainChooser.tsx`.
- **חדש** · 12 route modules: `{running,gym,home}.goals[.new|.$id|.$id.edit].tsx` — כל route מציג/יוצר/עורך רק יעדי התחום שלו.
- **compat** · `/goals`, `/goals/new`, `/goals/$id` הומרו ל-compatibility redirects: `?domain=` → redirect לתחום; ללא domain → בחירת 3 אריחים; `/goals/$id` → redirect לפי `goal.domain`, יעד חסר → 404 עברית. אין קישור גלובלי בניווט.
- **wiring** · `DomainPrimaryGoalTile` חובר ל-`/running`,`/gym`,`/home` (הוחלף מקטע ה-goals הישן ב-gym שהתבסס על façade ריק). קישורי האריח → routes תחומיים.
- **route-gen fix** · תוקן drift של `routeTree.gen.ts` (R-19): 4 routes (`exercises.$id`,`locations.$id`,`running.$id`,`running.new.$type`) עברו מ-`Route.useLoaderData()` ל-`Route.useParams()` (loaders + notFound guards נשמרו; ערכים זהים). generation כעת דטרמיניסטי ו-typecheck ירוק.
- **script** · נוסף `"typecheck": "tsc --noEmit"` ל-package.json.

**Phase 2 — trash/restore הושלם ל-3 ישויות.**
- **lib** · `listTrashedSessions`+`useTrashedSessions` (sessions), `useTrashedHomeSessions` (home), `useTrashedGoals` (goals).
- **`/trash`** · 3 מקטעים חדשים: אימוני חדר כושר, אימוני בית, יעדים — שחזור דו-שלבי (`ConfirmDialog`).
- **delete-to-trash** · אימון בית: כפתור "מחק לסל" (2-step) ב-summary. יעד: אישור לפני מחיקה ב-`GoalDetailView`. gym כבר היה קיים.
- **recompute** · restore דרך `commit()` → subscribers → analytics/records/summaries/goal-progress מחושבים מחדש מ-raw (ארכיטקטורת `useSyncExternalStore`).

**i18n + hygiene.**
- `__root.tsx` — 404 + error boundary תורגמו לעברית + RTL + `role="alert"`/`aria-live` + focus.
- נוסף `.gitattributes` (LF; ללא renormalize גורף — R-17).
- lint hook false-positive (`goals.new.tsx`) נפתר ע"י named component (ללא disable).

**בדיקות** · +8 (סה"כ **158/158**, 12 קבצים): domain scoping, type restriction, edit, getPrimaryGoal, trash/restore ל-3 ישויות + no-duplicate + source recompute.
**checks** · typecheck ✅ · lint 0 errors/8 warnings (shadcn) · build ✅ · routeTree דטרמיניסטי (build×2 ללא diff).

## 2026-07-24 · Product Alignment Audit (Claude Code)

- **audit** · בוצע audit מלא ללא שינוי פונקציונלי. מופו 41 route modules, ~40 ישויות ב-9 תחומי `src/lib`, App Shell, design system, שכבת נתונים, ואבטחה.
- **docs (חדשים)** · `route-inventory.md`, `entity-inventory.md`, `design-system-audit.md`, `product-alignment-audit.md`, `migration-plan.md`, `claude-session-log.md`.
- **docs (עודכנו)** · `current-state.md` (reconciliation — הסרת טענות מיושנות "אין קוד"), `architecture.md` (מבנה בפועל `src/lib/<domain>` מול המתוכנן), `decisions.md` (ADR-0019 היררכיית מקורות אמת, ADR-0020 audit), `open-tasks.md` (Human Decisions Required), `risks.md` (R-17 CRLF, R-18 goals orphan), `test-plan.md` (עדכון סטטוס בדיקות אמיתי).
- **fix (בטוח)** · 4 שגיאות `prefer-const` (`analytics/exerciseHistory.ts:94`, `progress.ts:28`, `quality.ts:161-162`) — `let`→`const`, ללא שינוי התנהגות.
- **baseline** · `tsc --noEmit` נקי · `vitest` 150/150 (10 קבצים) · `build` עובר · `lint` — ראה R-17 (CRLF מקומי; על LF: 8 warnings + 1 error rules-of-hooks false-positive).
- **ממצא מפתח** · הפרויקט מיושר היטב עם הדרישות; רוב תחומי הליבה כבר בנויים (localStorage). אין קוד legacy (people/transport/roles/PIN/coach — כולם נעדרים). הפער המוצרי היחיד: משטח goals (`/goals` orphan מול "יעדים בתוך התחום"). שם התיקייה `expense-guard` מטעה — הקוד הוא אפליקציית כושר.

## 2026-07-30 · Strength history + analytics

- **analytics** · `src/lib/analytics/` — `formulas.ts` (רשם 1RM: Epley/Brzycki v1), `oneRM.ts` (שער כשירות דטרמיניסטי + `reason` לפסילה), `comparability.ts` (`compareSets` — פסילת חימום, יחידת משקל, פערי חזרות, snapshot תרגיל שונה), `volume.ts` (נורמליזציה ל־kg + `unilateral × 2`), `records.ts` (`detectSessionRecords` עם baseline לאימון ראשון של תרגיל), `quality.ts` (Workout Quality Score מרובה־רכיבים עם נירמול הרכיבים שנעדרים ורשימת excluded), `progress.ts`, `sessionHistory.ts`, `sessionComparison.ts`, `muscleLoad.ts`, `chartData.ts`, `time.ts`.
- **ui** · `src/components/analytics/MiniLineChart.tsx` (SVG מקורי נגיש), `MetricSelector.tsx`, `SessionHistoryTile.tsx`, `QualityBreakdown.tsx` (רכיבים + מוחרגים + תווית תיאורית), `HistoryFiltersSheet.tsx`, `ExerciseHistoryPanel.tsx`.
- **routes** · `/gym/history` (רשימת אריחים + סינון/מיון ב־Sheet), `/gym/history/$id` (סיכום + השוואה לאימון קודם + Quality breakdown), `/gym/compare` (בחירת שני אימונים והשוואת מדדים), `/exercises/$id/history` (מגמות תרגיל עם `MiniLineChart` + `MetricSelector`).
- **integration** · `/gym` → אריח היסטוריה פעיל (לינק ל־`/gym/history`). `/sessions/$id/summary` → כרטיס Quality Breakdown + לינק "השווה לאימון קודם" (`/gym/compare?a=<id>`) + לינק להיסטוריה + PRs אמיתיים בלבד (baseline לא נספר). `/exercises/$id` → `ExerciseHistoryPanel` במקום EmptyState.
- **docs** · `docs/ai/metrics-strength.md` — מקור אמת לכל הנוסחאות, תנאי כשירות, וכללי השוואה.
- **checks** · `bunx tsgo --noEmit` נקי, `bunx vitest run` 119/119 (25 חדשים לאנליטיקה: נוסחאות, כשירות 1RM, comparability, volume, records+baseline, quality נירמול, session comparison, exercise summary).



## 2026-07-29 · Strength Templates + Sessions skeleton

- **data** · `src/lib/templates/` — `types.ts`, `repo.ts`, `storage.ts`, `hooks.ts`, `versions.ts`, `duration.ts`, `muscleLoad.ts`, `compatibility.ts`, `schemas.ts`, `defaults.ts` (3×12, 90s rest), `labels.ts`, `index.ts`. מודל שלוש־שכבתי: `WorkoutTemplate` → `WorkoutTemplateBlock` (single / superset / circuit) → `WorkoutTemplateExercise`. Soft-delete, ארכוב, שכפול (parent_template_id), versioning עם snapshot מלא.
- **sessions** · `src/lib/sessions/` — שלד `startSessionFromTemplate` השומר snapshot קפוא של התבנית ומעלה `usage_count`. עריכה מאוחרת בתבנית לא משנה sessions קיימים.
- **ui** · `src/components/templates/TemplateTile.tsx`, `ExercisePickerSheet.tsx` (בחירה מרובה + יצירת סופרסט מיידית), `TemplateBlockCard.tsx` + `TemplateExerciseRow.tsx` (עורך בלוקים, שינוי סדר בכפתורים בלבד — ללא swipe), `TemplateSummary.tsx` (סיכומי משך משוער, עומס שרירים, אזהרות ציוד חסר במיקום).
- **routes** · `/templates` (טאבים: פעילות / ארכיון / סל), `/templates/$id`, `/templates/$id/edit` (Autosave), `/templates/$id/history` (גרסאות), `/sessions/$id` (שלד מעבר לאימון פעיל). כל route עם `head()` ייחודי.
- **integration** · `/gym` מציג ספירת תבניות + קישור פעיל, `/more` — קישור לתבניות, `/trash` — סעיף שחזור תבניות.
- **checks** · `bunx tsgo` נקי, `bunx eslint --fix` 0 errors (8 warnings shadcn baseline בלבד), `vitest` 94/94 (17 חדשים למודול תבניות + snapshot immutability).



## 2026-07-26 · Catalog UI — Locations / Treadmills / Equipment / Trash

- **routes** · `src/routes/locations.tsx` (רשימת מקומות + חיפוש + סינון visibility), `src/routes/locations.$id.tsx` (טאבים: ציוד / הליכונים + פילטרים אנכיים + קישור עריכה + `notFound`), `src/routes/trash.tsx` (שחזור פר־ישות עם אישור כפול). `head()` ייחודי לכל route + og.
- **tiles** · `src/components/catalog/LocationTile.tsx`, `TreadmillTile.tsx`, `EquipmentTile.tsx` — אריחים במובייל, פעולות ב־Popover (2 קליקים לפחות), badges למועדף / ברירת מחדל / ארכיון / סל.
- **filters** · `src/components/catalog/EquipmentFiltersSheet.tsx` — Sheet אנכי (ללא chips אופקיים) לפי sinning types × availability × favorites × visibility.
- **more** · `src/routes/more.tsx` — הפעלת קטלוג פעיל: קישור למקומות, קישור לסל מחזור עם counter, הסרת הפריטים "בקרוב" הרלוונטיים.
- **soft-delete** · `trash` / `restore` / `archive` / `unarchive` דרך repo קיים; היסטוריה נשמרת.
- **checks** · `bunx tsgo` נקי, `bun run lint` 0 errors, `vitest` 18/18.



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

## מסך ביצוע אימון כוח פעיל
- הרחבת מודלים ב-`src/lib/sessions/` (Session/Exercise/Set), autosave ל-localStorage, טיימר מבוסס timestamp.
- `hooks.ts`: `useSession`, `useSessionBlocks`, `useSessionExercises`, `useExerciseSets`, `useSessionVolume`, `useLiveSessionDuration`, `useRestTimer` + `startRestTimer/adjust/stop`.
- חישובים ב-`calculations.ts`: נפח (kg), סטים completed, PRs מול היסטוריה, previous performance, data completeness.
- רכיבי UI ב-`src/components/session/`: `NumberField`, `SetRow`, `ExerciseCard`, `RestTimer`.
- מסלולים: `/sessions/$id` (ביצוע פעיל), `/sessions/$id/summary` (סיכום עובדתי), `/gym/new` (בחירת מקור: ריק / תבנית / שכפול).
- באנר "אימון פעיל" ב-`/gym` המפנה חזרה למסך הביצוע.
- Typecheck נקי, Lint נקי (למעט אזהרת react-refresh קיימת ב-`toggle.tsx`), 94/94 בדיקות עוברות.

## 2026-08-XX · Home Strength Module

- **data** · `src/lib/home/` — `types.ts`, `storage.ts` (localStorage + subscribers), `repo.ts`, `metrics.ts` (mean/median/CV-based stability + Home Quality Score), `records.ts` (baseline-aware PR detection: top reps in set, total reps, longest hold), `hooks.ts`, `seed.ts`, `index.ts` barrel.
- **models** · `HomeSession` / `HomeExerciseEntry` (with `snapshot` for exercise substitution history) / `HomeExerciseSet` (reps/time/tempo/side/added_weight/assistance/round). Home templates: `HomeTemplate` + `HomeTemplateEntry` + versions. Soft-delete throughout (`deleted_at`).
- **ui** · `src/components/home/` — `RepStepper` (−1/+1/+5 rapid entry), `HoldTimer` (timestamp-based), `HomeSetRow` (unified reps/time/side with per-set variance), `HomeSessionTile`, `HomeSessionTileWrapper`, `HomeTemplateTile`.
- **routes** · `/home` launchpad עם recent + templates + quick actions; `/home/quick` picker; `/home/quick/$exerciseId` shortcut; `/home/sessions/$id` execution; `/home/sessions/$id/summary` factual summary עם PRs + Quality Breakdown; `/home/history` filterable list; `/home/history/$id` redirect; `/home/templates` library; `/home/templates/$id` details; `/home/templates/$id/edit` full editor (reorder, per-entry sets/reps/hold/rest/added_weight, save version, launch session).
- **behavior** · Autosave on every mutation; per-set independent reporting (no forced identical reps); exercise substitution snapshot; skipped-set exclusion from totals; factual language (no cheerleading).
- **tests** · `src/lib/home/__tests__/home.test.ts` — 20 tests (metrics, repo lifecycle, quick entry, substitution, templates, PR baseline behavior, quality score).
- **checks** · `bunx tsgo` נקי; `vitest` 139/139 עוברות (9 test files).

## Goals module — 2026-07-24
- `src/lib/goals/`: types, catalog (26 goal types × 3 domains), calculation (deterministic, formula v1), repo (CRUD + status transitions + versions + snapshots + activity links), hooks (useGoalProgress computes from live runs/sessions/home data), storage (localStorage + subscribers).
- `src/components/goals/DomainPrimaryGoalTile.tsx`: reusable tile with progress bar + primary goal selection.
- `src/routes/goals.tsx`, `goals.$id.tsx`, `goals.new.tsx`: list + filter + create form + detail (progress, projection, manual current, snapshots, versions, lifecycle actions).
- Tests: 11 new (150 total passing). Typecheck + build clean.
- Notes: is_primary is single-per-domain; material field changes bump version + write GoalVersion; snapshots append-only; event goals show days-remaining only (no % progress).
