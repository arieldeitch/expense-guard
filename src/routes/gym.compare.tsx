/**
 * /gym/compare — השוואה בין שני אימונים דומים.
 */
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Tile, TileLabel, TileFootnote } from "@/components/tile/Tile";
import { EmptyState } from "@/components/shell/EmptyState";
import { GitCompare } from "lucide-react";
import { useAllSessions } from "@/lib/sessions";
import { useHydrated } from "@/lib/storage/useHydrated";
import { compareSessions, listSessionHistory } from "@/lib/analytics";

interface Search {
  a?: string;
  b?: string;
}

export const Route = createFileRoute("/gym/compare")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    a: typeof search.a === "string" ? search.a : undefined,
    b: typeof search.b === "string" ? search.b : undefined,
  }),
  head: () => ({
    meta: [
      { title: "השוואת אימונים · Fit Log" },
      { name: "description", content: "השוואה עובדתית בין שני אימוני כוח." },
    ],
  }),
  component: CompareRoute,
});

function CompareRoute() {
  useAllSessions();
  // ראה ADR-0039 — קריאה ישירה ל-repository נדחית עד אחרי ה-hydration.
  const hydrated = useHydrated();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const history = hydrated ? listSessionHistory({}, "date_desc") : [];
  const cmp = hydrated && search.a && search.b ? compareSessions(search.a, search.b) : null;

  return (
    <AppShell topBar={{ title: "השוואת אימונים", back: { to: "/gym/history" } }}>
      <PageHeader
        eyebrow="חדר כושר"
        title="השוואה בין שני אימונים"
        description="בחר אימון קודם ואימון נוכחי. משווה רק מדדים בני־השוואה."
      />
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        <SessionPicker
          label="אימון קודם"
          value={search.b ?? ""}
          options={history}
          onChange={(v) =>
            navigate({ search: (s: Search) => ({ ...s, b: v || undefined }) })
          }
        />
        <SessionPicker
          label="אימון נוכחי"
          value={search.a ?? ""}
          options={history}
          onChange={(v) =>
            navigate({ search: (s: Search) => ({ ...s, a: v || undefined }) })
          }
        />
      </div>

      {!cmp ? (
        <div className="px-4 sm:px-6">
          <EmptyState
            icon={<GitCompare aria-hidden />}
            title="בחר שני אימונים להשוואה"
            description="הבחירה שומרת על סדר: משמאל = אימון קודם, מימין = אימון נוכחי."
          />
        </div>
      ) : (
        <div className="space-y-3 px-4 sm:px-6">
          <Tile>
            <TileLabel>סיכום השוואה</TileLabel>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="font-bold">אימון קודם</div>
              <div className="font-bold">שינוי</div>
              <div className="font-bold">אימון נוכחי</div>
            </div>
            <ul className="mt-2 space-y-1">
              {cmp.metrics.map((m) => (
                <li
                  key={m.id}
                  className="grid grid-cols-3 items-center gap-2 rounded-xl border border-border-strong bg-surface p-2 text-sm"
                >
                  <div className="ltr-nums text-center">{m.b ?? "—"}</div>
                  <div className="text-center text-xs">
                    <div className="font-bold">{m.label}</div>
                    {m.comparable && m.delta != null ? (
                      <div
                        className={
                          m.delta > 0
                            ? "text-success"
                            : m.delta < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }
                      >
                        {m.delta > 0 ? "+" : ""}
                        {m.delta}
                        {m.deltaPercent != null ? ` (${m.deltaPercent}%)` : ""}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">אין השוואה</div>
                    )}
                  </div>
                  <div className="ltr-nums text-center">{m.a ?? "—"}</div>
                </li>
              ))}
            </ul>
          </Tile>
          <Tile>
            <TileLabel>תרגילים משותפים ושונים</TileLabel>
            <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="font-bold">בשניהם</div>
                <div className="ltr-nums text-2xl font-black">{cmp.sharedExerciseIds.length}</div>
              </div>
              <div>
                <div className="font-bold">רק בקודם</div>
                <div className="ltr-nums text-2xl font-black">{cmp.onlyInB.length}</div>
              </div>
              <div>
                <div className="font-bold">רק בנוכחי</div>
                <div className="ltr-nums text-2xl font-black">{cmp.onlyInA.length}</div>
              </div>
            </div>
            <TileFootnote className="mt-2 text-[11px]">
              ההשוואה נעשית על סטי עבודה בלבד. סטי חימום, drop sets, וחוסר יחידה אחידה מוחרגים.
            </TileFootnote>
          </Tile>
        </div>
      )}
    </AppShell>
  );
}

function SessionPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReturnType<typeof listSessionHistory>;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-bold">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border-strong bg-surface p-2"
      >
        <option value="">—</option>
        {options.map((t) => (
          <option key={t.session.id} value={t.session.id}>
            {new Date(t.session.started_at).toLocaleDateString("he-IL")} — {t.session.name}
          </option>
        ))}
      </select>
    </label>
  );
}
