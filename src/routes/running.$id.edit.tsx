import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { RunForm } from "@/components/runs/RunForm";
import { RUN_TYPE_LABELS, runsRepo, useRun } from "@/lib/runs";

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
    const r = runsRepo.getRun(params.id);
    if (!r) throw notFound();
    return { id: params.id };
  },
  component: EditRunPage,
});

function EditRunPage() {
  const { id } = Route.useLoaderData();
  const run = useRun(id);
  if (!run) return null;
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
