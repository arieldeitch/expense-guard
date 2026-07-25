/**
 * GoalForm — יצירה/עריכה של יעד בתוך תחום נעול.
 *
 * ה-domain נעול (מגיע מה-route התחומי) ולכן רשימת סוגי היעד מוגבלת ל-
 * `listGoalTypesByDomain(domain)` בלבד — route ריצה לא יציע יעד שכיבות סמיכה וכו'.
 * המשתמש בלבד מזין ערך/תאריך; אין המצאת ערכי ברירת מחדל ליעד.
 */
import { useState } from "react";
import {
  listGoalTypesByDomain,
  createGoal,
  updateGoal,
  useGoal,
  type GoalDomain,
  type GoalType,
} from "@/lib/goals";
import { GOAL_DOMAIN_LABEL } from "./goalDomainConfig";

interface Props {
  domain: GoalDomain;
  /** אם קיים — מצב עריכה. */
  goalId?: string;
  onSaved: (goalId: string) => void;
  onCancel?: () => void;
}

export function GoalForm({ domain, goalId, onSaved, onCancel }: Props) {
  const editing = useGoal(goalId);
  const types = listGoalTypesByDomain(domain);

  const [type, setType] = useState<GoalType>(editing?.goal_type ?? types[0].id);
  const [name, setName] = useState(editing?.name ?? "");
  const [target, setTarget] = useState(
    editing?.target_value != null ? String(editing.target_value) : "",
  );
  const [baseline, setBaseline] = useState(
    editing?.baseline_value != null ? String(editing.baseline_value) : "",
  );
  const [targetDate, setTargetDate] = useState(editing?.target_date ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    if (goalId && editing) {
      updateGoal(
        goalId,
        {
          goal_type: type,
          name: name.trim() || undefined,
          target_value: Number(target),
          baseline_value: baseline ? Number(baseline) : null,
          target_date: targetDate || null,
        },
        "עריכת יעד ע\"י המשתמש",
      );
      onSaved(goalId);
      return;
    }
    const g = createGoal({
      domain,
      goal_type: type,
      name: name || undefined,
      target_value: Number(target),
      baseline_value: baseline ? Number(baseline) : null,
      target_date: targetDate || null,
    });
    onSaved(g.id);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-border-strong bg-surface p-4"
    >
      <div className="text-xs font-bold text-muted-foreground">
        תחום: {GOAL_DOMAIN_LABEL[domain]}
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-bold text-muted-foreground">סוג יעד</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as GoalType)}
          className="w-full rounded-lg border border-border-strong bg-background p-2"
        >
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label_he}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-bold text-muted-foreground">שם (אופציונלי)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border-strong bg-background p-2"
          placeholder="השאר ריק לשם ברירת מחדל"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-bold text-muted-foreground">ערך יעד</span>
          <input
            type="number"
            step="any"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
            className="ltr-nums w-full rounded-lg border border-border-strong bg-background p-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-bold text-muted-foreground">
            baseline (אם רלוונטי)
          </span>
          <input
            type="number"
            step="any"
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            className="ltr-nums w-full rounded-lg border border-border-strong bg-background p-2"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-bold text-muted-foreground">
          תאריך יעד (אופציונלי)
        </span>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="ltr-nums w-full rounded-lg border border-border-strong bg-background p-2"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          className="tile-interactive inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
        >
          {goalId ? "שמירת שינויים" : "יצירת יעד"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold"
          >
            ביטול
          </button>
        ) : null}
      </div>
    </form>
  );
}
