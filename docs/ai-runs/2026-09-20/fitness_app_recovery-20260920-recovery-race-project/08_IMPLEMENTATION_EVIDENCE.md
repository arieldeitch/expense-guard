ראו src/lib/race-project, src/routes/running.project.tsx, src/routes/history.tsx, DurationField, RunForm, HomeSetRow, קטלוג הבית והבדיקות. פלטי build/בדיקות ב־assets. קובץ routeTree נוצר על ידי build, לא נערך ידנית.

## המשך · Claude Code · 2026-09-20 ערב
- קוד: `src/lib/race-project/{model,repo}.ts` (revision רק בעדכון מפורש, `formatDayMonth`/`formatWeekRange`), `src/routes/running.project.tsx`, `src/components/runs/RunForm.tsx` (`toRunPatch`, קצב נגזר חי), `src/components/inputs/DurationField.tsx` (placeholder/className), `src/components/shell/AppShell.tsx` (קיצורים במסכים ראשיים בלבד), `src/routes/running.$id.{index,edit}.tsx` (ללא 404 בשרת + קישור לתוכנית), `src/routes/home.quick.index.tsx` (קטלוג מצומצם + תרגיל מותאם), `src/routes/home.sessions.$id.index.tsx` (מילוי סט ריק), `src/routes/history.tsx`, `package.json` (סקריפטי בדיקה בלבד).
- בדיקות: `src/lib/race-project/model.test.ts` (7), `src/test/fitnessRecovery.test.tsx` (9), `src/test/durationField.test.tsx` (1).
- ראיות: `assets/mobile-qa-390x844/*.png` (13 צילומים, Chrome אמיתי) ו-`assets/mobile-qa-390x844/final-qa-log.txt` (יומן הרצה מלא מהמצב הנקי, כולל בדיקות DOM ל-overflow ומטרות מגע).
