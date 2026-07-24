import { createFileRoute, Link } from "@tanstack/react-router";
import { Footprints, MapPin, Timer } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote } from "@/components/tile/Tile";

export const Route = createFileRoute("/running/new")({
  head: () => ({
    meta: [
      { title: "דיווח ריצה חדש · Fit Log" },
      { name: "description", content: "בחירת סוג ריצה — חוץ או הליכון." },
      { property: "og:title", content: "דיווח ריצה חדש · Fit Log" },
      { property: "og:description", content: "בחירת סוג ריצה — חוץ או הליכון." },
    ],
  }),
  component: NewRunPage,
});

function NewRunPage() {
  return (
    <AppShell topBar={{ title: "דיווח ריצה", back: { to: "/running", label: "חזרה לתחום ריצה" } }}>
      <PageHeader
        eyebrow="ריצה"
        title="דיווח חדש"
        description="בחירת סוג הריצה. טופס הדיווח המלא ייבנה בשלב הבא."
      />
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        <Tile variant="run" tone="soft" size="lg">
          <div className="flex items-start gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-run/25 text-run [&_svg]:size-6">
              <MapPin aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black">ריצת חוץ</div>
              <div className="text-sm text-muted-foreground">
                מסלול פתוח, GPS ידני או Suunto import.
              </div>
            </div>
          </div>
          <TileFootnote className="mt-2">
            מודול הדיווח ייבנה בשלב הבא. לא נשמר מידע כאן.
          </TileFootnote>
        </Tile>
        <Tile variant="run" tone="soft" size="lg">
          <div className="flex items-start gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-run/25 text-run [&_svg]:size-6">
              <Timer aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black">ריצת הליכון</div>
              <div className="text-sm text-muted-foreground">כיול מהיר לפי מסילה שמורה.</div>
            </div>
          </div>
          <TileFootnote className="mt-2">
            מודול הדיווח ייבנה בשלב הבא. לא נשמר מידע כאן.
          </TileFootnote>
        </Tile>
      </div>
      <div className="mt-6 px-4 sm:px-6">
        <Tile>
          <div className="flex items-center gap-3">
            <Footprints aria-hidden className="size-5 text-muted-foreground" />
            <TileFootnote>
              רוצה לחזור?{" "}
              <Link
                to="/running"
                className="font-bold text-foreground underline-offset-2 hover:underline"
              >
                חזרה לתחום ריצה
              </Link>
            </TileFootnote>
          </div>
        </Tile>
      </div>
    </AppShell>
  );
}
