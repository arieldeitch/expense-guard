/**
 * LocationForm — יצירה או עריכה של TrainingLocation.
 * מוצג ב־Sheet מובייל־פרנדלי, שדות מדורגים: חובה בראש, אופציונליים למטה.
 * מבטיח אזהרה לפני סגירה כאשר יש שינויים לא שמורים.
 */
import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CountryPicker } from "./CountryPicker";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  createLocation,
  LOCATION_TYPE_LABEL,
  LOCATION_TYPES_ORDERED,
  locationFormSchema,
  updateLocation,
  type LocationType,
  type TrainingLocation,
} from "@/lib/catalog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** אם קיים — מצב עריכה. אחרת — יצירה. */
  location?: TrainingLocation | null;
  onSaved?: (loc: TrainingLocation) => void;
}

interface FormState {
  name: string;
  location_type: LocationType;
  country_code: string | null;
  city: string;
  area: string;
  address: string;
  description: string;
  notes: string;
  latitudeStr: string;
  longitudeStr: string;
  is_favorite: boolean;
  is_default: boolean;
}

function toFormState(l?: TrainingLocation | null): FormState {
  return {
    name: l?.name ?? "",
    location_type: (l?.location_type as LocationType) ?? "gym",
    country_code: l?.country_code ?? null,
    city: l?.city ?? "",
    area: l?.area ?? "",
    address: l?.address ?? "",
    description: l?.description ?? "",
    notes: l?.notes ?? "",
    latitudeStr: l?.latitude != null ? String(l.latitude) : "",
    longitudeStr: l?.longitude != null ? String(l.longitude) : "",
    is_favorite: l?.is_favorite ?? false,
    is_default: l?.is_default ?? false,
  };
}

export function LocationForm({ open, onOpenChange, location, onSaved }: Props) {
  const initial = useMemo(() => toFormState(location), [location]);
  const [state, setState] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmClose, setConfirmClose] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setState(initial);
      setErrors({});
    }
  }, [open, initial]);

  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(initial), [state, initial]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function requestClose(next: boolean) {
    if (!next && dirty) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const lat = state.latitudeStr.trim() === "" ? null : Number(state.latitudeStr);
    const lng = state.longitudeStr.trim() === "" ? null : Number(state.longitudeStr);
    const raw = {
      name: state.name,
      location_type: state.location_type,
      country_code: state.country_code ?? undefined,
      city: state.city,
      area: state.area,
      address: state.address,
      description: state.description,
      notes: state.notes,
      latitude: Number.isNaN(lat as number) ? undefined : lat,
      longitude: Number.isNaN(lng as number) ? undefined : lng,
      is_favorite: state.is_favorite,
      is_default: state.is_default,
    };
    const parsed = locationFormSchema.safeParse(raw);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        map[issue.path.join(".")] = issue.message;
      }
      setErrors(map);
      setSaving(false);
      return;
    }
    setErrors({});
    const data = parsed.data;
    const payload = {
      name: data.name,
      location_type: data.location_type as LocationType,
      country_code: data.country_code ?? null,
      city: data.city ?? null,
      area: data.area ?? null,
      address: data.address ?? null,
      description: data.description ?? null,
      notes: data.notes ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    };
    const saved = location
      ? updateLocation(location.id, {
          ...payload,
          is_favorite: state.is_favorite,
          is_default: state.is_default,
        })
      : createLocation({
          ...payload,
          is_favorite: state.is_favorite,
          is_default: state.is_default,
        });
    setSaving(false);
    if (saved) onSaved?.(saved);
    onOpenChange(false);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent
          side="bottom"
          dir="rtl"
          className="max-h-[92vh] overflow-y-auto rounded-t-2xl border-border-strong bg-background sm:max-w-2xl sm:mx-auto"
        >
          <SheetHeader className="text-start">
            <SheetTitle>{location ? "עריכת מקום" : "מקום חדש"}</SheetTitle>
            <SheetDescription>
              שם וסוג הם חובה. שאר הפרטים לא נחוצים לדיווח אימון.
            </SheetDescription>
          </SheetHeader>
          <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="loc-name" className="mb-1.5 block text-sm font-bold">
                שם המקום *
              </Label>
              <Input
                id="loc-name"
                value={state.name}
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                placeholder='למשל: "חדר הכושר בקיבוץ"'
                required
                maxLength={80}
                className="min-h-11 rounded-xl"
                aria-invalid={errors.name ? true : undefined}
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </div>

            <div>
              <Label htmlFor="loc-type" className="mb-1.5 block text-sm font-bold">
                סוג *
              </Label>
              <Select
                value={state.location_type}
                onValueChange={(v) =>
                  setState((s) => ({ ...s, location_type: v as LocationType }))
                }
              >
                <SelectTrigger id="loc-type" className="min-h-11 rounded-xl border-border-strong">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {LOCATION_TYPES_ORDERED.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LOCATION_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-bold">מדינה</Label>
              <CountryPicker
                value={state.country_code}
                onChange={(code) => setState((s) => ({ ...s, country_code: code }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="loc-city" className="mb-1.5 block text-sm font-bold">
                  עיר
                </Label>
                <Input
                  id="loc-city"
                  value={state.city}
                  onChange={(e) => setState((s) => ({ ...s, city: e.target.value }))}
                  maxLength={80}
                  className="min-h-11 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="loc-area" className="mb-1.5 block text-sm font-bold">
                  אזור / שכונה
                </Label>
                <Input
                  id="loc-area"
                  value={state.area}
                  onChange={(e) => setState((s) => ({ ...s, area: e.target.value }))}
                  maxLength={80}
                  className="min-h-11 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="loc-address" className="mb-1.5 block text-sm font-bold">
                כתובת
              </Label>
              <Input
                id="loc-address"
                value={state.address}
                onChange={(e) => setState((s) => ({ ...s, address: e.target.value }))}
                maxLength={200}
                className="min-h-11 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="loc-desc" className="mb-1.5 block text-sm font-bold">
                תיאור
              </Label>
              <Textarea
                id="loc-desc"
                value={state.description}
                onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
                maxLength={500}
                rows={2}
                className="min-h-20 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="loc-notes" className="mb-1.5 block text-sm font-bold">
                הערות
              </Label>
              <Textarea
                id="loc-notes"
                value={state.notes}
                onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
                maxLength={500}
                rows={2}
                className="min-h-20 rounded-xl"
              />
            </div>

            <details className="rounded-xl border border-border-strong bg-surface p-3">
              <summary className="cursor-pointer text-sm font-bold">
                מיקום גאוגרפי (אופציונלי)
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="loc-lat" className="mb-1.5 block text-xs font-bold">
                    קו רוחב
                  </Label>
                  <Input
                    id="loc-lat"
                    inputMode="decimal"
                    value={state.latitudeStr}
                    onChange={(e) => setState((s) => ({ ...s, latitudeStr: e.target.value }))}
                    placeholder="31.7683"
                    className="ltr-nums min-h-11 rounded-xl"
                  />
                  {errors.latitude ? <FieldError>{errors.latitude}</FieldError> : null}
                </div>
                <div>
                  <Label htmlFor="loc-lng" className="mb-1.5 block text-xs font-bold">
                    קו אורך
                  </Label>
                  <Input
                    id="loc-lng"
                    inputMode="decimal"
                    value={state.longitudeStr}
                    onChange={(e) => setState((s) => ({ ...s, longitudeStr: e.target.value }))}
                    placeholder="35.2137"
                    className="ltr-nums min-h-11 rounded-xl"
                  />
                  {errors.longitude ? <FieldError>{errors.longitude}</FieldError> : null}
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                לא נשלח לשירות חיצוני. GPS אינו נדרש.
              </p>
            </details>

            <div className="flex flex-col gap-2 rounded-xl border border-border-strong bg-surface p-3">
              <ToggleRow
                icon={<Star aria-hidden />}
                label="הוספה למועדפים"
                hint="יופיע בראש הרשימה"
                checked={state.is_favorite}
                onChange={(v) => setState((s) => ({ ...s, is_favorite: v }))}
              />
              <ToggleRow
                label="הגדרת מקום ברירת מחדל"
                hint="ייבחר אוטומטית בדיווח אימון חדש. יבטל ברירת מחדל קודמת."
                checked={state.is_default}
                onChange={(v) => setState((s) => ({ ...s, is_default: v }))}
              />
            </div>

            <SheetFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 rounded-xl"
                onClick={() => requestClose(false)}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="min-h-11 rounded-xl bg-primary text-primary-foreground"
              >
                {location ? "שמירת שינויים" : "יצירת מקום"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="השינויים לא נשמרו"
        description="יש שינויים שלא נשמרו. יציאה תאבד את השינויים."
        confirmLabel="יציאה בלי שמירה"
        cancelLabel="חזרה לטופס"
        destructive
        onConfirm={() => {
          setConfirmClose(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-destructive">{children}</p>;
}

function ToggleRow({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon?: React.ReactNode;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-bold">
          {icon ? (
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-tint text-foreground [&_svg]:size-3.5">
              {icon}
            </span>
          ) : null}
          <span>{label}</span>
        </div>
        {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
