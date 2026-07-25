# Prompts — Living Repository

מקום מרוכז ל־prompts שנשלחים ל־AI (Lovable AI Gateway או אחר) מתוך האפליקציה, וכן prompt patterns פנימיים לעבודת סוכנים.

כרגע: **אין** קריאות AI מתוך האפליקציה. נוסיף בעתיד עם approval flow (ראה `product-requirements.md` §5).

## Prompt history — sessions של סוכנים

### 2026-07-25 · התאוששות מריסטרט לא מתוכנן
1. **STATUS-ONLY RECOVERY AUDIT** — מיפוי read-only של מצב הריפו אחרי ריסטרט; אסור לשנות קוד/Git/DB. תוצאה: זוהתה עבודה לא מחויבת, פער תיעוד מול Git (push), ובאג route nesting.
2. **הקפאה + השלמת תיקון** — freeze commit לפני כל שינוי, ואז שיטוח routes, תיקון harness ו-fixtures, אימות מלא.
3. **עצירת חקירת ה-hang** — הוראה מפורשת להפסיק profiling/bisect/pool experiments ולעבור לפתרון דטרמיניסטי.
4. **הסרת custom runner** — לעבור ל-package scripts מפורשים, קובץ אחד לתהליך.
5. **פיצול מבני יחיד** — לפצל את `systemErrors.test.tsx` לפי אחריות; ניסיון אחד בלבד. **הצליח.**
6. **Push בטוח** — אימות מוקדם (status/branch/ahead-behind) ואז `git push` ללא force. בוצע: `5af65bd..a4d24e2`.
7. **סנכרון תיעוד** — עדכון `docs/ai/` בלבד כך שישקף את מצב ה-remote אחרי ה-push, תוך סימון רשומות היסטוריות כ-Superseded במקום מחיקתן.

**לקח לתיעוד:** דוח שנכתב לפני סוף העבודה עלול לסתור את Git. יש לאמת טענות push/working-tree מול `git reflog` ו-`git status` בזמן הכתיבה, לא מהזיכרון.

## תבניות עתידיות (מתוכננות)

### AI Suggestion — יעד שבועי מומלץ
```
System: You are a training analyst. You never modify user data. You suggest;
the user approves. Data is authoritative — do not invent history.

Context: <last 4 weeks aggregated: total km, weekly km, longest run, avg pace>

Task: Suggest ONE weekly distance goal for next week. Return JSON:
{ "value": number, "unit": "km", "rationale": string, "confidence": "low"|"medium"|"high" }
```
נשמר ב־`ai_suggestions` עם `status='pending'`.

### AI Suggestion — החלפת תרגיל
```
System: <as above>
Context: exercise=<name>, reason=<user text: pain|equipment|variety>,
history=<last 5 sessions with this exercise>, equipment_available=<list>
Task: Suggest 1-3 alternatives with same primary muscle group. Return JSON array.
```

## עקרונות לכתיבת prompts

- Explicit "do not modify data" בכל system prompt.
- דורש JSON output — parse עם zod schema, דחיית פלט שלא תואם.
- כולל תמיד `confidence` — UI מסמן הצעות low confidence אחרת.
- context הוא **aggregate**, לא raw dump — מונע עלות token מיותרת ו־context leakage.

## אסור

- לשלוח PII / דאטה של users אחרים (אין כאלה — אבל עדיין: לא לחרוג מהמשתמש הנוכחי).
- להשתמש ב־AI כדי להחליט **על דעת עצמו** על יעד או שינוי דאטה. תמיד suggestion → approval.
- להזרים דאטה גולמי של Suunto ל־AI ללא סינון וסיכום.
