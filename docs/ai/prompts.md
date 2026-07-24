# Prompts — Living Repository

מקום מרוכז ל־prompts שנשלחים ל־AI (Lovable AI Gateway או אחר) מתוך האפליקציה, וכן prompt patterns פנימיים לעבודת סוכנים.

כרגע: **אין** קריאות AI מתוך האפליקציה. נוסיף בעתיד עם approval flow (ראה `product-requirements.md` §5).

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
