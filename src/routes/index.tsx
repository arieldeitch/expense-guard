import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Footprints, Dumbbell, HeartPulse } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { DomainSummaryTile } from "@/components/tile/DomainSummaryTile";
import { useDomainSummary } from "@/lib/hooks/use-domain-summary";
import {
  hasLandedThisSession,
  markLandedThisSession,
  LANDING_MODULE_ROUTES,
} from "@/lib/preferences";
import { usePreferences } from "@/lib/hooks/use-preferences";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ראשי · Fit Log" },
      {
        name: "description",
        content: "בחירת תחום אימון — ריצה, חדר כושר, או כוח בבית. Launchpad ממוקד ללא dashboard.",
      },
      { property: "og:title", content: "ראשי · Fit Log" },
      {
        property: "og:description",
        content: "בחירת תחום אימון — ריצה, חדר כושר, או כוח בבית.",
      },
    ],
  }),
  component: LaunchpadPage,
});

function LaunchpadPage() {
  const running = useDomainSummary("running");
  const gym = useDomainSummary("gym");
  const home = useDomainSummary("home");
  const navigate = useNavigate();
  const { preferences } = usePreferences();

  // Default module redirect — פעם אחת לסשן.
  useEffect(() => {
    if (hasLandedThisSession()) return;
    markLandedThisSession();
    if (preferences.landingModule === "home") return;
    const target = LANDING_MODULE_ROUTES[preferences.landingModule];
    if (target && target !== "/") {
      navigate({ to: target, replace: true });
    }
  }, [navigate, preferences.landingModule]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="בחירת תחום"
        title="לאן היום"
        description="שלושה תחומים. בחירה אחת. אין הזנת נתונים לפני שרוצים."
      />

      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:px-6">
        <DomainSummaryTile
          variant="run"
          title="ריצה"
          icon={<Footprints aria-hidden />}
          domainPath="/running"
          quickStartPath="/running/new"
          summary={running.data}
          loading={running.isPending}
        />
        <DomainSummaryTile
          variant="gym"
          title="חדר כושר"
          icon={<Dumbbell aria-hidden />}
          domainPath="/gym"
          quickStartPath="/gym/new"
          summary={gym.data}
          loading={gym.isPending}
        />
        <DomainSummaryTile
          variant="home"
          title="בית"
          icon={<HeartPulse aria-hidden />}
          domainPath="/home"
          quickStartPath="/home/new"
          summary={home.data}
          loading={home.isPending}
        />
      </div>
    </AppShell>
  );
}
