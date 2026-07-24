/**
 * מסך יעדים גלובלי — רשימת כל היעדים + טופס יצירה מינימלי.
 * נגיש דרך /goals עם ?domain= לפילטור לפי תחום.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";
import { Target } from "lucide-react";
import {
  useAllGoals,
  listGoalTypesByDomain,
  createGoal,
  type GoalDomain,
  type GoalType,
} from "@/lib/goals";

const DOMAIN_LABEL: Record<GoalDomain, string> = {
  running: "ריצה",
  gym: "חדר כושר",
  home: "בית",
};

const searchSchema = z.object({
  domain: z.enum(["running", "gym", "home"]).optional(),
});

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "יעדים · Fit Log" },
      { name: "description", content: "ניהול יעדים אישיים לריצה, חדר כושר וכוח בבית." },
      { property: "og:title", content: "יעדים · Fit Log" },
      { property: "og:description", content: "ניהול יעדים אישיים." },
    ],
  }),
  validateSearch: searchSchema,
  component: GoalsPage,
});

function GoalsPage() {
  const { domain } = Route.useSearch();
  const all = useAllGoals();
  const goals = domain ? all.filter((g) => g.domain === domain) : all;

  return (
    <AppShell topBar={{ title: "יעדים", back: { to: "/", label: "חזרה" } }}>
      <PageHeader
        eyebrow="ניהול"
        title="יעדים"
        description="כל יעד מוגדר על ידך. אין המצאה של יעדים או ערכים."
      />

      <div className="flex flex-wrap gap-2 px-4 sm:px-6">
        <FilterLink to="/goals" active={!domain} label="הכל" />
        <FilterLink to="/goals" search={{ domain: "running" }} active={domain === "running"} label="ריצה" />
        <FilterLink to="/goals" search={{ domain: "gym" }} active={domain === "gym"} label="חדר כושר" />
        <FilterLink to="/goals" search={{ domain: "home" }} active={domain === "home"} label="בית" />
      </div>

      <SectionHeader title="יצירת יעד חדש" />
      <div className="px-4 sm:px-6">
        <GoalCreateForm defaultDomain={domain ?? "running"} />
      </div>

      <SectionHeader title={`יעדים${domain ? ` — ${DOMAIN_LABEL[domain as GoalDomain]}` : ""}`} />
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        {goals.length === 0 ? (
          <EmptyState
            icon={<Target aria-hidden />}
            title="אין יעדים"
            description="הוסף יעד חדש למעלה."
          />
        ) : (
          goals.map((g) => (
            <Link key={g.id} to="/goals/$id" params={{ id: g.id }}>
              <Tile variant="goal" tone="soft" interactive>
                <TileLabel>
                  {DOMAIN_LABEL[g.domain]} · {g.status}
                </TileLabel>
                <TileMetric
                  value={g.target_value != null ? `${g.target_value} ${g.target_unit}` : "—"}
                />
                <TileFootnote>{g.name}</TileFootnote>
              </Tile>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}

function FilterLink({
  to,
  search,
  active,
  label,
}: {
  to: string;
  search?: { domain: GoalDomain };
  active: boolean;
  label: string;
}) {
  return (
    <Link
      to={to}
      search={search ?? {}}
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function GoalCreateForm({ defaultDomain }: { defaultDomain: GoalDomain }) {
  const navigate = useNavigate();
  const [domain, setDomain] = useState<GoalDomain>(defaultDomain);
  const [type, setType] = useState<GoalType>(listGoalTypesByDomain(domain)[0].id);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [baseline, setBaseline] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const types = listGoalTypesByDomain(domain);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    const g = createGoal({
      domain,
      goal_type: type,
      name: name || undefined,
      target_value: Number(target),
      baseline_value: baseline ? Number(baseline) : null,
      target_date: targetDate || null,
    });
    navigate({ to: "/goals/$id", params: { id: g.id } });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-border-strong bg-surface p-4"
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-bold text-muted-foreground">תחום</span>
          <select
            value={domain}
            onChange={(e) => {
              const d = e.target.value as GoalDomain;
              setDomain(d);
              setType(listGoalTypesByDomain(d)[0].id);
            }}
            className="w-full rounded-lg border border-border-strong bg-background p-2"
          >
            <option value="running">ריצה</option>
            <option value="gym">חדר כושר</option>
            <option value="home">בית</option>
          </select>
        </label>
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
      </div>
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
            className="w-full rounded-lg border border-border-strong bg-background p-2 ltr-nums"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-bold text-muted-foreground">baseline (אם רלוונטי)</span>
          <input
            type="number"
            step="any"
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            className="w-full rounded-lg border border-border-strong bg-background p-2 ltr-nums"
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
          className="w-full rounded-lg border border-border-strong bg-background p-2 ltr-nums"
        />
      </label>
      <button
        type="submit"
        className="tile-interactive inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
      >
        יצירת יעד
      </button>
    </form>
  );
}
