/**
 * /exercises/$id — פרטי תרגיל.
 * שם + מטא־דאטה + מפת גוף + ציוד + הוראות + חלופות + היסטוריה (empty state כרגע).
 * Sections נפתחים כדי לא להציף.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Copy,
  Dumbbell,
  Edit2,
  History,
  Info,
  Layers,
  ListChecks,
  MapPin,
  Star,
  StarOff,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MuscleMap } from "@/components/exercises/MuscleMap";
import { AlternativesList } from "@/components/exercises/AlternativesList";
import { MediaGallery } from "@/components/exercises/MediaGallery";
import { ExerciseHistoryPanel } from "@/components/analytics/ExerciseHistoryPanel";
import { ExerciseForm } from "@/components/exercises/ExerciseForm";
import {
  EQUIPMENT_TYPE_LABEL,
  useAllLocations,
  useEquipmentInLocation,
  type EquipmentType,
} from "@/lib/catalog";
import {
  AVAILABILITY_STATUS_LABEL,
  AVAILABILITY_STATUS_TONE,
  CATEGORY_LABEL,
  DIFFICULTY_LABEL,
  duplicateExercise,
  findAlternatives,
  getExerciseAvailability,
  MOVEMENT_PATTERN_LABEL,
  toggleFavoriteExercise,
  TRACKING_TYPE_LABEL,
  useAllExercises,
  useExercise,
  useExerciseMedia,
  useMuscleGroups,
  useVariationsOf,
} from "@/lib/exercises";

export const Route = createFileRoute("/exercises/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "תרגיל · Fit Log" },
      { name: "description", content: "פרטי תרגיל, ציוד, מפת שרירים וחלופות." },
      { property: "og:title", content: "תרגיל · Fit Log" },
      { property: "og:description", content: `מזהה תרגיל ${params.id}.` },
    ],
  }),
  loader: ({ params }) => ({ id: params.id }),
  notFoundComponent: MissingExercise,
  component: ExerciseDetailPage,
});

function MissingExercise() {
  return (
    <AppShell topBar={{ title: "תרגיל לא נמצא", back: { to: "/exercises" } }}>
      <div className="px-4 sm:px-6">
        <EmptyState
          title="התרגיל לא נמצא"
          description="ייתכן שהוא הועבר לסל מחזור. אפשר לשחזר משם."
          action={
            <Link
              to="/exercises"
              className="tile-interactive inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold"
            >
              חזרה לספרייה
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}

function ExerciseDetailPage() {
  const { id } = Route.useParams();
  const exercise = useExercise(id);
  const muscleGroups = useMuscleGroups();
  const allExercises = useAllExercises();
  const media = useExerciseMedia(id);
  const variations = useVariationsOf(id);
  const locations = useAllLocations();
  const [locationId, setLocationId] = useState<string>("");
  const equipment = useEquipmentInLocation(locationId);
  const [editOpen, setEditOpen] = useState(false);

  const mgById = useMemo(() => new Map(muscleGroups.map((m) => [m.id, m])), [muscleGroups]);

  const snapshot = locationId ? { locationId, items: equipment } : null;
  const favoriteIds = useMemo(
    () => allExercises.filter((e) => e.is_favorite).map((e) => e.id),
    [allExercises],
  );
  const alternatives = useMemo(
    () =>
      exercise
        ? findAlternatives(exercise, {
            candidatePool: allExercises,
            snapshot,
            favoriteIds,
            limit: 6,
          })
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise?.id, allExercises, snapshot?.locationId, equipment.length, favoriteIds],
  );

  if (!exercise) return <MissingExercise />;

  const primaryMuscle = mgById.get(exercise.primary_muscle_group_id);
  const secondaryMuscles = exercise.secondary_muscle_group_ids
    .map((id) => mgById.get(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const availability = getExerciseAvailability(exercise, snapshot);
  const availabilityTone = AVAILABILITY_STATUS_TONE[availability.status];

  const parent = exercise.parent_exercise_id
    ? (allExercises.find((e) => e.id === exercise.parent_exercise_id) ?? null)
    : null;

  return (
    <AppShell topBar={{ title: exercise.name_he, back: { to: "/exercises" } }}>
      <PageHeader
        eyebrow={exercise.is_system ? "תרגיל מערכת" : "תרגיל אישי"}
        title={exercise.name_he}
        description={
          exercise.name_en
            ? `${exercise.name_en}${exercise.aliases.length > 0 ? " · " + exercise.aliases.join(", ") : ""}`
            : undefined
        }
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="min-h-11 rounded-xl border-border-strong"
              onClick={() => toggleFavoriteExercise(exercise.id)}
              aria-label={exercise.is_favorite ? "הסרה ממועדפים" : "הוספה למועדפים"}
            >
              {exercise.is_favorite ? <StarOff className="size-4" /> : <Star className="size-4" />}
            </Button>
            {exercise.is_system ? (
              <Button
                onClick={() => {
                  const dup = duplicateExercise(exercise.id);
                  if (dup) window.history.pushState({}, "", `/exercises/${dup.id}`);
                }}
                className="min-h-11 rounded-xl bg-primary text-primary-foreground"
              >
                <Copy aria-hidden className="me-1 size-4" />
                שכפול לעריכה
              </Button>
            ) : (
              <Button
                onClick={() => setEditOpen(true)}
                className="min-h-11 rounded-xl bg-primary text-primary-foreground"
              >
                <Edit2 aria-hidden className="me-1 size-4" />
                עריכה
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 px-4 sm:px-6">
        <Tile>
          <div className="flex flex-wrap gap-1.5">
            <Chip>{CATEGORY_LABEL[exercise.category]}</Chip>
            <Chip>{MOVEMENT_PATTERN_LABEL[exercise.movement_pattern]}</Chip>
            <Chip>{TRACKING_TYPE_LABEL[exercise.tracking_type]}</Chip>
            <Chip tone="info">{DIFFICULTY_LABEL[exercise.difficulty]}</Chip>
            {exercise.unilateral ? <Chip>חד־צדדי</Chip> : null}
            {exercise.bodyweight_based ? <Chip>משקל גוף</Chip> : null}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <MetricCell label="סטים" value={String(exercise.default_sets)} />
            <MetricCell
              label="חזרות"
              value={exercise.default_reps != null ? String(exercise.default_reps) : "—"}
            />
            <MetricCell
              label="מנוחה"
              value={
                exercise.default_rest_seconds != null ? `${exercise.default_rest_seconds} שנ'` : "—"
              }
            />
          </div>
        </Tile>
      </div>

      <SectionHeader title="ציוד וזמינות" />
      <div className="grid grid-cols-1 gap-3 px-4 sm:px-6">
        <Tile>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                מקום אימון לבדיקת זמינות
              </div>
              <div className="mt-1.5">
                <Select
                  value={locationId || "none"}
                  onValueChange={(v) => setLocationId(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="min-h-11 rounded-xl border-border-strong">
                    <SelectValue placeholder="בחר מקום" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="none">ללא בדיקה</SelectItem>
                    {locations
                      .filter((l) => l.deleted_at === null && l.is_active)
                      .map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
              className="justify-self-start sm:justify-self-end"
            >
              {AVAILABILITY_STATUS_LABEL[availability.status]}
            </Chip>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{availability.humanExplanation}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {exercise.required_equipment_types.map((t) => (
              <Chip key={`req-${t}`}>{EQUIPMENT_TYPE_LABEL[t as EquipmentType] ?? t}</Chip>
            ))}
            {exercise.optional_equipment_types.map((t) => (
              <Chip key={`opt-${t}`} tone="info">
                {EQUIPMENT_TYPE_LABEL[t as EquipmentType] ?? t} · אופציונלי
              </Chip>
            ))}
            {exercise.required_equipment_types.length === 0 &&
            exercise.optional_equipment_types.length === 0 ? (
              <Chip>ללא ציוד</Chip>
            ) : null}
          </div>
        </Tile>
      </div>

      <SectionHeader title="שרירים מעורבים" />
      <div className="px-4 sm:px-6">
        <Tile>
          <MuscleMap
            primaryRegion={primaryMuscle?.body_region ?? null}
            secondaryRegions={secondaryMuscles.map((m) => m.body_region)}
          />
        </Tile>
      </div>

      {(exercise.instructions ||
        exercise.technique_cues.length > 0 ||
        exercise.common_mistakes.length > 0 ||
        exercise.personal_notes) && (
        <>
          <SectionHeader title="הוראות וטכניקה" />
          <div className="grid grid-cols-1 gap-3 px-4 sm:px-6">
            {exercise.instructions ? (
              <Tile>
                <SectionTitle icon={<BookOpen aria-hidden />}>הוראות</SectionTitle>
                <p className="text-sm text-foreground">{exercise.instructions}</p>
              </Tile>
            ) : null}
            {exercise.technique_cues.length > 0 ? (
              <Tile>
                <SectionTitle icon={<ListChecks aria-hidden />}>נקודות טכניקה</SectionTitle>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {exercise.technique_cues.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </Tile>
            ) : null}
            {exercise.common_mistakes.length > 0 ? (
              <Tile variant="warning" tone="soft">
                <SectionTitle icon={<Info aria-hidden />}>טעויות נפוצות</SectionTitle>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {exercise.common_mistakes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </Tile>
            ) : null}
            {exercise.personal_notes ? (
              <Tile>
                <SectionTitle icon={<Edit2 aria-hidden />}>הערות אישיות</SectionTitle>
                <p className="text-sm">{exercise.personal_notes}</p>
              </Tile>
            ) : null}
          </div>
        </>
      )}

      <SectionHeader title="מדיה" />
      <div className="px-4 sm:px-6">
        <MediaGallery media={media} />
      </div>

      {(variations.length > 0 || parent) && (
        <>
          <SectionHeader title="ווריאציות" />
          <div className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 sm:px-6">
            {parent ? (
              <Link to="/exercises/$id" params={{ id: parent.id }}>
                <Tile size="sm" className="hover:border-primary/50">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                    <Layers aria-hidden className="size-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        תרגיל אב
                      </div>
                      <div className="truncate text-sm font-bold">{parent.name_he}</div>
                    </div>
                  </div>
                </Tile>
              </Link>
            ) : null}
            {variations.map((v) => (
              <Link key={v.id} to="/exercises/$id" params={{ id: v.id }}>
                <Tile size="sm" className="hover:border-primary/50">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                    <Layers aria-hidden className="size-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        ווריאציה
                      </div>
                      <div className="truncate text-sm font-bold">{v.name_he}</div>
                    </div>
                  </div>
                </Tile>
              </Link>
            ))}
          </div>
        </>
      )}

      <SectionHeader title="חלופות" />
      <div className="px-4 sm:px-6">
        <AlternativesList alternatives={alternatives} muscleGroups={muscleGroups} />
      </div>

      <SectionHeader title="היסטוריה" />
      <div className="px-4 sm:px-6">
        <ExerciseHistoryPanel exerciseId={exercise.id} />
      </div>

      {!exercise.is_system ? (
        <ExerciseForm
          open={editOpen}
          onOpenChange={setEditOpen}
          exercise={exercise}
          muscleGroups={muscleGroups}
        />
      ) : null}
    </AppShell>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-strong bg-surface p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="ltr-nums mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-sm font-bold">
      <span className="grid size-7 place-items-center rounded-lg bg-tint text-foreground [&_svg]:size-4">
        {icon}
      </span>
      {children}
    </div>
  );
}
