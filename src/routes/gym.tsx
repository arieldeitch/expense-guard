import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, Sparkles } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";

export const Route = createFileRoute("/gym")({
  head: () => ({
    meta: [
      { title: "חדר כושר · Fit Log" },
      { name: "description", content: "אימוני כוח בחדר כושר: תבניות, סופרסטים, סטים, שיאים." },
      { property: "og:title", content: "חדר כושר · Fit Log" },
      { property: "og:description", content: "תבניות, סופרסטים, סטים ושיאים אישיים." },
    ],
  }),
  component: GymPage,
});

function GymPage() {
  return (
    <AppShell topBar={{ title: "חדר כושר" }}>
      <PageHeader
        eyebrow="תחום"
        title="חדר כושר"
        description="תבניות, סופרסטים, סטים ו־PR. יחידות והמקור נשמרים בכל דיווח."
      />

      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Tile variant="gym" tone="soft" size="sm">
          <TileLabel>אימונים</TileLabel>
          <TileMetric value="0" />
          <TileFootnote>החודש</TileFootnote>
        </Tile>
        <Tile variant="gym" tone="soft" size="sm">
          <TileLabel>סטים</TileLabel>
          <TileMetric value="0" />
          <TileFootnote>7 ימים אחרונים</TileFootnote>
        </Tile>
        <Tile variant="gym" tone="soft" size="sm">
          <TileLabel>נפח (Volume)</TileLabel>
          <TileMetric value="0" unit="ק״ג" />
          <TileFootnote>שבועי</TileFootnote>
        </Tile>
        <Tile variant="gym" tone="soft" size="sm">
          <TileLabel>שיאים חדשים</TileLabel>
          <TileMetric value="0" />
          <TileFootnote>30 יום</TileFootnote>
        </Tile>
      </div>

      <SectionHeader title="תבניות" />
      <div className="px-4 sm:px-6">
        <EmptyState
          icon={<Dumbbell aria-hidden />}
          title="עוד אין תבניות"
          description="בנה תבנית ראשונה — Push / Pull / רגליים, או מותאם אישית."
        />
      </div>

      <SectionHeader title="יעדי כוח" />
      <div className="px-4 sm:px-6">
        <EmptyState
          icon={<Sparkles aria-hidden />}
          title="אין יעדים פעילים"
          description="Squat 1RM, Bench 1RM — מוגדרים על ידך."
        />
      </div>
    </AppShell>
  );
}
