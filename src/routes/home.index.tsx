/**
 * /home — מסך הכניסה לתחום כוח בבית.
 * דיווח מהיר, מועדפים, אחרונים, טיוטות פעילות, תבניות ומגמה תקופתית.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bolt,
  History as HistoryIcon,
  Library,
  LayoutTemplate,
  Play,
  Plus,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileFootnote, TileLabel, TileMetric } from "@/components/tile/Tile";
import {
  recentExerciseIds,
  useActiveHomeDrafts,
  useHomeSessions,
  useHomeTemplates,
} from "@/lib/home";
import { useAllExercises } from "@/lib/exercises";
import { daysSince, frequencyPerWeek } from "@/lib/home";
import { HomeSessionTileWrapper } from "@/components/home/HomeSessionTileWrapper";
import { DomainPrimaryGoalTile } from "@/components/goals/DomainPrimaryGoalTile";

export const Route = createFileRoute("/home/")({
  head: () => ({
    meta: [
      { title: "כוח בבית · Fit Log" },
      { name: "description", content: "דיווח מהיר, תבניות בית והיסטוריית תרגילים." },
      { property: "og:title", content: "כוח בבית · Fit Log" },
      { property: "og:description", content: "דיווח מהיר, תבניות בית והיסטוריית תרגילים." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const sessions = useHomeSessions();
  const drafts = useActiveHomeDrafts();
  const templates = useHomeTemplates();
  const exercises = useAllExercises();

  const completed = sessions.filter((s) => s.status === "completed" || s.status === "partial");
  const lastCompleted = completed
    .slice()
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
  const dsl = daysSince(lastCompleted?.started_at ?? null);
  const freq = frequencyPerWeek(completed.map((s) => s.started_at));
  const recentIds = recentExerciseIds(4);
  const recentExercises = recentIds
    .map((id) => exercises.find((e) => e.id === id))
    .filter(Boolean);
  const favorites = exercises
    .filter((e) => e.is_favorite && !e.deleted_at && e.is_active)
    .filter((e) => e.bodyweight_based || e.category === "bodyweight")
    .slice(0, 4);

  return (
    <AppShell
      topBar={{
        title: "בית",
        back: { to: "/", label: "חזרה למסך הראשי" },
        action: (
          <Link
            to="/home/quick"
            aria-label="דיווח מהיר"
            className="tile-interactive inline-flex size-9 items-center justify-center rounded-xl bg-home text-white"
          >
            <Plus aria-hidden className="size-5" />
          </Link>
        ),
      }}
    >
      <PageHeader
        eyebrow="תחום"
        title="כוח בבית"
        description="דיווח מהיר של תרגיל יחיד או אימון קצר."
      />

      {/* Primary action tiles */}
      <div className="grid grid-cols-2 gap-3 px-4 sm:px-6">
        <Link to="/home/quick" className="block">
          <Tile variant="home" tone="solid" size="lg" interactive>
            <div className="flex items-center gap-2">
              <Zap aria-hidden className="size-5" />
              <div className="text-lg font-black">דיווח מהיר</div>
            </div>
            <TileFootnote className="text-white/80">תרגיל יחיד, סטים גמישים.</TileFootnote>
          </Tile>
        </Link>
        <Link to="/home/templates" className="block">
          <Tile variant="home" tone="soft" size="lg" interactive>
            <div className="flex items-center gap-2 text-home">
              <LayoutTemplate aria-hidden className="size-5" />
              <div className="text-lg font-black">תבניות</div>
            </div>
            <TileFootnote>
              {templates.length ? `${templates.length} תבניות פעילות` : "אין תבניות עדיין"}
            </TileFootnote>
          </Tile>
        </Link>
      </div>

      {/* Active drafts */}
      {drafts.length > 0 ? (
        <>
          <SectionHeader title="להמשיך אימון" />
          <div className="space-y-2 px-4 sm:px-6">
            {drafts.map((d) => (
              <Link key={d.id} to="/home/sessions/$id" params={{ id: d.id }} className="block">
                <Tile variant="warning" tone="soft" interactive>
                  <div className="flex items-center justify-between">
                    <div>
                      <TileLabel>טיוטה פעילה</TileLabel>
                      <div className="font-black">{d.name}</div>
                    </div>
                    <Play aria-hidden className="size-5 text-warning" />
                  </div>
                </Tile>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {/* Summary metrics */}
      <SectionHeader title="נתונים אחרונים" />
      <div className="grid grid-cols-3 gap-2 px-4 sm:px-6">
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>אימונים 4 שב׳</TileLabel>
          <TileMetric value={freq != null ? freq.toFixed(1) : "–"} />
          <TileFootnote>{freq != null ? "לשבוע" : "אין נתונים"}</TileFootnote>
        </Tile>
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>אימונים כולל</TileLabel>
          <TileMetric value={completed.length || "–"} />
          <TileFootnote>{completed.length ? "מ־log" : "אין נתונים"}</TileFootnote>
        </Tile>
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>מאז אחרון</TileLabel>
          <TileMetric value={dsl == null ? "–" : dsl === 0 ? "היום" : `${dsl}י׳`} />
          <TileFootnote>{lastCompleted ? "פעילות" : "טרם דווח"}</TileFootnote>
        </Tile>
      </div>

      {/* Favorites */}
      {favorites.length > 0 ? (
        <>
          <SectionHeader title="מועדפים" />
          <div className="grid grid-cols-2 gap-2 px-4 sm:px-6">
            {favorites.map((ex) => (
              <Link
                key={ex!.id}
                to="/home/quick/$exerciseId"
                params={{ exerciseId: ex!.id }}
                className="block"
              >
                <Tile variant="home" tone="soft" interactive size="sm">
                  <div className="flex items-center gap-2">
                    <Bolt aria-hidden className="size-4 text-home" />
                    <div className="truncate text-sm font-black">{ex!.name_he}</div>
                  </div>
                </Tile>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {/* Recent */}
      {recentExercises.length > 0 ? (
        <>
          <SectionHeader title="אחרונים" />
          <div className="grid grid-cols-2 gap-2 px-4 sm:px-6">
            {recentExercises.map((ex) => (
              <Link
                key={ex!.id}
                to="/home/quick/$exerciseId"
                params={{ exerciseId: ex!.id }}
                className="block"
              >
                <Tile tone="outline" interactive size="sm">
                  <div className="truncate text-sm font-bold">{ex!.name_he}</div>
                </Tile>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {/* Recent sessions */}
      <SectionHeader
        title="פעילויות אחרונות"
        action={
          <Link
            to="/home/history"
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"
          >
            <HistoryIcon aria-hidden className="size-3.5" />
            הכל
          </Link>
        }
      />
      <div className="space-y-2 px-4 sm:px-6">
        {completed.length ? (
          completed
            .slice()
            .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
            .slice(0, 3)
            .map((s) => <HomeSessionTileWrapper key={s.id} sessionId={s.id} />)
        ) : (
          <EmptyState
            icon={<Zap aria-hidden />}
            title="עדיין אין פעילות בית"
            description="לחץ ׳דיווח מהיר׳ כדי להתחיל."
            action={
              <Link
                to="/home/quick"
                className="tile-interactive inline-flex min-h-11 items-center gap-2 rounded-xl bg-home px-4 text-sm font-bold text-white"
              >
                <Plus aria-hidden className="size-4" />
                דיווח מהיר
              </Link>
            }
          />
        )}
      </div>

      <SectionHeader title="יעדי בית" />
      <div id="goals" className="px-4 sm:px-6">
        <DomainPrimaryGoalTile domain="home" />
      </div>

      <div className="mt-6 px-4 sm:px-6">
        <Link to="/exercises" className="block">
          <Tile tone="outline" interactive>
            <div className="flex items-center gap-2">
              <Library aria-hidden className="size-5 text-muted-foreground" />
              <div className="text-sm font-bold">ספריית תרגילים</div>
            </div>
          </Tile>
        </Link>
      </div>
    </AppShell>
  );
}

