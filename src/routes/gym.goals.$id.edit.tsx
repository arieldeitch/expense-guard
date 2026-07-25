/** עריכת יעד כוח. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { GoalForm } from "@/components/goals/GoalForm";

export const Route = createFileRoute("/gym/goals/$id/edit")({
  head: () => ({ meta: [{ title: "עריכת יעד כוח · Fit Log" }] }),
  component: GymGoalEditPage,
});

function GymGoalEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  return (
    <AppShell topBar={{ title: "עריכת יעד", back: { to: "/gym/goals", label: "יעדי כוח" } }}>
      <PageHeader eyebrow="חדר כושר" title="עריכת יעד כוח" />
      <div className="px-4 sm:px-6">
        <GoalForm
          domain="gym"
          goalId={id}
          onSaved={(gid) => navigate({ to: "/gym/goals/$id", params: { id: gid } })}
          onCancel={() => navigate({ to: "/gym/goals/$id", params: { id } })}
        />
      </div>
    </AppShell>
  );
}
