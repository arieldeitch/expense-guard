/**
 * /exercises/$id/history — היסטוריית תרגיל בודד + גרפים + מגמה.
 */
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useHydrated } from "@/lib/storage/useHydrated";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { ExerciseHistoryPanel } from "@/components/analytics/ExerciseHistoryPanel";
import { useExercise } from "@/lib/exercises";

export const Route = createFileRoute("/exercises/$id/history")({
  head: () => ({
    meta: [
      { title: "היסטוריית תרגיל · Fit Log" },
      { name: "description", content: "היסטוריית ביצוע ומגמות של תרגיל בודד." },
    ],
  }),
  component: ExerciseHistoryRoute,
});

function ExerciseHistoryRoute() {
  const { id } = Route.useParams();
  const exercise = useExercise(id);
  const hydrated = useHydrated();
  // ראה ADR-0039 — תרגיל מותאם אישית קיים רק ב-localStorage ולכן חסר בשרת.
  if (!hydrated) return null;
  if (!exercise) throw notFound();
  return (
    <AppShell topBar={{ title: exercise.name_he, back: { to: `/exercises/${id}` } }}>
      <PageHeader
        eyebrow="תרגיל"
        title={`היסטוריית ${exercise.name_he}`}
        description="נתונים עובדתיים בלבד. הערכת 1RM מסומנת כהערכה."
      />
      <div className="px-4 sm:px-6">
        <ExerciseHistoryPanel exerciseId={id} />
      </div>
    </AppShell>
  );
}
