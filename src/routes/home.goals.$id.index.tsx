/** פרטי יעד בית. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { GoalDetailView } from "@/components/goals/GoalDetailView";
import { useGoal } from "@/lib/goals";

export const Route = createFileRoute("/home/goals/$id/")({
  head: () => ({ meta: [{ title: "יעד בית · Fit Log" }] }),
  component: HomeGoalDetailPage,
});

function HomeGoalDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const goal = useGoal(id);
  return (
    <AppShell topBar={{ title: goal?.name ?? "יעד בית", back: { to: "/home/goals", label: "יעדי בית" } }}>
      <GoalDetailView domain="home" goalId={id} onTrashed={() => navigate({ to: "/home/goals" })} />
    </AppShell>
  );
}
