/** יעדי חדר כושר — רשימה בתוך אזור חדר הכושר (אין מסך יעדים גלובלי). */
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { GoalsListView } from "@/components/goals/GoalsListView";

export const Route = createFileRoute("/gym/goals")({
  head: () => ({
    meta: [
      { title: "יעדי כוח · Fit Log" },
      { name: "description", content: "יעדי כוח בחדר כושר שהוגדרו על ידך — בתוך אזור חדר הכושר." },
    ],
  }),
  component: GymGoalsPage,
});

function GymGoalsPage() {
  return (
    <AppShell topBar={{ title: "יעדי כוח", back: { to: "/gym", label: "חדר כושר" } }}>
      <PageHeader
        eyebrow="חדר כושר"
        title="יעדי כוח"
        description="כל יעד מוגדר על ידך. אין המצאה של יעדים או ערכים."
      />
      <GoalsListView domain="gym" />
    </AppShell>
  );
}
