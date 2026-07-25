/**
 * /trash — סל מחזור.
 * מציג מקומות, הליכונים וציוד שנמחקו. מאפשר שחזור או מחיקה סופית (מאושרת פעמיים).
 * מחיקה סופית: בשלב זה — לא נחשפת כברירת מחדל אלא רק דרך אישור כפול.
 */
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  RotateCcw,
  Trash2,
  MapPin,
  Gauge,
  Dumbbell,
  Footprints,
  BookOpen,
  Layers,
  House,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { ConfirmDialog } from "@/components/catalog/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { restoreEquipment, restoreLocation, restoreTreadmill, useTrashItems } from "@/lib/catalog";
import { runsRepo, useTrashedRuns, RUN_TYPE_LABELS } from "@/lib/runs";
import { restoreExercise, useTrashedExercises } from "@/lib/exercises";
import { restoreTemplate, useTrashedTemplates } from "@/lib/templates";
import { useTrashedSessions, restoreSession } from "@/lib/sessions";
import { useTrashedHomeSessions, restoreHomeSession } from "@/lib/home";
import { useTrashedGoals, restoreGoal } from "@/lib/goals";
import { GOAL_DOMAIN_LABEL } from "@/components/goals/goalDomainConfig";

function shortDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d.toLocaleDateString("he-IL");
}

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
  const trashedRuns = useTrashedRuns();
  const trashedExercises = useTrashedExercises();
  const trashedTemplates = useTrashedTemplates();
  const trashedSessions = useTrashedSessions();
  const trashedHomeSessions = useTrashedHomeSessions();
  const trashedGoals = useTrashedGoals();
  const total =
    trash.locations.length +
    trash.treadmills.length +
    trash.equipment.length +
    trashedRuns.length +
    trashedExercises.length +
    trashedTemplates.length +
    trashedSessions.length +
    trashedHomeSessions.length +
    trashedGoals.length;

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

          {trashedRuns.length > 0 ? (
            <TrashSection
              title="ריצות"
              icon={<Footprints aria-hidden />}
              items={trashedRuns.map((r) => ({
                id: r.id,
                primary: `${RUN_TYPE_LABELS[r.run_type]} · ${new Date(r.started_at).toLocaleDateString("he-IL")}`,
                secondary: r.distance_meters
                  ? `${(r.distance_meters / 1000).toFixed(2)} ק"מ`
                  : undefined,
              }))}
              onRestore={runsRepo.restoreRun}
            />
          ) : null}

          {trashedExercises.length > 0 ? (
            <TrashSection
              title="תרגילים"
              icon={<BookOpen aria-hidden />}
              items={trashedExercises.map((e) => ({
                id: e.id,
                primary: e.name_he,
                secondary: e.name_en ?? undefined,
              }))}
              onRestore={restoreExercise}
            />
          ) : null}

          {trashedTemplates.length > 0 ? (
            <TrashSection
              title="תבניות אימון"
              icon={<Layers aria-hidden />}
              items={trashedTemplates.map((t) => ({
                id: t.id,
                primary: t.name,
                secondary: `גרסה ${t.version} · בוצעה ${t.usage_count}×`,
              }))}
              onRestore={restoreTemplate}
            />
          ) : null}

          {trashedSessions.length > 0 ? (
            <TrashSection
              title="אימוני חדר כושר"
              icon={<Dumbbell aria-hidden />}
              items={trashedSessions.map((s) => ({
                id: s.id,
                primary: s.name,
                secondary: [
                  `אומן ${shortDate(s.started_at) ?? "—"}`,
                  s.deleted_at ? `נמחק ${shortDate(s.deleted_at)}` : undefined,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              onRestore={restoreSession}
            />
          ) : null}

          {trashedHomeSessions.length > 0 ? (
            <TrashSection
              title="אימוני בית"
              icon={<House aria-hidden />}
              items={trashedHomeSessions.map((s) => ({
                id: s.id,
                primary: s.name,
                secondary: [
                  `אומן ${shortDate(s.started_at) ?? "—"}`,
                  s.deleted_at ? `נמחק ${shortDate(s.deleted_at)}` : undefined,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              onRestore={restoreHomeSession}
            />
          ) : null}

          {trashedGoals.length > 0 ? (
            <TrashSection
              title="יעדים"
              icon={<Target aria-hidden />}
              items={trashedGoals.map((g) => ({
                id: g.id,
                primary: g.name,
                secondary: [
                  GOAL_DOMAIN_LABEL[g.domain],
                  g.target_value != null ? `יעד ${g.target_value} ${g.target_unit}` : undefined,
                  g.deleted_at ? `נמחק ${shortDate(g.deleted_at)}` : undefined,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              onRestore={restoreGoal}
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
