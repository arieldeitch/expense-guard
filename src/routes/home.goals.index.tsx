/** יעדי בית — רשימה בתוך אזור הבית (אין מסך יעדים גלובלי). */
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { GoalsListView } from "@/components/goals/GoalsListView";

export const Route = createFileRoute("/home/goals/")({
  head: () => ({
    meta: [
      { title: "יעדי בית · Fit Log" },
      { name: "description", content: "יעדי כוח בבית שהוגדרו על ידך — בתוך אזור הבית." },
    ],
  }),
  component: HomeGoalsPage,
});

function HomeGoalsPage() {
  return (
    <AppShell topBar={{ title: "יעדי בית", back: { to: "/home", label: "בית" } }}>
      <PageHeader
        eyebrow="בית"
        title="יעדי בית"
        description="כל יעד מוגדר על ידך. אין המצאה של יעדים או ערכים."
      />
      <GoalsListView domain="home" />
    </AppShell>
  );
}
