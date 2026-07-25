/** עריכת יעד בית. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { GoalForm } from "@/components/goals/GoalForm";

export const Route = createFileRoute("/home/goals/$id/edit")({
  head: () => ({ meta: [{ title: "עריכת יעד בית · Fit Log" }] }),
  component: HomeGoalEditPage,
});

function HomeGoalEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  return (
    <AppShell topBar={{ title: "עריכת יעד", back: { to: "/home/goals", label: "יעדי בית" } }}>
      <PageHeader eyebrow="בית" title="עריכת יעד בית" />
      <div className="px-4 sm:px-6">
        <GoalForm
          domain="home"
          goalId={id}
          onSaved={(gid) => navigate({ to: "/home/goals/$id", params: { id: gid } })}
          onCancel={() => navigate({ to: "/home/goals/$id", params: { id } })}
        />
      </div>
    </AppShell>
  );
}
