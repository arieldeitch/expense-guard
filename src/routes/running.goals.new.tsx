/** יצירת יעד ריצה. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { GoalForm } from "@/components/goals/GoalForm";

export const Route = createFileRoute("/running/goals/new")({
  head: () => ({ meta: [{ title: "יעד ריצה חדש · Fit Log" }] }),
  component: RunningGoalNewPage,
});

function RunningGoalNewPage() {
  const navigate = useNavigate();
  return (
    <AppShell topBar={{ title: "יעד ריצה חדש", back: { to: "/running/goals", label: "יעדי ריצה" } }}>
      <PageHeader eyebrow="ריצה" title="יעד ריצה חדש" description="הגדרת יעד בתוך אזור הריצה." />
      <div className="px-4 sm:px-6">
        <GoalForm
          domain="running"
          onSaved={(id) => navigate({ to: "/running/goals/$id", params: { id } })}
          onCancel={() => navigate({ to: "/running/goals" })}
        />
      </div>
    </AppShell>
  );
}
