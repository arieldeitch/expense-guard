/**
 * /home/quick/$exerciseId — התחלה מהירה של תרגיל ידוע מראש
 * (מגיע מ־קישור מועדפים/אחרונים). יוצר session ומפנה למסך הביצוע.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { startQuickEntry } from "@/lib/home";

export const Route = createFileRoute("/home/quick/$exerciseId")({
  beforeLoad: ({ params }) => {
    if (typeof window === "undefined") return;
    const { session } = startQuickEntry({ exercise_id: params.exerciseId });
    throw redirect({ to: "/home/sessions/$id", params: { id: session.id } });
  },
  component: () => null,
});
