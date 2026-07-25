/**
 * /goals/$id — COMPATIBILITY ROUTE בלבד (deprecated).
 *
 * טוען את היעד, מזהה את goal.domain, ומפנה לפרטי היעד בתוך התחום.
 * יעד חסר → 404 בעברית. אין redirect loop (היעד מפנה ל-route תוכן, לא ל-redirect).
 */
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { useGoal } from "@/lib/goals";
import { GoalDetailRedirect } from "@/components/goals/goalLinks";

export const Route = createFileRoute("/goals/$id")({
  head: () => ({ meta: [{ title: "יעד · Fit Log" }] }),
  component: GoalDetailCompatPage,
});

function GoalDetailCompatPage() {
  const { id } = Route.useParams();
  const goal = useGoal(id);

  if (!goal) {
    return (
      <AppShell topBar={{ title: "יעד לא נמצא", back: { to: "/", label: "מסך ראשי" } }}>
        <PageHeader
          title="היעד לא נמצא"
          description="ייתכן שהיעד נמחק או שהמזהה שגוי."
        />
      </AppShell>
    );
  }

  return <GoalDetailRedirect domain={goal.domain} id={goal.id} />;
}
