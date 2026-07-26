/**
 * /sessions/$id — מסך אימון כוח פעיל.
 * מובייל תחילה, אריחים, כפתורים גדולים, אין גלילה אופקית.
 * ה־session נשמר autosave לכל שינוי דרך storage. snapshot של התבנית קפוא.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Pause,
  Play,
  Plus,
  Save,
  StopCircle,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileFootnote, TileLabel, TileMetric } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExerciseCard } from "@/components/session/ExerciseCard";
import { RestTimer } from "@/components/session/RestTimer";
import { ExercisePickerSheet } from "@/components/templates/ExercisePickerSheet";
import { useAllLocations } from "@/lib/catalog";
import {
  abandonSession,
  addExerciseToSession,
  finishSession,
  finishSessionPartial,
  pauseSession,
  resumeSession,
  substituteExercise,
  trashSession,
  updateSession,
  updateSessionExercise,
  useLiveSessionDuration,
  usePersistenceStatus,
  useSession,
  useSessionBlocks,
  useSessionExercises,
  useSessionVolume,
  type PersistenceStatus,
} from "@/lib/sessions";
import { useWorstStorageStatus } from "@/lib/storage/hooks";
import type { StorageWriteStatus } from "@/lib/storage/safeStorage";

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
  const [finishOpen, setFinishOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [notesFor, setNotesFor] = useState<string | null>(null);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const persistence = usePersistenceStatus();
  const worstStorage = useWorstStorageStatus();

  const activeLocation = useMemo(
    () => locations.find((l) => l.id === session?.location_id) ?? null,
    [locations, session?.location_id],
  );

  // קיבוץ תרגילים לפי בלוק (תוויות A1/A2). חייב להיקרא לפני כל early return —
  // hooks חייבים לרוץ באותו סדר בכל render.
  const byBlock = useMemo(() => {
    const map = new Map<string, typeof exercises>();
    for (const ex of exercises) {
      const list = map.get(ex.block_id) ?? [];
      list.push(ex);
      map.set(ex.block_id, list);
    }
    return map;
  }, [exercises]);

  if (!session) {
    // מצב שגיאה/התאוששות — לא 404 גנרי: מסביר מה קרה ומציע יציאה בטוחה.
    return (
      <AppShell topBar={{ title: "אימון", back: { to: "/gym" } }}>
        <div className="px-4 sm:px-6">
          <EmptyState
            title="האימון לא נמצא"
            description="ייתכן שהאימון נמחק או שהקישור אינו תקין. אימונים אחרים לא הושפעו."
            action={
              <Link
                to="/gym"
                className="inline-flex min-h-11 items-center rounded-xl bg-gym px-4 text-sm font-bold text-white"
              >
                חזרה לחדר כושר
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  const status = session.status;
  const isActive = status === "in_progress";
  const isPaused = status === "paused";
  const isFinished = status === "completed";

  const remainingSets = volume.totalSets - volume.completedSets - volume.skippedSets;
  const isPartial = remainingSets > 0;

  /** סיום מלא — אין סטים פתוחים. */
  function finishComplete() {
    finishSession(id);
    navigate({ to: "/sessions/$id/summary", params: { id } });
  }

  /** סיום חלקי — סטים שלא בוצעו מסומנים כדולגו; מה שבוצע נשמר. */
  function finishPartial() {
    finishSessionPartial(id);
    navigate({ to: "/sessions/$id/summary", params: { id } });
  }

  function handleFinish() {
    if (isPartial) {
      setFinishOpen(true);
      return;
    }
    finishComplete();
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
                <SaveStatus status={persistence} worstStatus={worstStorage.status} />
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
                  <MenuBtn onClick={() => setRenaming(true)}>שינוי שם</MenuBtn>
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
                    onClick={() => setConfirmTrash(true)}
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
                    onEditNotes={setNotesFor}
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

      {/* סיום חלקי — bottom sheet קליל, לא confirm() חוסם */}
      <Sheet open={finishOpen} onOpenChange={setFinishOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>סיום אימון חלקי</SheetTitle>
            <SheetDescription>
              נותרו {remainingSets} סטים שלא בוצעו. סיום עכשיו יסמן אותם כדולגו. הסטים שכבר
              בוצעו נשמרים.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => {
                setFinishOpen(false);
                finishPartial();
              }}
              className="min-h-12 rounded-xl bg-gym text-white"
            >
              סיים אימון חלקי
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFinishOpen(false)}
              className="min-h-12 rounded-xl border-border-strong"
            >
              חזרה לאימון
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* שינוי שם — inline, ללא prompt() */}
      <Sheet open={renaming} onOpenChange={setRenaming}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>שם האימון</SheetTitle>
          </SheetHeader>
          <form
            className="mt-4 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const value = new FormData(e.currentTarget).get("name");
              if (typeof value === "string" && value.trim()) {
                updateSession(id, { name: value.trim() });
              }
              setRenaming(false);
            }}
          >
            <Input name="name" defaultValue={session.name} aria-label="שם האימון" autoFocus />
            <Button type="submit" className="min-h-12 rounded-xl bg-gym text-white">
              שמור
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* הערת תרגיל — inline, ללא prompt() */}
      <Sheet open={!!notesFor} onOpenChange={(v) => !v && setNotesFor(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>הערה על התרגיל</SheetTitle>
          </SheetHeader>
          <form
            className="mt-4 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const value = new FormData(e.currentTarget).get("notes");
              if (notesFor && typeof value === "string") {
                updateSessionExercise(notesFor, { notes: value.trim() || null });
              }
              setNotesFor(null);
            }}
          >
            <Input
              name="notes"
              defaultValue={exercises.find((e) => e.id === notesFor)?.notes ?? ""}
              aria-label="הערה על התרגיל"
              autoFocus
            />
            <Button type="submit" className="min-h-12 rounded-xl bg-gym text-white">
              שמור הערה
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* מחיקה — פעולה הרסנית, מופרדת חזותית */}
      <Sheet open={confirmTrash} onOpenChange={setConfirmTrash}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>מחיקת אימון</SheetTitle>
            <SheetDescription>
              האימון יעבור לסל המחזור וניתן יהיה לשחזר אותו משם. הנתונים לא נמחקים לצמיתות.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => {
                setConfirmTrash(false);
                trashSession(id);
                navigate({ to: "/gym" });
              }}
              className="min-h-12 rounded-xl bg-destructive text-white"
            >
              העבר לסל המחזור
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmTrash(false)}
              className="min-h-12 rounded-xl border-border-strong"
            >
              ביטול
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <RestTimer sessionId={id} />
    </AppShell>
  );
}

/**
 * סטטוס שמירה — טקסט **ואייקון**, לא צבע בלבד (a11y).
 *
 * מציג "נשמר" רק אחרי שה-repository אישר כתיבה מוצלחת ל-localStorage, **וגם** רק
 * כאשר אף מודול אחר לא נכשל בכתיבה (`worstStatus`): אסור להצהיר "נשמר" בזמן
 * שההתראה הגלובלית מדווחת על כשל.
 */
function SaveStatus({
  status,
  worstStatus,
}: {
  status: PersistenceStatus;
  worstStatus: StorageWriteStatus;
}) {
  if (status === "memory") {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1 text-xs font-bold text-destructive"
      >
        <AlertTriangle aria-hidden className="size-3" /> לא נשמר במכשיר — לא ישרוד רענון
      </span>
    );
  }
  if (status === "saved" && worstStatus === "saved") {
    return (
      <span role="status" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Save aria-hidden className="size-3" /> נשמר במכשיר
      </span>
    );
  }
  // מודול אחר נכשל בכתיבה, או שטרם בוצעה כתיבה — לא מצהירים "נשמר".
  return (
    <span role="status" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Save aria-hidden className="size-3" /> שמירה אוטומטית
    </span>
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
