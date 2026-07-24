import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Settings2,
  MapPin,
  Trash2,
  Download,
  Cpu,
  Home,
  Footprints,
  Dumbbell,
  HeartPulse,
  Check,
  Database,
  ChevronLeft,
  BookOpen,
} from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader, SectionHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { usePreferences } from "@/lib/hooks/use-preferences";
import type { LandingModule } from "@/lib/preferences";
import { LANDING_MODULE_LABELS } from "@/lib/preferences";
import { activeRepoKind } from "@/lib/repo";
import { useTrashItems } from "@/lib/catalog";
import { useTrashedRuns } from "@/lib/runs";
import { useTrashedExercises } from "@/lib/exercises";
import { cn } from "@/lib/utils";

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

function MorePage() {
  return (
    <AppShell topBar={{ title: "עוד" }}>
      <PageHeader eyebrow="ניהול" title="עוד" description="הגדרות ופעולות משניות." />

      <SectionHeader title="הגדרות פעילות" />
      <div className="grid grid-cols-1 gap-3 px-4 sm:px-6">
        <DefaultModuleSetting />
        <DataSourceTile />
      </div>

      <SectionHeader title="קטלוג" />
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        <CatalogLinkTile
          to="/locations"
          title="מקומות וציוד"
          hint="חדרי כושר, מסלולי ריצה, הליכונים, ציוד ביתי"
          icon={<MapPin aria-hidden />}
        />
        <CatalogLinkTile
          to="/exercises"
          title="ספריית תרגילים"
          hint="חדר כושר · בית · משקל גוף — עם חלופות וזמינות ציוד"
          icon={<BookOpen aria-hidden />}
        />
        <TrashLinkTile />
      </div>

      <SectionHeader title="ניהול המוצר" />
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        {futureItems.map((item) => (
          <DisabledItemTile key={item.title} {...item} />
        ))}
      </div>
    </AppShell>
  );
}

const LANDING_OPTIONS: { value: LandingModule; icon: ReactNode; hint: string }[] = [
  { value: "home", icon: <Home aria-hidden />, hint: "בחירת תחום כל פעם" },
  { value: "running", icon: <Footprints aria-hidden />, hint: "פתיחה ישירה לריצה" },
  { value: "gym", icon: <Dumbbell aria-hidden />, hint: "פתיחה ישירה לחדר כושר" },
  { value: "home-workout", icon: <HeartPulse aria-hidden />, hint: "פתיחה ישירה לבית" },
];

function DefaultModuleSetting() {
  const { preferences, setPreferences } = usePreferences();
  return (
    <Tile>
      <TileLabel>מסך ברירת מחדל בכניסה</TileLabel>
      <TileFootnote>
        לאיזה מסך להיכנס אחרי פתיחת האפליקציה. ניתן לחזור למסך הראשי בכל רגע דרך הניווט התחתון.
      </TileFootnote>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LANDING_OPTIONS.map((opt) => {
          const isActive = preferences.landingModule === opt.value;
          return (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => setPreferences({ landingModule: opt.value })}
                aria-pressed={isActive}
                className={cn(
                  "tile-interactive grid w-full min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-2 text-start",
                  isActive
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border-strong bg-surface text-foreground hover:bg-surface-elevated",
                )}
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-tint text-foreground [&_svg]:size-5">
                  {opt.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">
                    {LANDING_MODULE_LABELS[opt.value]}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{opt.hint}</span>
                </span>
                <span className="inline-flex size-5 items-center justify-center">
                  {isActive ? <Check aria-hidden className="size-5 text-primary" /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Tile>
  );
}

function DataSourceTile() {
  const label = activeRepoKind === "mock" ? "נתוני mock מקומיים" : "מחובר ל־Lovable Cloud";
  return (
    <Tile>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-tint text-foreground [&_svg]:size-5">
          <Database aria-hidden />
        </span>
        <div className="min-w-0">
          <TileLabel>מקור הנתונים</TileLabel>
          <div className="truncate text-sm font-bold">{label}</div>
          <TileFootnote>
            עדיין לא מחובר ל־backend. סיכומים מחושבים משכבה מרכזית שתמופה ל־Supabase בשלב הבא.
          </TileFootnote>
        </div>
        <span className="rounded-md border border-border-strong bg-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          mock
        </span>
      </div>
    </Tile>
  );
}

const futureItems: { title: string; hint: string; icon: ReactNode }[] = [
  { title: "הגדרות פרופיל", hint: "פרופיל, יחידות, שפה", icon: <Settings2 aria-hidden /> },
  { title: "ייצוא נתונים", hint: "כל מה שהזנת — CSV / JSON", icon: <Download aria-hidden /> },
  { title: "הגדרות AI", hint: "רק כשיופעל. תמיד עם אישור.", icon: <Cpu aria-hidden /> },
];

function DisabledItemTile({ title, hint, icon }: { title: string; hint: string; icon: ReactNode }) {
  return (
    <Tile disabled className="opacity-70">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-tint text-foreground [&_svg]:size-5">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{title}</div>
          <div className="truncate text-xs text-muted-foreground">{hint}</div>
        </div>
        <span className="rounded-md border border-border-strong bg-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          בקרוב
        </span>
      </div>
    </Tile>
  );
}

function CatalogLinkTile({
  to,
  title,
  hint,
  icon,
  badge,
}: {
  to: "/locations" | "/trash";
  title: string;
  hint: string;
  icon: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="tile-interactive group block rounded-2xl border border-border-strong bg-surface p-4 shadow-[var(--shadow-tile)]"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-tint text-foreground [&_svg]:size-5">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{title}</div>
          <div className="truncate text-xs text-muted-foreground">{hint}</div>
        </div>
        <div className="inline-flex items-center gap-2">
          {badge}
          <ChevronLeft aria-hidden className="size-4 text-muted-foreground rtl:rotate-180" />
        </div>
      </div>
    </Link>
  );
}

function TrashLinkTile() {
  const { locations, treadmills, equipment } = useTrashItems();
  const runs = useTrashedRuns();
  const total = locations.length + treadmills.length + equipment.length + runs.length;
  return (
    <CatalogLinkTile
      to="/trash"
      title="סל מחזור"
      hint="פריטים שנמחקו — ניתן לשחזר"
      icon={<Trash2 aria-hidden />}
      badge={
        total > 0 ? (
          <span className="rounded-md border border-border-strong bg-tint px-2 py-0.5 text-[10px] font-bold text-foreground">
            {total}
          </span>
        ) : null
      }
    />
  );
}
