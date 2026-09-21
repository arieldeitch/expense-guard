# Fit Log ב-Android — APK, build משתחזר ומעבר נתונים (ADR-0043)

עודכן: 2026-09-21 (Claude Code). המקור המחייב לארכיטקטורה: `decisions.md` ADR-0043.

## מה זה
אותה אפליקציית Web (React + TanStack Start + Vite) ארוזה ב-**Capacitor 8** כ-WebView מקומי. נכסי ה-Web נמצאים **בתוך** ה-APK (`android/app/src/main/assets/public`), כך שהאפליקציה נפתחת בלי רשת ובלי תלות ב-Lovable. `src/` הוא מקור האמת היחיד; רק האריזה שונה.

| | Web (Lovable) | Android (APK) |
|---|---|---|
| build | `bun run build` (SSR, nitro, cloudflare) | `bun run build:android:web` (SPA shell, `nitro: false`) → `dist-android/client` |
| origin של localStorage | `https://fitlog-workout.lovable.app` | `https://localhost` (WebView של האפליקציה) |
| זהות | — | `com.arieldeitch.fitlog` · שם: **Fit Log** |
| גרסה | `package.json` `version` | `versionName` = אותו ערך; `versionCode` = major·10000+minor·100+patch (1.1.0 → 10100) |
| commit | `VITE_GIT_SHA` (עוד → אודות) | אותו דבר + `@string/build_commit` |
| הרשאות | — | **`INTERNET` בלבד** |

## פקודות
```
bun run build:android:web        # SPA shell → dist-android/client
bun run android:sync             # cap sync android (מעתיק נכסים + plugins)
bun run android:apk              # הכול יחד + gradlew assembleDebug + שם קובץ + SHA-256
bun run android:apk:release      # כנ"ל, דורש FITLOG_KEYSTORE_PATH/PASSWORD, FITLOG_KEY_ALIAS/PASSWORD
bun run android:assets           # מייצר אייקון + splash מ-SVG אחד (scripts/android-assets.mjs; dev בלבד)
```
דרישות מקומיות: `JAVA_HOME` → JDK **21** (Temurin), `ANDROID_HOME` → SDK עם `platforms;android-36` + `build-tools;36.0.0`, `android/local.properties` עם `sdk.dir` (לא מחויב). הסקריפט נכשל מיד אם אחד מהם חסר.

תוצר: `android/app/build/outputs/fitlog/fitlog-<version>-<versionCode>-<commit>-<variant>.apk` + `.sha256` + `fitlog-apk.json` (לא מחויבים).

## CI — `.github/workflows/android-apk.yml`
רץ על push ל-`main` (למעט docs) ובאופן ידני (`workflow_dispatch`, `variant=debug|release`). Bun 1.4.2 · Temurin 21 · SDK 36 · Gradle 8.14.3 (wrapper מחויב) · AGP 8.13.0. מעלה artifact `fitlog-apk-<variant>-<sha>` (APK + SHA-256 + JSON) ל-90 יום ומדפיס summary. **release** נבנה רק אם קיימים ה-secrets `FITLOG_KEYSTORE_BASE64`, `FITLOG_KEYSTORE_PASSWORD`, `FITLOG_KEY_ALIAS`, `FITLOG_KEY_PASSWORD`; אחרת נכשל במפורש. אין keystore בריפו (`*.jks`/`*.keystore` ב-.gitignore).

## חתימה
- **debug** — נחתם ב-debug keystore הסטנדרטי של ה-SDK: מתאים להתקנה ידנית (sideload) ולשימוש פנימי. **לא** מתאים ל-Google Play. שדרוג מגרסה ל-גרסה עובד כל עוד אותו keystore (כל מכונה/CI עם debug key שונה → יש להסיר ולהתקין מחדש; הנתונים אז נמחקים — לכן גיבוי לפני).
- **release** — רק עם keystore מאושר דרך secrets. פרסום ב-Play Store אינו חלק מהריצה ודורש אישור נפרד.

## התנהגות Android
- **Back:** `@capacitor/app` — אם ל-WebView יש היסטוריה → חזרה בתוך האפליקציה; במסך הראשון → מזעור (לא יציאה חדה). `src/lib/native.ts`.
- **מקלדת:** `windowSoftInputMode="adjustResize"` — הטופס מתכווץ, כפתור "שמור וסיים" נשאר נגיש.
- **Status/Navigation bar:** צבע הרקע של האפליקציה (`colors.xml` = טוקני `styles.css`); edge-to-edge עם `adjustMarginsForEdgeToEdge: "force"`.
- **RTL:** `supportsRtl` + `dir="rtl"` בשורש.
- **קישורים:** פנימיים נשארים ב-WebView; חיצוניים (`https://…` שאינו `localhost`) נפתחים בדפדפן המערכת (ברירת המחדל של Capacitor).
- **גיבוי:** "הורד גיבוי" כותב ל-cache הפרטי ופותח את **גיליון השיתוף** (Drive/Files/WhatsApp); "בחר קובץ גיבוי" משתמש בבורר הקבצים של המערכת. ל-WebView אין מנהל הורדות — לכן Share.
- **Offline:** כל הנכסים מקומיים; הפונט Heebo נטען מ-Google Fonts כשיש רשת, אחרת פונט המערכת. אין מסך "אין רשת" כי שום פעולה לא דורשת רשת.

## מעבר נתונים Web → APK (חובה לקרוא לפני ההתקנה הראשונה)
**עובדה:** ה-APK מקבל localStorage **ריק**. הנתונים של האתר לא עוברים אוטומטית ולא ניתן להעבירם בלי הרשאות חריגות — לכן המסלול הוא Export/Restore המפורש והקיים.

מפתחות הנתונים (כולם ב-localStorage, כולם בגיבוי אלא אם צוין): `fitlog:runs:v1` (ריצות, מסלולים, מרוצים, שבועות, העדפות מאמן) · `fitlog:home:v1` · `fitlog:sessions:v2` · `fitlog:exercises:v1` · `fitlog:catalog:v1` · `fitlog:goals:v1` · `fitlog:templates:v1` · `fitlog:suunto:v1` · `fitlog:preferences:v1` — **בגיבוי**. `fitlog:storage-meta`, `fitlog:migration-snapshot`, `fitlog:backup-snapshot:*`, `fitlog:sync-state:v1`, `fitlog:session`, `fitlog:mock-mode` — פנימיים/נגזרים, לא בגיבוי (נבנים מחדש).

### הוראות לאריאל (פעם אחת)
1. **באתר** (טלפון או מחשב): עוד → גיבוי ושחזור → **הורד גיבוי**. שים לב למספר הרשומות המוצג ("סה״כ N רשומות").
2. העבר את הקובץ לטלפון (Drive / WhatsApp לעצמך / כבל). שם הקובץ: `fitlog-backup-<תאריך>.json`.
3. **התקן את ה-APK** (הורדה מה-artifact/קישור → פתיחה → אישור "התקנה ממקור לא מוכר" לאפליקציה שממנה פותחים).
4. **באפליקציה**: עוד → גיבוי ושחזור → **בחר קובץ גיבוי** → בדוק את התצוגה המקדימה ("רשומות חדשות שיתווספו" צריך להיות ≈ N) → **הוסף חדשים בלבד (שמור על המכשיר)**.
5. **אימות:** היסטוריה → "כל התקופה" → מספר האימונים; פרויקט חצאי המרתון → המרוצים והשבוע; עוד → אודות → גרסה + commit.
6. מרגע זה: **מקור אמת אחד** — האפליקציה. באתר אפשר להמשיך להשתמש, אבל הנתונים לא מסונכרנים ביניהם (Phase 1 בענן עדיין פתוח, T-05).

### הגנות
- ייבוא קובץ שגוי/חלקי: `validateBackup` דוחה קובץ שאינו מעטפת תקינה (format/schema/checksum) ומציג שגיאה; קובץ חלקי מוסיף רק מה שיש בו.
- ללא דריסה שקטה: `merge_keep_local` (ברירת מחדל) מוסיף רשומות חדשות בלבד; קונפליקטים לא נדרסים.
- **Rollback:** לפני כל שחזור נשמר `fitlog:backup-snapshot:<timestamp>`; שחזור הגיבוי הקודם דרך אותו מסך מחזיר את המצב. גם הסרת האפליקציה והתקנה מחדש + שחזור הקובץ המקורי = rollback מלא.
- שדרוג גרסה (אותו keystore, אותו `applicationId`) **לא** מאפס localStorage (אומת באמולטור: התקנה מעל גרסה קודמת שמרה 1 ריצה + 1 פק״ל).

## בדיקות שבוצעו באמולטור (Pixel 7 · API 35 · Android 15)
ראה `docs/ai-runs/2026-09-21/fitness_app_recovery-20260921-compact-ux-android-apk/09_END_OF_RUN_REPORT.md` וצילומים ב-`assets/android/`.
