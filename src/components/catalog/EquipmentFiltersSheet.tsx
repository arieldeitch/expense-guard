/**
 * FiltersSheet — Sheet אנכי לפילטרים של ציוד.
 * לא chips אופקיים (איסור גלילה אופקית).
 */
import type { EquipmentFilters } from "@/lib/catalog";
import {
  AVAILABILITY_LABEL,
  AVAILABILITY_ORDERED,
  EMPTY_EQUIPMENT_FILTERS,
  EQUIPMENT_TYPE_LABEL,
  EQUIPMENT_TYPES_ORDERED,
} from "@/lib/catalog";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

export function EquipmentFiltersSheet({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: EquipmentFilters;
  onChange: (next: EquipmentFilters) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        dir="rtl"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl border-border-strong bg-background sm:mx-auto sm:max-w-lg"
      >
        <SheetHeader className="text-start">
          <SheetTitle>
            <span className="inline-flex items-center gap-2">
              <Filter aria-hidden className="size-4" />
              סינון ציוד
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-4">
          <section>
            <Label className="mb-2 block text-sm font-bold">תצוגה</Label>
            <Select
              value={value.visibility}
              onValueChange={(v) =>
                onChange({ ...value, visibility: v as EquipmentFilters["visibility"] })
              }
            >
              <SelectTrigger className="min-h-11 rounded-xl border-border-strong">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="active">פעילים בלבד</SelectItem>
                <SelectItem value="archived">ארכיון בלבד</SelectItem>
                <SelectItem value="all">כולם</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <section className="rounded-xl border border-border-strong bg-surface p-3">
            <label className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <span className="text-sm font-bold">מועדפים בלבד</span>
              <Switch
                checked={value.favoritesOnly}
                onCheckedChange={(v) => onChange({ ...value, favoritesOnly: v })}
              />
            </label>
          </section>

          <section>
            <Label className="mb-2 block text-sm font-bold">סוג ציוד</Label>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {EQUIPMENT_TYPES_ORDERED.map((t) => {
                const checked = value.types.includes(t);
                return (
                  <li key={t}>
                    <label className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg border border-border-strong bg-surface px-2 py-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          const next = c ? [...value.types, t] : value.types.filter((x) => x !== t);
                          onChange({ ...value, types: next });
                        }}
                      />
                      <span className="truncate">{EQUIPMENT_TYPE_LABEL[t]}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <Label className="mb-2 block text-sm font-bold">זמינות</Label>
            <ul className="grid grid-cols-1 gap-1">
              {AVAILABILITY_ORDERED.map((a) => {
                const checked = value.availability.includes(a);
                return (
                  <li key={a}>
                    <label className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg border border-border-strong bg-surface px-2 py-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          const next = c
                            ? [...value.availability, a]
                            : value.availability.filter((x) => x !== a);
                          onChange({ ...value, availability: next });
                        }}
                      />
                      <span className="truncate">{AVAILABILITY_LABEL[a]}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <SheetFooter className="mt-4 flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 rounded-xl"
            onClick={() => onChange(EMPTY_EQUIPMENT_FILTERS)}
          >
            ניקוי פילטרים
          </Button>
          <Button
            type="button"
            className="min-h-11 rounded-xl bg-primary text-primary-foreground"
            onClick={() => onOpenChange(false)}
          >
            סיום
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function filtersActiveCount(f: EquipmentFilters): number {
  return (
    (f.visibility !== "active" ? 1 : 0) +
    (f.favoritesOnly ? 1 : 0) +
    f.types.length +
    f.availability.length
  );
}
