import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { RunForm } from "@/components/runs/RunForm";
import { RUN_TYPE_LABELS, runsRepo, useRun } from "@/lib/runs";
import { useHydrated } from "@/lib/storage/useHydrated";

export const Route = createFileRoute("/running/$id/edit")({
  head: () => ({
    meta: [
      { title: "עריכת ריצה · Fit Log" },
      { name: "description", content: "עריכת סשן ריצה שמור." },
      { property: "og:title", content: "עריכת ריצה · Fit Log" },
      { property: "og:description", content: "עריכת סשן ריצה שמור." },
    ],
  }),
  loader: ({ params }) => {
    // The draft URL (`/running/{id}/edit`) must survive a refresh: no server-side 404 (R-43).
    if (typeof window === "undefined") return { id: params.id };
    const r = runsRepo.getRun(params.id);
    if (!r) throw notFound();
    return { id: params.id };
  },
  component: EditRunPage,
});

function EditRunPage() {
  const { id } = Route.useLoaderData();
  const hydrated = useHydrated();
  const run = useRun(id);
  // ראה ADR-0039 — אין לזרוק notFound() ב-render של השרת (אין שם localStorage).
  if (!hydrated) return null;
  if (!run) throw notFound();
  return (
    <AppShell
      topBar={{
        title: `עריכה · ${RUN_TYPE_LABELS[run.run_type]}`,
        back: { to: `/running/${run.id}`, label: "חזרה" },
      }}
    >
      <PageHeader
        eyebrow="עריכה"
        title={RUN_TYPE_LABELS[run.run_type]}
        description="השינויים נשמרים אוטומטית."
      />
      <RunForm runType={run.run_type} existing={run} />
    </AppShell>
  );
}
