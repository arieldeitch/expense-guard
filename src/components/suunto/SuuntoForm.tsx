/**
 * SuuntoForm — Sheet להזנת/עריכת snapshot של Suunto לריצה קיימת.
 * Progressive disclosure: שדות בסיס למעלה, שדות מתקדמים בקבוצות נפתחות,
 * ואפשרות להוסיף מדד מותאם אישית (label + value + unit).
 *
 * שמירה: `upsertSuuntoSnapshot` — החלפה אטומית של ה-rows של source='suunto' לריצה.
 * לעולם לא משכתב את נתוני ההליכון עצמם.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  formatDurationHMS,
  formatPace,
  parseDecimal,
  parseDurationInput,
  parsePaceMSS,
} from "@/lib/runs";
import {
  METRIC_DEFS,
  customSlug,
  isOutOfRange,
  suuntoSnapshotSchema,
  suuntoRepo,
  type CustomMetricInput,
  type DeviceRunSnapshot,
  type SuuntoSnapshotInput,
} from "@/lib/suunto";

interface Props {
  runId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: DeviceRunSnapshot | null;
}

type NumFields = Exclude<
  keyof SuuntoSnapshotInput,
  "device_name" | "device_model" | "notes" | "custom"
>;

function emptyForm(): SuuntoSnapshotInput {
  return {
    device_name: "Suunto",
    device_model: null,
    distance_meters: null,
    duration_seconds: null,
    average_pace_s_per_km: null,
    average_speed_kmh: null,
    max_speed_kmh: null,
    average_heart_rate: null,
    max_heart_rate: null,
    average_cadence_spm: null,
    calories: null,
    training_effect: null,
    peak_training_effect: null,
    epoc_ml_kg: null,
    recovery_time_hours: null,
    ascent_m: null,
    descent_m: null,
    notes: null,
    custom: [],
  };
}

function fromExisting(snap: DeviceRunSnapshot): SuuntoSnapshotInput {
  const base = emptyForm();
  return {
    ...base,
    device_name: snap.device_name ?? "Suunto",
    device_model: snap.device_model,
    distance_meters: snap.distance_meters,
    duration_seconds: snap.duration_seconds,
    average_pace_s_per_km: snap.average_pace_s_per_km,
    average_speed_kmh: snap.average_speed_kmh,
    max_speed_kmh: snap.max_speed_kmh,
    average_heart_rate: snap.average_heart_rate,
    max_heart_rate: snap.max_heart_rate,
    average_cadence_spm: snap.average_cadence_spm,
    calories: snap.calories,
    training_effect: snap.training_effect,
    peak_training_effect: snap.peak_training_effect,
    epoc_ml_kg: snap.epoc_ml_kg,
    recovery_time_hours: snap.recovery_time_hours,
    ascent_m: snap.ascent_m,
    descent_m: snap.descent_m,
    notes: snap.notes,
    custom: snap.custom.map<CustomMetricInput>((c) => ({
      label: c.label,
      value: c.value,
      unit: c.unit,
    })),
  };
}

export function SuuntoForm({ runId, open, onOpenChange, existing }: Props) {
  const [form, setForm] = useState<SuuntoSnapshotInput>(() =>
    existing ? fromExisting(existing) : emptyForm(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [terrainOpen, setTerrainOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(form.custom.length > 0);

  // Text mirrors for pace/duration inputs (m:ss / h:mm:ss).
  const [durationText, setDurationText] = useState(() =>
    form.duration_seconds != null ? formatDurationHMS(form.duration_seconds) : "",
  );
  const [paceText, setPaceText] = useState(() =>
    form.average_pace_s_per_km != null ? formatPace(form.average_pace_s_per_km) : "",
  );

  const setNum = (key: NumFields, value: number | null) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const derived = useMemo(() => {
    // אינו כותב לטופס — רק תצוגה של ערכים שיחושבו אם המשתמש לא הזין ידנית.
    const d = form.distance_meters;
    const t = form.duration_seconds;
    const pace = form.average_pace_s_per_km ?? (d && t ? t / (d / 1000) : null);
    const speed = form.average_speed_kmh ?? (d && t ? d / 1000 / (t / 3600) : null);
    return { pace, speed };
  }, [form.distance_meters, form.duration_seconds, form.average_pace_s_per_km, form.average_speed_kmh]);

  function handleSave() {
    const parsed = suuntoSnapshotSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const p = issue.path.join(".");
        if (!errs[p]) errs[p] = issue.message;
      }
      setErrors(errs);
      toast.error("יש שדות עם ערכים לא סבירים. אפשר לתקן ולשמור שוב.");
      return;
    }
    setErrors({});
    const snap: DeviceRunSnapshot = {
      source_type: "suunto",
      device_name: parsed.data.device_name,
      device_model: parsed.data.device_model,
      entered_at: new Date().toISOString(),
      distance_meters: parsed.data.distance_meters,
      duration_seconds: parsed.data.duration_seconds,
      average_pace_s_per_km: parsed.data.average_pace_s_per_km,
      average_speed_kmh: parsed.data.average_speed_kmh,
      max_speed_kmh: parsed.data.max_speed_kmh,
      average_heart_rate: parsed.data.average_heart_rate,
      max_heart_rate: parsed.data.max_heart_rate,
      average_cadence_spm: parsed.data.average_cadence_spm,
      calories: parsed.data.calories,
      training_effect: parsed.data.training_effect,
      peak_training_effect: parsed.data.peak_training_effect,
      epoc_ml_kg: parsed.data.epoc_ml_kg,
      recovery_time_hours: parsed.data.recovery_time_hours,
      ascent_m: parsed.data.ascent_m,
      descent_m: parsed.data.descent_m,
      notes: parsed.data.notes,
      custom: parsed.data.custom.map((c) => ({
        key: customSlug(c.label),
        label: c.label,
        value: c.value,
        unit: c.unit,
      })),
    };
    suuntoRepo.upsertSuuntoSnapshot(runId, snap, { input_method: "manual", confidence: 1 });
    toast.success(existing ? "נתוני Suunto עודכנו" : "נתוני Suunto נוספו לריצה");
    onOpenChange(false);
  }

  function updateCustom(idx: number, patch: Partial<CustomMetricInput>) {
    setForm((s) => {
      const next = s.custom.slice();
      next[idx] = { ...next[idx], ...patch };
      return { ...s, custom: next };
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" dir="rtl" className="max-h-[92dvh] overflow-y-auto">
        <SheetHeader className="text-start">
          <SheetTitle>{existing ? "עריכת נתוני Suunto" : "הוספת נתוני Suunto"}</SheetTitle>
          <SheetDescription>
            הנתונים נשמרים בנפרד מנתוני ההליכון ולא דורסים אותם. שדה בסיס: מרחק ומשך.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 py-4">
          <Row2>
            <Field label="שם מכשיר" hint="למשל Suunto Race">
              <Input
                value={form.device_name ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, device_name: e.target.value || null }))}
                placeholder="Suunto"
              />
            </Field>
            <Field label="דגם" hint="אופציונלי">
              <Input
                value={form.device_model ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, device_model: e.target.value || null }))}
                placeholder="Race S / 9 Peak..."
              />
            </Field>
          </Row2>

          <SectionTitle>מדדים בסיסיים</SectionTitle>
          <Row2>
            <Field
              label="מרחק"
              hint='ק"מ (למשל 5.32)'
              error={errors.distance_meters}
              outlier={isOutOfRange("distance_meters", form.distance_meters)}
            >
              <Input
                inputMode="decimal"
                value={form.distance_meters == null ? "" : (form.distance_meters / 1000).toString()}
                onChange={(e) => {
                  const km = parseDecimal(e.target.value);
                  setNum("distance_meters", km == null ? null : km * 1000);
                }}
                placeholder='ק"מ'
              />
            </Field>
            <Field
              label="משך"
              hint="mm:ss או hh:mm:ss"
              error={errors.duration_seconds}
              outlier={isOutOfRange("duration_seconds", form.duration_seconds)}
            >
              <Input
                inputMode="numeric"
                value={durationText}
                onChange={(e) => {
                  const t = e.target.value;
                  setDurationText(t);
                  const secs = parseDurationInput(t);
                  setNum("duration_seconds", secs);
                }}
                placeholder="30:00"
              />
            </Field>
          </Row2>

          <Row2>
            <Field
              label="קצב ממוצע"
              hint={derived.pace && !form.average_pace_s_per_km ? `יחושב: ${formatPace(derived.pace)}` : "m:ss"}
              error={errors.average_pace_s_per_km}
              outlier={isOutOfRange("average_pace_s_per_km", form.average_pace_s_per_km)}
            >
              <Input
                inputMode="numeric"
                value={paceText}
                onChange={(e) => {
                  const t = e.target.value;
                  setPaceText(t);
                  setNum("average_pace_s_per_km", parsePaceMSS(t));
                }}
                placeholder="5:30"
              />
            </Field>
            <Field
              label="מהירות ממוצעת"
              hint={
                derived.speed && !form.average_speed_kmh
                  ? `יחושב: ${derived.speed.toFixed(1)} קמ"ש`
                  : 'קמ"ש'
              }
              error={errors.average_speed_kmh}
              outlier={isOutOfRange("average_speed_kmh", form.average_speed_kmh)}
            >
              <Input
                inputMode="decimal"
                value={form.average_speed_kmh ?? ""}
                onChange={(e) => setNum("average_speed_kmh", parseDecimal(e.target.value))}
                placeholder="11.0"
              />
            </Field>
          </Row2>

          <Row3>
            <Field label="דופק ממוצע" error={errors.average_heart_rate}>
              <Input
                inputMode="numeric"
                value={form.average_heart_rate ?? ""}
                onChange={(e) => setNum("average_heart_rate", parseDecimal(e.target.value))}
                placeholder="bpm"
              />
            </Field>
            <Field label="דופק מרבי" error={errors.max_heart_rate}>
              <Input
                inputMode="numeric"
                value={form.max_heart_rate ?? ""}
                onChange={(e) => setNum("max_heart_rate", parseDecimal(e.target.value))}
                placeholder="bpm"
              />
            </Field>
            <Field label="Cadence" error={errors.average_cadence_spm}>
              <Input
                inputMode="numeric"
                value={form.average_cadence_spm ?? ""}
                onChange={(e) => setNum("average_cadence_spm", parseDecimal(e.target.value))}
                placeholder="spm"
              />
            </Field>
          </Row3>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between rounded-xl border border-border-strong bg-tint px-3 min-h-11 font-bold"
              >
                מדדי עומס ואימון
                <span className="text-xs text-muted-foreground">{advancedOpen ? "סגור" : "הרחב"}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <Row2>
                <Field label="קלוריות">
                  <Input
                    inputMode="numeric"
                    value={form.calories ?? ""}
                    onChange={(e) => setNum("calories", parseDecimal(e.target.value))}
                  />
                </Field>
                <Field label="מהירות מרבית" hint='קמ"ש'>
                  <Input
                    inputMode="decimal"
                    value={form.max_speed_kmh ?? ""}
                    onChange={(e) => setNum("max_speed_kmh", parseDecimal(e.target.value))}
                  />
                </Field>
              </Row2>
              <Row2>
                <Field label="Training Effect" hint="0..5">
                  <Input
                    inputMode="decimal"
                    value={form.training_effect ?? ""}
                    onChange={(e) => setNum("training_effect", parseDecimal(e.target.value))}
                  />
                </Field>
                <Field label="Peak TE" hint="0..5">
                  <Input
                    inputMode="decimal"
                    value={form.peak_training_effect ?? ""}
                    onChange={(e) => setNum("peak_training_effect", parseDecimal(e.target.value))}
                  />
                </Field>
              </Row2>
              <Row2>
                <Field label="EPOC" hint="ml/kg">
                  <Input
                    inputMode="decimal"
                    value={form.epoc_ml_kg ?? ""}
                    onChange={(e) => setNum("epoc_ml_kg", parseDecimal(e.target.value))}
                  />
                </Field>
                <Field label="זמן התאוששות" hint="שעות">
                  <Input
                    inputMode="decimal"
                    value={form.recovery_time_hours ?? ""}
                    onChange={(e) => setNum("recovery_time_hours", parseDecimal(e.target.value))}
                  />
                </Field>
              </Row2>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={terrainOpen} onOpenChange={setTerrainOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between rounded-xl border border-border-strong bg-tint px-3 min-h-11 font-bold"
              >
                שטח ורום
                <span className="text-xs text-muted-foreground">{terrainOpen ? "סגור" : "הרחב"}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <Row2>
                <Field label="עלייה" hint="מ'">
                  <Input
                    inputMode="numeric"
                    value={form.ascent_m ?? ""}
                    onChange={(e) => setNum("ascent_m", parseDecimal(e.target.value))}
                  />
                </Field>
                <Field label="ירידה" hint="מ'">
                  <Input
                    inputMode="numeric"
                    value={form.descent_m ?? ""}
                    onChange={(e) => setNum("descent_m", parseDecimal(e.target.value))}
                  />
                </Field>
              </Row2>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={customOpen} onOpenChange={setCustomOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between rounded-xl border border-border-strong bg-tint px-3 min-h-11 font-bold"
              >
                מדדים מותאמים אישית
                <span className="text-xs text-muted-foreground">{form.custom.length}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              {form.custom.map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
                  <Input
                    value={c.label}
                    onChange={(e) => updateCustom(i, { label: e.target.value })}
                    placeholder="שם המדד"
                  />
                  <Input
                    value={c.value as string | number}
                    onChange={(e) => {
                      const asNum = Number(e.target.value.replace(",", "."));
                      updateCustom(i, {
                        value: Number.isFinite(asNum) && e.target.value !== "" ? asNum : e.target.value,
                      });
                    }}
                    placeholder="ערך"
                  />
                  <Input
                    className="w-16"
                    value={c.unit ?? ""}
                    onChange={(e) => updateCustom(i, { unit: e.target.value || null })}
                    placeholder="יח'"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label="הסרת מדד"
                    onClick={() =>
                      setForm((s) => ({ ...s, custom: s.custom.filter((_, idx) => idx !== i) }))
                    }
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 rounded-xl border border-border-strong bg-surface"
                onClick={() =>
                  setForm((s) => ({
                    ...s,
                    custom: [...s.custom, { label: "", value: "", unit: null }],
                  }))
                }
              >
                <Plus aria-hidden className="size-4 me-1" />
                הוספת מדד
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Field label="הערות">
            <Textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value || null }))}
              placeholder="הערות מהשעון או תיאור תחושה"
            />
          </Field>

          {Object.keys(errors).length > 0 ? (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="size-4" aria-hidden />
                שדות דורשים תיקון
              </div>
              <ul className="mt-1 list-disc ps-5">
                {Object.entries(errors).map(([k, v]) => (
                  <li key={k}>
                    {METRIC_DEFS.find((m) => m.key === k)?.label ?? k}: {v}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <SheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            {existing ? "עדכון" : "שמירה"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// --- Layout helpers ---

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
function Row3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-3">{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</div>;
}
function Field({
  label,
  hint,
  error,
  outlier,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  outlier?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      <div className={cn(outlier && !error && "rounded-lg ring-1 ring-warning/60")}>{children}</div>
      {error ? (
        <div className="text-[11px] text-destructive">{error}</div>
      ) : hint ? (
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      ) : outlier ? (
        <div className="text-[11px] text-warning">ערך חריג מהטווח הצפוי — אפשר לשמור בכל זאת.</div>
      ) : null}
    </div>
  );
}
