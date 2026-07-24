/**
 * חלופה ל־/goals/new שמפנה לטופס יצירה עם domain מוקצה מראש.
 */
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod";

const search = z.object({
  domain: z.enum(["running", "gym", "home"]).optional(),
});

export const Route = createFileRoute("/goals/new")({
  validateSearch: search,
  component: () => {
    const s = Route.useSearch();
    return <Navigate to="/goals" search={{ domain: s.domain }} replace />;
  },
});
