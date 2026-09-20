import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Input } from "@/components/ui/input";
import { Tile } from "@/components/tile/Tile";
import { useAllRuns, formatDurationHMS } from "@/lib/runs";
import { useAllSessions } from "@/lib/sessions";
import { useHomeSessions } from "@/lib/home";

export const Route = createFileRoute("/history")({ component: History });
function History() {
  const runs = useAllRuns();
  const gym = useAllSessions();
  const home = useHomeSessions();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const items = [
    ...runs.map((r) => ({
      ...r,
      domain: "run",
      name: r.run_type === "treadmill" ? "ריצה על הליכון" : "ריצה בחוץ",
      partner: "",
    })),
    ...gym.map((s) => ({ ...s, domain: "gym", partner: "" })),
    ...home.map((s) => ({ ...s, domain: "home", partner: s.training_partner ?? "" })),
  ]
    .filter(
      (s) =>
        !s.deleted_at &&
        s.status !== "trashed" &&
        (filter === "all" || s.domain === filter) &&
        `${s.name} ${s.partner} ${s.notes ?? ""} ${s.started_at}`.includes(query.trim()),
    )
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
  return (
    <AppShell topBar={{ title: "כל ההיסטוריה", back: { to: "/" } }}>
      <PageHeader
        title="כל האימונים במקום אחד"
        description="ריצות, פק״ל בבית ואימוני מכון — כולל טיוטות שאפשר להמשיך"
      />
      <div className="space-y-3 px-4 sm:px-6">
        <label className="block text-sm">
          חיפוש לפי שם, תאריך או הערה
          <Input value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "הכול"],
            ["run", "ריצה"],
            ["home", "פק״ל בבית"],
            ["gym", "מכון"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-11 rounded-xl border px-3 ${filter === value ? "bg-primary text-primary-foreground" : "bg-surface"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm">{items.length} אימונים</p>
        {items.length === 0 && (
          <p>אין אימונים שמתאימים לחיפוש. דיווחים חדשים יופיעו כאן אוטומטית.</p>
        )}
        {items.map((s) => (
          <Tile key={`${s.domain}-${s.id}`}>
            <h2 className="font-bold">{s.name}</h2>
            <p className="text-sm">
              {new Date(s.started_at).toLocaleString("he-IL")} ·{" "}
              {formatDurationHMS(s.duration_seconds)}
            </p>
            <p className="text-sm">
              {s.status === "completed"
                ? "הושלם"
                : s.status === "partial"
                  ? "אימון חלקי"
                  : "טיוטה / לא הושלם"}
              {s.partner ? ` · יחד עם ${s.partner}` : ""}
            </p>
            {s.domain === "run" ? (
              <Link
                className="inline-flex min-h-11 items-center underline"
                to="/running/$id"
                params={{ id: s.id }}
              >
                פתח ריצה
              </Link>
            ) : s.domain === "home" ? (
              <Link
                className="inline-flex min-h-11 items-center underline"
                to="/home/sessions/$id"
                params={{ id: s.id }}
              >
                פתח פק״ל
              </Link>
            ) : (
              <Link
                className="inline-flex min-h-11 items-center underline"
                to="/gym/history/$id"
                params={{ id: s.id }}
              >
                פתח אימון מכון
              </Link>
            )}
          </Tile>
        ))}
      </div>
    </AppShell>
  );
}
