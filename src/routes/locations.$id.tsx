/**
 * /locations/$id — פרטי מקום: הליכונים + ציוד.
 * מציג טאבים ("הליכונים", "ציוד"), עם ניהול, סינון וארכוב.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Dumbbell, Filter, Gauge, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LocationForm } from "@/components/catalog/LocationForm";
import { TreadmillForm } from "@/components/catalog/TreadmillForm";
import { EquipmentForm } from "@/components/catalog/EquipmentForm";
import { TreadmillTile } from "@/components/catalog/TreadmillTile";
import { EquipmentTile } from "@/components/catalog/EquipmentTile";
import {
  EquipmentFiltersSheet,
  filtersActiveCount,
} from "@/components/catalog/EquipmentFiltersSheet";
import { Chip } from "@/components/catalog/shared";
import {
  EMPTY_EQUIPMENT_FILTERS,
  LOCATION_TYPE_LABEL,
  findCountry,
  useEquipmentInLocation,
  useLocation,
  useTreadmillsInLocation,
  type EquipmentFilters,
  type EquipmentItem,
  type LocationType,
  type TreadmillProfile,
} from "@/lib/catalog";

export const Route = createFileRoute("/locations/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `מקום · Fit Log` },
      { name: "description", content: "פרטי מקום, ציוד והליכונים." },
      { property: "og:title", content: "מקום · Fit Log" },
      { property: "og:description", content: `מזהה מקום ${params.id}.` },
    ],
  }),
  loader: ({ params }) => ({ id: params.id }),
  notFoundComponent: MissingLocation,
  component: LocationDetailPage,
});

function MissingLocation() {
  return (
    <AppShell topBar={{ title: "מקום לא נמצא", back: { to: "/locations" } }}>
      <div className="px-4 sm:px-6">
        <EmptyState
          title="המקום לא נמצא"
          description="ייתכן שהמקום נמחק. אפשר לשחזר מסל המחזור."
          action={
            <Link
              to="/locations"
              className="tile-interactive inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold"
            >
              חזרה לרשימת המקומות
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}

function LocationDetailPage() {
  const { id } = Route.useLoaderData();
  const location = useLocation(id);
  const treadmills = useTreadmillsInLocation(id);
  const equipment = useEquipmentInLocation(id);

  const [tab, setTab] = useState<"equipment" | "treadmills">("equipment");
  const [editLocationOpen, setEditLocationOpen] = useState(false);
  const [treadFormOpen, setTreadFormOpen] = useState(false);
  const [editTread, setEditTread] = useState<TreadmillProfile | null>(null);
  const [equipFormOpen, setEquipFormOpen] = useState(false);
  const [editEquip, setEditEquip] = useState<EquipmentItem | null>(null);
  const [filters, setFilters] = useState<EquipmentFilters>(EMPTY_EQUIPMENT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [equipQuery, setEquipQuery] = useState("");

  if (!location) throw notFound();

  const country = findCountry(location.country_code);

  const filteredEquip = useMemo(() => {
    const q = equipQuery.trim().toLowerCase();
    return equipment
      .filter((e) => e.deleted_at === null)
      .filter((e) =>
        filters.visibility === "archived"
          ? !e.is_active
          : filters.visibility === "active"
            ? e.is_active
            : true,
      )
      .filter((e) => (filters.favoritesOnly ? e.is_favorite : true))
      .filter((e) => (filters.types.length === 0 ? true : filters.types.includes(e.equipment_type)))
      .filter((e) =>
        filters.availability.length === 0
          ? true
          : filters.availability.includes(e.availability_status),
      )
      .filter((e) =>
        q === ""
          ? true
          : [e.name, e.manufacturer, e.model].some(
              (s) => s && s.toLowerCase().includes(q),
            ),
      );
  }, [equipment, equipQuery, filters]);

  const visibleTreads = treadmills.filter((t) => t.deleted_at === null);
  const activeFilters = filtersActiveCount(filters);

  return (
    <AppShell topBar={{ title: location.name, back: { to: "/locations" } }}>
      <PageHeader
        eyebrow={LOCATION_TYPE_LABEL[location.location_type as LocationType]}
        title={location.name}
        description={
          [location.city, country?.he, location.address].filter(Boolean).join(" · ") ||
          undefined
        }
        action={
          <Button
            variant="ghost"
            onClick={() => setEditLocationOpen(true)}
            className="min-h-11 rounded-xl border border-border-strong"
          >
            עריכה
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1.5 px-4 sm:px-6">
        {location.is_default ? <Chip tone="info">ברירת מחדל</Chip> : null}
        {location.is_favorite ? <Chip tone="warning">מועדף</Chip> : null}
        {!location.is_active ? <Chip tone="warning">בארכיון</Chip> : null}
      </div>

      <div className="mt-4 px-4 sm:px-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-2 rounded-xl border border-border-strong bg-surface p-1">
            <TabsTrigger value="equipment" className="rounded-lg data-[state=active]:bg-tint">
              ציוד ({equipment.filter((e) => e.deleted_at === null).length})
            </TabsTrigger>
            <TabsTrigger value="treadmills" className="rounded-lg data-[state=active]:bg-tint">
              הליכונים ({visibleTreads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipment" className="mt-4 flex flex-col gap-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
              <Input
                value={equipQuery}
                onChange={(e) => setEquipQuery(e.target.value)}
                placeholder="חיפוש בציוד"
                className="min-h-11 rounded-xl border-border-strong"
                aria-label="חיפוש ציוד"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFiltersOpen(true)}
                className="min-h-11 rounded-xl border border-border-strong"
                aria-label="פילטרים"
              >
                <Filter aria-hidden className="size-4" />
                {activeFilters > 0 ? (
                  <span className="ms-1 rounded-md bg-primary/20 px-1.5 text-xs font-bold text-primary">
                    {activeFilters}
                  </span>
                ) : null}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEditEquip(null);
                  setEquipFormOpen(true);
                }}
                className="min-h-11 rounded-xl bg-primary text-primary-foreground"
              >
                <Plus aria-hidden className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredEquip.length === 0 ? (
                <div className="sm:col-span-2">
                  <EmptyState
                    icon={<Dumbbell aria-hidden />}
                    title={
                      equipQuery || activeFilters
                        ? "אין ציוד תואם"
                        : "אין עדיין ציוד"
                    }
                    description={
                      equipQuery || activeFilters
                        ? "נסה לנקות פילטרים או להסיר חיפוש."
                        : "הוספת ציוד מאפשרת שימוש חוזר בין אימונים באותו מקום."
                    }
                    action={
                      !(equipQuery || activeFilters) ? (
                        <Button
                          onClick={() => {
                            setEditEquip(null);
                            setEquipFormOpen(true);
                          }}
                          className="min-h-11 rounded-xl bg-primary text-primary-foreground"
                        >
                          הוספת פריט
                        </Button>
                      ) : null
                    }
                  />
                </div>
              ) : (
                filteredEquip.map((e) => (
                  <EquipmentTile
                    key={e.id}
                    equipment={e}
                    onEdit={(item) => {
                      setEditEquip(item);
                      setEquipFormOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="treadmills" className="mt-4 flex flex-col gap-3">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  setEditTread(null);
                  setTreadFormOpen(true);
                }}
                className="min-h-11 rounded-xl bg-primary text-primary-foreground"
              >
                <Plus aria-hidden className="me-1 size-4" />
                הליכון חדש
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleTreads.length === 0 ? (
                <div className="sm:col-span-2">
                  <EmptyState
                    icon={<Gauge aria-hidden />}
                    title="אין עדיין הליכונים"
                    description="הוספת הליכון תאפשר לזהות אותו בעתיד ולהשוות מדידות."
                    action={
                      <Button
                        onClick={() => {
                          setEditTread(null);
                          setTreadFormOpen(true);
                        }}
                        className="min-h-11 rounded-xl bg-primary text-primary-foreground"
                      >
                        הוספת הליכון
                      </Button>
                    }
                  />
                </div>
              ) : (
                visibleTreads.map((t) => (
                  <TreadmillTile
                    key={t.id}
                    treadmill={t}
                    onEdit={(item) => {
                      setEditTread(item);
                      setTreadFormOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <LocationForm
        open={editLocationOpen}
        onOpenChange={setEditLocationOpen}
        location={location}
      />
      <TreadmillForm
        open={treadFormOpen}
        onOpenChange={setTreadFormOpen}
        locationId={location.id}
        treadmill={editTread}
      />
      <EquipmentForm
        open={equipFormOpen}
        onOpenChange={setEquipFormOpen}
        locationId={location.id}
        equipment={editEquip}
        allowSequential
      />
      <EquipmentFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onChange={setFilters}
      />
    </AppShell>
  );
}
