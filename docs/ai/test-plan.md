# Test Plan

## כרגע

**אין קוד מוצרי → אין בדיקות פונקציונליות.** רק בדיקות שלד: build עובר, typecheck נקי, lint נקי.

## מסגרת מתוכננת

| שכבה | כלי | היקף |
|---|---|---|
| Unit | Vitest | פונקציות pure, helpers, validators (zod) |
| Component | Vitest + `@testing-library/react` | רכיבי UI קריטיים (`Tile`, `DeleteWithConfirm`, טפסי דיווח סט) |
| Integration | Vitest + msw/מוקים | queryOptions + server functions (מוקים ל־Supabase) |
| E2E | Playwright דרך shell | זרימות critical: login → דיווח סט → הופעה בהיסטוריה |
| RLS | server-side query tests | לוודא ש־user A לא רואה דאטה של user B (גם באפליקציה חד־משתמש — נאכף כשמידה עתידית) |

## מה חובה לבדוק (כשיש קוד)

### Data integrity
- soft delete מסמן `deleted_at` ולא מוחק שורה.
- שחזור מאפס `deleted_at`.
- `numeric` נשמר בלי איבוד דיוק (משקל 87.5 חוזר 87.5, לא 87.4999...).
- כל insert מספרי כולל `unit` + `source`.

### RLS
- `SELECT`/`INSERT`/`UPDATE`/`DELETE` — כל אחד עם `owner_id=auth.uid()`.
- attempt ל־`owner_id` שגוי → נדחה.
- `WITH CHECK` נאכף ב־INSERT וב־UPDATE.

### Auth
- login עם credentials תקינים → session נשמר → redirect ל־dashboard.
- login שגוי → הודעת שגיאה נגישה (`aria-live`).
- logout → cancel queries, clear cache, redirect ל־`/auth`, replace history.
- route מוגן ללא session → redirect ל־`/auth`.

### UI
- כל מסך נטען ב־RTL בלי גלילה אופקית ב־viewport מובייל (מדגם: 360×640, 390×844).
- אין רכיב שדורש swipe לפעולה קריטית.
- כל query view מציג loading, empty, error states.

### AI
- הצעות AI נשמרות עם `status='pending'` ולא נכנסות ל־production data אלא אחרי approve.
- זריקת JSON לא תקין מה־LLM → הצעה מסומנת `expired` בלי לפגוע במשתמש.

## מה **לא** בודקים

- ביצועים ברמת ms (אין SLA).
- browser matrix מלא (מוצר אישי → Safari iOS + Chrome desktop למפתח מספיקים).
- accessibility תקן מלא WCAG AA כרגע — נדרש בסיס (`aria-label`, keyboard nav, contrast) אך לא תעודה.

## הפעלה

```sh
bun run lint         # (מוגדר: eslint .)
bunx tsgo            # type check (מהיר יותר מ־tsc --noEmit)
bun run build        # וידוא build עובר
# בעתיד:
# bun run test       # vitest
# bunx playwright test
```

## סטטוס נוכחי

- ✅ `bun run build` — עובר (שלד ריק).
- ✅ typecheck — נקי.
- ✅ lint — נקי (או מותאם לתבנית).
- ❌ בדיקות פונקציונליות — אין. אין קוד לבדוק.
