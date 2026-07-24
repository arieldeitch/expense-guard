# Change Log

פורמט: `YYYY-MM-DD` · שכבה · תיאור קצר · קישור להחלטה אם רלוונטי.

## 2026-07-24

- **docs** · נוצר `docs/ai/` — product-requirements, product-overview, current-state, architecture, data-model, decisions, open-tasks, risks, benchmark, prompts, change-log, test-plan.
- **docs** · `AGENTS.md` הורחב עם הנחיות מחייבות לסוכנים עתידיים.
- **scan** · סריקה ראשונה של הפרויקט: תבנית Lovable/TanStack Start ריקה + shadcn UI (46 primitives). אין קוד מוצר, אין Supabase, אין auth, אין דאטה. אין שגיאות build/lint/typecheck.
- **decisions** · ADR-0001 עד ADR-0013 (ראה `decisions.md`).
- **no code changes** · לא בוצעו שינויי קוד מוצריים בסריקה הזו — לא נמצאו imports שבורים / routes שבורים / TS errors / typos שמונעים build.
