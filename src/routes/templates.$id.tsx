/**
 * /templates/$id — פרטי תבנית (readonly overview).
 * מציג מטא־דאטה, סיכום, בלוקים ותרגילים בקומפקטי, וכפתור "התחלת אימון".
 */
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Edit2, History, Layers, Play } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { TemplateSummary } from "@/components/templates/TemplateSummary";
import { useLocation } from "@/lib/catalog";
import { useExercise, useMuscleGroups } from "@/lib/exercises";
import {
  BLOCK_TYPE_LABELS,
  SUPERSET_LETTERS,
  TEMPLATE_STATUS_LABELS,
  useTemplate,
  useTemplateBlocks,
  useBlockExercises,
} from "@/lib/templates";
import { startSessionFromTemplate } from "@/lib/sessions";

export const Route = createFileRoute("/templates/$id")({
  head: () => ({
    meta: [
      { title: "תבנית · Fit Log" },
      { name: "description", content: "פרטי תבנית אימון: מבנה, תרגילים, סופרסטים, זמינות ציוד." },
      { property: "og:title", content: "תבנית · Fit Log" },
      { property: "og:description", content: "התחלת אימון מתבנית שמורה." },
    ],
  }),
  component: TemplateDetailPage,
});

function TemplateDetailPage() {
  const { id } = Route.useParams();
  const template = useTemplate(id);
  const blocks = useTemplateBlocks(id);
  const location = useLocation(template?.location_id ?? undefined);
  const navigate = useNavigate();

  if (!template) throw notFound();

  const canStart = template.status === "active" && blocks.length > 0;

  async function handleStart() {
    const session = startSessionFromTemplate(template!.id);
    if (session) await navigate({ to: "/sessions/$id", params: { id: session.id } });
  }

  return (
    <AppShell topBar={{ title: template.name, back: { to: "/templates" } }}>
      <PageHeader
        eyebrow="תבנית"
        title={template.name}
        description={template.description ?? "ללא תיאור"}
        action={
          <div className="flex gap-2">
            <Link
              to="/templates/$id/edit"
              params={{ id: template.id }}
              className="tile-interactive inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold"
            >
              <Edit2 aria-hidden className="me-1 size-4" />
              עריכה
            </Link>
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className="tile-interactive inline-flex min-h-11 items-center rounded-xl bg-gym px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play aria-hidden className="me-1 size-4" />
              התחלת אימון
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:px-6">
        <Tile size="sm">
          <TileLabel>מקום</TileLabel>
          <div className="text-base font-bold">{location?.name ?? "לא הוגדר"}</div>
        </Tile>
        <Tile size="sm">
          <TileLabel>סטטוס</TileLabel>
          <Chip
            tone={
              template.status === "active"
                ? "success"
                : template.status === "draft"
                  ? "info"
                  : "default"
            }
          >
            {TEMPLATE_STATUS_LABELS[template.status]}
          </Chip>
          <TileFootnote>
            גרסה {template.version} · בוצעה {template.usage_count} פעמים
          </TileFootnote>
        </Tile>
        <Tile size="sm">
          <TileLabel>מנוחה ברירת מחדל</TileLabel>
          <div className="text-base font-bold">{template.default_rest_seconds} שניות</div>
        </Tile>
      </div>

      <div className="mt-4 px-4 sm:px-6">
        <TemplateSummary templateId={template.id} />
      </div>

      <section className="mt-6 flex flex-col gap-3 px-4 sm:px-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          מבנה ({blocks.length} בלוקים)
        </h2>
        {blocks.length === 0 ? (
          <Tile>
            <TileFootnote>עדיין ריקה — עבור לעריכה כדי להוסיף תרגילים.</TileFootnote>
          </Tile>
        ) : (
          blocks.map((b, i) => <BlockReadonly key={b.id} blockId={b.id} index={i} />)
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-border px-4 py-4 sm:px-6">
        <Link
          to="/templates/$id/history"
          params={{ id: template.id }}
          className="tile-interactive inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold"
        >
          <History aria-hidden className="me-1 size-4" />
          היסטוריית גרסאות
        </Link>
      </div>
    </AppShell>
  );
}

function BlockReadonly({ blockId, index }: { blockId: string; index: number }) {
  const exs = useBlockExercises(blockId);
  const letter = SUPERSET_LETTERS[index] ?? String(index + 1);
  return (
    <Tile>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-tint text-sm font-black">
          {letter}
        </span>
        <div className="min-w-0 truncate text-sm font-bold">{exs.length} תרגילים</div>
        <Chip>
          <Layers aria-hidden className="me-0.5 size-3" />
          בלוק
        </Chip>
      </div>
      <ul className="ms-11 mt-2 space-y-1 text-sm">
        {exs.map((te, i) => (
          <ReadonlyExerciseLine
            key={te.id}
            exerciseId={te.exercise_id}
            sublabel={`${letter}${i + 1}`}
            sets={te.planned_sets}
            reps={te.planned_reps}
          />
        ))}
      </ul>
    </Tile>
  );
}

function ReadonlyExerciseLine({
  exerciseId,
  sublabel,
  sets,
  reps,
}: {
  exerciseId: string;
  sublabel: string;
  sets: number;
  reps: number | null;
}) {
  const ex = useExercise(exerciseId);
  const muscles = useMuscleGroups();
  const primary = ex ? muscles.find((m) => m.id === ex.primary_muscle_group_id) : null;
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
      <span className="text-xs font-bold text-muted-foreground">{sublabel}</span>
      <span className="min-w-0 truncate">
        {ex?.name_he ?? "—"}
        <span className="ms-2 text-xs text-muted-foreground">{primary?.name_he}</span>
      </span>
      <span className="ltr-nums text-xs font-bold text-muted-foreground">
        {sets}×{reps ?? "—"}
      </span>
    </li>
  );
}

void BLOCK_TYPE_LABELS;
