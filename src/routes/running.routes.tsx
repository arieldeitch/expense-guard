import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, MapPin, Star, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Tile, TileFootnote } from "@/components/tile/Tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CountryPicker } from "@/components/catalog/CountryPicker";
import {
  ROUTE_TYPE_LABELS,
  ROUTE_TYPE_ORDERED,
  runsRepo,
  useAllRoutes,
  formatDistanceKm,
} from "@/lib/runs";
import { useAllLocations } from "@/lib/catalog";
import type { RunningRoute } from "@/lib/runs";

export const Route = createFileRoute("/running/routes")({
  head: () => ({
    meta: [
      { title: "מסלולי ריצה · Fit Log" },
      { name: "description", content: "ניהול מסלולים קבועים לשימוש חוזר." },
      { property: "og:title", content: "מסלולי ריצה · Fit Log" },
      { property: "og:description", content: "ניהול מסלולים קבועים." },
    ],
  }),
  component: RoutesPage,
});

function RoutesPage() {
  const routes = useAllRoutes().filter((r) => r.deleted_at == null);
  const [editing, setEditing] = useState<RunningRoute | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <AppShell topBar={{ title: "מסלולים", back: { to: "/running", label: "חזרה" } }}>
      <PageHeader
        eyebrow="ריצה"
        title="מסלולים קבועים"
        description="שימוש חוזר בעת דיווח ריצת חוץ."
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="me-1 size-4" />
            חדש
          </Button>
        }
      />
      <div className="space-y-2 px-4 sm:px-6">
        {routes.length === 0 ? (
          <EmptyState
            icon={<MapPin aria-hidden />}
            title="אין מסלולים שמורים"
            description="הוסף מסלול קבוע כדי לחסוך זמן בדיווח."
          />
        ) : (
          routes.map((r) => (
            <Tile key={r.id} className="gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-bold">
                    {r.is_favorite ? <Star className="size-3 fill-warning text-warning" /> : null}
                    {r.name}
                  </div>
                  <TileFootnote>
                    {ROUTE_TYPE_LABELS[r.route_type]} · {r.city_or_area ?? "–"} ·{" "}
                    {r.typical_distance_meters
                      ? `${formatDistanceKm(r.typical_distance_meters, 1)} ק"מ`
                      : ""}
                  </TileFootnote>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                    aria-label="עריכה"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!window.confirm("להעביר את המסלול לסל המחזור?")) return;
                      runsRepo.softDeleteRoute(r.id);
                      toast.info("המסלול הועבר לסל המחזור");
                    }}
                    aria-label="מחיקה"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Tile>
          ))
        )}
      </div>
      <RouteFormSheet open={open} onOpenChange={setOpen} route={editing} />
    </AppShell>
  );
}

function RouteFormSheet({
  open,
  onOpenChange,
  route,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  route: RunningRoute | null;
}) {
  const locations = useAllLocations().filter((l) => l.deleted_at == null && l.is_active);
  const [name, setName] = useState(route?.name ?? "");
  const [routeType, setRouteType] = useState<RunningRoute["route_type"]>(
    route?.route_type ?? "fixed",
  );
  const [locationId, setLocationId] = useState<string | null>(route?.location_id ?? null);
  const [countryCode, setCountryCode] = useState<string | null>(route?.country_code ?? null);
  const [city, setCity] = useState(route?.city_or_area ?? "");
  const [distanceKm, setDistanceKm] = useState(
    route?.typical_distance_meters ? (route.typical_distance_meters / 1000).toString() : "",
  );
  const [notes, setNotes] = useState(route?.notes ?? "");
  const [favorite, setFavorite] = useState(route?.is_favorite ?? false);

  // reset when route changes
  useState(() => {
    setName(route?.name ?? "");
    setRouteType(route?.route_type ?? "fixed");
    setLocationId(route?.location_id ?? null);
    setCountryCode(route?.country_code ?? null);
    setCity(route?.city_or_area ?? "");
    setDistanceKm(
      route?.typical_distance_meters ? (route.typical_distance_meters / 1000).toString() : "",
    );
    setNotes(route?.notes ?? "");
    setFavorite(route?.is_favorite ?? false);
  });

  function save() {
    if (!name.trim()) {
      toast.error("יש להזין שם");
      return;
    }
    const dist = distanceKm.trim() ? Number(distanceKm) * 1000 : null;
    const payload = {
      name: name.trim(),
      route_type: routeType,
      location_id: locationId,
      country_code: countryCode,
      city_or_area: city.trim() || null,
      typical_distance_meters: Number.isFinite(dist as number) ? (dist as number) : null,
      description: null,
      notes: notes.trim() || null,
      image_url: null,
      is_favorite: favorite,
      is_active: true,
    };
    if (route) {
      runsRepo.updateRoute(route.id, payload);
      toast.success("המסלול עודכן");
    } else {
      runsRepo.createRoute(payload);
      toast.success("המסלול נוסף");
    }
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{route ? "עריכת מסלול" : "מסלול חדש"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <F label="שם">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='למשל: "המרובע"'
            />
          </F>
          <F label="סוג">
            <Select
              value={routeType}
              onValueChange={(v) => setRouteType(v as RunningRoute["route_type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROUTE_TYPE_ORDERED.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ROUTE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="מקום מקושר (אופציונלי)">
            <Select
              value={locationId ?? "__none"}
              onValueChange={(v) => setLocationId(v === "__none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="ללא" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— ללא —</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="מדינה">
            <CountryPicker value={countryCode} onChange={setCountryCode} />
          </F>
          <F label="עיר / אזור">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </F>
          <F label='מרחק אופייני (ק"מ)'>
            <Input
              inputMode="decimal"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
            />
          </F>
          <F label="הערות">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </F>
          <div className="flex items-center gap-2">
            <Switch checked={favorite} onCheckedChange={setFavorite} id="fav" />
            <Label htmlFor="fav">מסלול מועדף</Label>
          </div>
        </div>
        <SheetFooter className="mt-4 flex gap-2">
          <Button onClick={save} className="flex-1">
            שמור
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
