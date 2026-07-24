import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings2, MapPin, Trash2, Download, Cpu } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { Tile } from "@/components/tile/Tile";
import type { ReactNode } from "react";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "עוד · Fit Log" },
      { name: "description", content: "הגדרות, מקומות וציוד, סל מחזור, ייצוא נתונים." },
      { property: "og:title", content: "עוד · Fit Log" },
      { property: "og:description", content: "הגדרות, מקומות וציוד, סל מחזור, ייצוא נתונים." },
    ],
  }),
  component: MorePage,
});

const items: {
  to: string;
  title: string;
  hint: string;
  icon: ReactNode;
  disabled?: boolean;
}[] = [
  {
    to: "/more",
    title: "הגדרות",
    hint: "פרופיל, יחידות, שפה",
    icon: <Settings2 aria-hidden />,
    disabled: true,
  },
  {
    to: "/more",
    title: "מקומות וציוד",
    hint: "חדר כושר, מסילות, ציוד ביתי",
    icon: <MapPin aria-hidden />,
    disabled: true,
  },
  {
    to: "/more",
    title: "סל מחזור",
    hint: "פריטים שנמחקו — ניתן לשחזר",
    icon: <Trash2 aria-hidden />,
    disabled: true,
  },
  {
    to: "/more",
    title: "ייצוא נתונים",
    hint: "כל מה שהזנת — CSV / JSON",
    icon: <Download aria-hidden />,
    disabled: true,
  },
  {
    to: "/more",
    title: "הגדרות AI",
    hint: "רק כשיופעל. תמיד עם אישור.",
    icon: <Cpu aria-hidden />,
    disabled: true,
  },
];

function MorePage() {
  return (
    <AppShell topBar={{ title: "עוד" }}>
      <PageHeader eyebrow="ניהול" title="עוד" description="הגדרות ופעולות משניות." />

      <SectionHeader title="ניהול המוצר" />
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        {items.map((item) => (
          <Tile
            key={item.title}
            interactive={!item.disabled}
            disabled={item.disabled}
            as={item.disabled ? "div" : "a"}
          >
            {item.disabled ? (
              <MoreItem {...item} />
            ) : (
              <Link to={item.to} className="focus-visible:outline-none">
                <MoreItem {...item} />
              </Link>
            )}
          </Tile>
        ))}
      </div>
    </AppShell>
  );
}

function MoreItem({
  title,
  hint,
  icon,
  disabled,
}: {
  title: string;
  hint: string;
  icon: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex size-10 items-center justify-center rounded-xl bg-tint text-foreground [&_svg]:size-5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-bold">{title}</div>
        <div className="truncate text-sm text-muted-foreground">{hint}</div>
      </div>
      {disabled ? (
        <span className="rounded-md border border-border-strong bg-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          בקרוב
        </span>
      ) : null}
    </div>
  );
}
