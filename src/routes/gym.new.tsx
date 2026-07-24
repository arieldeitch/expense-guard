import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, FilePlus, LayoutTemplate } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote } from "@/components/tile/Tile";

export const Route = createFileRoute("/gym/new")({
  head: () => ({
    meta: [
      { title: "אימון חדר כושר חדש · Fit Log" },
      { name: "description", content: "בחירת תבנית או אימון ריק." },
      { property: "og:title", content: "אימון חדר כושר חדש · Fit Log" },
      { property: "og:description", content: "בחירת תבנית או אימון ריק." },
    ],
  }),
  component: NewGymPage,
});

function NewGymPage() {
  return (
    <AppShell topBar={{ title: "אימון חדש", back: { to: "/gym", label: "חזרה לתחום חדר כושר" } }}>
      <PageHeader
        eyebrow="חדר כושר"
        title="אימון חדש"
        description="בחירת תבנית או אימון ריק. טופס הדיווח המלא ייבנה בשלב הבא."
      />
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        <Tile variant="gym" tone="soft" size="lg">
          <div className="flex items-start gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-gym/25 text-gym [&_svg]:size-6">
              <LayoutTemplate aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black">התחלה מתבנית</div>
              <div className="text-sm text-muted-foreground">Push / Pull / רגליים / מותאם אישית.</div>
            </div>
          </div>
          <TileFootnote className="mt-2">מודול התבניות ייבנה בשלב הבא. לא נשמר מידע כאן.</TileFootnote>
        </Tile>
        <Tile variant="gym" tone="soft" size="lg">
          <div className="flex items-start gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-gym/25 text-gym [&_svg]:size-6">
              <FilePlus aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black">אימון ריק</div>
              <div className="text-sm text-muted-foreground">הוספת תרגילים תוך כדי.</div>
            </div>
          </div>
          <TileFootnote className="mt-2">מודול הדיווח ייבנה בשלב הבא. לא נשמר מידע כאן.</TileFootnote>
        </Tile>
      </div>
      <div className="mt-6 px-4 sm:px-6">
        <Tile>
          <div className="flex items-center gap-3">
            <Dumbbell aria-hidden className="size-5 text-muted-foreground" />
            <TileFootnote>
              <Link to="/gym" className="font-bold text-foreground underline-offset-2 hover:underline">חזרה לתחום חדר כושר</Link>
            </TileFootnote>
          </div>
        </Tile>
      </div>
    </AppShell>
  );
}
