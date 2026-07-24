import { createFileRoute } from "@tanstack/react-router";
import { Footprints, Sparkles } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileLabel, TileMetric, TileFootnote } from "@/components/tile/Tile";

export const Route = createFileRoute("/running")({
  head: () => ({
    meta: [
      { title: "ריצה · Fit Log" },
      { name: "description", content: "סשני ריצה, מסלולים, קריאות Suunto ומקטעים." },
      { property: "og:title", content: "ריצה · Fit Log" },
      { property: "og:description", content: "סשני ריצה, מסלולים, קריאות Suunto ומקטעים." },
    ],
  }),
  component: RunningPage,
});

function RunningPage() {
  return (
    <AppShell topBar={{ title: "ריצה" }}>
      <PageHeader
        eyebrow="תחום"
        title="ריצה"
        description="מסלולים, סשנים ומקטעים. Raw מ־Suunto נשמר בנפרד."
      />

      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>שבועי</TileLabel>
          <TileMetric value="0" unit="ק״מ" />
          <TileFootnote>ללא נתונים</TileFootnote>
        </Tile>
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>ריצה ארוכה</TileLabel>
          <TileMetric value="0" unit="ק״מ" />
          <TileFootnote>4 שבועות אחרונים</TileFootnote>
        </Tile>
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>קצב ממוצע</TileLabel>
          <TileMetric value="–" unit="/ק״מ" />
          <TileFootnote>ללא נתונים</TileFootnote>
        </Tile>
        <Tile variant="run" tone="soft" size="sm">
          <TileLabel>סשנים</TileLabel>
          <TileMetric value="0" />
          <TileFootnote>החודש</TileFootnote>
        </Tile>
      </div>

      <SectionHeader title="ריצות אחרונות" />
      <div className="px-4 sm:px-6">
        <EmptyState
          icon={<Footprints aria-hidden />}
          title="עוד אין ריצות"
          description="דיווח ראשון יופיע כאן. Suunto import ייצור סשן אוטומטית."
        />
      </div>

      <SectionHeader title="יעדי ריצה" />
      <div className="px-4 sm:px-6">
        <EmptyState
          icon={<Sparkles aria-hidden />}
          title="אין יעדים פעילים"
          description="יעדים מוגדרים על ידך בלבד. המערכת לא ממציאה יעדים."
        />
      </div>
    </AppShell>
  );
}
