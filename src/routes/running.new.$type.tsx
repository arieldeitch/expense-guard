import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { RunForm } from "@/components/runs/RunForm";
import { RUN_TYPE_LABELS } from "@/lib/runs";
import type { RunType } from "@/lib/runs";

export const Route = createFileRoute("/running/new/$type")({
  head: ({ params }) => ({
    meta: [
      { title: `ריצה חדשה · ${params.type === "treadmill" ? "הליכון" : "חוץ"} · Fit Log` },
      { name: "description", content: "טופס דיווח ריצה חדשה." },
      { property: "og:title", content: "ריצה חדשה · Fit Log" },
      { property: "og:description", content: "טופס דיווח ריצה חדשה." },
    ],
  }),
  loader: ({ params }) => {
    if (params.type !== "treadmill" && params.type !== "outdoor") throw notFound();
    return { runType: params.type as RunType };
  },
  component: NewRunForm,
});

function NewRunForm() {
  const data = Route.useLoaderData();
  const runType = data.runType as RunType;
  return (
    <AppShell
      topBar={{
        title: `ריצה חדשה · ${RUN_TYPE_LABELS[runType]}`,
        back: { to: "/running/new", label: "חזרה" },
      }}
    >
      <PageHeader
        eyebrow="ריצה חדשה"
        title={RUN_TYPE_LABELS[runType]}
        description="הטופס נשמר כטיוטה אוטומטית."
      />
      <RunForm runType={runType} />
    </AppShell>
  );
}
