/** יצירת יעד כוח. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { GoalForm } from "@/components/goals/GoalForm";

export const Route = createFileRoute("/gym/goals/new")({
  head: () => ({ meta: [{ title: "יעד כוח חדש · Fit Log" }] }),
  component: GymGoalNewPage,
});

function GymGoalNewPage() {
  const navigate = useNavigate();
  return (
    <AppShell topBar={{ title: "יעד כוח חדש", back: { to: "/gym/goals", label: "יעדי כוח" } }}>
      <PageHeader eyebrow="חדר כושר" title="יעד כוח חדש" description="הגדרת יעד בתוך אזור חדר הכושר." />
      <div className="px-4 sm:px-6">
        <GoalForm
          domain="gym"
          onSaved={(id) => navigate({ to: "/gym/goals/$id", params: { id } })}
          onCancel={() => navigate({ to: "/gym/goals" })}
        />
      </div>
    </AppShell>
  );
}
