/**
 * /locations — רשימת מקומות אימון.
 * אריחים בגריד רספונסיבי, כפתור "מקום חדש", גישה לסל מחזור.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationTile } from "@/components/catalog/LocationTile";
import { LocationForm } from "@/components/catalog/LocationForm";
import { useAllLocations, type TrainingLocation } from "@/lib/catalog";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "מקומות · Fit Log" },
      { name: "description", content: "ניהול מקומות אימון: חדרי כושר, מסלולי ריצה, בית." },
      { property: "og:title", content: "מקומות · Fit Log" },
      { property: "og:description", content: "ניהול מקומות אימון." },
    ],
  }),
  component: LocationsPage,
});

type Visibility = "active" | "archived" | "all";

function LocationsPage() {
  const all = useAllLocations();
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingLocation | null>(null);

  const trashCount = useMemo(() => all.filter((l) => l.deleted_at !== null).length, [all]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((l) => l.deleted_at === null)
      .filter((l) =>
        visibility === "archived" ? !l.is_active : visibility === "active" ? l.is_active : true,
      )
      .filter((l) =>
        q === ""
          ? true
          : [l.name, l.city, l.area, l.address].some((s) => s && s.toLowerCase().includes(q)),
      );
  }, [all, query, visibility]);

  return (
    <AppShell topBar={{ title: "מקומות", back: { to: "/more" } }}>
      <PageHeader
        eyebrow="קטלוג"
        title="מקומות אימון"
        description="חדרי כושר, מסלולי ריצה, בית — כל מה שהוזן בעבר זמין לשימוש חוזר."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="min-h-11 rounded-xl bg-primary text-primary-foreground"
          >
            <Plus aria-hidden className="me-1 size-4" />
            מקום חדש
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי שם, עיר או כתובת"
          className="min-h-11 rounded-xl border-border-strong"
          aria-label="חיפוש מקומות"
        />
        <Select value={visibility} onValueChange={(v) => setVisibility(v as Visibility)}>
          <SelectTrigger className="min-h-11 rounded-xl border-border-strong sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="active">פעילים בלבד</SelectItem>
            <SelectItem value="archived">ארכיון בלבד</SelectItem>
            <SelectItem value="all">כולם</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        {items.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState
              icon={<MapPin aria-hidden />}
              title={query ? "לא נמצאו מקומות תואמים" : "אין עדיין מקומות"}
              description={
                query
                  ? "נסה חיפוש אחר או להסיר סינון."
                  : "צור מקום ראשון כדי לקבץ תחתיו ציוד, הליכונים ואימונים."
              }
              action={
                <Button
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                  className="min-h-11 rounded-xl bg-primary text-primary-foreground"
                >
                  יצירת מקום ראשון
                </Button>
              }
            />
          </div>
        ) : (
          items.map((l) => (
            <LocationTile
              key={l.id}
              location={l}
              onEdit={(loc) => {
                setEditing(loc);
                setFormOpen(true);
              }}
            />
          ))
        )}
      </div>

      {trashCount > 0 ? (
        <div className="mt-6 px-4 sm:px-6">
          <Link
            to="/trash"
            className="tile-interactive inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            <Trash2 aria-hidden className="size-4" />
            סל מחזור ({trashCount})
          </Link>
        </div>
      ) : null}

      <LocationForm open={formOpen} onOpenChange={setFormOpen} location={editing} />
    </AppShell>
  );
}
