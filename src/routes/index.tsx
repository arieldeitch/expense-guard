import { createFileRoute, Link } from "@tanstack/react-router";
import { Footprints, Dumbbell, HeartPulse, Target, Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ראשי · Fit Log" },
      {
        name: "description",
        content: "אפליקציית אימונים אישית — ריצה, חדר כושר וכוח בבית. מבוססת נתונים ולא עידוד ריק.",
      },
      { property: "og:title", content: "ראשי · Fit Log" },
      {
        property: "og:description",
        content: "אפליקציית אימונים אישית — ריצה, חדר כושר וכוח בבית.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="שלום"
        title="בוקר טוב"
        description="שלושה תחומי אימון. מקור אמת אחד. בחר לאן להיכנס."
      />

      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:px-6">
        <DomainTile
          to="/running"
          variant="run"
          icon={<Footprints aria-hidden />}
          title="ריצה"
          hint="מסלולים, מקטעים, Suunto"
        />
        <DomainTile
          to="/gym"
          variant="gym"
          icon={<Dumbbell aria-hidden />}
          title="חדר כושר"
          hint="תבניות, סופרסטים, PR"
        />
        <DomainTile
          to="/home"
          variant="home"
          icon={<HeartPulse aria-hidden />}
          title="בית"
          hint="משקל גוף, ציוד מינימלי"
        />
      </div>

      <SectionHeader title="סקירת השבוע" />
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>ק״מ שרוצו</TileLabel>
          <TileMetric value="0" unit="ק״מ" />
          <TileFootnote>אין ריצות עדיין</TileFootnote>
        </Tile>
        <Tile variant="gym" tone="soft" size="sm">
          <TileLabel>סטים בחדר</TileLabel>
          <TileMetric value="0" />
          <TileFootnote>אין אימונים עדיין</TileFootnote>
        </Tile>
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>אימוני בית</TileLabel>
          <TileMetric value="0" />
          <TileFootnote>אין אימונים עדיין</TileFootnote>
        </Tile>
        <Tile variant="goal" tone="soft" size="sm">
          <TileLabel>יעדים פעילים</TileLabel>
          <TileMetric value="0" />
          <TileFootnote>הגדר יעד ראשון</TileFootnote>
        </Tile>
      </div>

      <SectionHeader title="פעולה מהירה" />
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        <Tile variant="goal" tone="soft" interactive>
          <div className="flex items-center gap-3">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-goal/20 text-goal [&_svg]:size-5">
              <Target aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-bold">הגדר יעד חדש</div>
              <div className="truncate text-sm text-muted-foreground">
                מסע שבועי, מרחק ארוך, שיא כוח…
              </div>
            </div>
            <Plus aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          </div>
        </Tile>
        <Tile interactive>
          <div className="flex items-center gap-3">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-tint text-foreground [&_svg]:size-5">
              <Sparkles aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-bold">תובנות</div>
              <div className="truncate text-sm text-muted-foreground">
                מוצגות אחרי איסוף נתונים
              </div>
            </div>
          </div>
        </Tile>
      </div>

      <SectionHeader title="היסטוריה" />
      <div className="px-4 sm:px-6">
        <EmptyState
          icon={<Sparkles aria-hidden />}
          title="עוד אין היסטוריה"
          description="פתיחת דיווח ראשון תופיע כאן. אין נתונים שסוכם על-חינם — רק מה שהזנת."
        />
      </div>
    </AppShell>
  );
}

function DomainTile({
  to,
  variant,
  icon,
  title,
  hint,
}: {
  to: string;
  variant: "run" | "gym" | "home";
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="focus-visible:outline-none"
      aria-label={`${title} — ${hint}`}
    >
      <Tile variant={variant} tone="soft" interactive size="lg" className="h-full">
        <div className="flex items-start justify-between">
          <div
            className={
              "inline-flex size-11 items-center justify-center rounded-xl [&_svg]:size-6 " +
              (variant === "run"
                ? "bg-run/25 text-run"
                : variant === "gym"
                  ? "bg-gym/25 text-gym"
                  : "bg-home/25 text-home")
            }
          >
            {icon}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            תחום
          </span>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black leading-tight">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{hint}</div>
        </div>
      </Tile>
    </Link>
  );
}
