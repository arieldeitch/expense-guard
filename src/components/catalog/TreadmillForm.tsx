/**
 * TreadmillForm — יצירה / עריכה של הליכון עבור מקום מסוים.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  createTreadmill,
  findSimilarTreadmillInLocation,
  treadmillFormSchema,
  updateTreadmill,
  type TreadmillProfile,
} from "@/lib/catalog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  treadmill?: TreadmillProfile | null;
  onSaved?: (t: TreadmillProfile) => void;
}

interface FormState {
  display_name: string;
  machine_number: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  visual_description: string;
  image_url: string | null;
  notes: string;
  is_favorite: boolean;
}

function toState(t?: TreadmillProfile | null): FormState {
  return {
    display_name: t?.display_name ?? "",
    machine_number: t?.machine_number ?? "",
    manufacturer: t?.manufacturer ?? "",
    model: t?.model ?? "",
    serial_number: t?.serial_number ?? "",
    visual_description: t?.visual_description ?? "",
    image_url: t?.image_url ?? null,
    notes: t?.notes ?? "",
    is_favorite: t?.is_favorite ?? false,
  };
}

export function TreadmillForm({ open, onOpenChange, locationId, treadmill, onSaved }: Props) {
  const initial = useMemo(() => toState(treadmill), [treadmill]);
  const [state, setState] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmClose, setConfirmClose] = useState(false);
  const [duplicateOverride, setDuplicateOverride] = useState(false);

  useEffect(() => {
    if (open) {
      setState(initial);
      setErrors({});
      setDuplicateOverride(false);
    }
  }, [open, initial]);

  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(initial), [state, initial]);

  const similar = useMemo(
    () =>
      state.display_name.trim().length > 0
        ? findSimilarTreadmillInLocation(state.display_name, locationId, treadmill?.id)
        : [],
    [state.display_name, locationId, treadmill?.id],
  );

  function requestClose(next: boolean) {
    if (!next && dirty) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = treadmillFormSchema.safeParse({
      location_id: locationId,
      display_name: state.display_name,
      machine_number: state.machine_number,
      manufacturer: state.manufacturer,
      model: state.model,
      serial_number: state.serial_number,
      visual_description: state.visual_description,
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
      setDuplicateOverride(true); // require explicit second click
      return;
    }
    setErrors({});
    const data = parsed.data;
    const payload = {
      location_id: locationId,
      display_name: data.display_name,
      machine_number: data.machine_number ?? null,
      manufacturer: data.manufacturer ?? null,
      model: data.model ?? null,
      serial_number: data.serial_number ?? null,
      visual_description: data.visual_description ?? null,
      image_url: data.image_url ?? null,
      notes: data.notes ?? null,
    };
    const saved = treadmill
      ? updateTreadmill(treadmill.id, { ...payload, is_favorite: state.is_favorite })
      : createTreadmill({ ...payload, is_favorite: state.is_favorite });
    if (saved) onSaved?.(saved);
    onOpenChange(false);
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
            <SheetTitle>{treadmill ? "עריכת הליכון" : "הליכון חדש"}</SheetTitle>
            <SheetDescription>
              שם התצוגה הוא היחיד החובה. פרטי יצרן, מספר וסידורי — אופציונליים.
            </SheetDescription>
          </SheetHeader>
          <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="tm-name" className="mb-1.5 block text-sm font-bold">
                שם תצוגה *
              </Label>
              <Input
                id="tm-name"
                value={state.display_name}
                onChange={(e) => {
                  setState((s) => ({ ...s, display_name: e.target.value }));
                  setDuplicateOverride(false);
                }}
                required
                maxLength={80}
                placeholder='למשל: "הליכון מספר 3"'
                className="min-h-11 rounded-xl"
              />
              {errors.display_name ? (
                <p className="mt-1 text-xs text-destructive">{errors.display_name}</p>
              ) : null}
            </div>

            {similar.length > 0 ? (
              <div
                className="rounded-xl border border-warning/60 bg-warning-soft/40 p-3 text-sm text-foreground"
                role="alert"
              >
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle aria-hidden className="size-4" />
                  <span className="font-bold">שם דומה נמצא במקום זה</span>
                </div>
                <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                  {similar.map((s) => (
                    <li key={s.id}>{s.display_name}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  {duplicateOverride
                    ? "לחצו שוב על ״שמירה״ כדי להמשיך בכל זאת."
                    : "אפשר להמשיך רק בהחלטה מפורשת."}
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="tm-num" className="mb-1.5 block text-sm font-bold">
                  מספר מכשיר
                </Label>
                <Input
                  id="tm-num"
                  value={state.machine_number}
                  onChange={(e) => setState((s) => ({ ...s, machine_number: e.target.value }))}
                  maxLength={30}
                  className="min-h-11 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="tm-mfr" className="mb-1.5 block text-sm font-bold">
                  יצרן
                </Label>
                <Input
                  id="tm-mfr"
                  value={state.manufacturer}
                  onChange={(e) => setState((s) => ({ ...s, manufacturer: e.target.value }))}
                  maxLength={60}
                  className="min-h-11 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="tm-model" className="mb-1.5 block text-sm font-bold">
                  דגם
                </Label>
                <Input
                  id="tm-model"
                  value={state.model}
                  onChange={(e) => setState((s) => ({ ...s, model: e.target.value }))}
                  maxLength={60}
                  className="min-h-11 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="tm-serial" className="mb-1.5 block text-sm font-bold">
                  מספר סידורי
                </Label>
                <Input
                  id="tm-serial"
                  value={state.serial_number}
                  onChange={(e) => setState((s) => ({ ...s, serial_number: e.target.value }))}
                  maxLength={80}
                  className="min-h-11 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tm-visual" className="mb-1.5 block text-sm font-bold">
                תיאור חזותי
              </Label>
              <Textarea
                id="tm-visual"
                value={state.visual_description}
                onChange={(e) => setState((s) => ({ ...s, visual_description: e.target.value }))}
                maxLength={200}
                rows={2}
                className="min-h-20 rounded-xl"
                placeholder='למשל: "בפינה הימנית ליד החלון"'
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-bold">תמונה</Label>
              <ImagePicker
                value={state.image_url}
                onChange={(url) => setState((s) => ({ ...s, image_url: url }))}
                label="תמונת הליכון"
              />
            </div>

            <div>
              <Label htmlFor="tm-notes" className="mb-1.5 block text-sm font-bold">
                הערות
              </Label>
              <Textarea
                id="tm-notes"
                value={state.notes}
                onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
                maxLength={500}
                rows={2}
                className="min-h-20 rounded-xl"
              />
            </div>

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
              <Button
                type="submit"
                className="min-h-11 rounded-xl bg-primary text-primary-foreground"
              >
                {treadmill ? "שמירה" : "הוספת הליכון"}
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
