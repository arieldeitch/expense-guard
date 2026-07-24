/**
 * /trash — סל מחזור.
 * מציג מקומות, הליכונים וציוד שנמחקו. מאפשר שחזור או מחיקה סופית (מאושרת פעמיים).
 * מחיקה סופית: בשלב זה — לא נחשפת כברירת מחדל אלא רק דרך אישור כפול.
 */
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RotateCcw, Trash2, MapPin, Gauge, Dumbbell } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { ConfirmDialog } from "@/components/catalog/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  restoreEquipment,
  restoreLocation,
  restoreTreadmill,
  useTrashItems,
} from "@/lib/catalog";

export const Route = createFileRoute("/trash")({
  head: () => ({
    meta: [
      { title: "סל מחזור · Fit Log" },
      { name: "description", content: "פריטים שנמחקו — ניתן לשחזר." },
      { property: "og:title", content: "סל מחזור · Fit Log" },
      { property: "og:description", content: "שחזור מקומות, הליכונים וציוד שהוסרו." },
    ],
  }),
  component: TrashPage,
});

function TrashPage() {
  const trash = useTrashItems();
  const total = trash.locations.length + trash.treadmills.length + trash.equipment.length;

  return (
    <AppShell topBar={{ title: "סל מחזור", back: { to: "/more" } }}>
      <PageHeader
        eyebrow="ניהול"
        title="סל מחזור"
        description="פריטים שנמחקו נשמרים כאן. שחזור מחזיר אותם למקום המקורי."
      />

      {total === 0 ? (
        <div className="px-4 sm:px-6">
          <EmptyState
            icon={<Trash2 aria-hidden />}
            title="הסל ריק"
            description="פריטים שיישלחו לסל יופיעו כאן וניתן יהיה לשחזר אותם."
            action={
              <Link
                to="/more"
                className="tile-interactive inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold"
              >
                חזרה
              </Link>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-4 sm:px-6">
          {trash.locations.length > 0 ? (
            <TrashSection
              title="מקומות"
              icon={<MapPin aria-hidden />}
              items={trash.locations.map((l) => ({
                id: l.id,
                primary: l.name,
                secondary: l.city ?? undefined,
              }))}
              onRestore={restoreLocation}
            />
          ) : null}

          {trash.treadmills.length > 0 ? (
            <TrashSection
              title="הליכונים"
              icon={<Gauge aria-hidden />}
              items={trash.treadmills.map((t) => ({
                id: t.id,
                primary: t.display_name,
                secondary: [t.manufacturer, t.model].filter(Boolean).join(" · ") || undefined,
              }))}
              onRestore={restoreTreadmill}
            />
          ) : null}

          {trash.equipment.length > 0 ? (
            <TrashSection
              title="ציוד"
              icon={<Dumbbell aria-hidden />}
              items={trash.equipment.map((e) => ({
                id: e.id,
                primary: e.name,
                secondary: [e.manufacturer, e.model].filter(Boolean).join(" · ") || undefined,
              }))}
              onRestore={restoreEquipment}
            />
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

interface TrashItem {
  id: string;
  primary: string;
  secondary?: string;
}

function TrashSection({
  title,
  icon,
  items,
  onRestore,
}: {
  title: string;
  icon: React.ReactNode;
  items: TrashItem[];
  onRestore: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {title} ({items.length})
      </h2>
      <div className="grid grid-cols-1 gap-2">
        {items.map((item) => (
          <TrashRow key={item.id} item={item} icon={icon} onRestore={onRestore} />
        ))}
      </div>
    </section>
  );
}

function TrashRow({
  item,
  icon,
  onRestore,
}: {
  item: TrashItem;
  icon: React.ReactNode;
  onRestore: (id: string) => void;
}) {
  const [restoreOpen, setRestoreOpen] = useState(false);

  return (
    <>
      <Tile size="sm">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-tint text-muted-foreground [&_svg]:size-5">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{item.primary}</div>
            {item.secondary ? (
              <div className="truncate text-xs text-muted-foreground">{item.secondary}</div>
            ) : null}
            <div className="mt-1">
              <Chip tone="destructive">בסל מחזור</Chip>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRestoreOpen(true)}
            className="min-h-11 rounded-xl border border-border-strong"
          >
            <RotateCcw aria-hidden className="me-1 size-4" />
            שחזור
          </Button>
        </div>
      </Tile>

      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="שחזור פריט"
        description="הפריט יוחזר לרשימה הפעילה. אפשר לשלוח שוב לסל בכל רגע."
        confirmLabel="שחזור"
        onConfirm={() => {
          onRestore(item.id);
          setRestoreOpen(false);
        }}
      />
    </>
  );
}
