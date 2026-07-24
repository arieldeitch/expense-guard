/**
 * ExerciseTile — אריח יחיד בספריית התרגילים.
 * מציג: אייקון/thumbnail, שם, קבוצת שריר ראשית, סוג מעקב, ציוד מרכזי,
 * זמינות במקום נבחר, מועדף, אינדיקציית מדיה.
 * פעולות ב־Popover (2 קליקים לפחות).
 */
import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Dumbbell,
  Edit2,
  Ellipsis,
  Image as ImageIcon,
  Star,
  StarOff,
  Trash2,
  Undo2,
} from "lucide-react";
import { Tile } from "@/components/tile/Tile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionRow, Chip } from "@/components/catalog/shared";
import { ConfirmDialog } from "@/components/catalog/ConfirmDialog";
import { EQUIPMENT_TYPE_LABEL, type EquipmentType } from "@/lib/catalog";
import {
  archiveExercise,
  AVAILABILITY_STATUS_LABEL,
  AVAILABILITY_STATUS_TONE,
  CATEGORY_LABEL,
  DIFFICULTY_LABEL,
  duplicateExercise,
  MOVEMENT_PATTERN_LABEL,
  restoreExercise,
  toggleFavoriteExercise,
  TRACKING_TYPE_LABEL,
  trashExercise,
  unarchiveExercise,
  type EquipmentAvailabilitySummary,
  type Exercise,
  type MuscleGroup,
} from "@/lib/exercises";

interface Props {
  exercise: Exercise;
  primaryMuscle?: MuscleGroup | null;
  thumbnailUrl?: string | null;
  hasMedia?: boolean;
  availability?: EquipmentAvailabilitySummary | null;
  onEdit?: (e: Exercise) => void;
}

export function ExerciseTile({
  exercise,
  primaryMuscle,
  thumbnailUrl,
  hasMedia,
  availability,
  onEdit,
}: Props) {
  const [trashOpen, setTrashOpen] = useState(false);
  const isTrashed = exercise.deleted_at !== null;
  const isArchived = !exercise.is_active && !isTrashed;

  const availabilityTone = availability ? AVAILABILITY_STATUS_TONE[availability.status] : "default";
  const availabilityLabel = availability ? AVAILABILITY_STATUS_LABEL[availability.status] : null;

  const equipmentSummary = summarizeEquipment(exercise);

  return (
    <>
      <Tile size="md" className="h-full">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border-strong bg-tint text-foreground">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={exercise.name_he}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Dumbbell aria-hidden className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                to="/exercises/$id"
                params={{ id: exercise.id }}
                className="min-w-0 truncate text-sm font-black hover:underline"
              >
                {exercise.name_he}
              </Link>
              {exercise.is_favorite ? (
                <Star
                  aria-label="מועדף"
                  className="size-3.5 shrink-0 text-warning"
                  fill="currentColor"
                />
              ) : null}
              {hasMedia ? (
                <ImageIcon aria-label="מדיה זמינה" className="size-3.5 shrink-0 text-info" />
              ) : null}
            </div>
            <div className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {primaryMuscle?.name_he ?? "—"}
              <span aria-hidden> · </span>
              {TRACKING_TYPE_LABEL[exercise.tracking_type]}
            </div>
            {equipmentSummary ? (
              <div className="mt-1 truncate text-xs text-muted-foreground">{equipmentSummary}</div>
            ) : null}
          </div>
          <MoreMenu
            exercise={exercise}
            onEdit={() => onEdit?.(exercise)}
            onTrash={() => setTrashOpen(true)}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Chip>{CATEGORY_LABEL[exercise.category]}</Chip>
          <Chip>{MOVEMENT_PATTERN_LABEL[exercise.movement_pattern]}</Chip>
          <Chip tone="info">{DIFFICULTY_LABEL[exercise.difficulty]}</Chip>
          {availabilityLabel ? (
            <Chip
              tone={
                availabilityTone === "success"
                  ? "success"
                  : availabilityTone === "warning"
                    ? "warning"
                    : availabilityTone === "info"
                      ? "info"
                      : "default"
              }
            >
              {availabilityLabel}
            </Chip>
          ) : null}
          {exercise.is_custom ? <Chip tone="info">מותאם אישית</Chip> : null}
          {exercise.parent_exercise_id ? <Chip>ווריאציה</Chip> : null}
          {isTrashed ? <Chip tone="destructive">בסל מחזור</Chip> : null}
          {isArchived ? <Chip tone="warning">ארכיון</Chip> : null}
        </div>
      </Tile>

      <ConfirmDialog
        open={trashOpen}
        onOpenChange={setTrashOpen}
        title={exercise.is_system ? "העברת תרגיל מערכת לארכיון" : "העברת תרגיל לסל מחזור"}
        description={
          exercise.is_system
            ? "תרגיל מערכת לא נמחק — הוא מועבר לארכיון בלבד. אפשר להחזיר מ־'ארכיון'."
            : "ההיסטוריה של האימונים תישמר. אפשר לשחזר בכל עת מסל המחזור."
        }
        confirmLabel={exercise.is_system ? "לארכיון" : "להעביר לסל"}
        destructive={!exercise.is_system}
        onConfirm={() => {
          trashExercise(exercise.id);
          setTrashOpen(false);
        }}
      />
    </>
  );
}

function summarizeEquipment(e: Exercise): ReactNode {
  if (e.bodyweight_based && e.required_equipment_types.length === 0) return "משקל גוף";
  const types = e.required_equipment_types
    .slice(0, 3)
    .map((t) => EQUIPMENT_TYPE_LABEL[t as EquipmentType] ?? t);
  if (types.length === 0) return null;
  return types.join(" · ");
}

function MoreMenu({
  exercise,
  onEdit,
  onTrash,
}: {
  exercise: Exercise;
  onEdit: () => void;
  onTrash: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isTrashed = exercise.deleted_at !== null;
  const isArchived = !exercise.is_active && !isTrashed;

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
        {isTrashed ? (
          <ActionRow
            icon={<Undo2 aria-hidden />}
            onClick={() => run(() => restoreExercise(exercise.id))}
          >
            שחזור
          </ActionRow>
        ) : (
          <>
            {!exercise.is_system ? (
              <ActionRow icon={<Edit2 aria-hidden />} onClick={() => run(onEdit)}>
                עריכה
              </ActionRow>
            ) : null}
            <ActionRow
              icon={<Copy aria-hidden />}
              onClick={() => run(() => duplicateExercise(exercise.id))}
            >
              שכפול לתרגיל אישי
            </ActionRow>
            <ActionRow
              icon={exercise.is_favorite ? <StarOff aria-hidden /> : <Star aria-hidden />}
              onClick={() => run(() => toggleFavoriteExercise(exercise.id))}
            >
              {exercise.is_favorite ? "הסרה ממועדפים" : "הוספה למועדפים"}
            </ActionRow>
            {isArchived ? (
              <ActionRow
                icon={<ArchiveRestore aria-hidden />}
                onClick={() => run(() => unarchiveExercise(exercise.id))}
              >
                החזרה מהארכיון
              </ActionRow>
            ) : (
              <ActionRow
                icon={<Archive aria-hidden />}
                tone="warning"
                onClick={() => run(() => archiveExercise(exercise.id))}
              >
                {exercise.is_system ? "לארכיון" : "ארכוב"}
              </ActionRow>
            )}
            {!exercise.is_system ? (
              <ActionRow
                icon={<Trash2 aria-hidden />}
                tone="destructive"
                onClick={() => run(onTrash)}
              >
                העברה לסל מחזור
              </ActionRow>
            ) : null}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
