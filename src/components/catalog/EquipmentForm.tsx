/**
 * EquipmentForm — יצירה או עריכה של פריט ציוד.
 * תומך במצב "הוספה רצופה": אחרי שמירה מוצע להוסיף עוד באותו מקום.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Star } from "lucide-react";
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
import { ImagePicker } from "./ImagePicker";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  AVAILABILITY_LABEL,
  AVAILABILITY_ORDERED,
  createEquipment,
  EQUIPMENT_TYPE_LABEL,
  EQUIPMENT_TYPES_ORDERED,
  equipmentFormSchema,
  findSimilarEquipmentInLocation,
  updateEquipment,
  WEIGHT_UNIT_LABEL,
  type EquipmentAvailability,
  type EquipmentItem,
  type EquipmentType,
  type WeightUnit,
} from "@/lib/catalog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  equipment?: EquipmentItem | null;
  onSaved?: (e: EquipmentItem) => void;
  /** אם true — אחרי שמירה, איפוס טופס למצב יצירה נוספת. */
  allowSequential?: boolean;
}

interface FormState {
  name: string;
  equipment_type: EquipmentType;
  availability_status: EquipmentAvailability;
  manufacturer: string;
  model: string;
  quantity: string;
  minStr: string;
  maxStr: string;
  incStr: string;
  unit: WeightUnit | "";
  image_url: string | null;
  notes: string;
  is_favorite: boolean;
}

function toState(e?: EquipmentItem | null): FormState {
  return {
    name: e?.name ?? "",
    equipment_type: (e?.equipment_type as EquipmentType) ?? "dumbbells",
    availability_status: (e?.availability_status as EquipmentAvailability) ?? "available",
    manufacturer: e?.manufacturer ?? "",
    model: e?.model ?? "",
    quantity: e?.quantity != null ? String(e.quantity) : "1",
    minStr: e?.min_weight != null ? String(e.min_weight) : "",
    maxStr: e?.max_weight != null ? String(e.max_weight) : "",
    incStr: e?.weight_increment != null ? String(e.weight_increment) : "",
    unit: (e?.unit as WeightUnit | null) ?? "kg",
    image_url: e?.image_url ?? null,
    notes: e?.notes ?? "",
    is_favorite: e?.is_favorite ?? false,
  };
}

export function EquipmentForm({
  open,
  onOpenChange,
  locationId,
  equipment,
  onSaved,
  allowSequential = false,
}: Props) {
  const initial = useMemo(() => toState(equipment), [equipment]);
  const [state, setState] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmClose, setConfirmClose] = useState(false);
  const [duplicateOverride, setDuplicateOverride] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(Boolean(equipment));

  useEffect(() => {
    if (open) {
      setState(initial);
      setErrors({});
      setDuplicateOverride(false);
      setShowAdvanced(Boolean(equipment));
    }
  }, [open, initial, equipment]);

  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(initial), [state, initial]);

  const similar = useMemo(
    () =>
      state.name.trim().length > 0
        ? findSimilarEquipmentInLocation(state.name, locationId, equipment?.id)
        : [],
    [state.name, locationId, equipment?.id],
  );

  function requestClose(next: boolean) {
    if (!next && dirty) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(next);
  }

  function parseNumberField(v: string): number | undefined {
    if (v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  function handleSave(e: React.FormEvent, addAnother: boolean) {
    e.preventDefault();
    const parsed = equipmentFormSchema.safeParse({
      location_id: locationId,
      name: state.name,
      equipment_type: state.equipment_type,
      availability_status: state.availability_status,
      manufacturer: state.manufacturer,
      model: state.model,
      quantity: Number(state.quantity),
      min_weight: parseNumberField(state.minStr),
      max_weight: parseNumberField(state.maxStr),
      weight_increment: parseNumberField(state.incStr),
      unit: state.unit === "" ? undefined : state.unit,
      image_url: state.image_url ?? undefined,
      notes: state.notes,
      is_favorite: state.is_favorite,
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) map[issue.path.join(".")] = issue.message;
      setErrors(map);
      return;
    }
    if (similar.length > 0 && !duplicateOverride) {
      setDuplicateOverride(true);
      return;
    }
    setErrors({});
    const data = parsed.data;
    const payload = {
      location_id: locationId,
      name: data.name,
      equipment_type: data.equipment_type as EquipmentType,
      availability_status: data.availability_status as EquipmentAvailability,
      manufacturer: data.manufacturer ?? null,
      model: data.model ?? null,
      quantity: data.quantity,
      min_weight: data.min_weight ?? null,
      max_weight: data.max_weight ?? null,
      weight_increment: data.weight_increment ?? null,
      unit: (data.unit as WeightUnit | null | undefined) ?? null,
      image_url: data.image_url ?? null,
      notes: data.notes ?? null,
    };
    const saved = equipment
      ? updateEquipment(equipment.id, { ...payload, is_favorite: state.is_favorite })
      : createEquipment({ ...payload, is_favorite: state.is_favorite });
    if (saved) onSaved?.(saved);
    if (addAnother) {
      // Reset for a fresh entry
      setState({
        ...toState(null),
        equipment_type: state.equipment_type,
        availability_status: state.availability_status,
        unit: state.unit,
      });
      setDuplicateOverride(false);
      setErrors({});
    } else {
      onOpenChange(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent
          side="bottom"
          dir="rtl"
          className="max-h-[92vh] overflow-y-auto rounded-t-2xl border-border-strong bg-background sm:mx-auto sm:max-w-2xl"
        >
          <SheetHeader className="text-start">
            <SheetTitle>{equipment ? "עריכת ציוד" : "ציוד חדש"}</SheetTitle>
            <SheetDescription>שם, סוג וזמינות נדרשים. פרטים מתקדמים אופציונליים.</SheetDescription>
          </SheetHeader>
          <form className="mt-4 flex flex-col gap-4" onSubmit={(e) => handleSave(e, false)}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="eq-name" className="mb-1.5 block text-sm font-bold">
                  שם *
                </Label>
                <Input
                  id="eq-name"
                  value={state.name}
                  onChange={(e) => {
                    setState((s) => ({ ...s, name: e.target.value }));
                    setDuplicateOverride(false);
                  }}
                  required
                  maxLength={80}
                  className="min-h-11 rounded-xl"
                  placeholder='למשל: "משקולות יד 5-25 ק״ג"'
                />
                {errors.name ? (
                  <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="eq-type" className="mb-1.5 block text-sm font-bold">
                  סוג *
                </Label>
                <Select
                  value={state.equipment_type}
                  onValueChange={(v) =>
                    setState((s) => ({ ...s, equipment_type: v as EquipmentType }))
                  }
                >
                  <SelectTrigger id="eq-type" className="min-h-11 rounded-xl border-border-strong">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {EQUIPMENT_TYPES_ORDERED.map((t) => (
                      <SelectItem key={t} value={t}>
                        {EQUIPMENT_TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="eq-avail" className="mb-1.5 block text-sm font-bold">
                  זמינות *
                </Label>
                <Select
                  value={state.availability_status}
                  onValueChange={(v) =>
                    setState((s) => ({ ...s, availability_status: v as EquipmentAvailability }))
                  }
                >
                  <SelectTrigger id="eq-avail" className="min-h-11 rounded-xl border-border-strong">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {AVAILABILITY_ORDERED.map((v) => (
                      <SelectItem key={v} value={v}>
                        {AVAILABILITY_LABEL[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="eq-qty" className="mb-1.5 block text-sm font-bold">
                  כמות
                </Label>
                <Input
                  id="eq-qty"
                  inputMode="numeric"
                  value={state.quantity}
                  onChange={(e) => setState((s) => ({ ...s, quantity: e.target.value }))}
                  className="ltr-nums min-h-11 rounded-xl"
                />
                {errors.quantity ? (
                  <p className="mt-1 text-xs text-destructive">{errors.quantity}</p>
                ) : null}
              </div>
            </div>

            {similar.length > 0 ? (
              <div
                className="rounded-xl border border-warning/60 bg-warning-soft/40 p-3 text-sm text-foreground"
                role="alert"
              >
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle aria-hidden className="size-4" />
                  <span className="font-bold">שם דומה נמצא באותו מקום</span>
                </div>
                <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                  {similar.map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  {duplicateOverride
                    ? "לחצו שוב ״שמירה״ להמשיך בכל זאת."
                    : "אפשר להמשיך רק בהחלטה מפורשת."}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-start text-xs font-bold text-primary underline underline-offset-2"
            >
              {showAdvanced ? "הסתרת פרטים מתקדמים" : "הוספת פרטים מתקדמים (משקל, יצרן, תמונה)"}
            </button>

            {showAdvanced ? (
              <div className="flex flex-col gap-4 rounded-xl border border-border-strong bg-surface p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="eq-mfr" className="mb-1.5 block text-sm font-bold">
                      יצרן
                    </Label>
                    <Input
                      id="eq-mfr"
                      value={state.manufacturer}
                      onChange={(e) => setState((s) => ({ ...s, manufacturer: e.target.value }))}
                      maxLength={60}
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eq-model" className="mb-1.5 block text-sm font-bold">
                      דגם
                    </Label>
                    <Input
                      id="eq-model"
                      value={state.model}
                      onChange={(e) => setState((s) => ({ ...s, model: e.target.value }))}
                      maxLength={60}
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="eq-min" className="mb-1.5 block text-xs font-bold">
                      משקל מינ׳
                    </Label>
                    <Input
                      id="eq-min"
                      inputMode="decimal"
                      value={state.minStr}
                      onChange={(e) => setState((s) => ({ ...s, minStr: e.target.value }))}
                      className="ltr-nums min-h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eq-max" className="mb-1.5 block text-xs font-bold">
                      משקל מקס׳
                    </Label>
                    <Input
                      id="eq-max"
                      inputMode="decimal"
                      value={state.maxStr}
                      onChange={(e) => setState((s) => ({ ...s, maxStr: e.target.value }))}
                      className="ltr-nums min-h-11 rounded-xl"
                    />
                    {errors.max_weight ? (
                      <p className="mt-1 text-xs text-destructive">{errors.max_weight}</p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="eq-inc" className="mb-1.5 block text-xs font-bold">
                      צעד
                    </Label>
                    <Input
                      id="eq-inc"
                      inputMode="decimal"
                      value={state.incStr}
                      onChange={(e) => setState((s) => ({ ...s, incStr: e.target.value }))}
                      className="ltr-nums min-h-11 rounded-xl"
                    />
                    {errors.weight_increment ? (
                      <p className="mt-1 text-xs text-destructive">{errors.weight_increment}</p>
                    ) : null}
                  </div>
                </div>
                <div>
                  <Label htmlFor="eq-unit" className="mb-1.5 block text-sm font-bold">
                    יחידת משקל
                  </Label>
                  <Select
                    value={state.unit === "" ? "kg" : state.unit}
                    onValueChange={(v) => setState((s) => ({ ...s, unit: v as WeightUnit }))}
                  >
                    <SelectTrigger
                      id="eq-unit"
                      className="min-h-11 rounded-xl border-border-strong"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {(["kg", "lb"] as WeightUnit[]).map((u) => (
                        <SelectItem key={u} value={u}>
                          {WEIGHT_UNIT_LABEL[u]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-bold">תמונה</Label>
                  <ImagePicker
                    value={state.image_url}
                    onChange={(url) => setState((s) => ({ ...s, image_url: url }))}
                    label="תמונת ציוד"
                  />
                </div>
                <div>
                  <Label htmlFor="eq-notes" className="mb-1.5 block text-sm font-bold">
                    הערות
                  </Label>
                  <Textarea
                    id="eq-notes"
                    value={state.notes}
                    onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
                    maxLength={500}
                    rows={2}
                    className="min-h-20 rounded-xl"
                  />
                </div>
              </div>
            ) : null}

            <label className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border-strong bg-surface p-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="inline-flex size-6 items-center justify-center rounded-md bg-tint text-foreground [&_svg]:size-3.5">
                  <Star aria-hidden />
                </span>
                מועדף
              </div>
              <Switch
                checked={state.is_favorite}
                onCheckedChange={(v) => setState((s) => ({ ...s, is_favorite: v }))}
              />
            </label>

            <SheetFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 rounded-xl"
                onClick={() => requestClose(false)}
              >
                ביטול
              </Button>
              {allowSequential && !equipment ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 rounded-xl border-border-strong"
                  onClick={(e) => handleSave(e as unknown as React.FormEvent, true)}
                >
                  שמור והוסף עוד
                </Button>
              ) : null}
              <Button
                type="submit"
                className="min-h-11 rounded-xl bg-primary text-primary-foreground"
              >
                {equipment ? "שמירה" : "הוספת ציוד"}
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
