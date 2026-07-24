import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartPulse, FilePlus, LayoutTemplate } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote } from "@/components/tile/Tile";

export const Route = createFileRoute("/home/new")({
  head: () => ({
    meta: [
      { title: "אימון בית חדש · Fit Log" },
      { name: "description", content: "בחירת תרגיל מהיר או תבנית ביתית." },
      { property: "og:title", content: "אימון בית חדש · Fit Log" },
      { property: "og:description", content: "בחירת תרגיל מהיר או תבנית ביתית." },
    ],
  }),
  component: NewHomeWorkoutPage,
});

function NewHomeWorkoutPage() {
  return (
    <AppShell topBar={{ title: "אימון חדש", back: { to: "/home", label: "חזרה לתחום בית" } }}>
      <PageHeader
        eyebrow="בית"
        title="אימון חדש"
        description="תרגיל מהיר או תבנית. טופס הדיווח המלא ייבנה בשלב הבא."
      />
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        <Tile variant="home" tone="soft" size="lg">
          <div className="flex items-start gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-home/25 text-home [&_svg]:size-6">
              <FilePlus aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black">תרגיל מהיר</div>
              <div className="text-sm text-muted-foreground">שכיבות סמיכה, מתח, סקוואטים.</div>
            </div>
          </div>
          <TileFootnote className="mt-2">מודול הדיווח ייבנה בשלב הבא. לא נשמר מידע כאן.</TileFootnote>
        </Tile>
        <Tile variant="home" tone="soft" size="lg">
          <div className="flex items-start gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-home/25 text-home [&_svg]:size-6">
              <LayoutTemplate aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black">תבנית ביתית</div>
              <div className="text-sm text-muted-foreground">אימון full-body / ליבה / משיכה.</div>
            </div>
          </div>
          <TileFootnote className="mt-2">מודול התבניות ייבנה בשלב הבא. לא נשמר מידע כאן.</TileFootnote>
        </Tile>
      </div>
      <div className="mt-6 px-4 sm:px-6">
        <Tile>
          <div className="flex items-center gap-3">
            <HeartPulse aria-hidden className="size-5 text-muted-foreground" />
            <TileFootnote>
              <Link to="/home" className="font-bold text-foreground underline-offset-2 hover:underline">חזרה לתחום בית</Link>
            </TileFootnote>
          </div>
        </Tile>
      </div>
    </AppShell>
  );
}
