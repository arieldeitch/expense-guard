/**
 * /goals — COMPATIBILITY ROUTE בלבד (deprecated).
 *
 * החלטת מוצר: אין מסך יעדים גלובלי בחוויית המשתמש. יעדים מנוהלים בתוך כל תחום.
 * route זה אינו מופיע בניווט. אינו מציג רשימה גלובלית/משולבת.
 * עם ?domain= → redirect לרשימת התחום. ללא domain → בחירת תחום קומפקטית (3 אריחים).
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { GoalDomainChooser } from "@/components/goals/GoalDomainChooser";
import { GoalListRedirect } from "@/components/goals/goalLinks";

const searchSchema = z.object({
  domain: z.enum(["running", "gym", "home"]).optional(),
});

export const Route = createFileRoute("/goals/")({
  head: () => ({
    meta: [
      { title: "יעדים · Fit Log" },
      { name: "description", content: "יעדים מנוהלים בתוך כל תחום אימון." },
    ],
  }),
  validateSearch: searchSchema,
  component: GoalsCompatPage,
});

function GoalsCompatPage() {
  const { domain } = Route.useSearch();
  if (domain) return <GoalListRedirect domain={domain} />;

  return (
    <AppShell topBar={{ title: "יעדים", back: { to: "/", label: "מסך ראשי" } }}>
      <PageHeader
        eyebrow="בחירת תחום"
        title="יעדים לפי תחום"
        description="יעדים מנוהלים בתוך כל תחום. בחר תחום להצגת היעדים שלו."
      />
      <GoalDomainChooser mode="list" />
    </AppShell>
  );
}
