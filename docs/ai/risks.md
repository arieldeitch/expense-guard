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
