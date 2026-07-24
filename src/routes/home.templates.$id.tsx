/**
 * /home/templates/$id — פרטי תבנית עם רשימת תרגילים.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Edit2, Play } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { EmptyState } from "@/components/shell/EmptyState";
import {
  startSessionFromTemplate,
  useHomeTemplate,
  useHomeTemplateEntries,
} from "@/lib/home";
import { useExercise } from "@/lib/exercises";

export const Route = createFileRoute("/home/templates/$id")({
  head: () => ({
    meta: [
      { title: "תבנית בית · Fit Log" },
      { name: "description", content: "פרטי תבנית." },
      { property: "og:title", content: "תבנית בית · Fit Log" },
      { property: "og:description", content: "פרטי תבנית." },
    ],
  }),
  component: TemplateDetailPage,
});

function TemplateDetailPage() {
  const { id } = Route.useParams();
  const template = useHomeTemplate(id);
  const entries = useHomeTemplateEntries(id);
  const navigate = useNavigate();

  if (!template) {
    return (
      <AppShell topBar={{ title: "לא נמצא", back: { to: "/home/templates" } }}>
        <EmptyState title="התבנית לא נמצאה" />
      </AppShell>
    );
  }

  return (
    <AppShell
      topBar={{
        title: template.name,
        back: { to: "/home/templates" },
        action: (
          <Link
            to="/home/templates/$id/edit"
            params={{ id }}
            className="tile-interactive inline-flex size-9 items-center justify-center rounded-xl bg-tint text-muted-foreground"
            aria-label="עריכה"
          >
            <Edit2 aria-hidden className="size-4" />
          </Link>
        ),
      }}
    >
      <PageHeader
        eyebrow="תבנית"
        title={template.name}
        description={template.rounds > 1 ? `${template.rounds} סבבים` : `${entries.length} תרגילים`}
      />
      <div className="space-y-2 px-4 sm:px-6">
        {entries.length ? (
          entries.map((e) => (
            <EntryTile
              key={e.id}
              exerciseId={e.exercise_id}
              plannedSets={e.planned_sets}
              plannedReps={e.planned_reps}
              plannedDuration={e.planned_duration_seconds}
              restSeconds={e.rest_seconds}
            />
          ))
        ) : (
          <EmptyState
            title="אין תרגילים בתבנית"
            description="פתח עריכה והוסף תרגילים."
            action={
              <Link
                to="/home/templates/$id/edit"
                params={{ id }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-home px-4 text-sm font-bold text-white"
              >
                <Edit2 className="size-4" aria-hidden />
                עריכה
              </Link>
            }
          />
        )}
      </div>
      {entries.length ? (
        <div className="mt-6 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => {
              const s = startSessionFromTemplate(id);
              if (s) navigate({ to: "/home/sessions/$id", params: { id: s.id } });
            }}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-home px-4 text-base font-black text-white active:scale-95"
          >
            <Play className="size-5" aria-hidden />
            התחל אימון
          </button>
        </div>
      ) : null}
    </AppShell>
  );
}

function EntryTile({
  exerciseId,
  plannedSets,
  plannedReps,
  plannedDuration,
  restSeconds,
}: {
  exerciseId: string;
  plannedSets: number;
  plannedReps: number | null;
  plannedDuration: number | null;
  restSeconds: number | null;
}) {
  const exercise = useExercise(exerciseId);
  return (
    <Tile variant="home" tone="soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <TileLabel>תרגיל</TileLabel>
          <div className="text-base font-black">{exercise?.name_he ?? "תרגיל"}</div>
        </div>
        <div className="text-end">
          <TileLabel>סטים</TileLabel>
          <div className="ltr-nums text-lg font-black">{plannedSets}</div>
        </div>
      </div>
      <TileFootnote>
        {plannedReps ? `${plannedReps} חז׳` : ""}
        {plannedDuration ? ` · ${plannedDuration}שנ׳` : ""}
        {restSeconds ? ` · מנוחה ${restSeconds}שנ׳` : ""}
      </TileFootnote>
    </Tile>
  );
}
