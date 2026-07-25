/** יעדי ריצה — רשימה בתוך אזור הריצה (אין מסך יעדים גלובלי). */
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { GoalsListView } from "@/components/goals/GoalsListView";

export const Route = createFileRoute("/running/goals/")({
  head: () => ({
    meta: [
      { title: "יעדי ריצה · Fit Log" },
      { name: "description", content: "יעדי ריצה שהוגדרו על ידך — בתוך אזור הריצה." },
    ],
  }),
  component: RunningGoalsPage,
});

function RunningGoalsPage() {
  return (
    <AppShell topBar={{ title: "יעדי ריצה", back: { to: "/running", label: "ריצה" } }}>
      <PageHeader
        eyebrow="ריצה"
        title="יעדי ריצה"
        description="כל יעד מוגדר על ידך. אין המצאה של יעדים או ערכים."
      />
      <GoalsListView domain="running" />
    </AppShell>
  );
}
