/**
 * EquipmentTile — אריח פריט ציוד.
 * מציג אייקון/תמונה, שם, סוג, טווח משקל (אם רלוונטי), כמות, זמינות.
 */
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Cable,
  ChevronsUpDown,
  Dumbbell,
  Edit2,
  Ellipsis,
  Layers,
  Star,
  StarOff,
  Trash2,
  Undo2,
  Wind,
  Weight,
  StretchHorizontal,
  Bike,
  BicepsFlexed,
  Package,
} from "lucide-react";
import { Tile } from "@/components/tile/Tile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionRow, Chip } from "./shared";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  archiveEquipment,
  AVAILABILITY_LABEL,
  AVAILABILITY_TONE,
  EQUIPMENT_TYPE_LABEL,
  restoreEquipment,
  toggleFavoriteEquipment,
  trashEquipment,
  unarchiveEquipment,
  WEIGHT_UNIT_LABEL,
  type EquipmentItem,
  type EquipmentType,
} from "@/lib/catalog";

const ICONS: Record<EquipmentType, React.ComponentType<{ className?: string }>> = {
  dumbbells: Dumbbell,
  barbell: Weight,
  plates: Layers,
  bench: StretchHorizontal,
  machine: BicepsFlexed,
  cable: Cable,
  pullup_bar: ChevronsUpDown,
  dip_bar: ChevronsUpDown,
  band: Wind,
  kettlebell: Weight,
  trx: Wind,
  mat: StretchHorizontal,
  cardio: Bike,
  custom: Package,
};

export function EquipmentTile({
  equipment,
  onEdit,
}: {
  equipment: EquipmentItem;
  onEdit: (e: EquipmentItem) => void;
}) {
  const Icon = ICONS[equipment.equipment_type as EquipmentType] ?? Package;
  const [trashOpen, setTrashOpen] = useState(false);
  const isTrashed = equipment.deleted_at !== null;
  const isArchived = !equipment.is_active && !isTrashed;

  const weightRange = formatWeightRange(equipment);
  const availabilityTone = AVAILABILITY_TONE[equipment.availability_status];

  return (
    <>
      <Tile size="md">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border-strong bg-tint text-foreground">
            {equipment.image_url ? (
              
              <img
                src={equipment.image_url}
                alt={equipment.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Icon aria-hidden className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="min-w-0 truncate text-sm font-black">{equipment.name}</div>
              {equipment.is_favorite ? (
                <Star
                  aria-label="מועדף"
                  className="size-3.5 shrink-0 text-warning"
                  fill="currentColor"
                />
              ) : null}
            </div>
            <div className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {EQUIPMENT_TYPE_LABEL[equipment.equipment_type as EquipmentType]}
              {equipment.quantity > 1 ? ` · ×${equipment.quantity}` : ""}
            </div>
            {weightRange ? (
              <div className="mt-1 ltr-nums text-xs text-foreground">{weightRange}</div>
            ) : null}
          </div>
          <MoreMenu
            equipment={equipment}
            onEdit={() => onEdit(equipment)}
            onTrash={() => setTrashOpen(true)}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
            {AVAILABILITY_LABEL[equipment.availability_status]}
          </Chip>
          {isTrashed ? <Chip tone="destructive">בסל מחזור</Chip> : null}
          {isArchived ? <Chip tone="warning">ארכיון</Chip> : null}
        </div>
      </Tile>

      <ConfirmDialog
        open={trashOpen}
        onOpenChange={setTrashOpen}
        title="העברת ציוד לסל מחזור"
        description="ההיסטוריה של האימונים תישמר. אפשר לשחזר בכל עת מסל המחזור."
        confirmLabel="להעביר לסל"
        destructive
        onConfirm={() => {
          trashEquipment(equipment.id);
          setTrashOpen(false);
        }}
      />
    </>
  );
}

function formatWeightRange(e: EquipmentItem): string | null {
  const unit = e.unit ? WEIGHT_UNIT_LABEL[e.unit] : "";
  if (e.min_weight != null && e.max_weight != null) {
    return `${e.min_weight}–${e.max_weight} ${unit}`.trim();
  }
  if (e.min_weight != null) return `מ־${e.min_weight} ${unit}`.trim();
  if (e.max_weight != null) return `עד ${e.max_weight} ${unit}`.trim();
  return null;
}

function MoreMenu({
  equipment,
  onEdit,
  onTrash,
}: {
  equipment: EquipmentItem;
  onEdit: () => void;
  onTrash: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isTrashed = equipment.deleted_at !== null;
  const isArchived = !equipment.is_active && !isTrashed;

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
            onClick={() => run(() => restoreEquipment(equipment.id))}
          >
            שחזור
          </ActionRow>
        ) : (
          <>
            <ActionRow icon={<Edit2 aria-hidden />} onClick={() => run(onEdit)}>
              עריכה
            </ActionRow>
            <ActionRow
              icon={equipment.is_favorite ? <StarOff aria-hidden /> : <Star aria-hidden />}
              onClick={() => run(() => toggleFavoriteEquipment(equipment.id))}
            >
              {equipment.is_favorite ? "הסרה ממועדפים" : "הוספה למועדפים"}
            </ActionRow>
            {isArchived ? (
              <ActionRow
                icon={<ArchiveRestore aria-hidden />}
                onClick={() => run(() => unarchiveEquipment(equipment.id))}
              >
                החזרה מהארכיון
              </ActionRow>
            ) : (
              <ActionRow
                icon={<Archive aria-hidden />}
                tone="warning"
                onClick={() => run(() => archiveEquipment(equipment.id))}
              >
                ארכוב
              </ActionRow>
            )}
            <ActionRow
              icon={<Trash2 aria-hidden />}
              tone="destructive"
              onClick={() => run(onTrash)}
            >
              העברה לסל מחזור
            </ActionRow>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
