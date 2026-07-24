import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Timer } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote } from "@/components/tile/Tile";
import { runsRepo } from "@/lib/runs";

export const Route = createFileRoute("/running/new")({
  head: () => ({
    meta: [
      { title: "דיווח ריצה חדש · Fit Log" },
      { name: "description", content: "בחירת סוג ריצה — חוץ או הליכון." },
      { property: "og:title", content: "דיווח ריצה חדש · Fit Log" },
      { property: "og:description", content: "בחירת סוג ריצה — חוץ או הליכון." },
    ],
  }),
  component: NewRunTypePicker,
});

function NewRunTypePicker() {
  const last = runsRepo.getLastUsed().run_type;
  return (
    <AppShell topBar={{ title: "דיווח חדש", back: { to: "/running", label: "חזרה" } }}>
      <PageHeader eyebrow="ריצה" title="בחר סוג ריצה" description="הסוג האחרון מוצג ראשון." />
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        {[
          {
            type: "outdoor" as const,
            label: "ריצת חוץ",
            desc: "מסלול פתוח, פארק, כביש או שביל.",
            icon: <MapPin aria-hidden />,
          },
          {
            type: "treadmill" as const,
            label: "ריצת הליכון",
            desc: "מכשיר עם כיול, מהירות ושיפוע.",
            icon: <Timer aria-hidden />,
          },
        ]
          .sort((a) => (a.type === last ? -1 : 1))
          .map((opt) => (
            <Link
              key={opt.type}
              to="/running/new/$type"
              params={{ type: opt.type }}
              className="block"
            >
              <Tile variant="run" tone="soft" size="lg" interactive>
                <div className="flex items-start gap-3">
                  <div className="inline-flex size-11 items-center justify-center rounded-xl bg-run/25 text-run [&_svg]:size-6">
                    {opt.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-black">{opt.label}</div>
                    <div className="text-sm text-muted-foreground">{opt.desc}</div>
                    {opt.type === last ? <TileFootnote className="mt-1">אחרון</TileFootnote> : null}
                  </div>
                </div>
              </Tile>
            </Link>
          ))}
      </div>
    </AppShell>
  );
}
