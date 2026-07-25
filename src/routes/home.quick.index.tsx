/**
 * /home/quick — בחירת תרגיל לדיווח מהיר.
 * מציג: מועדפים, אחרונים, כל תרגילי הבית + חיפוש.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bolt, Search, Star, Plus, X } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile } from "@/components/tile/Tile";
import { Input } from "@/components/ui/input";
import { useAllExercises } from "@/lib/exercises";
import type { Exercise } from "@/lib/exercises";
import { recentExerciseIds, startQuickEntry } from "@/lib/home";

export const Route = createFileRoute("/home/quick/")({
  head: () => ({
    meta: [
      { title: "דיווח מהיר · Fit Log" },
      { name: "description", content: "בחר תרגיל להתחלת דיווח מהיר." },
      { property: "og:title", content: "דיווח מהיר · Fit Log" },
      { property: "og:description", content: "בחר תרגיל להתחלת דיווח מהיר." },
    ],
  }),
  component: QuickPickPage,
});

function QuickPickPage() {
  const all = useAllExercises();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const homeCandidates = useMemo(
    () =>
      all.filter(
        (e) =>
          !e.deleted_at &&
          e.is_active &&
          (e.bodyweight_based || e.category === "bodyweight" || e.location_ids.length === 0),
      ),
    [all],
  );
  const favorites = homeCandidates.filter((e) => e.is_favorite).slice(0, 8);
  const recentIds = recentExerciseIds(8);
  const recent = recentIds
    .map((id) => homeCandidates.find((e) => e.id === id))
    .filter((e): e is Exercise => !!e);
  const searchLower = q.trim().toLowerCase();
  const searchResults = searchLower
    ? homeCandidates
        .filter(
          (e) =>
            e.name_he.toLowerCase().includes(searchLower) ||
            (e.name_en ?? "").toLowerCase().includes(searchLower) ||
            e.aliases.some((a) => a.toLowerCase().includes(searchLower)),
        )
        .slice(0, 30)
    : null;

  const start = (exerciseId: string) => {
    const { session } = startQuickEntry({ exercise_id: exerciseId });
    navigate({ to: "/home/sessions/$id", params: { id: session.id } });
  };

  return (
    <AppShell topBar={{ title: "דיווח מהיר", back: { to: "/home", label: "חזרה" } }}>
      <PageHeader eyebrow="בית" title="בחר תרגיל" />

      <div className="mb-3 flex items-center gap-2 px-4 sm:px-6">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש תרגיל"
            className="pe-9"
            aria-label="חיפוש תרגיל"
          />
        </div>
        {q ? (
          <button
            type="button"
            aria-label="נקה חיפוש"
            onClick={() => setQ("")}
            className="min-h-11 min-w-11 rounded-xl border border-border-strong bg-tint p-2 text-muted-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {searchResults ? (
        <>
          <SectionHeader title={`תוצאות (${searchResults.length})`} />
          <div className="grid grid-cols-2 gap-2 px-4 sm:px-6">
            {searchResults.length === 0 ? (
              <EmptyState
                title="לא נמצאו תרגילים"
                description="נסה מונח אחר או צור תרגיל חדש בספרייה."
                action={
                  <Link
                    to="/exercises"
                    className="tile-interactive inline-flex min-h-11 items-center gap-2 rounded-xl bg-home px-4 text-sm font-bold text-white"
                  >
                    <Plus aria-hidden className="size-4" />
                    ספרייה
                  </Link>
                }
              />
            ) : (
              searchResults.map((e) => <PickTile key={e.id} exercise={e} onPick={start} />)
            )}
          </div>
        </>
      ) : (
        <>
          {favorites.length > 0 ? (
            <>
              <SectionHeader title="מועדפים" />
              <div className="grid grid-cols-2 gap-2 px-4 sm:px-6">
                {favorites.map((e) => (
                  <PickTile key={e.id} exercise={e} onPick={start} favorite />
                ))}
              </div>
            </>
          ) : null}
          {recent.length > 0 ? (
            <>
              <SectionHeader title="אחרונים" />
              <div className="grid grid-cols-2 gap-2 px-4 sm:px-6">
                {recent.map((e) => (
                  <PickTile key={e.id} exercise={e} onPick={start} />
                ))}
              </div>
            </>
          ) : null}
          <SectionHeader title="כל תרגילי הבית" />
          <div className="grid grid-cols-2 gap-2 px-4 sm:px-6">
            {homeCandidates.slice(0, 40).map((e) => (
              <PickTile key={e.id} exercise={e} onPick={start} />
            ))}
          </div>
          <div className="mt-4 px-4 sm:px-6">
            <Link
              to="/exercises"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-strong bg-tint px-4 text-sm font-bold text-muted-foreground"
            >
              <Plus aria-hidden className="size-4" />
              יצירת תרגיל חדש
            </Link>
          </div>
        </>
      )}
    </AppShell>
  );
}

function PickTile({
  exercise,
  onPick,
  favorite,
}: {
  exercise: Exercise;
  onPick: (id: string) => void;
  favorite?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(exercise.id)}
      className="text-start"
    >
      <Tile variant="home" tone="soft" interactive size="sm">
        <div className="flex items-center gap-2">
          {favorite ? (
            <Star aria-hidden className="size-3.5 fill-goal text-goal" />
          ) : (
            <Bolt aria-hidden className="size-3.5 text-home" />
          )}
          <div className="truncate text-sm font-black">{exercise.name_he}</div>
        </div>
      </Tile>
    </button>
  );
}
