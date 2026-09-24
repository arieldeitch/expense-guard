<!--
Verbatim Run-3 prompt from Ariel, 2026-09-24. Saved per section 0 of the prompt itself.
Only the <pasted_content> wrapper tags were stripped; the body is unedited.
-->

# 01 — Outbound prompt (verbatim)

אתה עובד כעת על **Fit Log / Fitness App Recovery** של Ariel Deitch.

זוהי **ריצת ביצוע ארוכה, רציפה ואוטונומית**. המטרה היא לקחת את כל הפידבק האחרון מהשימוש האמיתי באפליקציה, לממש אותו end-to-end, לבצע רגרסיה מלאה, להכין build Android חדש ולהשאיר את הפרויקט במצב נקי, מתועד ומוכן לפיילוט נוסף — בלי לעצור בדרך כדי לשאול את Ariel שאלות שאפשר לפתור באמצעות הקוד, התיעוד, בדיקות או שיקול הנדסי סביר.

## 0. זהות הפרויקט והתחלה בטוחה

המאגר הצפוי והמאומת הוא:

`arieldeitch/expense-guard`

השם `expense-guard` הוא שם היסטורי מטעה; הקוד הוא אפליקציית **Fit Log**.

ה־HEAD המאומת של `main` לפני תחילת הריצה הוא:

`ed9f583e0f7ce8dfd6ef72bad62b50ebaa297c4e`

אל תניח שה־clone המקומי מעודכן.

לפני שינוי כלשהו:

1. בדוק:

   * `pwd`
   * `git remote -v`
   * `git status`
   * `git branch --show-current`
   * `git log -10 --oneline --decorate`
   * `git rev-parse HEAD`
   * `git rev-parse origin/main`
2. ודא שה־remote הוא אכן `arieldeitch/expense-guard`.
3. קרא `CLAUDE.md` וכל הוראת repository מקומית.
4. קרא לפחות:

   * `docs/AI_RUN_CONTEXT_LEDGER.yaml`
   * `docs/PROJECT_LAST_UPDATE_LEDGER.yaml`
   * `docs/ai/current-state.md`
   * `docs/ai/PROJECT_STATUS.md`
   * `docs/ai/OPEN_TASKS.md`
   * `docs/ai/SESSION_HANDOFF.md`
   * `docs/ai/CHANGELOG.md`
   * הדוח האחרון תחת `docs/ai-runs/`
   * ADRs ורשומות סיכון הנוגעים ל־Home, Running, Suunto, Supabase, Android ו־UX.
5. נסה לבצע את בדיקת ה־OS/Start Here לפי החוזה הקיים. אם מקור חיצוני אינו נגיש, רשום זאת והמשך מהמקורות הקנוניים בריפו. חוסר גישה ל־Drive/Control Tower אינו סיבה לעצור עבודת קוד.
6. אין להפעיל Docker.
7. אין למחוק או לדרוס עבודה מקומית קיימת. אם working tree אינו נקי, חקור ושמור את העבודה במקום בטוח במקום reset/clean.
8. אם `main` נקי וניתן לעדכון בטוח, בצע fetch ו־fast-forward בלבד. אין force.
9. עבוד בענף ייעודי חדש, למשל:

`feat/fitlog-pakalim-suunto-home-ux`

אם כבר קיים ענף מתאים ורלוונטי מהריצה הנוכחית, המשך בו במקום ליצור כפילות.

שמור את הפרומפט הזה בשלמותו ב־run capsule החדש כ־`01_OUTBOUND_PROMPT.md`.

---

# 1. מטרת העל

Ariel כבר משתמש באפליקציה בפועל. הפידבק הבא הגיע מתוך שימוש אמיתי ולכן הוא **דרישת מוצר לביצוע**, לא brainstorm.

בסיום הריצה אני רוצה:

* Suunto sync ברור ונוח להזנה.
* הזנת זמן בריצה שמבינה גם שניות בלבד.
* מודול "פק״לים בבית" מהיר מאוד לשימוש.
* שתי קבוצות קבועות: **פק״לים בוקר** ו־**פק״לים ערב**.
* עריכת דיווחים קיימים.
* בנק תרגילי בית טוב יותר, כולל דאמבלים וחבל.
* ניווט דאמבלים לפי קבוצת שרירים.
* איורים וקטוריים פשוטים שמסבירים תנועה וקבוצת שרירים.
* backend/data model שאינו מניח עוד משתמש יחיד ושניתן בעתיד לצרף משתמש נוסף בלי הסבה מסוכנת.
* אין צורך עדיין לחשוף UI של משתמש שני ואין ליצור חשבון לילד.
* כל הנתונים הקיימים של Ariel חייבים להישמר.
* בדיקות ורגרסיה מלאות.
* build Android חדש מהקוד החדש.

אל תבנה מחדש את האפליקציה. שמור על הארכיטקטורה הקיימת והרחב אותה באופן ממוקד.

---

# 2. סדר עדיפויות

בצע את העבודה בסדר הבא, אך אל תעצור בין השלבים:

1. baseline + שחזור הבאגים.
2. תיקוני parsing/input של Suunto וריצה.
3. תיקון מודל הפק״לים הקיים.
4. פק״לים בוקר/ערב כתבניות קבועות.
5. עריכת רשומות פק״לים.
6. הרחבת בנק תרגילי הבית.
7. ניווט דאמבלים לפי קבוצת שרירים.
8. שכבת איורים.
9. הכנת מודל הנתונים ל־multi-user.
10. רגרסיה מלאה.
11. QA מובייל.
12. Android build.
13. commits/push/PR/merge לפי כללי הריפו והבדיקות.
14. תיעוד ודיווח.

כאשר אפשר לבצע workstreams במקביל בלי לייצר conflicts, עשה זאת, אך שמור נקודות אינטגרציה ברורות.

---

# 3. Suunto Sync — זמן

## הבעיה

בשדה זמן של סנכרון Suunto לא ברור מה משמעות `42:15`.

Ariel אינו רוצה לנחש אם הנקודה/הפרדה היא ערך עשרוני או דקות/שניות.

## התנהגות נדרשת

הגדר פורמט חד־משמעי.

`42:15` = **42 דקות ו־15 שניות**.

לא לפרש `:15` כחלק עשרוני של דקה.

במקום המתאים הצג placeholder/label כגון:

`דקות:שניות`

או:

`mm:ss`

כאשר משך יכול לעבור שעה, תמוך בצורה עקבית גם ב־`h:mm:ss`, אך אל תשבור את `mm:ss`.

ב־UI העברי עדיף טקסט אנושי במקום שבו אין עומס.

בדוק את כל המקומות שבהם אותו parser/helper משמש כדי שלא יהיו שני חוזים שונים לזמן.

כתוב parser מרכזי אחד ככל שניתן.

בדיקות חובה לדוגמא:

* `42:15` → 2535 seconds
* `0:40` → 40 seconds
* `1:20` → 80 seconds
* גבולות `00`, `59`, מעבר שעה
* inputs לא חוקיים אינם נשמרים בשקט
* round-trip display → parse → display נשאר עקבי

אל תשנה ערכי היסטוריה קיימים.

---

# 4. Suunto Sync — מרחק עשרוני

## הבעיה

Ariel ניסה להזין:

`7.15`

ק"מ, והשדה לא אפשר לו להזין/לראות את הערך בצורה תקינה.

## התנהגות נדרשת

* השדה חייב לקבל `7.15`.
* השתמש ב־mobile numeric input שמתאים לערך עשרוני (`inputMode=decimal` או המקבילה הארכיטקטונית הקיימת).
* אל תמיר את הערך ל־integer בזמן typing.
* controlled input צריך לשמור string ביניים תקין בזמן ההקלדה.
* parse רק בנקודת validation/save המתאימה.
* תמוך בנקודה עשרונית.
* אם פשוט ובטוח, קבל גם פסיק והמר אותו לנקודה, אך הנקודה חייבת לעבוד בוודאות.
* אל תחתוך את הספרות האחרונות ב־UI.
* אל תעגל בצורה מפתיעה.
* שמור את יחידת הק"מ הקיימת.

בדיקות:

`7`, `7.1`, `7.15`, `0.5`, `10.00`, ומקרה invalid.

בצע QA אמיתי ב־viewport של טלפון עם מקלדת/input behavior ככל שסביבת הבדיקות מאפשרת.

---

# 5. ריצה — הזנת שניות ללא צורך ב־0:

## הבעיה

במסך אימון הריצה, כדי להזין 40 שניות Ariel נאלץ לכתוב:

`0:40`

אם הוא כותב:

`40`

הערך אינו מתקבל נכון.

## החוזה החדש

בשדות duration הרלוונטיים לריצה:

* `40` → 40 שניות.
* `0:40` → 40 שניות.
* `1:20` → 80 שניות.
* `10:00` → 600 שניות.

אין צורך לחייב colon כשמדובר רק בשניות.

אל תשנה שדות שבהם integer מייצג משהו אחר.

אתר את parser הזמן הקיים; אל תיצור parsing logic כפול בכל component.

הוסף unit tests ו־UI regression tests.

---

# 6. פק״לים בבית — מודל זמן שגוי

## הבעיה

כרגע דיווחי פק״לים מתנהגים כאילו אנחנו מודדים זמן.

Ariel רוצה בפק״לים בבית **כמויות/חזרות**, לא טיימר.

## נדרש

בזרימת פק״לים:

* המדד הראשי הוא quantity/reps.
* אין להציג timer כברירת מחדל.
* אין לסכם "משך ביצוע" כאילו זו מטרת התרגיל.
* אין להתחיל timer אוטומטי.
* גם קפיצה בחבל במסגרת הזאת יכולה להירשם ככמות קפיצות/סיבובים.
* שמור על אפשרות ארכיטקטונית לתרגיל מבוסס זמן אם המודל הכללי של האפליקציה דורש זאת בעתיד, אבל **פק״לים בוקר/ערב עצמם צריכים להיות count-first**.

אל תפגע במודול gym או בתרגילי hold קיימים שאינם חלק מה־flow הזה.

---

# 7. פק״לים — עריכת דיווח קיים

## הבעיה

אם Ariel טעה בכמות, כרגע קשה או בלתי אפשרי לתקן את הרשומה בלי לעשות הכול מחדש.

## נדרש

כל session/entry שנשמר חייב להיות בר־עריכה.

אפשר לערוך לפחות:

* שם הקבוצה/session כאשר רלוונטי.
* כמות לכל תרגיל.
* להוסיף תרגיל שלא דווח.
* להסיר תרגיל שנוסף בטעות.
* לשנות סדר, כאשר המודל הקיים תומך בכך באופן טבעי.

שמירה צריכה לעדכן את הרשומה הקיימת ולא ליצור duplicate.

לא לאבד timestamp/history/snapshot שלא צריך להשתנות.

לא ליצור רשומה חדשה בכל עריכה.

הוסף בדיקות ל־create → edit → reload → verify.

בדוק גם soft-delete/archive semantics קיימים.

---

# 8. באג שם האימון

## הבעיה

כאשר Ariel עושה סט של פק״לים בבית, האימון מקבל לפעמים את שם התרגיל הראשון/האחרון, כגון:

"שכיבות סמיכה"

או:

"כפיפות בטן"

זה לא רצוי.

## החוזה החדש

session של פק״לים הוא **קבוצה/אימון**, לא תרגיל בודד.

שם session לא ייגזר יותר אוטומטית משם התרגיל האחרון/הראשון.

ברירת המחדל תגיע מהתבנית:

* `פק״לים בוקר`
* `פק״לים ערב`

שם הקבוצה חייב להיות editable.

בעת יצירת session מתבנית שמור title snapshot מתאים, כדי ששינוי שם התבנית בעתיד לא ישכתב היסטוריה קיימת בלי כוונה.

תקן migration/normalization מקומי אם נדרש, אבל אל תשנה בכוח שמות היסטוריים בלי הוכחה.

---

# 9. שתי קבוצות קבועות: פק״לים בוקר / פק״לים ערב

זהו הכיוון המרכזי של ה־UX.

Ariel עושה בדרך כלל אותם תרגילים ולא רוצה ליצור כל פעם אימון מחדש.

## מסך הבית / Home

צריך להיות מסלול מהיר וברור לשתי קבוצות קבועות:

### פק״לים בוקר

### פק״לים ערב

אלו **templates קבועים**, לא session יחיד שחוזר ונדרס.

לחיצה על אחת מהן יוצרת/פותחת דיווח חדש לאותו זמן, עם רשימת התרגילים המוגדרת באותה תבנית.

בכל תבנית:

* שם editable.
* רשימת תרגילים.
* reorder.
* add.
* remove.
* quantity input מהיר.
* שמירה מהירה.
* אחרי שמירה ניתן לחזור ולערוך.

אל תדרוש מהמשתמש לעבור בכל פעם דרך wizard ארוך.

המטרה:

**Home → פק״לים בוקר/ערב → הזנת כמויות → שמירה**

בכמה שפחות taps.

## Seed / migration

אם כבר קיימים תרגילי פק״לים נפוצים אצל Ariel, השתמש בהם ליצירת default templates באופן שלא מוחק customization קיים.

אל תיצור duplicate template בכל startup.

צריך להיות seed idempotent.

אם למשתמש כבר יש templates דומים, כתוב migration/normalization זהיר ולא blind insert.

---

# 10. בנק תרגילי הבית

יש ליצור/להרחיב Exercise Bank לבית.

הבנק מכיל את התרגילים הקיימים + התוספות הבאות.

## משקל גוף

לפחות:

* שכיבות סמיכה ברוחב כתפיים / רגילות
* שכיבות סמיכה יהלום
* שכיבות סמיכה רחבות / כפול רוחב כתפיים
* כפיפות בטן רגילות

אל תיצור duplicates אם תרגילים אלו כבר קיימים בשם מעט שונה; בצע canonicalization סביר.

## דאמבלים / משקולות יד

הוסף category ברורה:

`דאמבלים`

בכניסה אליה לא מציגים list ענק שטוח.

שלב ראשון: בחירת קבוצת שרירים.

לפחות:

* יד קדמית / Biceps
* יד אחורית / Triceps
* כתפיים
* חזה
* גב

אם קיימת כבר taxonomy ל־legs או muscle groups נוספים, שמור עליה וניתן לכלול אותם, אבל אל תעמיס סתם.

## חבל

הוסף:

`קפיצה בחבל`

ב־flow של פק״לים היא quantity-first.

---

# 11. דאמבלים — ניווט לפי קבוצת שרירים

ה־UX צריך להיות:

`הוסף תרגיל`
→ `דאמבלים`
→ `בחר קבוצת שרירים`
→ רשימת תרגילים באותה קבוצה.

בכל קבוצת שרירים, סדר את התרגיל הנפוץ/פשוט ביותר ראשון.

ברירות מחדל טובות לבית:

### יד קדמית

ראשון:
`Dumbbell Curl / כפיפת מרפקים עם דאמבלים`

### כתפיים

ראשון:
`Dumbbell Shoulder Press / לחיצת כתפיים`

### יד אחורית

ראשון:
`Overhead Dumbbell Triceps Extension / פשיטת מרפק מעל הראש`

### חזה

מאחר שאין להניח שקיימת ספסל:
ראשון:
`Dumbbell Floor Press / לחיצת חזה בשכיבה על הרצפה`

### גב

ראשון:
`One-arm Dumbbell Row / חתירה ביד אחת`

השתמש בשמות עבריים ברורים ב־UI; English יכול להישמר כ־alias/metadata אם הארכיטקטורה תומכת.

אפשר להוסיף תרגילים נוספים שימושיים, אבל אל תהפוך את הריצה לפרויקט encyclopedic של מאות exercises.

Ariel צריך bank טוב וקל לניווט, לא ספריית Bodybuilding אינסופית.

---

# 12. איורי קבוצות שרירים

Ariel ביקש **איור**, לא צילום.

האיורים צריכים להיות חלק מהמוצר ולא image search חיצוני.

העדפה:

* SVG מקורי ופשוט.
* lightweight.
* עובד offline.
* מתאים ל־dark UI.
* ללא תלות בשרת תמונות.
* ללא assets מוגנים בזכויות יוצרים מצד שלישי.
* אין צורך באיור אנטומי מפורט.

## תפקיד האיור

ליד/בתוך exercise detail/card הצג body silhouette פשוט שבו:

* primary muscle מודגש בבירור.
* secondary muscle, אם מוצג, מודגש בעוצמה פחותה.
* הטקסט הוא עדיין מקור האמת; האיור עוזר להבין.

דוגמאות:

### שכיבות סמיכה רגילות / רוחב כתפיים

Primary:

* chest / pectorals
* triceps

Secondary:

* anterior deltoids
* core stabilization, אם מתאים למודל.

### Diamond push-up

דגש חזק יותר על:

* triceps

וגם:

* chest
* anterior deltoids

### Wide push-up

דגש:

* chest

Secondary:

* anterior deltoids
* triceps

### כפיפות בטן

דגש:

* rectus abdominis

הימנע מטענות רפואיות או biomechanical overprecision.

המטרה היא הכוונה ויזואלית שימושית.

---

# 13. איורי תנועה לפני / אחרי

בתרגילי דאמבלים ובעיקר בתרגילים הנפוצים, Ariel רוצה להבין את התנועה במבט.

הצג איור דו־מצבי פשוט:

`START → END`

למשל ב־curl:

* יד כמעט ישרה בתחילת התנועה.
* מרפק כפוף בסיום.
* סימון biceps.

ב־shoulder press:

* משקולות ליד גובה כתפיים.
* ידיים למעלה בסיום.

ב־triceps extension:

* משקולת מאחורי/מעל הראש.
* extension למעלה.

ב־floor press:

* מרפקים כפופים במצב תחתון.
* ידיים ישרות מעל החזה במצב עליון.

ב־row:

* זרוע מטה.
* משיכת המרפק לאחור.

האיור לא צריך להיות animation מורכב.

שתי תנוחות vector side-by-side או overlay ברור מספיקות.

אם מערכת ה־design הקיימת מתאימה, צור component reusable כגון:

* `MuscleMap`
* `ExerciseMovementIllustration`

אל תיצור SVG ענק ייחודי ומוכפל בכל component.

השתמש metadata exercise-driven:

* muscleGroup
* primaryMuscles
* secondaryMuscles
* movementIllustration key
* equipment
* category
* defaultMetric

כך אפשר להרחיב את הבנק בהמשך בלי hard-code מפוזר ב־UI.

---

# 14. UX של בחירת תרגיל

Ariel רוצה להגיע לתרגיל במהירות.

כאשר לוחצים "הוסף תרגיל":

מסך ראשון קומפקטי:

* משקל גוף
* דאמבלים
* חבל
* קטגוריות קיימות רלוונטיות

בדאמבלים:

בחר קבוצת שרירים.

אחר כך:

* התרגיל הנפוץ ראשון.
* יתר התרגילים אחריו.
* card קומפקטי.
* שם.
* muscle target.
* movement preview קטן, אם אינו מעמיס.
* tap אחד לבחירה.

אל תיצור navigation עם tabs צפופים ומבלבלים.

במבט ראשון צריך להיות snapshot קצר וברור; detail רק לאחר tap.

---

# 15. מודל נתונים — הכנה ל־Multi-user

Ariel שוקל בעתיד לשתף את האפליקציה עם משתמש נוסף.

כרגע:

**אין ליצור משתמש נוסף.
אין ליצור UX של family management.
אין ליצור parent/child controls.
אין להוסיף נתונים עבור אדם אחר.**

אבל אסור להמשיך לפתח מתוך הנחה שהמערכת תמיד single-user.

## עיקרון

כל מידע אישי חייב להיות ניתן לשיוך מפורש ל־user/owner:

* sessions
* runs
* home sessions
* morning/evening templates
* custom exercises
* preferences
* goals
* sync state
* future cloud records

System exercise catalog יכול להיות משותף.

User customizations חייבים להיות user-scoped.

## ראשית חקור

ה־Supabase authoritative project הידוע מהתיעוד הוא:

`fusrapommtdqwfglkmks`

אבל **אמת זאת שוב מתוך הקוד והתיעוד לפני כל פעולה**.

קרא את migrations, generated types, RLS, repository adapter ומצב Phase 1 הנוכחי.

אל תניח שכל הישויות כבר בענן.

לפי התיעוד הקיים, חלק גדול מה־home/running עדיין עשוי להיות local-first. שמור זאת אם זה המצב.

## מה לבצע עכשיו

מטרת הריצה היא **multi-user-ready**, לא "להפעיל משתמש שני".

בצע את המינימום הנכון ארכיטקטונית:

1. ודא שאין IDs/keys חדשים שמניחים Ariel כגלובלי יחיד.
2. כל entities חדשים/נוגעים שנוצרים במהלך הריצה צריכים contract של ownership.
3. הפרד system exercise definitions מ־user-specific templates/custom exercises.
4. אם repository interfaces דורשים הרחבה כדי להעביר user identity בעתיד, בצע אותה בצורה backward compatible.
5. בדוק storage keys / indexes / selectors כך שלא יהפכו בעתיד לחסם קשה.
6. Cloud tables קיימים שכבר משתמשים ב־`user_id` ו־`auth.uid()` — אל תחליש אותם.
7. אל תוסיף policy permissive כדי לגרום לבדיקה לעבור.
8. אל תשתמש ב־service-role בצד client.
9. אין למחוק RLS.
10. אין להעביר נתוני Ariel לענן באופן אוטומטי כחלק מהריצה.
11. אין להמציא user id עבור Ariel ולהטמיע אותו כ־magic constant.

אם שינוי schema בטוח והפיך באמת נדרש כדי לתקן ownership שכבר נמצא בענן, תכנן migration additive ולא destructive, בדוק אותה, ותפעל בהתאם למדיניות הקיימת של הריפו.

אין לבצע destructive migration או מחיקת נתוני production.

אם נתיב ההרשאה לפרודקשן אינו זמין, **אל תעצור את כל הריצה**:

* כתוב את migration המוכנה.
* בדוק אותה ככל שאפשר בסביבה מורשית.
* השלם את כל שאר העבודה.
* דווח בסוף שה־apply חסום.

---

# 16. שמירה על נתוני Ariel

זהו constraint קשיח.

אסור:

* למחוק localStorage אמיתי.
* לבצע reset ל־DB.
* לנקות production.
* לשנות IDs היסטוריים ללא migration.
* להפוך edit ל־delete+recreate אם הדבר פוגע בהיסטוריה.
* להעלות נתונים אישיים אמיתיים לענן כחלק מבדיקה.
* לדרוס templates קיימים ב־seed.

לפני migrations או data transformations:

* הבן את data model.
* כתוב tests.
* ודא backward compatibility.
* שמור backup/export compatibility.

אם פורמט backup צריך להתרחב בגלל השדות החדשים, בצע versioning/migration מסודר וודא round-trip.

---

# 17. בדיקות חובה לכל הפיצ'רים

אל תסתפק ב־"הקוד נראה נכון".

צור/עדכן בדיקות סביב:

## Suunto

* time parsing
* distance decimals
* persistence
* reload
* edit

## Running

* bare seconds
* mm:ss
* invalid values
* round-trip

## Pakalim

* Morning template seed is idempotent.
* Evening template seed is idempotent.
* custom template title persists.
* session title does not become exercise name.
* quantity entry.
* save.
* edit existing value.
* add exercise after save.
* remove incorrect exercise.
* reopen after refresh.
* history displays correct title and values.
* duplicate save protection.

## Exercise bank

* category filters.
* dumbbell muscle-group navigation.
* expected default-first exercise.
* no duplicate catalog entries.
* jump rope available.

## Illustrations

בדוק לפחות:

* asset/component renders.
* no missing reference.
* no overflow.
* accessibility text/aria where appropriate.
* app remains usable if decorative illustration is hidden.

## Multi-user readiness

ברמת unit/contract:

* user-owned entities cannot accidentally be mixed in repository API.
* system catalog remains shared.
* custom user data has ownership contract.
* no global mutable singleton data store that combines users.
* existing records remain readable.

אם authenticated two-user backend test כבר אפשרי דרך המנגנון המורשה הקיים, בצע אותו עם disposable test users בלבד.

אם email confirmation או הרשאות חוסמות אותו:

* אל תשנה auth production settings ללא צורך.
* אל תיתקע.
* תעד BLOCKED והמשך.

---

# 18. UX / Mobile QA

זה מוצר mobile-first.

בצע visual/interaction QA לפחות ב־390×844.

בדוק:

* RTL.
* keyboard overlap.
* decimal keyboard assumptions.
* fields not clipped.
* buttons ≥ reasonable touch target לפי design system.
* morning/evening cards easy to reach.
* editing session possible.
* exercise selection not scroll-chaotic.
* dumbbell category navigation.
* illustration does not dominate the card.
* no horizontal overflow.
* Android back behavior.
* refresh/deep-link routes.
* empty states.
* existing Running/Gym/Home navigation unchanged unless intentionally improved.

אם Pixel emulator זמין באופן בטוח, בצע QA גם שם.

אמולטור אינו תחליף לקבלה פיזית, אבל כן ראיה חשובה.

אין לטעון שנבדק על הטלפון של Ariel.

---

# 19. רגרסיה מלאה

הרץ את הפקודות הקנוניות מה־repo, לא פקודות מומצאות.

לפי הפרויקט בפועל יש סביבת Bun/TanStack/Vite; אמת scripts לפני שימוש.

לכל הפחות, בהתאם למה שקיים:

* frozen install, אם נדרש.
* typecheck.
* unit tests.
* router/UI tests.
* build.
* lint לפי baseline ומדיניות הריפו.
* `git diff --check`.
* secret scan קיימת.
* backup/import tests.
* Android build gates.

אל "תתקן" CRLF baseline ישן או formatting churn שאינו קשור למשימה.

אל commit route tree ordering-only drift אם התיעוד מציין שהוא generated-tool difference בלבד.

כאשר test נכשל:

* אבחן.
* תקן root cause.
* הרץ focused test.
* אחר כך regression suite.
* אל תדלג על test כדי להגיע לירוק.

---

# 20. Android APK

לאחר שה־feature branch ירוק:

1. ודא שגרסת Android/build identity מתעדכנת לפי מדיניות הפרויקט.
2. שמור package:
   `com.arieldeitch.fitlog`
3. אל תשבור את stable debug signing/cache שכבר הוגדר ב־GitHub Actions.
4. אל תחליף keystore ללא צורך.
5. בנה Android APK דרך הנתיב הקנוני של הפרויקט.
6. אם workflow קיים הוא המקור הקנוני, הפעל/אפשר לו לבנות מה־commit הנכון.
7. בדוק artifact:

   * filename
   * versionName
   * versionCode
   * commit SHA
   * package
   * file size
   * SHA-256
8. אם ניתן, התקן באמולטור ובדוק build identity.
9. ודא שה־APK החדש ניתן להתקנה מעל ה־APK הקנוני הקודם, ככל שהחתימה נשמרת.

אל תסמן physical-device acceptance כ־PASS.

---

# 21. Git — עבודה אוטונומית

אין צורך לבקש מ־Ariel אישור בכל commit.

עבוד ב־commits הגיוניים, למשל:

1. fix input parsing
2. pakalim data/template model
3. exercise bank + navigation
4. illustrations
5. multi-user readiness
6. tests/QA/docs

החלוקה בפועל לפי הקוד.

בסיום:

* working tree clean.
* push branch.
* פתח PR מול `main`.
* כתוב PR description אמיתי עם scope, migrations, tests, risks ו־screens/QA evidence אם קיים.

אם כל תנאי המיזוג הקיימים בריפו עברו ואין blocker ממשי, מותר להשלים merge בהתאם להרשאה הקיימת והכללים של הריפו.

אין:

* force push.
* bypass ל־branch protection.
* מחיקת היסטוריה.
* שינוי auth/security כדי "לעבור" test.

לאחר merge, אמת את `main` עצמו והרץ את ה־gates הנדרשים אם ה־workflow לא עושה זאת אוטומטית.

---

# 22. Lovable

פרויקט Lovable הידוע היסטורית הוא:

`2b79da21-331d-4a52-bd0f-e49f64b4e79d`

אבל אל תניח שהסשן המחובר רואה אותו.

אם יש גישה מורשית:

* אמת את הפרויקט.
* Publish רק אם זה תואם למדיניות והעבודה מוזגה כנדרש.
* אמת routes חיוניים אחרי publish.

אם מתקבלת שוב `project_not_found` או חסם גישה:

* אל תבזבז את הריצה על ניסיונות חוזרים.
* רשום את החסם.
* המשך ל־APK ולכל שאר העבודה.
* אל תטען שה־live עודכן.

---

# 23. תיעוד

פתח run capsule חדש:

`docs/ai-runs/2026-09-24/<run-id>/`

לפי הסכמה הקיימת.

שמור:

* manifest
* הפרומפט המלא הזה
* input sources
* feedback של Ariel
* review/synthesis
* accepted decisions
* implementation evidence
* end-of-run report
* handoff

עדכן:

* `docs/AI_RUN_CONTEXT_LEDGER.yaml`
* `docs/PROJECT_LAST_UPDATE_LEDGER.yaml`
* current-state/status
* changelog
* risks
* ADR אם התקבלה החלטה ארכיטקטונית אמיתית
* Android docs אם build flow השתנה
* QA evidence

ה־feedback המקורי שצריך להישמר בתיעוד הוא, בתמצית:

1. Suunto time format ambiguous.
2. Suunto decimal distance broken.
3. run duration should accept bare seconds.
4. Pakalim should be quantity-based.
5. Existing Pakalim reports must be editable.
6. Session title must not inherit exercise name.
7. Persistent morning/evening Pakalim templates.
8. Editable template names/list/order.
9. Dumbbells + jump rope in home exercise bank.
10. Dumbbell navigation by muscle group.
11. Common exercise first.
12. Muscle target illustrations.
13. START/END movement illustrations.
14. Backend/data model must be ready for more than one user, without exposing second-user UX yet.

---

# 24. Control Tower / Chief of Staff

בתחילת הריצה, באבן דרך משמעותית ובסוף:

פעל לפי מנגנון הדיווח הקיים בריפו וב־OS.

אל תמציא endpoint.

אם bridge מאומת קיים:

* שלח.
* שמור receipt/ack.

אם אינו קיים/אינו נגיש:

* צור/עדכן outbox לפי החוזה.
* `pending` נשאר pending.
* prepared אינו sent.
* sent אינו acknowledged.

הדיווח צריך לכלול מצב מוצר אמיתי, לא רק "tests green".

אל תשלח פרטי אימונים אישיים שאינם נחוצים.

---

# 25. כלל אי־עצירה

זוהי ריצה שנועדה לנצל טרמינל פנוי לאורך זמן.

**אל תעצור אחרי analysis או אחרי כתיבת TODO.**

לאחר כל גילוי, המשך לביצוע הבא.

אל תשאל את Ariel:

* איזה שם branch לבחור.
* האם לכתוב tests.
* האם לתקן bug ברור.
* האם להוסיף migration additive נדרשת שנכללת במפורש בדרישה הזאת.
* האם לבצע commit/push של העבודה שהושלמה.
* האם להמשיך לשלב הבא שכבר מוגדר כאן.

במקום זאת קבל החלטה הנדסית סבירה, תעד אותה והמשך.

עצור רק אם הפעולה הבאה עצמה דורשת אחד מאלה:

* secret שאין לך דרך מורשית להשיג.
* שינוי בלתי הפיך בנתוני production.
* שינוי הרשאות/אבטחה משמעותי שאינו מתחייב מהדרישה.
* תשלום.
* מחיקת נתונים אמיתיים.
* יעד repository/backend שאינו ניתן לזיהוי בביטחון.

גם במקרה כזה:

**אל תסיים את כל הריצה.**

סמן את ה־workstream הספציפי BLOCKED והמשך בכל workstream אחר.

---

# 26. Definition of Done

הריצה נחשבת מלאה רק כאשר, ככל שהסביבה מאפשרת:

* Suunto time UX תוקן.
* Suunto decimal distance תוקן.
* running bare-seconds תוקן.
* Pakalim quantity-only flow פעיל.
* edit קיים.
* morning/evening templates קיימים.
* title bug סגור.
* templates editable.
* exercise bank מורחב.
* dumbbell categories פעילות.
* common-first ordering פעיל.
* muscle illustrations פעילות.
* movement illustrations פעילות.
* ownership/multi-user readiness הוטמעה בצורה שאינה מסכנת מידע קיים.
* tests חדשים קיימים.
* regressions ירוקים.
* mobile QA בוצע.
* Android build נוצר.
* artifact מתועד.
* branch pushed.
* PR נוצר/מוזג אם gates מאפשרים.
* main אומת לאחר merge.
* documentation עודכנה.
* Control Tower/Chief of Staff קיבלו דיווח או outbox אמיתי נרשם.
* working tree נקי.

אם רכיב כלשהו לא בוצע, יש לציין סיבה ספציפית וראיה. אין לקרוא לריצה GREEN אם feature מרכזי נשאר לא ממומש.

---

# 27. דוח סיום שאתה מחזיר ל־Ariel

בסיום, אל תחזיר narrative ארוך ולא מסודר.

החזר בעברית ובפורמט הבא:

STATUS: GREEN / YELLOW / RED

USER OUTCOME:
מה Ariel יכול לעשות עכשיו באפליקציה בפועל.

IMPLEMENTED:
פיצ'רים ותיקונים שבוצעו.

SUUNTO:
מה תוקן בזמן ובמרחק.

PAKALIM:
מצב בוקר/ערב, עריכה, quantities, bank, dumbbells, rope.

VISUAL GUIDANCE:
איורי שרירים ותנועה — מה קיים ובאילו תרגילים.

MULTI-USER READINESS:
מה שונה בפועל ומה במכוון עדיין לא נחשף.

DATA SAFETY:
אילו migrations/transformations בוצעו ומה הראיה שנתוני Ariel נשמרו.

VERIFIED:
מספר בדיקות, typecheck, build, lint, mobile QA, emulator, backend tests.

ANDROID:
versionName
versionCode
commit
artifact
SHA-256
workflow/run
האם נבדק באמולטור
האם נבדק במכשיר פיזי

GIT:
branch
commits
PR
merge commit
main HEAD

LIVE:
Lovable publish state והוכחה, או blocker מדויק.

OPEN ISSUES:
רק דברים שבאמת נשארו.

CONTROL TOWER:
acknowledged / pending / failed + receipt/evidence.

CHIEF OF STAFF:
acknowledged / pending / failed + receipt/evidence.

ARIEL ACTION:
אם לא נדרשת פעולה: "לא נדרשת פעולה כרגע."
אם נדרשת קבלת מכשיר בלבד: כתוב בדיוק מה לבדוק בטלפון, בקיצור.

NEXT:
הצעד ההנדסי הבא היחיד שמומלץ לאחר הפיילוט.

RUN ENDED:
ISO-8601 מלא כולל timezone.

REPORT WRITTEN:
ISO-8601 מלא כולל timezone.

PROJECT LAST UPDATE:
ISO-8601 מלא כולל timezone.

בסוף ודא שהדוח נשמר גם ב־run capsule ושכל ה־commits הדרושים נדחפו לפני שאתה מסיים את הסשן.
</pasted_content id="4114">
