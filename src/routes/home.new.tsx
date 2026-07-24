/**
 * /home/new — נשאר לתאימות. מפנה ל־/home/quick.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/home/new")({
  beforeLoad: () => {
    throw redirect({ to: "/home/quick" });
  },
  component: () => null,
});
