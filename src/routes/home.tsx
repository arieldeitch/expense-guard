import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse, Sparkles } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "בית · Fit Log" },
      { name: "description", content: "אימוני כוח בבית ותרגילי משקל גוף." },
      { property: "og:title", content: "בית · Fit Log" },
      { property: "og:description", content: "אימוני כוח בבית ותרגילי משקל גוף." },
    ],
  }),
  component: HomeStrengthPage,
});

function HomeStrengthPage() {
  return (
    <AppShell topBar={{ title: "בית" }}>
      <PageHeader
        eyebrow="תחום"
        title="בית ומשקל גוף"
        description="אימונים ללא ציוד או עם ציוד מינימלי. אותה שיטת דיווח, אותם שיאים."
      />

      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>אימונים</TileLabel>
          <TileMetric value="0" />
          <TileFootnote>החודש</TileFootnote>
        </Tile>
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>סטים</TileLabel>
          <TileMetric value="0" />
          <TileFootnote>7 ימים אחרונים</TileFootnote>
        </Tile>
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>חזרות</TileLabel>
          <TileMetric value="0" />
          <TileFootnote>שבועי</TileFootnote>
        </Tile>
        <Tile variant="home" tone="soft" size="sm">
          <TileLabel>סדרות</TileLabel>
          <TileMetric value="0" />
          <TileFootnote>שבועי</TileFootnote>
        </Tile>
      </div>

      <SectionHeader title="אימונים אחרונים" />
      <div className="px-4 sm:px-6">
        <EmptyState
          icon={<HeartPulse aria-hidden />}
          title="עוד אין אימונים בבית"
          description="דיווח ראשון יופיע כאן. אין דמו־דאטה, אין תבניות שיווקיות."
        />
      </div>

      <SectionHeader title="יעדי בית" />
      <div className="px-4 sm:px-6">
        <EmptyState
          icon={<Sparkles aria-hidden />}
          title="אין יעדים פעילים"
          description="למשל: יעד יומי של שכיבות שמיכה, זמן פלאנק."
        />
      </div>
    </AppShell>
  );
}
