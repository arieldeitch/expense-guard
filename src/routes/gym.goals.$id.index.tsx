/** פרטי יעד כוח. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { GoalDetailView } from "@/components/goals/GoalDetailView";
import { useGoal } from "@/lib/goals";

export const Route = createFileRoute("/gym/goals/$id/")({
  head: () => ({ meta: [{ title: "יעד כוח · Fit Log" }] }),
  component: GymGoalDetailPage,
});

function GymGoalDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const goal = useGoal(id);
  return (
    <AppShell topBar={{ title: goal?.name ?? "יעד כוח", back: { to: "/gym/goals", label: "יעדי כוח" } }}>
      <GoalDetailView domain="gym" goalId={id} onTrashed={() => navigate({ to: "/gym/goals" })} />
    </AppShell>
  );
}
