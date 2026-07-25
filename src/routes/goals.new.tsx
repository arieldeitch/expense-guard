/**
 * /goals/new — COMPATIBILITY ROUTE בלבד (deprecated).
 *
 * עם ?domain= → redirect ליצירת יעד בתחום. ללא domain → בחירת תחום קומפקטית.
 * אין יצירת יעד כאן; היעד נוצר רק בטופס התחומי לאחר שהמשתמש אישר.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { GoalDomainChooser } from "@/components/goals/GoalDomainChooser";
import { GoalNewRedirect } from "@/components/goals/goalLinks";

const searchSchema = z.object({
  domain: z.enum(["running", "gym", "home"]).optional(),
});

export const Route = createFileRoute("/goals/new")({
  head: () => ({ meta: [{ title: "יעד חדש · Fit Log" }] }),
  validateSearch: searchSchema,
  component: GoalNewCompatPage,
});

function GoalNewCompatPage() {
  const { domain } = Route.useSearch();
  if (domain) return <GoalNewRedirect domain={domain} />;

  return (
    <AppShell topBar={{ title: "יעד חדש", back: { to: "/", label: "מסך ראשי" } }}>
      <PageHeader
        eyebrow="בחירת תחום"
        title="יעד חדש"
        description="בחר את התחום שבו ייווצר היעד."
      />
      <GoalDomainChooser mode="new" />
    </AppShell>
  );
}
