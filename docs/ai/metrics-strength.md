# מדדים ואנליטיקה — כוח בחדר כושר

מקור אמת לחישובי מדדים במודול הכוח. כל מדד ניתן להסבר בשורה אחת ומחושב באופן דטרמיניסטי מטבלאות `sessions`, `session_exercises`, `session_sets` בלבד.

## עקרונות
- **דטרמיניסטי:** אותם נתונים → אותה תוצאה, לא משנה מתי חושבו.
- **הוגן:** השוואות רק בין סטים דומים (אותו תרגיל, וריאציה, ציוד, יחידת משקל, טווח חזרות סביר, ללא חימום).
- **שקוף:** רכיב לא מדיד → מוחרג ומצוין למשתמש, ולא מוריד ציון.
- **ללא צ'ירלידינג:** תוויות תיאוריות ("שיפור ברור", "יציב", "ירידה קלה") ולא הצהרות התלהבות.

## Estimated 1RM
נוסחאות רשומות ב־`src/lib/analytics/formulas.ts`; ברירת המחדל היא `epley-v1`.

- `epley-v1`: `w × (1 + reps / 30)` — לטווח 1–12 חזרות.
- `brzycki-v1`: `w × 36 / (37 − reps)` — לטווח 1–10 חזרות.

**תנאי כשירות (`estimate1RMForSet`):**
1. `set_type = "regular"` (חימום/dropset/failure מוחרגים).
2. `tracking_type ∈ {weight_reps, assisted, weighted_bodyweight}`.
3. `completed = true`, `skipped = false`.
4. `1 ≤ actual_reps ≤ maxReps` של הנוסחה.
5. `actual_weight > 0`.

כל דחייה מוחזרת עם `reason` (`warmup`, `too_many_reps`, `incompatible_tracking` וכד'). השדה `formula` נשמר בתוצאה כדי לאפשר החלפת נוסחה עתידית עם שקיפות מלאה.

## נפח (Volume)
`setVolumeKg(set, snapshot)` = `weight_kg × actual_reps × (unilateral ? 2 : 1)`.

- משקל בליברות מומר ל־ק״ג (`1 lb = 0.453592 kg`) לפני הכפל.
- חימום, סטים לא מושלמים, סטים ללא משקל, ותרגילי `bodyweight/time` → 0 (הם מיוצגים במדד אחר).
- סכימות מסך מבצעות `sumSetsVolumeKg` על סטים שעברו את המסנן.

## Comparability
`compareSets(a, b)` מחזיר `{ comparable, reasons[] }`. סיבות פסילה עיקריות:
- `warmup_vs_working` — סוגי סטים שונים.
- `different_unit` — יחידות משקל שונות.
- `reps_gap_too_large` — פער > 5 חזרות.
- `variation_mismatch` / `equipment_mismatch` — snapshot של תרגיל שונה.

כל ההיסטוריה של תרגיל מסוננת דרך הכלל הזה לפני חישוב מגמות.

## שיאים אישיים (PRs)
`detectSessionRecords(sessionId)` עובר על כל תרגיל באימון ומחפש:
- `top_weight` — משקל עליון חדש בטווח חזרות זהה או חופף.
- `more_weight_same_reps` — משקל גבוה יותר באותו מספר חזרות.
- `more_reps_same_weight` — יותר חזרות באותו משקל.
- `top_estimated_1rm` — הערכת 1RM חדשה גבוהה יותר.
- `top_volume_session` — נפח כולל גבוה יותר לתרגיל באימון.

**Baseline:** אם זה האימון הראשון של אותו תרגיל, כל שיא מסומן `isBaseline = true` ולא נחשב שיא אמיתי במסכי סיכום/היסטוריה.

## מדד איכות אימון (Workout Quality Score)
`computeWorkoutQuality(sessionId)` מרכיב ציון 0–100 מרכיבים משוקללים:

| רכיב | משקל | חישוב |
| --- | --- | --- |
| `set_completion` | 0.30 | סטים מושלמים / מתוכננים |
| `planned_adherence` | 0.20 | קרבה בין `actual` ל־`planned` (reps × weight) |
| `rpe_alignment` | 0.15 | פער מ־RPE יעד (רק אם דווח) |
| `rest_adherence` | 0.15 | קרבת מנוחה בפועל למתוכננת (רק אם דווח) |
| `pr_bonus` | 0.10 | נוכחות שיאים אמיתיים |
| `session_completeness` | 0.10 | סטטוס האימון + כיסוי תרגילים |

**נירמול:** רכיב שלא ניתן למדוד (לא דווח RPE/מנוחה, אין תבנית וכו') מסומן `excluded` ומחולק המשקל שלו מחדש בין הרכיבים הנותרים. המסך מציג רשימת המוחרגים כדי שלא ייווצר רושם של "עונש סמוי".

## היסטוריה והשוואת אימונים
- `listSessionHistory(filters, sort)` מחזיר `SessionHistoryTile` עם: תאריך, שם, מיקום, נפח, סטים, שיאים אמיתיים, ציון איכות.
- `compareSessions(aId, bId)` משווה אימון נוכחי לקודם על שרשרת מדדים (`volume`, `sets`, `duration`, `quality`, `unique_exercises`) עם delta ותווית תיאורית (`שיפור ברור`, `יציב`, `ירידה קלה`).
- `getExerciseHistorySummary(exerciseId)` מרכז `timesPerformed`, `topWeightKg`, `topEstimated1RM`, `lastSession`, ו־`recentTrend[]` להזנת גרפי SVG.

## הצגה
- כרטיסי היסטוריה: `SessionHistoryTile` — כותרת, מיקום, זמן, נפח, סטים, PR badge, quality chip.
- `QualityBreakdown` — פירוט רכיבים + הרכיבים שלא נמדדו + מסקנה תיאורית.
- `MiniLineChart` — SVG מקורי, נגיש, ללא ספריות חיצוניות.
- `MetricSelector` — grid קומפקטי לבחירת מדד תצוגה.

## נקודות שקיפות למשתמש
- ליד כל השוואה: הסבר קצר למה הושוותה או לא ("סטים שונים בסוג", "יחידת משקל שונה").
- ליד ציון האיכות: רשימת רכיבים שלא נכללו.
- ליד PR: המילה "שיא" רק כשהוא לא baseline.
