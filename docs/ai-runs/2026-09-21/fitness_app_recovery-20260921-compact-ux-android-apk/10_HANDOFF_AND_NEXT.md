# Handoff · 2026-09-21 (Claude Code) — מתעדכן בסגירה
- PR #2: https://github.com/arieldeitch/expense-guard/pull/2 — מצב מיזוג, פרסום ו-APK רשמי ב-`docs/AI_RUN_CONTEXT_LEDGER.yaml`.
- לאריאל: (1) Publish ב-Lovable אם עדיין לא פורסם; (2) להוריד את ה-APK מ-artifact ה-workflow של `main`, לייצא גיבוי מהאתר, להתקין, לשחזר — לפי `docs/ai/android.md`; (3) בדיקת קבלה על הטלפון (Back, מקלדת, גיבוי) ודיווח.
- הבא בתור (לא בהיקף): T-05 סנכרון ענן מאומת; אריזת Heebo (R-47) אם רוצים פונט זהה offline; release keystore (דורש אישור) ו-Play — רק לפי בקשה מפורשת.

## מצב סופי · 2026-09-21T13:31:00+03:00
- **PR #2 מוזג** ל-`main` ב-merge commit `2d7cffd` (13:14). עץ עבודה נקי אחרי commit הסגירה.
- **APK רשמי מ-`main`:** run https://github.com/arieldeitch/expense-guard/actions/runs/35587726424 → artifact `fitlog-apk-debug-2d7cffde8af7b4f2bb4410963e830c87da097416` → `fitlog-1.1.0-10100-2d7cffde8a-debug.apk` · 4,770,061 bytes · SHA-256 `5a5b466a34f1cebf7c64816eb99127bf81f75e39cd9eb114ca743edc4d56a007` · `com.arieldeitch.fitlog` · versionName 1.1.0 · versionCode 10100 · commit `2d7cffde8a` · חתימת debug. הותקן באמולטור (התקנה נקייה) ואומת: "Fit Log 1.1.0 · Android · build 10100 · 2d7cffde8a".
- **נצפה:** APK מ-run אחר (PR) נחתם ב-debug key שונה → התקנה מעל נכשלה (R-46). נוסף cache ל-keystore ב-workflow (commit הסגירה); ייכנס לתוקף מה-run הבא.
- **פרסום Lovable — חסום מהסשן** (החשבון המחובר: `project_not_found`). live: `/`, `/history` → 200 (build קודם); `/report`, `/plans` → 404 עד לפרסום. **לא נטען שפורסם.**
- **מכשיר פיזי** — לא נבדק; פעולת קבלה לאריאל.

## תיקון אחרון · 2026-09-21T13:33:00+03:00 — חתימה יציבה ב-CI
- ה-APK הראשון מ-`main` (`2d7cffde8a`) נחתם במפתח debug חד-פעמי של ה-runner. תוקן: `actions/cache` ל-`~/.config/.android/debug.keystore` (commit `452a17a`). אומת ב-`apksigner`: שני runs עוקבים (35588770666 ו-35588979743) → אותה תעודה `59842bec…2193`.
- **ה-APK הקנוני למסירה:** run https://github.com/arieldeitch/expense-guard/actions/runs/35588979743 → `fitlog-1.1.0-10100-452a17af40-debug.apk` · SHA-256 `791aa929c6d1cef88d552ddaebde648aecf61496156549670201106cb0a7910e`. כל APK עתידי מ-`main` יתקין מעליו (כל עוד ה-cache חי).
