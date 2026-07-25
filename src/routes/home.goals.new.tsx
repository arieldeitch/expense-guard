/** יצירת יעד בית. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { GoalForm } from "@/components/goals/GoalForm";

export const Route = createFileRoute("/home/goals/new")({
  head: () => ({ meta: [{ title: "יעד בית חדש · Fit Log" }] }),
  component: HomeGoalNewPage,
});

function HomeGoalNewPage() {
  const navigate = useNavigate();
  return (
    <AppShell topBar={{ title: "יעד בית חדש", back: { to: "/home/goals", label: "יעדי בית" } }}>
      <PageHeader eyebrow="בית" title="יעד בית חדש" description="הגדרת יעד בתוך אזור הבית." />
      <div className="px-4 sm:px-6">
        <GoalForm
          domain="home"
          onSaved={(id) => navigate({ to: "/home/goals/$id", params: { id } })}
          onCancel={() => navigate({ to: "/home/goals" })}
        />
      </div>
    </AppShell>
  );
}
