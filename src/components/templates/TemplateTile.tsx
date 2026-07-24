/**
 * TemplateTile — אריח תבנית בלוח הראשי /templates.
 * מציג: שם, מקום, קבוצות שריר עיקריות, מספר תרגילים, מספר סופרסטים,
 * משך משוער, פעילות אחרונה, סטטוס. פעולות ב־Popover.
 */
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Edit2,
  Ellipsis,
  Layers,
  MapPin,
  Play,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionRow, Chip } from "@/components/catalog/shared";
import { ConfirmDialog } from "@/components/catalog/ConfirmDialog";
import { useLocation } from "@/lib/catalog";
import { useMuscleGroups } from "@/lib/exercises";
import {
  archiveTemplate,
  activateTemplate,
  duplicateTemplate,
  toggleFavoriteTemplate,
  trashTemplate,
  TEMPLATE_STATUS_LABELS,
  estimateTemplateDuration,
  summarizeTemplateMuscleLoad,
  useTemplateBlocks,
  useTemplateExercises,
  type WorkoutTemplate,
} from "@/lib/templates";
import { startSessionFromTemplate } from "@/lib/sessions";

interface Props {
  template: WorkoutTemplate;
}

export function TemplateTile({ template }: Props) {
  const blocks = useTemplateBlocks(template.id);
  const exercises = useTemplateExercises(template.id);
  const location = useLocation(template.location_id ?? undefined);
  const muscles = useMuscleGroups();

  const [trashOpen, setTrashOpen] = useState(false);
  const navigate = useNavigate();

  const supersetCount = blocks.filter(
    (b) => b.block_type === "superset" || b.block_type === "triset" || b.block_type === "circuit",
  ).length;
  const duration = estimateTemplateDuration(template.id);
  const load = summarizeTemplateMuscleLoad(template.id);
  const mgById = new Map(muscles.map((m) => [m.id, m]));
  const primaryMuscleNames = load.primary
    .slice(0, 3)
    .map((p) => mgById.get(p.muscle_group_id)?.name_he ?? "—")
    .join(" · ");

  const canStart = template.status === "active" && exercises.length > 0;

  async function handleStart() {
    const session = startSessionFromTemplate(template.id);
    if (session) {
      await navigate({ to: "/sessions/$id", params: { id: session.id } });
    }
  }

  const statusTone: "success" | "warning" | "info" | "default" | "destructive" =
    template.status === "active"
      ? "success"
      : template.status === "draft"
        ? "info"
        : template.status === "paused"
          ? "warning"
          : template.status === "archived"
            ? "default"
            : "destructive";

  return (
    <>
      <Tile size="md" className="h-full">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                to="/templates/$id"
                params={{ id: template.id }}
                className="min-w-0 truncate text-base font-black hover:underline"
              >
                {template.name}
              </Link>
              {template.is_favorite ? (
                <Star
                  aria-label="מועדפת"
                  className="size-4 shrink-0 text-warning"
                  fill="currentColor"
                />
              ) : null}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin aria-hidden className="size-3.5" />
              <span className="truncate">{location?.name ?? "ללא מקום"}</span>
            </div>
          </div>
          <MoreMenu
            template={template}
            onEdit={() => navigate({ to: "/templates/$id/edit", params: { id: template.id } })}
            onTrash={() => setTrashOpen(true)}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="תרגילים" value={String(exercises.length)} />
          <MiniStat
            label="סופרסטים"
            value={String(supersetCount)}
            icon={<Layers className="size-3.5" />}
          />
          <MiniStat
            label="משך משוער"
            value={duration.seconds > 0 ? `${duration.minMinutes}–${duration.maxMinutes} ד׳` : "–"}
          />
        </div>

        {primaryMuscleNames ? (
          <TileFootnote className="truncate">קבוצות מרכזיות: {primaryMuscleNames}</TileFootnote>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={statusTone === "destructive" ? "destructive" : statusTone}>
            {TEMPLATE_STATUS_LABELS[template.status]}
          </Chip>
          {template.usage_count > 0 ? (
            <Chip>בוצעה {template.usage_count}×</Chip>
          ) : (
            <Chip>טרם בוצעה</Chip>
          )}
          <Chip tone="info">גרסה {template.version}</Chip>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/templates/$id/edit"
            params={{ id: template.id }}
            className="tile-interactive inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold"
          >
            <Edit2 aria-hidden className="size-4" />
            עריכה
          </Link>
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className="tile-interactive inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-gym px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play aria-hidden className="size-4" />
            התחלת אימון
          </button>
        </div>
      </Tile>

      <ConfirmDialog
        open={trashOpen}
        onOpenChange={setTrashOpen}
        title="העברת תבנית לסל מחזור"
        description="אימונים שכבר בוצעו מתבנית זו לא ימחקו — הם שומרים snapshot משלהם. ניתן לשחזר בכל עת."
        confirmLabel="להעביר לסל"
        destructive
        onConfirm={() => {
          trashTemplate(template.id);
          setTrashOpen(false);
        }}
      />
    </>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border-strong bg-tint/40 px-2 py-1.5 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="ltr-nums text-sm font-black">{value}</div>
    </div>
  );
}

function MoreMenu({
  template,
  onEdit,
  onTrash,
}: {
  template: WorkoutTemplate;
  onEdit: () => void;
  onTrash: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isTrashed = template.status === "trashed" || template.deleted_at !== null;
  const isArchived = template.status === "archived";

  function run(fn: () => void) {
    fn();
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="פעולות נוספות"
        className="inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-tint hover:text-foreground"
      >
        <Ellipsis aria-hidden className="size-5" />
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" dir="rtl" className="w-56 p-1">
        <ActionRow icon={<Edit2 aria-hidden />} onClick={() => run(onEdit)}>
          עריכה
        </ActionRow>
        <ActionRow
          icon={<Copy aria-hidden />}
          onClick={() => run(() => duplicateTemplate(template.id))}
        >
          שכפול
        </ActionRow>
        <ActionRow
          icon={template.is_favorite ? <StarOff aria-hidden /> : <Star aria-hidden />}
          onClick={() => run(() => toggleFavoriteTemplate(template.id))}
        >
          {template.is_favorite ? "הסרה ממועדפות" : "הוספה למועדפות"}
        </ActionRow>
        {isArchived ? (
          <ActionRow
            icon={<ArchiveRestore aria-hidden />}
            onClick={() => run(() => activateTemplate(template.id))}
          >
            החזרה לפעילה
          </ActionRow>
        ) : (
          <ActionRow
            icon={<Archive aria-hidden />}
            tone="warning"
            onClick={() => run(() => archiveTemplate(template.id))}
          >
            ארכוב
          </ActionRow>
        )}
        {!isTrashed ? (
          <ActionRow icon={<Trash2 aria-hidden />} tone="destructive" onClick={() => run(onTrash)}>
            העברה לסל מחזור
          </ActionRow>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
