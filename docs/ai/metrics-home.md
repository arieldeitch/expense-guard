# Home Strength — Metrics & Records

> מסמך זה מתאר את הנוסחאות המוטמעות ב־`src/lib/home/metrics.ts` וב־`src/lib/home/records.ts`.
> כל המדדים **עובדתיים**, ניתנים להסבר, וללא שפה שיפוטית.

## מונחים

- **סט (set)** — יחידת דיווח בודדת. יכולה להכיל: `reps`, `duration_seconds`, `added_weight`, `side`, `assistance_value`, `tempo`, `rpe/rir`.
- **entry** — תרגיל בתוך אימון. אוסף סטים לתרגיל יחיד.
- **session** — אימון בית שלם. יכול להיות quick-entry (תרגיל יחיד) או מלא (מספר entries).
- **baseline** — הביצוע הראשון הידוע לתרגיל. אינו נחשב שיא.

## סטטיסטיקה בסיסית (`metrics.ts`)

- `meanOf(xs)` — ממוצע אריתמטי. `null` על מערך ריק.
- `medianOf(xs)` — חציון על מערך ממויין. `null` על מערך ריק.
- `sumReps(sets)` — סכום `reps` מכל סט לא־מדולג ולא־מחוק.
- `summarizeSets(sets)`:
  - `totalReps`, `averageReps`, `medianReps`, `maxReps`
  - `firstSetReps`, `lastSetReps`, `lastToFirstRatio = lastSetReps / firstSetReps`
  - `completedCount`, `skippedCount`, `plannedCount`

## מדד יציבות (Stability)

מבוסס על **מקדם השונות** (Coefficient of Variation) של החזרות בסטים:

```
CV = stdev(reps) / mean(reps)
stability = clamp(1 - CV, 0, 1)
```

- דורש **≥2 סטים** עם ערכי reps. אחרת `null`.
- `stability = 1` → כל הסטים זהים.
- `stability → 0` → פיזור גדול (עייפות מוקדמת או ביצוע לא־עקבי).

## Home Quality Score

ציון 0–100 המשקלל:

| רכיב            | משקל | חישוב                                         |
| --------------- | ---- | --------------------------------------------- |
| Completion      | 0.5  | `completedSets / plannedSets` (או מדווחים)    |
| Stability       | 0.3  | `stabilityFromReps(reps)` (0..1)              |
| Data completeness | 0.2 | `% סטים עם ערך reps או duration ולא skipped` |

- מוחזר `{ score, breakdown }` כדי לתמוך ב־`QualityBreakdown` UI.
- `score=0` כשאין נתונים כלל.

## Records — זיהוי שיאים (`records.ts`)

שיא נחשב **רק** אם קיים baseline קודם (session מוקדם יותר עם ביצוע לתרגיל). Session ראשון מסומן כ־baseline:

- `top_reps_in_set` — הכי הרבה חזרות בסט בודד לאותו תרגיל.
- `total_reps_in_session` — סך חזרות באימון לאותו תרגיל.
- `longest_hold` — משך אחזקה מקסימלי בסט (זמן).
- `top_reps_with_added_weight[wKg]` — טופ־חזרות במסגרת משקל נוסף (per weight key).

`previousPerformance(exerciseId, sessionId)` מחזיר את ה־session הקודם המושלם עם ביצוע לתרגיל, לצורך השוואה במסך סיכום.

`summarizeExerciseHistory(exerciseId)` מחזיר:

- `timesPerformed`, `topRepsInSet`, `totalRepsAllTime`, `longestHold`
- `trend`: `"insufficient_data"` (≤1), `"improving"`, `"steady"`, `"declining"`

Trend מבוסס השוואה של חציון N sessions אחרונים מול N קודמים. ללא ניחושים כשאין מספיק דגימות.

## עקרונות שקיפות

1. כל ערך מדד חייב להיות ניתן להסבר בשורה אחת.
2. שיאים אינם ניתנים כשאין baseline.
3. חוסר נתונים ← `null`, לא ניחוש.
4. שפה עובדתית: "20 חזרות בסט", לא "ביצוע מרשים".
