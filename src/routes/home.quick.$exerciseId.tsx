/**
 * /home/quick/$exerciseId — יוצר session מהיר ומפנה מיד למסך הביצוע.
 * הפעולה מתבצעת בצד לקוח בלבד כדי שלא ניגע ב־storage ב־SSR.
 */
import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { startQuickEntry } from "@/lib/home";

export const Route = createFileRoute("/home/quick/$exerciseId")({
  head: () => ({
    meta: [
      { title: "התחלת דיווח מהיר · Fit Log" },
      { name: "description", content: "יוצר דיווח מהיר לתרגיל." },
      { property: "og:title", content: "התחלת דיווח מהיר · Fit Log" },
      { property: "og:description", content: "יוצר דיווח מהיר לתרגיל." },
    ],
  }),
  component: QuickForExercise,
});

function QuickForExercise() {
  const { exerciseId } = Route.useParams();
  const navigate = useNavigate();
  useEffect(() => {
    const { session } = startQuickEntry({ exercise_id: exerciseId });
    navigate({
      to: "/home/sessions/$id",
      params: { id: session.id },
      replace: true,
    });
  }, [exerciseId, navigate]);
  return (
    <AppShell topBar={{ title: "פותח…", back: { to: "/home" } }}>
      <div className="p-6 text-center text-sm text-muted-foreground">מכין דיווח…</div>
    </AppShell>
  );
}
