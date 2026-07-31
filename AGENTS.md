<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

---

# הנחיות מחייבות לסוכני AI (Lovable, Claude, GPT, וכל agent עתידי)

> **קרא את `docs/ai/` לפני כל שינוי משמעותי.** מסמכי `docs/ai/` הם מקור האמת של המוצר, לא הצ'אט הנוכחי.

## חוקים לא ניתנים למשא ומתן

1. **קרא קודם** את `docs/ai/product-requirements.md` ו־`docs/ai/current-state.md` לפני כל שינוי מעבר ל־typo.
2. **אל תמציא דרישות.** אם חסרה החלטה — שאל, או פתח שורה ב־`docs/ai/open-tasks.md`. אל תוסיף פיצ'ר שאינו כתוב בדרישות.
3. **אל תיצור עלות חדשה.** אל תפעיל שירות בתשלום, אל תוסיף תלות מסחרית, אל תעביר credits לחשבון חיצוני — ללא אישור מפורש של המשתמש.
4. **אל תמחק לצמיתות.** soft delete בלבד. אין `DROP TABLE`, `TRUNCATE`, `DELETE` בלתי מוגבל, או `DROP COLUMN` ללא אישור מפורש. אם מיגרציה דורשת שינוי הרסני — עצור, הצג את השינוי, חכה לאישור בכתב.
5. **אל תשנה דרישה מרכזית בשקט.** שינוי scope, שינוי אופי מוצר, הוספת feed/משתמשים/מאמנים וכד' — קודם עדכן `product-requirements.md`, קבל אישור, אחר כך קוד.
6. **תאימות לאחור.** אל תשבור schema קיים. מיגרציה שמוסיפה עמודה — עדיף עם `default`; מיגרציה ששוברת — דורשת אישור.
7. **הרץ בדיקות.** אחרי כל שינוי משמעותי: build + typecheck + lint (+ tests כשיהיו). אל תמסור "סיימתי" בלי להריץ.
8. **עדכן תיעוד.** כל שינוי בקוד שנכנס למקור אמת — עדכן את המסמך הרלוונטי ב־`docs/ai/`. כל החלטה חדשה — ADR ב־`decisions.md`. כל שינוי — שורה ב־`change-log.md`.
9. **בצע ברצף.** אל תעצור באמצע לדיווח על שינויים הפיכים. עצור רק בחסם אמיתי (ראה סעיף הבא).

## מתי מותר / חובה לעצור

- דרושה **הרשאה חיצונית** שאין לסוכן.
- דרוש **API key / secret** שהמשתמש צריך לספק.
- הפעולה **יוצרת עלות** (שירות בתשלום, מכסת credits חיצונית).
- **מחיקה בלתי הפיכה** (drop/truncate/delete without filter, מחיקת קבצי משתמש, drop של מיגרציה שכבר החלה על production).
- **החלטה שמשנה דרישת מוצר מרכזית** (משנה scope, מוסיף/מוריד תחום, משנה soft→hard delete וכו').
- **סתירה בלתי פתירה** בין דרישה חדשה לדרישה קיימת ב־`product-requirements.md`.

בכל שאר המקרים — המשך אוטונומית.

**הסכם עבודה מ-2026-07-31 (ADR-0038):** פרומפטים ל-Claude Code נכתבים **באנגלית**, ולסוכן ניתנת **אוטונומיה מרבית — ללא בקשות אישור מצטברות** באמצע משימה. אין לעצור כדי לאשר צעדים הפיכים (עריכות, בדיקות, commit, push לענף קיים, תיעוד, תיקון באגים שהתגלו באימות); יש להשלים את המשימה ולדווח בסיום. **הרשימה שלמעלה היא רשימת העצירות המלאה** — היא לא הוקלה. `docs/ai/` נשאר בעברית.

**כלי העבודה של המשתמש (נקבע 2026-07-31):** המשתמש עובד **אך ורק דרך Claude Code או Lovable**. **אין להפנות אותו לכלים אחרים** — לא ל-CLI חיצוני, לא ל-Dashboard של ספק, לא ל-IDE אחר, לא להתקנת תוכנה. אם משימה דורשת כלי שאינו אחד מהשניים — זו **עצירה**: יש לתאר את המצב ולהציע דרך שמתבצעת בתוך Claude Code או Lovable. אין להמליץ על wrangler, gh, psql, Supabase CLI וכדומה כפעולה שהמשתמש יבצע.

## עקרונות עבודה נוספים

- **Mobile-first + RTL** בכל שינוי UI. אין להוסיף מסך שלא נבדק ב־viewport 390×844 עם `dir="rtl"`.
- **אין swipe קריטי**, **אין גלילה אופקית**, **אין feed**, **אין cheerleading**. ראה `product-requirements.md` §3.
- **Tiles לפני listings** כברירת מחדל להצגת רשומות.
- **`numeric` בלבד** לכל שדה מספרי משמעותי. אין `float`. יחידה + מקור + timestamp לכל מדידה.
- **Raw נפרד מ־derived.** אל תדרוס קריאת חיישן עם ערך מחושב.
- **TanStack Query** = מקור אמת לנתוני שרת. localStorage רק לטיוטת טופס פעיל.
- **`_authenticated/route.tsx`** מנוהל ע"י אינטגרציית Supabase — אל תערוך אותו ידנית.
- **`src/routeTree.gen.ts`** נוצר אוטומטית — אל תערוך.
- **`client.server` (service role)** — יובא רק בתוך handler עם `await import(...)`, לעולם לא ברמת module.

## נוהל שינוי דרישה

1. עדכן `docs/ai/product-requirements.md`.
2. הוסף ADR ב־`docs/ai/decisions.md` (הקשר, החלטה, נימוק, השלכה).
3. עדכן מסמכים מושפעים (`data-model.md`, `open-tasks.md`, `risks.md`).
4. רק אז — קוד.
5. בסוף — `change-log.md`.

## נוהל סקירת סוכן חדש

לפני הפעולה הראשונה, קרא לפי הסדר:
1. `docs/ai/product-overview.md` — מה בונים.
2. `docs/ai/product-requirements.md` — הכללים.
3. `docs/ai/current-state.md` — מה קיים.
4. `docs/ai/architecture.md` — איך בנוי.
5. `docs/ai/data-model.md` — מה השדות.
6. `docs/ai/decisions.md` — למה הוחלט ככה.
7. `docs/ai/open-tasks.md` — מה הבא.
8. `docs/ai/risks.md` — ממה להיזהר.

רק אחרי — בצע שינוי.
