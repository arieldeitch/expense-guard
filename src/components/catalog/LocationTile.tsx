/**
 * LocationTile — אריח אחד למקום אימון.
 * Icon (לפי סוג), שם, סוג, עיר/מדינה, מונים (הליכונים/ציוד), badges (default/favorite/archive).
 * פעולות דורשות 2 קליקים לפחות — נפתחות ב־Popover.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Dumbbell,
  Edit2,
  Ellipsis,
  Footprints,
  Home,
  MapPin,
  Star,
  StarOff,
  Building2,
  Landmark,
  BedDouble,
  Route,
  Trees,
  Trash2,
  Archive,
  ArchiveRestore,
  Undo2,
  Check,
} from "lucide-react";
import { Tile } from "@/components/tile/Tile";
import { Chip } from "./shared";
import { ConfirmDialog } from "./ConfirmDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  archiveLocation,
  countLocationUsage,
  findCountry,
  LOCATION_TYPE_LABEL,
  restoreLocation,
  setDefaultLocation,
  toggleFavoriteLocation,
  trashLocation,
  unarchiveLocation,
  type LocationType,
  type TrainingLocation,
} from "@/lib/catalog";
import { ActionRow } from "./shared";

const LOCATION_ICON: Record<LocationType, React.ComponentType<{ className?: string }>> = {
  gym_kibbutz: Landmark,
  gym: Dumbbell,
  home: Home,
  hotel: BedDouble,
  workplace: Building2,
  outdoor_route: Route,
  park: Trees,
  trail: Footprints,
  city_area: MapPin,
  custom: MapPin,
};

export function LocationTile({
  location,
  onEdit,
}: {
  location: TrainingLocation;
  onEdit: (l: TrainingLocation) => void;
}) {
  const Icon = LOCATION_ICON[location.location_type as LocationType] ?? MapPin;
  const usage = countLocationUsage(location.id);
  const country = findCountry(location.country_code);
  const [trashOpen, setTrashOpen] = useState(false);

  const isTrashed = location.deleted_at !== null;
  const isArchived = !location.is_active && !isTrashed;

  return (
    <>
      <Tile size="md" className="h-full">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
          <div
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-tint text-foreground"
            aria-hidden
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                to="/locations/$id"
                params={{ id: location.id }}
                className="min-w-0 truncate text-base font-black hover:underline"
              >
                {location.name}
              </Link>
              {location.is_default ? <Chip tone="info">ברירת מחדל</Chip> : null}
              {location.is_favorite ? (
                <Star
                  aria-label="מועדף"
                  className="size-3.5 shrink-0 text-warning"
                  fill="currentColor"
                />
              ) : null}
            </div>
            <div className="mt-0.5 truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {LOCATION_TYPE_LABEL[location.location_type as LocationType]}
            </div>
            {location.city || country ? (
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {[location.city, country?.he].filter(Boolean).join(" · ")}
              </div>
            ) : null}
          </div>
          <MoreMenu
            location={location}
            onEdit={() => onEdit(location)}
            onTrash={() => setTrashOpen(true)}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <StatBadge label="הליכונים" value={usage.treadmills} />
          <StatBadge label="ציוד" value={usage.equipment} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {isTrashed ? <Chip tone="destructive">בסל מחזור</Chip> : null}
          {isArchived ? <Chip tone="warning">ארכיון</Chip> : null}
        </div>

        <Link
          to="/locations/$id"
          params={{ id: location.id }}
          className="tile-interactive mt-3 inline-flex min-h-11 items-center justify-between gap-2 rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold"
        >
          <span className="truncate">פתיחת המקום</span>
          <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
      </Tile>

      <ConfirmDialog
        open={trashOpen}
        onOpenChange={setTrashOpen}
        title="העברה לסל מחזור"
        description={
          usage.equipment + usage.treadmills > 0
            ? `במקום זה ${usage.treadmills} הליכונים ו־${usage.equipment} פריטי ציוד. ההיסטוריה תישמר. אפשר לשחזר בכל עת מסל המחזור.`
            : "אפשר לשחזר בכל עת מסל המחזור."
        }
        confirmLabel="להעביר לסל"
        destructive
        onConfirm={() => {
          trashLocation(location.id);
          setTrashOpen(false);
        }}
      />
    </>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg border border-border-strong bg-surface px-2 py-1.5">
      <span className="ltr-nums text-lg font-black">{value}</span>
      <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function MoreMenu({
  location,
  onEdit,
  onTrash,
}: {
  location: TrainingLocation;
  onEdit: () => void;
  onTrash: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isTrashed = location.deleted_at !== null;
  const isArchived = !location.is_active && !isTrashed;

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
            onClick={() => run(() => restoreLocation(location.id))}
          >
            שחזור מסל המחזור
          </ActionRow>
        ) : (
          <>
            <ActionRow icon={<Edit2 aria-hidden />} onClick={() => run(onEdit)}>
              עריכה
            </ActionRow>
            {!isArchived ? (
              <ActionRow
                icon={<Check aria-hidden />}
                onClick={() => run(() => setDefaultLocation(location.id))}
                disabled={location.is_default}
              >
                {location.is_default ? "כבר ברירת מחדל" : "הגדרה כברירת מחדל"}
              </ActionRow>
            ) : null}
            <ActionRow
              icon={location.is_favorite ? <StarOff aria-hidden /> : <Star aria-hidden />}
              onClick={() => run(() => toggleFavoriteLocation(location.id))}
            >
              {location.is_favorite ? "הסרה ממועדפים" : "הוספה למועדפים"}
            </ActionRow>
            {isArchived ? (
              <ActionRow
                icon={<ArchiveRestore aria-hidden />}
                onClick={() => run(() => unarchiveLocation(location.id))}
              >
                החזרה מהארכיון
              </ActionRow>
            ) : (
              <ActionRow
                icon={<Archive aria-hidden />}
                onClick={() => run(() => archiveLocation(location.id))}
                tone="warning"
              >
                ארכוב
              </ActionRow>
            )}
            <ActionRow
              icon={<Trash2 aria-hidden />}
              onClick={() => run(onTrash)}
              tone="destructive"
            >
              העברה לסל מחזור
            </ActionRow>
          </>
        )}
      </PopoverContent>
    </Popover>
  );

  function run(fn: () => void) {
    fn();
    setOpen(false);
  }
}
