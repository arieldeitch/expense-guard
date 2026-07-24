# Risks

מפת סיכונים אקטיבית. עדכון בכל החלטה שמפחיתה או מוסיפה סיכון.

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
**מיטיגציה מומלצת (לא בוצעה — דורשת renormalize מכוון):** להוסיף `.gitattributes` עם `* text=auto eol=lf` ואז `git add --renormalize .`. **אזהרה:** renormalize נוגע בכל קובץ (diff ענק) ועלול להשפיע על Lovable sync — לבצע רק בהחלטה מכוונת, לא כתיקון אגבי. עד אז: להריץ lint עם `--rule '{"prettier/prettier":"off"}'` לבדיקת בעיות אמיתיות בלבד, או להסתמך על CI.

## R-18 · goals surface orphan סותר §6 — 🟡 Medium (הוסף 2026-07-24)
**תרחיש:** `/goals` גלובלי קיים ובדוק אך מנותק מהניווט; `DomainPrimaryGoalTile` בנוי אך לא מרונדר. סתירה ל-§6 ("יעד בתוך התחום, אין עמוד גלובלי"). סיכון: החלטת מוצר תיפול דרך הסדקים, או route ימחק בטעות.
**מיטיגציה:** מתועד ב-ADR-0021 + `open-tasks.md → Human Decisions Required #1`. לא למחוק ולא לחווט עד החלטת משתמש. מנוע `lib/goals` נשמר.

## R-19 · `routeTree.gen.ts` drift ב-build מקומי → typecheck נשבר — 🟡 Medium (הוסף 2026-07-24)
**תרחיש:** הרצת `bun run build` מקומית מחדשת (regenerate) את `src/routeTree.gen.ts` בגרסה שונה מהמחויב (נצפו +10 שורות), וה-typecheck (`tsc`) נשבר עם 4 שגיאות `Route.useParams()` "possibly undefined" (`exercises.$id`, `locations.$id`, `running.$id`, `running.new.$type`). על הגרסה ה**מחויבת** (מה ש-CI/Lovable משתמשים) typecheck **נקי**.
**סיבה:** drift בין גרסת `@tanstack/router-plugin` המקומית למה שיצר את הקובץ המחויב.
**מיטיגציה:** `routeTree.gen.ts` הוא auto-generated — **לא לערוך ולא לקמט שינויי build שלו**. אם build מקומי שינה אותו והרס typecheck: `git checkout -- src/routeTree.gen.ts`. לבדוק typecheck **לפני** build, או בבידוד. לשקול יישור גרסת ה-plugin בעתיד.
