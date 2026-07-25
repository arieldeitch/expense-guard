/** עריכת יעד ריצה. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { GoalForm } from "@/components/goals/GoalForm";

export const Route = createFileRoute("/running/goals/$id/edit")({
  head: () => ({ meta: [{ title: "עריכת יעד ריצה · Fit Log" }] }),
  component: RunningGoalEditPage,
});

function RunningGoalEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  return (
    <AppShell topBar={{ title: "עריכת יעד", back: { to: "/running/goals", label: "יעדי ריצה" } }}>
      <PageHeader eyebrow="ריצה" title="עריכת יעד ריצה" />
      <div className="px-4 sm:px-6">
        <GoalForm
          domain="running"
          goalId={id}
          onSaved={(gid) => navigate({ to: "/running/goals/$id", params: { id: gid } })}
          onCancel={() => navigate({ to: "/running/goals/$id", params: { id } })}
        />
      </div>
    </AppShell>
  );
}
