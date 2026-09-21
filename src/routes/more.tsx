import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MapPin,
  Trash2,
  Download,
  Home,
  Footprints,
  Dumbbell,
  HeartPulse,
  Database,
  ChevronLeft,
  BookOpen,
  Layers,
} from "lucide-react";
import type { ReactNode } from "react";
import { AccountTile } from "@/components/account/AccountTile";
import { AppShell } from "@/components/shell/AppShell";
import { SectionHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { usePreferences } from "@/lib/hooks/use-preferences";
import type { LandingModule } from "@/lib/preferences";
import { LANDING_MODULE_LABELS } from "@/lib/preferences";
import { getBuildInfo, isNativeApp } from "@/lib/build-info";
import { useTrashItems } from "@/lib/catalog";
import { useTrashedRuns } from "@/lib/runs";
import { useTrashedExercises } from "@/lib/exercises";
import { useTrashedTemplates } from "@/lib/templates";
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
      <SectionHeader title="הגדרות" />
      <div className="grid grid-cols-1 gap-2 px-4 sm:px-6">
        <DefaultModuleSetting />
        <AccountTile />
      </div>

      <SectionHeader title="נתונים וקטלוג" />
      <div className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 sm:px-6">
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
        <CatalogLinkTile
          to="/templates"
          title="תבניות אימון"
          hint="תבניות כוח, סופרסטים, גרסאות ו־snapshots"
          icon={<Layers aria-hidden />}
        />
        <TrashLinkTile />
        <CatalogLinkTile
          to="/backup"
          title="גיבוי ושחזור"
          hint="הורדת קובץ גיבוי מקומי ושחזור ממנו — ללא ענן"
          icon={<Download aria-hidden />}
        />
      </div>

      <SectionHeader title="אודות" />
      <div className="grid grid-cols-1 gap-2 px-4 sm:px-6">
        <AboutTile />
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
    <Tile size="sm">
      <label className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm">
        <span className="min-w-0">
          <span className="block font-bold">מסך פתיחה</span>
          <span className="block text-xs text-muted-foreground">
            לאן להיכנס אחרי פתיחת האפליקציה
          </span>
        </span>
        <select
          aria-label="מסך פתיחה"
          className="min-h-11 max-w-[11rem] rounded-lg border border-border-strong bg-surface px-2 text-sm"
          value={preferences.landingModule}
          onChange={(e) => setPreferences({ landingModule: e.target.value as LandingModule })}
        >
          {LANDING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {LANDING_MODULE_LABELS[opt.value]}
            </option>
          ))}
        </select>
      </label>
    </Tile>
  );
}

/** גרסה, commit ופלטפורמה — זהות ה-build (ADR-0043). ללא סודות, ללא מידע פנימי אחר. */
function AboutTile() {
  const info = getBuildInfo();
  const native = isNativeApp();
  return (
    <Tile size="sm">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-tint text-foreground [&_svg]:size-4">
          <Database aria-hidden />
        </span>
        <div className="min-w-0 text-xs text-muted-foreground">
          <div className="text-sm font-bold text-foreground">Fit Log {info.version}</div>
          <div className="ltr-nums truncate" dir="ltr">
            {native ? "Android" : "Web"} · build {info.versionCode} · {info.commit}
          </div>
          <div>הנתונים נשמרים במכשיר זה בלבד; גיבוי ושחזור למעלה.</div>
        </div>
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
  to: "/locations" | "/trash" | "/exercises" | "/templates" | "/backup";
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
  const exercises = useTrashedExercises();
  const templates = useTrashedTemplates();
  const total =
    locations.length +
    treadmills.length +
    equipment.length +
    runs.length +
    exercises.length +
    templates.length;
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
