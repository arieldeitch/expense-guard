# החלטות הריצה (ADR-0042 · ADR-0043) — הרישום הסמכותי ב-`docs/ai/decisions.md`

## ADR-0042 · שפה קומפקטית, ניווט של חמישה יעדים ומרכז היסטוריה

**הקשר.** הפידבק: היסטוריה ודיווח לא נגישים, טקסט גדול, עומס כרטיסים, ניווט לפי תחומים.

**החלטה.**
1. **ניווט תחתון** (וסרגל צד בדסקטופ): **ראשי · דיווח · היסטוריה · תוכניות · עוד**. יעד פעיל אחד בדיוק לכל כתובת (`src/lib/nav.ts`, נבדק ב-`nav.test.ts`). התחומים (ריצה/מכון/בית) נגישים מהראשי ומ"דיווח"; מסכי טופס וסשן מסומנים כ"דיווח", פרויקט/יעדים/תבניות כ"תוכניות", קטלוג/גיבוי/סל כ"עוד".
2. **`/history` = מרכז ההיסטוריה**: שורות 56px (`list-row`), קיבוץ לפי שבוע ראשון–שבת עם סיכום (אימונים · זמן · ק״מ), chips לסוג, חיפוש, חודש קודם/הבא + "כל התקופה", איפוס, Empty state. מודל שורה אחיד ב-`src/lib/history/items.ts` (טהור, נבדק). לחיצה → מסך הפרטים הקיים; עריכה משם. ללא גרפים.
3. **`/report`** (טיוטות פתוחות + 5 דרכי דיווח) ו-**`/plans`** (חצאי מרתון · יעדים · תבניות) — מסכי-רשימה שקטים.
4. **מסך ראשי = Snapshot**: שורת "השבוע" מהנתונים האמיתיים + שלושה כרטיסי תחום קומפקטיים (מדד יחיד, "פעילות אחרונה", כפתור דיווח). תוקן פגם קודם: האריחים קראו מ-`activeRepo` (mock) ולכן תמיד הראו "אין פעילות"; עכשיו `useLocalDomainSummary` מחשב מ-localStorage דרך ה-selector הקיים.
5. **סולם טיפוגרפי**: כותרת עמוד 20px (`h1`), מדד יחיד 24px, גוף 14–15px, משני 12px. **לא** הוקטן טקסט גלובלית. `--radius` 14px, ריפוד אריחים 10–16px, `Input` 44px, `Button` ברירת מחדל 44px.
6. **טיוטת ריצה עצלה** (R-28): רשומה נוצרת בעריכה הראשונה, לא בפתיחת המסך; "שמור וסיים" חסום ללחיצה כפולה (ref).
7. **R-43** נסגר גם ל-`treadmills.$id` (הדפוס של ADR-0039); `locations`/`exercises` כבר היו תקינים.

**נדחה.** הקטנת פונטים גורפת · Bottom sheets לכל פעולה · גרפים בהיסטוריה · feed/streaks.

## ADR-0043 · Android דרך Capacitor (WebView מקומי), Source of Truth אחד

**חלופות שנבחנו.**
| חלופה | יתרון | למה נדחתה |
|---|---|---|
| **Capacitor 8 + WebView מקומי** (נבחר) | אותו קוד React/Vite; הנכסים בתוך ה-APK; localStorage יציב תחת `https://localhost`; Back/מקלדת/Safe-areas דרך API מתועד; build ב-Gradle רגיל; plugins רק לפי צורך | — |
| Trusted Web Activity (TWA / Bubblewrap) | APK דק | טוען את האתר החי בכל פתיחה — תלות ברשת וב-Lovable; localStorage של Chrome, לא של האפליקציה; אין Back/Share מותאמים |
| PWA "ארוז" (WebAPK / הוספה למסך הבית) | אפס קוד | לא APK ניתן להורדה/התקנה; תלוי ב-Chrome ובאתר החי |
| React Native / Native Android | ביצועים | שכתוב מלא, שני מקורות אמת, ללא צורך מוכח |

**מימוש.**
- `vite.android.config.ts`: אותו `@lovable.dev/vite-tanstack-config`, אך `spa.enabled` + `nitro: false` → `dist-android/client/index.html` (SPA shell מרונדר בזמן build) + `assets/`. ה-Web build (SSR/nitro) לא השתנה.
- `capacitor.config.ts`: `appId com.arieldeitch.fitlog`, `appName Fit Log`, `webDir dist-android/client`, `androidScheme https`, `adjustMarginsForEdgeToEdge: "force"`.
- `android/`: פרויקט Gradle מחויב (ללא build outputs, ללא keystore). `versionName` = `package.json` version; `versionCode` = major·10000+minor·100+patch (1.1.0 → **10100**); `build_commit` כמשאב מחרוזת; `windowSoftInputMode=adjustResize`; ערכת נושא כהה (`colors.xml` = טוקני ה-CSS); splash מערכת (Android 12+) + PNG לגרסאות ישנות; אייקון adaptive. כל הנכסים נוצרים מ-SVG אחד ב-`scripts/android-assets.mjs`.
- Plugins: `@capacitor/app` (Back), `@capacitor/filesystem` + `@capacitor/share` (ייצוא גיבוי — ל-WebView אין מנהל הורדות). **הרשאות: INTERNET בלבד** (Filesystem כותב ל-cache הפרטי; Share ללא הרשאה).
- Back: `App.addListener('backButton', ({canGoBack}) => canGoBack ? history.back() : App.minimizeApp())`.
- זהות build: `build-info.ts` מזריק `VITE_APP_VERSION / VITE_APP_VERSION_CODE / VITE_GIT_SHA / VITE_APP_TARGET` לשני ה-builds; מוצג ב"עוד → אודות".
- Build משתחזר: `scripts/android-apk.mjs` (build web → `cap sync` → `gradlew assembleDebug|Release` → שם קובץ `fitlog-<ver>-<code>-<commit>-<variant>.apk` + `.sha256` + `fitlog-apk.json`); נכשל אם `JAVA_HOME`/`ANDROID_HOME`/platform-36 חסרים או אם release מבוקש בלי keystore. `.github/workflows/android-apk.yml`: Bun 1.4.2 · Temurin 21 · SDK 36 · Gradle 8.14.3 (wrapper) · AGP 8.13.0 · artifact + SHA-256 + summary.
- **חתימה:** debug keystore (סטנדרטי של ה-SDK) — מתאים להתקנה פנימית/sideload בלבד, **לא** ל-Play Store. release רק עם `FITLOG_KEYSTORE_*` secrets — לא הומצא ולא נוצר keystore.

**שימור נתונים.** ה-WebView של האפליקציה הוא origin נפרד (`https://localhost`) מהדפדפן; localStorage **לא** עובר אוטומטית. המסלול: ייצוא מה-Web → העברת הקובץ → שחזור ב-APK (מסך "גיבוי ושחזור", `merge_keep_local`; snapshot נשמר לפני כל שחזור → rollback). מפורט ב-`docs/ai/android.md`.
