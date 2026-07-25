# Migration Plan — תוכנית מדורגת

עודכן: 2026-07-24. עיקרון-על: **build/typecheck/tests ירוקים בכל שלב**, ללא big-bang, ללא מחיקה מוקדמת, כל שלב הפיך.

> **הקשר מפתיע מה-audit:** רוב הפיצ'רים של שלושת התחומים **כבר ממומשים** (localStorage + 150 tests). לכן זו אינה תוכנית "בנייה מאפס" אלא בעיקר **(א) יישור משטחי UI חסרים, (ב) מעבר persistence ל-Supabase, (ג) תשתיות עתידיות (auth/RLS/audit/AI/export)**. השלבים המקוריים 3–10 ("בנה כל תחום") כבר נעשו במידה רבה — הם מסומנים ✅ (בנוי) והפעולה בהם היא verify/adapt, לא build.

## מקרא
- **A** = אוטונומי (בטוח, הפיך). **D** = דורש החלטת משתמש. **$** = עלות/אישור חיצוני.

## Phase 0 — Baseline &amp; Source of Truth `[A]` ✅ (המסמך הזה)
- verify typecheck/lint/test/build; יצירת `docs/ai/*` (route/entity/design/alignment/migration/test).
- **Acceptance:** baseline מתועד; מטריצת alignment קיימת. **Rollback:** מחיקת קבצי docs חדשים.

## Phase 1 — Navigation &amp; Domain Alignment `[A/D]` — ✅ **הושלם 2026-07-24**
- ✅ 404/Error לעברית+RTL. ✅ goals surface הוכרע (domain-scoped, ראה Phase 9). ✅ אין overflow.
- **Acceptance מולא:** 404/Error עברית; 12 domain-goals routes; `/goals*` compat.

## Phase 2 — Domain Model Foundations `[A]` — ✅ **הושלם 2026-07-24 (חלק trash)**
- ✅ **restore ל-gym/home sessions + goals ב-`/trash`** (שחזור דו-שלבי; recompute דרך subscribers).
- ⏳ נותר (עתידי): איחוד naming `owner_id` מול `user_id`.
- **Acceptance מולא:** כל 3 הישויות ניתנות לשחזור מ-`/trash`; בדיקות `trash-restore.test.ts` ירוקות.

## Phase 3 — Locations, Treadmills, Equipment `[A]` ✅ בנוי
- verify `catalog/` + `/locations*` + `/treadmills/$id`. **פעולה:** בדיקות + polish. **Acceptance:** CRUD+trash עובד.

## Phase 4 — Running `[A]` ✅ בנוי
- verify `runs/` + 8 routes. **Acceptance:** ריצה חוץ/הליכון נשמרת/נערכת/מוצגת.

## Phase 5 — Suunto Comparison `[A/D]` ✅ בנוי (מנוע)
- verify `suunto/` + כיול + `treadmills.$id`. **חסר:** ייבוא קובץ. **החלטה D:** פורמט ייבוא (GPX/FIT/CSV). **Acceptance:** raw נשמר נפרד; פקטור מוצע בלי לשנות raw.

## Phase 6 — Exercise Library &amp; Media `[A/$]` ✅ בנוי (ספרייה)
- verify `exercises/` + seed. **חסר:** מדיה אמיתית (bucket + signed URL) — כרגע data-URL inline. **`$`:** Storage bucket = חלק מ-Supabase (Phase 12).
- **Acceptance:** חיפוש/CRUD/חלופות עובד; מדיה נשארת inline עד Phase 12.

## Phase 7 — Gym Templates &amp; Active Sessions `[A]` ✅ בנוי
- verify `templates/` + `sessions/` + `sessions.$id` (autosave/סופרסט/מנוחה/החלפה). **Acceptance:** אימון פעיל נשמר תוך כדי; snapshot קפוא.

## Phase 8 — Home Quick Entry `[A]` ✅ בנוי
- verify `home/` + `/home/quick*` + `home.sessions.$id`. **Acceptance:** דיווח מהיר + סטים גמישים (round/side).

## Phase 9 — Goals `[D]` — ✅ **הושלם 2026-07-24**
- ✅ הוכרע (א): יעדים בתוך כל תחום. 12 domain-goals routes + `DomainPrimaryGoalTile` מחובר ל-3 המסכים. `/goals*` = compat redirects (DEPRECATE_LATER, לא נמחקו).
- **Acceptance מולא:** יעד מוצג בהקשר התחום; אין מסך גלובלי; אין סתירה ל-§6. ADR-0021.

## Phase 10 — History &amp; Analytics `[A]` ✅ בנוי
- verify `analytics/` + `*.history*` + `gym.compare`. **חסר:** dashboards גרפיים + export CSV/JSON. **Acceptance:** חישובים מוסברים; 1RM=estimated.

## Phase 11 — Persistence Abstraction `[A]`
- הרחב את חוזה `Repository` (`lib/repo`) לכסות CRUD פר-domain (כרגע read-only façade). הכנס adapter layer כך שכל domain repo מאחורי interface אחיד → מאפשר החלפת mock↔supabase בלי לגעת ב-UI.
- **Acceptance:** UI צורך רק interface; `activeRepoKind` מחליף מימוש. **Rollback:** interface אופציונלי. **Deps:** אין. **קריטי לפני Phase 12.**

## Phase 12 — Supabase / Auth / RLS `[$/D]` — **דורש Approval Brief (CLAUDE.md)**
- **`$` אישור מפורש:** הפעלת Lovable Cloud (יוצר פרויקט Supabase). לפני כל שינוי כאן — **Approval Brief** לפי הכלל הגלובלי.
- migrations לפי `data-model.md`: GRANT + `ENABLE RLS` + policies (USING **ו-**WITH CHECK, `auth.uid()=owner_id`) + indexes + `updated_at` trigger, לכל טבלה.
- Auth email+password (ADR-0004), `_authenticated/route.tsx` (integration-managed), `functionMiddleware` bearer.
- data migration: localStorage → Supabase (one-time import script פר-owner).
- Storage bucket פרטי למדיה + signed URLs; `audit_log` אמיתי.
- **Acceptance:** RLS פעיל לכל טבלה; אין service_role ב-client bundle; דאטה נשמרת בשרת; backups פעילים. **Rollback:** feature flag `RepoKind` חוזר ל-mock; migrations עם DOWN.
- **Deps:** אישור משתמש + Phase 11.

## Phase 13 — AI Agents `[$/D]`
- `ai_suggestions` (pending/accepted/rejected) + approval flow. AI **לא** משנה דאטה/יעד בלי אישור (§5).
- **`$`:** שירות AI — Lovable AI Gateway (ללא חיוב חיצוני) או אישור מפורש. **Acceptance:** כל הצעת AI עוברת approval.

## Phase 14 — Hardening &amp; Cleanup `[A]`
- גיזום shadcn primitives לא בשימוש (command/menubar/navigation-menu/sidebar/carousel/resizable/chart-recharts) — **רק אחרי** אישור שאינם נחוצים.
- קידום `IconButton`/`StatusBadge` ל-primitives משותפים; אימוץ עקבי של `FormField`.
- `.gitattributes` (`* text=auto eol=lf`) לפתרון CRLF (ראה `risks.md` R-17) — דורש renormalize מכוון.
- שם repo/תיקייה `expense-guard` → שם תואם-מוצר (החלטה D, השפעה על Lovable sync).
- **Acceptance:** lint נקי על LF; אין dead weight. **Rollback:** revert גיזום.

## מה אוטונומי מול מה שדורש החלטה
- **אוטונומי עכשיו:** Phase 0 (✅), 1 (copy), 2 (trash wiring), verify של 3–8,10, Phase 11 (abstraction), 14 (חלקי).
- **דורש החלטת משתמש:** Phase 9 (goals surface), Phase 5 (פורמט ייבוא), Phase 14 (שם repo).
- **דורש אישור עלות + Approval Brief:** Phase 12 (Supabase/Auth/RLS), Phase 13 (AI).
