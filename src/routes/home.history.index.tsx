/**
 * /home/history — היסטוריית אימוני בית מבוססת אריחים.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, HistoryIcon, Zap } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { HomeSessionTileWrapper } from "@/components/home/HomeSessionTileWrapper";
import { useHomeSessions } from "@/lib/home";

export const Route = createFileRoute("/home/history/")({
  head: () => ({
    meta: [
      { title: "היסטוריית בית · Fit Log" },
      { name: "description", content: "אריחי אימוני בית עם סינון ומיון." },
      { property: "og:title", content: "היסטוריית בית · Fit Log" },
      { property: "og:description", content: "אריחי אימוני בית עם סינון ומיון." },
    ],
  }),
  component: HistoryPage,
});

type Filter = "all" | "quick" | "template" | "partial";

function HistoryPage() {
  const sessions = useHomeSessions();
  const [filter, setFilter] = useState<Filter>("all");
  const items = useMemo(() => {
    const completed = sessions.filter(
      (s) => s.status === "completed" || s.status === "partial",
    );
    const filtered = completed.filter((s) => {
      if (filter === "quick") return s.is_quick_entry;
      if (filter === "template") return !s.is_quick_entry;
      if (filter === "partial") return s.status === "partial";
      return true;
    });
    return filtered.sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    );
  }, [sessions, filter]);

  return (
    <AppShell topBar={{ title: "היסטוריה", back: { to: "/home" } }}>
      <PageHeader
        eyebrow="בית"
        title="היסטוריה"
        description={`${items.length} רשומות`}
      />

      <div className="mb-3 flex flex-wrap gap-1.5 px-4 sm:px-6">
        {(["all", "quick", "template", "partial"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              "inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-black " +
              (filter === f
                ? "border-home bg-home text-white"
                : "border-border-strong bg-tint text-muted-foreground")
            }
          >
            {LABEL[f]}
          </button>
        ))}
      </div>

      <div className="space-y-2 px-4 sm:px-6">
        {items.length ? (
          items.map((s) => <HomeSessionTileWrapper key={s.id} sessionId={s.id} />)
        ) : (
          <EmptyState
            icon={<HistoryIcon aria-hidden />}
            title="אין רשומות בהיסטוריה"
            description="דיווח מהיר ראשון יופיע כאן."
            action={
              <Link
                to="/home/quick"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-home px-4 text-sm font-bold text-white"
              >
                <Zap className="size-4" aria-hidden />
                דיווח מהיר
              </Link>
            }
          />
        )}
      </div>
    </AppShell>
  );
}

const LABEL: Record<Filter, string> = {
  all: "הכל",
  quick: "מהירים",
  template: "מלאים",
  partial: "חלקיים",
};
