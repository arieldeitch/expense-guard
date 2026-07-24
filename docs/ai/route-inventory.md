# Route Inventory — `src/routes/`

עודכן: 2026-07-24 (Product Alignment Audit). מקור: קריאה ישירה של כל קובצי `src/routes/` + `src/routeTree.gen.ts` + `src/components/shell/Nav.tsx`.

## סיכום

- **41 route modules** (`.tsx`) + `__root.tsx` = **42 קבצים** ב־`src/routes/` (מאומת מול `routeTree.gen.ts` → `FileRoutesById` מונה 41 route IDs + `__root__`). קובץ נוסף `src/routes/README.md` אינו route.
- הניווט (`Nav.tsx`) חושף **5 טאבים** בלבד: `/` (ראשי), `/running`, `/gym`, `/home`, `/more`. כל השאר נגישים דרך `<Link>` פנימי (deep-link) או orphan.
- **הכול מחווט לרפוזיטוריז אמיתיים** (localStorage-backed mock repo, `activeRepoKind === "mock"`). אין מסכי דמה ריקים.
- **38/41** modules RELEVANT ונגישים בפועל. נקודת ההחלטה היחידה: משטח ה־**goals** (routes 37–39) — ממומש ובדוק אך מנותק מהניווט וסותר את עקרון "יעדים בתוך התחום".

## מקרא פעולות

`KEEP` · `KEEP_AND_ADAPT` · `REUSE_INFRASTRUCTURE` · `DEPRECATE_LATER` · `ARCHIVE_AFTER_MIGRATION` · `REQUIRES_PRODUCT_DECISION`

## טבלת Routes

| # | Route | קובץ | מטרה | תחום | ניווט | Repos/hooks | ישויות | מצב | רלוונטיות | Tests | סיכון הסרה | פעולה |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/` | `index.tsx` | Launchpad: 3 אריחי תחום + redirect לפי העדפת נחיתה | shared | ✅ nav | `use-domain-summary`, `preferences` | DomainSummary | עובד | RELEVANT | לא | גבוה | KEEP |
| 2 | `/running` | `running.tsx` | בית ריצה: אגרגט חודשי, ריצה אחרונה, טיוטות | running | ✅ nav | `runs`, `catalog` | Run, RunningRoute, Location | עובד | RELEVANT | calc | גבוה | KEEP |
| 3 | `/running/new` | `running.new.tsx` | בורר סוג ריצה (חוץ/הליכון) | running | deep | `runs` | — | עובד | RELEVANT | לא | נמוך | KEEP |
| 4 | `/running/new/$type` | `running.new.$type.tsx` | טופס ריצה חדשה לפי סוג | running | deep | `runs`, `RunForm` | Run (draft) | עובד | RELEVANT | לא | נמוך | KEEP |
| 5 | `/running/$id` | `running.$id.tsx` | פרטי ריצה: מדדים, מקטעים, השוואת Suunto, הליכון | running | deep | `runs`, `catalog`, `suunto` | Run, Segment, SuuntoSnapshot, Treadmill | עובד | RELEVANT | suunto | גבוה | KEEP |
| 6 | `/running/$id/edit` | `running.$id.edit.tsx` | עריכת ריצה שמורה | running | deep | `runs`, `RunForm` | Run | עובד | RELEVANT | לא | נמוך | KEEP |
| 7 | `/running/history` | `running.history.tsx` | היסטוריית ריצות + פילטרים + מיון (Sheet) | running | deep | `runs`, `catalog` | Run, Location, RunningRoute | עובד | RELEVANT | לא | בינוני | KEEP |
| 8 | `/running/routes` | `running.routes.tsx` | ניהול מסלולים קבועים (CRUD sheet) | running | deep | `runs`, `catalog`, `CountryPicker` | RunningRoute | עובד | RELEVANT | לא | בינוני | KEEP |
| 9 | `/gym` | `gym.tsx` | בית חדר כושר: אימון פעיל, סיכום, תבניות, יעד | gym | ✅ nav | `use-domain-summary`, `templates`, `sessions`, `selectors` | Session, Template, Goal | עובד | RELEVANT | לא | גבוה | KEEP |
| 10 | `/gym/new` | `gym.new.tsx` | התחלת אימון: ריק / מתבנית / שכפול | gym | deep | `templates`, `sessions` | Session, Template | עובד | RELEVANT | repo | בינוני | KEEP |
| 11 | `/gym/history` | `gym.history.tsx` | היסטוריית כוח + פילטרים + קישור השוואה | gym | deep | `analytics`, `sessions` | Session | עובד | RELEVANT | analytics | בינוני | KEEP |
| 12 | `/gym/history/$id` | `gym.history.$id.tsx` | פירוט אימון היסטורי: סטים, שיאים, איכות | gym | deep | `sessions`, `catalog`, `exercises`, `analytics` | Session, SessionExercise, Set, Records | עובד | RELEVANT | analytics | גבוה | KEEP |
| 13 | `/gym/compare` | `gym.compare.tsx` | השוואת שני אימונים דומים (search params a/b) | gym | deep | `sessions`, `analytics` | Session comparison | עובד | RELEVANT | analytics | בינוני | KEEP |
| 14 | `/sessions/$id` | `sessions.$id.tsx` | **מסך אימון כוח פעיל** (autosave, סופרסטים, טיימר מנוחה, החלפה) | gym | deep | `sessions`, `catalog` | Session, Block, SessionExercise, Set | עובד | RELEVANT | calc | גבוה | KEEP |
| 15 | `/sessions/$id/summary` | `sessions.$id.summary.tsx` | סיכום עובדתי אחרי אימון + שיאים + איכות | gym | deep | `sessions`, `analytics`, `catalog` | Session, Records, Quality | עובד | RELEVANT | analytics | בינוני | KEEP |
| 16 | `/templates` | `templates.tsx` | רשימת תבניות כוח (פעיל/ארכיון/סל) | gym | deep | `templates` | Template | עובד | RELEVANT | repo | בינוני | KEEP |
| 17 | `/templates/$id` | `templates.$id.tsx` | סקירת תבנית + התחלה | gym | deep | `templates`, `sessions`, `catalog`, `exercises` | Template, Block, TemplateExercise | עובד | RELEVANT | repo | בינוני | KEEP |
| 18 | `/templates/$id/edit` | `templates.$id.edit.tsx` | עורך תבנית (בלוקים, סופרסטים, autosave, גרסאות) | gym | deep | `templates`, `catalog` | Template, Block, TemplateExercise, Version | עובד | RELEVANT | repo | גבוה | KEEP |
| 19 | `/templates/$id/history` | `templates.$id.history.tsx` | snapshots של גרסאות תבנית | gym | deep | `templates` | TemplateVersion | עובד | RELEVANT | repo | נמוך | KEEP |
| 20 | `/home` | `home.tsx` | נחיתת בית: דיווח מהיר, מועדפים, אחרונים, טיוטות | home | ✅ nav | `home`, `exercises` | HomeSession, Exercise, HomeTemplate | עובד | RELEVANT | home | גבוה | KEEP |
| 21 | `/home/new` | `home.new.tsx` | redirect → `/home/quick` (תאימות לאחור) | home | deep | — | — | redirect | RELEVANT | לא | נמוך | KEEP |
| 22 | `/home/quick` | `home.quick.tsx` | בורר תרגיל לדיווח מהיר (חיפוש/מועדף/אחרון) | home | deep | `exercises`, `home` | Exercise, HomeSession | עובד | RELEVANT | home | בינוני | KEEP |
| 23 | `/home/quick/$exerciseId` | `home.quick.$exerciseId.tsx` | יוצר סשן מהיר, redirect לסשן | home | deep | `home` | HomeSession | עובד | RELEVANT | לא | נמוך | KEEP |
| 24 | `/home/sessions/$id` | `home.sessions.$id.tsx` | **אימון בית פעיל** (סטים גמישים, החלפה, ביצוע קודם) | home | deep | `home`, `exercises` | HomeSession, Entry, HomeSet | עובד | RELEVANT | home | גבוה | KEEP |
| 25 | `/home/sessions/$id/summary` | `home.sessions.$id.summary.tsx` | סיכום עובדתי אימון בית + שיאים | home | deep | `home` | HomeSession, Records, Quality | עובד | RELEVANT | home | בינוני | KEEP |
| 26 | `/home/history` | `home.history.tsx` | היסטוריית אימוני בית + צ'יפים | home | deep | `home` | HomeSession | עובד | RELEVANT | home | בינוני | KEEP |
| 27 | `/home/history/$id` | `home.history.$id.tsx` | redirect → `/home/sessions/$id/summary` | home | deep | — | — | redirect | RELEVANT | לא | נמוך | KEEP |
| 28 | `/home/templates` | `home.templates.tsx` | רשימת תבניות בית | home | deep | `home` | HomeTemplate | עובד | RELEVANT | home | בינוני | KEEP |
| 29 | `/home/templates/$id` | `home.templates.$id.tsx` | פרטי תבנית בית + התחלה | home | deep | `home`, `exercises` | HomeTemplate, Entry | עובד | RELEVANT | home | נמוך | KEEP |
| 30 | `/home/templates/$id/edit` | `home.templates.$id.edit.tsx` | עורך תבנית בית (סדר, סטים/חזרות/מנוחה) | home | deep | `home`, `exercises` | HomeTemplate, Entry | עובד | RELEVANT | home | בינוני | KEEP |
| 31 | `/exercises` | `exercises.tsx` | ספריית תרגילים (חיפוש, פילטרים, CRUD) | shared | deep | `exercises`, `catalog` | Exercise, MuscleGroup, Equipment | עובד | RELEVANT | exercises | גבוה | KEEP |
| 32 | `/exercises/$id` | `exercises.$id.tsx` | פרטי תרגיל: מפת שריר, ציוד, חלופות, היסטוריה | shared | deep | `exercises`, `catalog`, `analytics` | Exercise, Media, Variations | עובד | RELEVANT | exercises | גבוה | KEEP |
| 33 | `/exercises/$id/history` | `exercises.$id.history.tsx` | היסטוריית ביצוע לתרגיל יחיד | shared | deep | `exercises`, `analytics` | Exercise history | עובד | RELEVANT | yes | נמוך | KEEP |
| 34 | `/locations` | `locations.tsx` | רשימת מקומות אימון (CRUD) | catalog | deep | `catalog` | Location | עובד | RELEVANT | לא | בינוני | KEEP |
| 35 | `/locations/$id` | `locations.$id.tsx` | פרטי מקום: טאבי ציוד + הליכונים | catalog | deep | `catalog` | Location, Equipment, Treadmill | עובד | RELEVANT | לא | בינוני | KEEP |
| 36 | `/treadmills/$id` | `treadmills.$id.tsx` | כיול הליכון מול Suunto (חריגים, פקטור) | running | deep | `catalog`, `runs`, `suunto` | Treadmill, Calibration, Run | עובד | RELEVANT | suunto | בינוני | KEEP |
| 37 | `/goals` | `goals.tsx` | רשימת יעדים גלובלית + יצירה (פילטר תחום) | goals | **orphan** | `goals` | Goal | עובד | PARTIALLY | goals | בינוני | **REQUIRES_PRODUCT_DECISION** |
| 38 | `/goals/$id` | `goals.$id.tsx` | פרטי יעד: התקדמות, snapshots, גרסאות, מחזור חיים | goals | deep (מ־`/goals`) | `goals` | Goal, Snapshot, Version | עובד | PARTIALLY | goals | בינוני | **REQUIRES_PRODUCT_DECISION** |
| 39 | `/goals/new` | `goals.new.tsx` | redirect → `/goals?domain=` | goals | orphan | — | — | redirect | PARTIALLY | לא | נמוך | **REQUIRES_PRODUCT_DECISION** |
| 40 | `/more` | `more.tsx` | מרכז הגדרות/קטלוג: העדפת נחיתה, מקור נתונים, קישורי קטלוג, אריחי "בקרוב" | settings | ✅ nav | `use-preferences`, `repo`, `catalog`, `runs`, `exercises`, `templates` | Trash counts, prefs | עובד | RELEVANT | prefs | גבוה | KEEP |
| 41 | `/trash` | `trash.tsx` | סל מיחזור (שחזור locations/treadmills/equipment/runs/exercises/templates) | settings | deep | `catalog`, `runs`, `exercises`, `templates` | ישויות soft-deleted | עובד | RELEVANT | לא | בינוני | KEEP |
| — | (root) | `__root.tsx` | מעטפת: `<html dir=rtl>`, QueryClientProvider, 404 + error boundaries, Lovable error reporting | shell | n/a | `react-query`, `lovable-error-reporting` | — | עובד | RELEVANT | לא | גבוה | KEEP |

## ממצאים מיוחדים

- **`/search` / חיפוש חוצה-מודולים:** **לא קיים** כ־route. חיפוש קיים רק כסינון מקומי בתוך מסכים (`/exercises`, `/home/quick`, `/locations`, `/running/history`). טענת דוח Lovable על מודול search ייעודי — **לא מאומתת**.
- **`/design-system`:** **לא קיים** route. אין מסך storybook/design-system רשום ב־route tree.
- **QuickAddSheet ל־6 ישויות:** **לא קיים**. אין sheet אחיד חוצה-תחומים. הזרימה היחידה מסוג "מהיר" היא דיווח מהיר ביתי (`/home/quick`) — תרגיל בודד, בתוך היקף. יצירת ישויות אחרות דרך sheets ייעודיים לכל תחום (`LocationForm`, `EquipmentForm`, `TreadmillForm`, `ExerciseForm`, `RunForm`).
- **קוד legacy (people/peopleDirectory/transport/roles/PIN/coach/clients/team):** **לא נמצא** בכל `src`. חיפוש case-insensitive החזיר רק false positives: `MapPin` (אייקון), `input-otp.tsx` (primitive shadcn לא בשימוש). אין scaffolding של CRM/מאמנים/רב-משתמש. עקבי עם single-user.
- **Redirect stubs (תאימות לאחור):** `/home/new` → `/home/quick`; `/home/history/$id` → summary; `/goals/new` → `/goals`. מכוונים ובלתי מזיקים.
- **הערת goals:** הרכיב היחיד שמקשר ל־`/goals*` הוא `src/components/goals/DomainPrimaryGoalTile.tsx`, ו**הוא לא מיובא/מוצג בשום מקום**. `/gym` מציג אריח יעד פעיל אך **לא** מקשר ל־`/goals`. לכן routes 37–39 הם orphan/URL-only. מנוע ה־goals (`lib/goals`) בנוי ובדוק במלואו, אך משטח ה־UI אינו מחובר לניווט וסותר את "אין עמוד יעדים גלובלי". ראה `open-tasks.md` → Human Decisions Required.
