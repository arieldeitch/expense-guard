# סבבי תיקון בתוך הריצה (ללא האצלה לסוכן חיצוני)
- **Back ב-Android יצא מהאפליקציה** בסבב QA הראשון באמולטור: הבדיקה `history.state.__TSR_index` החזירה null → `minimizeApp`. תוקן ל-`canGoBack` שמגיע מה-WebView באירוע (דפוס Capacitor). אומת: Back מפרטי ריצה → הטופס → היסטוריה; במסך הראשון → מזעור.
- **"הורד גיבוי" לא עשה דבר ב-APK** (ל-WebView אין מנהל הורדות ל-blob). נוספו `@capacitor/filesystem` + `@capacitor/share`; הקובץ נכתב ל-cache ונפתח גיליון שיתוף (אומת: `ChooserActivity` + קובץ 72 רשומות ב-cache).
- **Gradle wrapper ב-Windows**: cmd.exe לא פתר `gradlew.bat` עם רווח בנתיב ("AI projects"); `scripts/android-apk.mjs` מריץ את ה-wrapper דרך `cmd.exe /d /s /c` בנתיב מוחלט ומצוטט. ב-CI (Linux) `gradlew` עם bit הרצה (`update-index --chmod=+x`).
- **SPA shell**: `nitro: { preset: "static" }` ו-`node-server` נכשלו בפרירנדר (ה-prerenderer של TanStack מחפש `dist/server/server.js`); `nitro: false` + `build.outDir: dist-android` + `spa.prerender.outputPath: "/index"` מייצר `index.html` תקין.
- **eslint** סרק את `android/` ו-`dist-android` (10+ דקות) — נוספו ל-`ignores`.
- **Web QA**: אריחי המסך הראשי הראו "אין פעילות" למרות נתונים — מקור: `activeRepo` = mock. תוקן ב-`useLocalDomainSummary`.
- העתקת מסך הגיבוי ב-APK ("בדפדפן הזה") → תלוית פלטפורמה.
