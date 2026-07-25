/** פרטי יעד ריצה. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { GoalDetailView } from "@/components/goals/GoalDetailView";
import { useGoal } from "@/lib/goals";

export const Route = createFileRoute("/running/goals/$id/")({
  head: () => ({ meta: [{ title: "יעד ריצה · Fit Log" }] }),
  component: RunningGoalDetailPage,
});

function RunningGoalDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const goal = useGoal(id);
  return (
    <AppShell topBar={{ title: goal?.name ?? "יעד ריצה", back: { to: "/running/goals", label: "יעדי ריצה" } }}>
      <GoalDetailView
        domain="running"
        goalId={id}
        onTrashed={() => navigate({ to: "/running/goals" })}
      />
    </AppShell>
  );
}
