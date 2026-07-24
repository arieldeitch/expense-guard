/**
 * /home/history/$id — פרטי אימון בית שהושלם. עוטף את מסך הסיכום.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/home/history/$id")({
  head: () => ({
    meta: [
      { title: "אימון בית · Fit Log" },
      { name: "description", content: "פרטי אימון בית." },
      { property: "og:title", content: "אימון בית · Fit Log" },
      { property: "og:description", content: "פרטי אימון בית." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/home/sessions/$id/summary", params: { id: params.id } });
  },
  component: () => null,
});
