import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Footprints, Dumbbell, HeartPulse } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { DomainSummaryTile } from "@/components/tile/DomainSummaryTile";
import { WeekSnapshot } from "@/components/home/WeekSnapshot";
import { useAllRuns } from "@/lib/runs";
import { useHomeSessions } from "@/lib/home";
import { useAllSessions } from "@/lib/sessions";
import { buildHistoryItems } from "@/lib/history/items";
import { useLocalDomainSummary } from "@/lib/selectors/local-domain-summary";
import {
  hasLandedThisSession,
  markLandedThisSession,
  readPreferences,
  LANDING_MODULE_ROUTES,
} from "@/lib/preferences";

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
  const running = useLocalDomainSummary("running");
  const gym = useLocalDomainSummary("gym");
  const home = useLocalDomainSummary("home");
  const navigate = useNavigate();
  const runs = useAllRuns();
  const homeSessions = useHomeSessions();
  const gymSessions = useAllSessions();
  const items = useMemo(
    () => buildHistoryItems({ runs, home: homeSessions, gym: gymSessions }),
    [runs, homeSessions, gymSessions],
  );

  // One-shot redirect לפי landing preference (פעם בסשן, לא reactive לשינויים).
  useEffect(() => {
    if (hasLandedThisSession()) return;
    markLandedThisSession();
    const module = readPreferences().landingModule;
    if (module === "home") return;
    const target = LANDING_MODULE_ROUTES[module];
    if (target && target !== "/") {
      navigate({ to: target, replace: true });
    }
    // Intentionally no deps — one shot per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <PageHeader title="Fit Log" description="השבוע שלך, ודיווח אחד רחוק." />

      <WeekSnapshot items={items} />

      <div className="mt-3 grid grid-cols-1 gap-2 px-4 sm:grid-cols-3 sm:px-6">
        <DomainSummaryTile
          variant="run"
          title="ריצה"
          icon={<Footprints aria-hidden />}
          domainPath="/running"
          quickStartPath="/running/new"
          summary={running}
        />
        <DomainSummaryTile
          variant="gym"
          title="חדר כושר"
          icon={<Dumbbell aria-hidden />}
          domainPath="/gym"
          quickStartPath="/gym/new"
          summary={gym}
        />
        <DomainSummaryTile
          variant="home"
          title="פק״ל בבית"
          icon={<HeartPulse aria-hidden />}
          domainPath="/home"
          quickStartPath="/home/quick"
          summary={home}
        />
      </div>
    </AppShell>
  );
}
