/**
 * /sessions/$id — מסך אימון כוח פעיל.
 * מובייל תחילה, אריחים, כפתורים גדולים, אין גלילה אופקית.
 * ה־session נשמר autosave לכל שינוי דרך storage. snapshot של התבנית קפוא.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, MapPin, Pause, Play, Plus, Save, StopCircle, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileFootnote, TileLabel, TileMetric } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExerciseCard } from "@/components/session/ExerciseCard";
import { RestTimer } from "@/components/session/RestTimer";
import { ExercisePickerSheet } from "@/components/templates/ExercisePickerSheet";
import { useAllLocations } from "@/lib/catalog";
import {
  abandonSession,
  addExerciseToSession,
  finishSession,
  pauseSession,
  resumeSession,
  substituteExercise,
  trashSession,
  updateSession,
  updateSessionExercise,
  useLiveSessionDuration,
  useSession,
  useSessionBlocks,
  useSessionExercises,
  useSessionVolume,
} from "@/lib/sessions";

export const Route = createFileRoute("/sessions/$id/")({
  head: () => ({
    meta: [
      { title: "אימון פעיל · Fit Log" },
      { name: "description", content: "מסך ביצוע אימון כוח פעיל." },
      { property: "og:title", content: "אימון פעיל · Fit Log" },
      { property: "og:description", content: "מסך ביצוע אימון כוח פעיל." },
    ],
  }),
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  const session = useSession(id);
  const blocks = useSessionBlocks(id);
  const exercises = useSessionExercises(id);
  const volume = useSessionVolume(id);
  const duration = useLiveSessionDuration(id);
  const locations = useAllLocations();
  const navigate = useNavigate();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [substituteFor, setSubstituteFor] = useState<string | null>(null);

  const activeLocation = useMemo(
    () => locations.find((l) => l.id === session?.location_id) ?? null,
    [locations, session?.location_id],
  );

  if (!session) throw notFound();

  const status = session.status;
  const isActive = status === "in_progress";
  const isPaused = status === "paused";
  const isFinished = status === "completed";

  // Group exercises by block for A1/A2 labels
  const byBlock = useMemo(() => {
    const map = new Map<string, typeof exercises>();
    for (const ex of exercises) {
      const list = map.get(ex.block_id) ?? [];
      list.push(ex);
      map.set(ex.block_id, list);
    }
    return map;
  }, [exercises]);

  function handleFinish() {
    const incomplete = exercises.some((e) => !e.completed);
    if (incomplete && !confirm("יש תרגילים לא מסומנים כהושלמו. לסיים בכל זאת?")) return;
    finishSession(id);
    navigate({ to: "/sessions/$id/summary", params: { id } });
  }

  return (
    <AppShell
      topBar={{
        title: session.name,
        back: { to: "/gym" },
        action: isFinished ? (
          <Link
            to="/sessions/$id/summary"
            params={{ id }}
            className="tile-interactive inline-flex min-h-9 items-center gap-1 rounded-xl bg-gym px-3 text-sm font-bold text-white"
          >
            סיכום
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            className="tile-interactive inline-flex min-h-9 items-center gap-1 rounded-xl bg-gym px-3 text-sm font-bold text-white"
          >
            <StopCircle aria-hidden className="size-4" /> סיום
          </button>
        ),
      }}
    >
      {/* Header block */}
      <div className="px-4 sm:px-6">
        <div className="rounded-2xl border border-border-strong bg-surface-elevated p-3 shadow-tile">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {isActive ? <Chip tone="success">בהתקדמות</Chip> : null}
                {isPaused ? <Chip tone="warning">מושהה</Chip> : null}
                {isFinished ? <Chip tone="info">הסתיים</Chip> : null}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Save aria-hidden className="size-3" /> נשמר אוטומטית
                </span>
              </div>
              <div className="mt-1 text-lg font-black leading-tight">{session.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin aria-hidden className="size-3" />
                {activeLocation ? (
                  <span>{activeLocation.name}</span>
                ) : (
                  <LocationPicker
                    onPick={(locId) => updateSession(id, { location_id: locId })}
                    locations={locations}
                  />
                )}
              </div>
            </div>
            <div className="text-end">
              <div className="ltr-nums text-2xl font-black tabular-nums">{formatHMS(duration)}</div>
              <div className="text-[10px] uppercase text-muted-foreground">משך אימון</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="סטים" value={`${volume.completedSets}/${volume.totalSets}`} />
            <MiniStat label="נפח" value={`${volume.totalVolumeKg}ק״ג`} />
            <MiniStat
              label="תרגילים"
              value={`${volume.completedExercises}/${volume.totalExercises}`}
            />
          </div>

          {!isFinished ? (
            <div className="mt-3 flex items-center gap-2">
              {isPaused ? (
                <Button
                  type="button"
                  onClick={() => resumeSession(id)}
                  className="flex-1 rounded-xl bg-gym text-white"
                >
                  <Play aria-hidden className="size-4" /> המשך
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => pauseSession(id)}
                  className="flex-1 rounded-xl border-border-strong"
                >
                  <Pause aria-hidden className="size-4" /> השהה
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="grid size-10 place-items-center rounded-xl border border-border-strong bg-tint"
                    aria-label="פעולות אימון"
                  >
                    …
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-1">
                  <MenuBtn
                    onClick={() => {
                      const name = prompt("שם אימון", session.name);
                      if (name) updateSession(id, { name });
                    }}
                  >
                    שינוי שם
                  </MenuBtn>
                  <LocationSubmenu
                    current={session.location_id}
                    locations={locations}
                    onPick={(locId) => updateSession(id, { location_id: locId })}
                  />
                  <MenuBtn
                    onClick={() => {
                      abandonSession(id, true);
                      navigate({ to: "/gym" });
                    }}
                  >
                    שמור כטיוטה וצא
                  </MenuBtn>
                  <MenuBtn
                    danger
                    onClick={() => {
                      if (confirm("להעביר את האימון לסל המחזור?")) {
                        trashSession(id);
                        navigate({ to: "/gym" });
                      }
                    }}
                    icon={<Trash2 className="size-4" aria-hidden />}
                  >
                    מחק אימון
                  </MenuBtn>
                </PopoverContent>
              </Popover>
            </div>
          ) : null}
        </div>
      </div>

      <PageHeader
        eyebrow={
          session.template_id ? `מבוסס תבנית · v${session.template_version ?? "?"}` : "אימון חופשי"
        }
        title="תרגילים"
      />

      <div className="flex flex-col gap-3 px-4 pb-32 sm:px-6">
        {blocks.length === 0 ? (
          <EmptyState
            title="אין תרגילים באימון"
            description="הוסף תרגיל ראשון כדי להתחיל."
            action={
              <Button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="rounded-xl bg-gym text-white"
              >
                <Plus aria-hidden className="size-4" /> הוסף תרגיל
              </Button>
            }
          />
        ) : (
          blocks.map((block) => {
            const blockExercises = byBlock.get(block.id) ?? [];
            const isSuper = block.block_type === "superset" || block.block_type === "circuit";
            const letter = String.fromCharCode(65 + block.sequence);
            return (
              <section key={block.id} className="flex flex-col gap-2">
                {isSuper && blockExercises.length > 1 ? (
                  <header className="flex items-center gap-2 rounded-xl bg-gym-soft/40 px-2 py-1 text-xs font-black text-gym">
                    <span>סופרסט {letter}</span>
                    {block.rounds > 1 ? <Chip>{block.rounds}×</Chip> : null}
                  </header>
                ) : null}
                {blockExercises.map((ex, i) => (
                  <ExerciseCard
                    key={ex.id}
                    sessionId={id}
                    exercise={ex}
                    supersetLabel={
                      isSuper && blockExercises.length > 1 ? `${letter}${i + 1}` : undefined
                    }
                    onSubstitute={setSubstituteFor}
                    onEditNotes={(exId) => {
                      const cur = exercises.find((e) => e.id === exId);
                      const val = prompt("הערה על התרגיל", cur?.notes ?? "");
                      if (val != null) updateSessionExercise(exId, { notes: val || null });
                    }}
                  />
                ))}
              </section>
            );
          })
        )}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong bg-transparent text-sm font-bold text-muted-foreground active:bg-tint"
        >
          <Plus aria-hidden className="size-5" /> הוסף תרגיל
        </button>

        {!isFinished ? (
          <Button
            type="button"
            onClick={handleFinish}
            className="mt-2 rounded-xl bg-success text-success-foreground"
          >
            <CheckCircle2 aria-hidden className="size-5" /> סיים אימון
          </Button>
        ) : (
          <Tile variant="info" tone="soft">
            <TileLabel>אימון הסתיים</TileLabel>
            <TileFootnote>
              משך: {formatHMS(session.duration_seconds ?? 0)} · נפח: {volume.totalVolumeKg}ק״ג
            </TileFootnote>
            <div className="mt-2">
              <Link
                to="/sessions/$id/summary"
                params={{ id }}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-gym px-3 text-sm font-bold text-white"
              >
                מסך סיכום
              </Link>
            </div>
          </Tile>
        )}
      </div>

      {/* Add exercise picker (single or superset) */}
      <ExercisePickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        locationId={session.location_id}
        title="הוספת תרגיל לאימון"
        onSelect={(ids, asSuperset) => {
          if (ids.length === 0) return;
          if (asSuperset && ids.length > 1) {
            let blockId: string | undefined;
            for (const exId of ids) {
              const added = addExerciseToSession(id, exId, {
                asNewBlock: !blockId,
                targetBlockId: blockId,
                asSuperset: true,
              });
              if (added && !blockId) blockId = added.block_id;
            }
          } else {
            for (const exId of ids) {
              addExerciseToSession(id, exId, { asNewBlock: true });
            }
          }
          setPickerOpen(false);
        }}
      />

      {/* Substitute picker — single choice */}
      <ExercisePickerSheet
        open={!!substituteFor}
        onOpenChange={(v) => !v && setSubstituteFor(null)}
        locationId={session.location_id}
        title="החלפת תרגיל"
        onSelect={(ids) => {
          if (substituteFor && ids[0]) substituteExercise(substituteFor, ids[0]);
          setSubstituteFor(null);
        }}
      />

      <RestTimer sessionId={id} />
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Tile size="sm" className="p-2">
      <TileLabel className="text-[10px]">{label}</TileLabel>
      <TileMetric value={value} />
    </Tile>
  );
}

function LocationPicker({
  onPick,
  locations,
}: {
  onPick: (id: string) => void;
  locations: ReturnType<typeof useAllLocations>;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border-strong px-1.5 py-0.5 text-xs font-bold text-primary"
        >
          בחר מקום אימון
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        {locations.length === 0 ? (
          <div className="p-2 text-xs text-muted-foreground">אין מקומות מוגדרים.</div>
        ) : (
          locations.map((l) => (
            <MenuBtn key={l.id} onClick={() => onPick(l.id)}>
              {l.name}
            </MenuBtn>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

function LocationSubmenu({
  current,
  locations,
  onPick,
}: {
  current: string | null;
  locations: ReturnType<typeof useAllLocations>;
  onPick: (id: string) => void;
}) {
  if (!locations.length) return null;
  return (
    <div className="border-t border-border-strong pt-1">
      <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
        מקום אימון
      </div>
      {locations.map((l) => (
        <MenuBtn
          key={l.id}
          onClick={() => onPick(l.id)}
          icon={
            <MapPin
              className={`size-4 ${l.id === current ? "text-primary" : "text-muted-foreground"}`}
              aria-hidden
            />
          }
        >
          {l.name}
        </MenuBtn>
      ))}
    </div>
  );
}

function MenuBtn({
  children,
  onClick,
  icon,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-sm hover:bg-tint ${
        danger ? "text-destructive" : ""
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function formatHMS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (hh > 0)
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
