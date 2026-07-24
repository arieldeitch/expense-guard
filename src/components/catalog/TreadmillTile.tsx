/**
 * TreadmillTile — אריח בודד להליכון בתוך מקום.
 * מציג תמונה או placeholder, שם, יצרן/דגם, ובאגר לפעולות.
 * פער כיול מול Suunto יוצג רק כאשר נקבר מספיק נתונים (בשלב זה: תמיד "אין עדיין").
 */
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Ellipsis,
  Edit2,
  Gauge,
  Star,
  StarOff,
  Trash2,
  Undo2,
} from "lucide-react";
import { Tile } from "@/components/tile/Tile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionRow, Chip } from "./shared";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  archiveTreadmill,
  restoreTreadmill,
  toggleFavoriteTreadmill,
  trashTreadmill,
  unarchiveTreadmill,
  type TreadmillProfile,
} from "@/lib/catalog";

export function TreadmillTile({
  treadmill,
  onEdit,
}: {
  treadmill: TreadmillProfile;
  onEdit: (t: TreadmillProfile) => void;
}) {
  const [trashOpen, setTrashOpen] = useState(false);
  const isTrashed = treadmill.deleted_at !== null;
  const isArchived = !treadmill.is_active && !isTrashed;

  return (
    <>
      <Tile size="md">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-border-strong bg-tint text-muted-foreground">
            {treadmill.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={treadmill.image_url}
                alt={treadmill.display_name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Gauge aria-hidden className="size-6" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="min-w-0 truncate text-base font-black">{treadmill.display_name}</div>
              {treadmill.is_favorite ? (
                <Star
                  aria-label="מועדף"
                  className="size-3.5 shrink-0 text-warning"
                  fill="currentColor"
                />
              ) : null}
            </div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {[treadmill.machine_number, treadmill.manufacturer, treadmill.model]
                .filter(Boolean)
                .join(" · ") || "פרטים חלקיים"}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              עדיין אין מספיק ריצות להשוואה מול Suunto.
            </div>
          </div>
          <MoreMenu
            treadmill={treadmill}
            onEdit={() => onEdit(treadmill)}
            onTrash={() => setTrashOpen(true)}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {isTrashed ? <Chip tone="destructive">בסל מחזור</Chip> : null}
          {isArchived ? <Chip tone="warning">ארכיון</Chip> : null}
        </div>
      </Tile>

      <ConfirmDialog
        open={trashOpen}
        onOpenChange={setTrashOpen}
        title="העברת הליכון לסל מחזור"
        description="ההיסטוריה של הריצות תישמר. אפשר לשחזר בכל עת מסל המחזור."
        confirmLabel="להעביר לסל"
        destructive
        onConfirm={() => {
          trashTreadmill(treadmill.id);
          setTrashOpen(false);
        }}
      />
    </>
  );
}

function MoreMenu({
  treadmill,
  onEdit,
  onTrash,
}: {
  treadmill: TreadmillProfile;
  onEdit: () => void;
  onTrash: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isTrashed = treadmill.deleted_at !== null;
  const isArchived = !treadmill.is_active && !isTrashed;

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
            onClick={() => run(() => restoreTreadmill(treadmill.id))}
          >
            שחזור
          </ActionRow>
        ) : (
          <>
            <ActionRow icon={<Edit2 aria-hidden />} onClick={() => run(onEdit)}>
              עריכה
            </ActionRow>
            <ActionRow
              icon={treadmill.is_favorite ? <StarOff aria-hidden /> : <Star aria-hidden />}
              onClick={() => run(() => toggleFavoriteTreadmill(treadmill.id))}
            >
              {treadmill.is_favorite ? "הסרה ממועדפים" : "הוספה למועדפים"}
            </ActionRow>
            {isArchived ? (
              <ActionRow
                icon={<ArchiveRestore aria-hidden />}
                onClick={() => run(() => unarchiveTreadmill(treadmill.id))}
              >
                החזרה מהארכיון
              </ActionRow>
            ) : (
              <ActionRow
                icon={<Archive aria-hidden />}
                tone="warning"
                onClick={() => run(() => archiveTreadmill(treadmill.id))}
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
