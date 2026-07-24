/**
 * RunForm — טופס יצירה/עריכה של ריצה (הליכון או חוץ).
 * Progressive disclosure: שדות בסיס בראש, נוספים בהמשך, מקטעים אופציונליים.
 * Autosave: כל שינוי → updateRun (למצב draft).
 * חישובים: mirror של הערכים הידניים; ערך שהמשתמש הזין גובר.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertCircle, Save, CheckCircle2, Copy as CopyIcon } from "lucide-react";
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
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { CountryPicker } from "@/components/catalog/CountryPicker";
import { SegmentsEditor } from "./SegmentsEditor";
import {
  RUN_TYPE_LABELS,
  detectOutliers,
  runFormSchema,
  formatDurationHMS,
  parseDurationInput,
  parseDecimal,
  parsePaceMSS,
  formatPace,
  runsRepo,
} from "@/lib/runs";
import type { RunNumericField, RunSegment, RunSession, RunType } from "@/lib/runs";
import { useAllLocations, useTreadmillsInLocation } from "@/lib/catalog";
import { useActiveRoutes } from "@/lib/runs";

interface Props {
  runType: RunType;
  existing?: RunSession | null;
  /** אם ניתן initial — הטופס פותח בערכים אלו אך יוצר run חדש (שכפול). */
  initial?: Partial<RunSession> | null;
}

type FormState = {
  started_at: string;
  duration_seconds: number | null;
  distance_meters: number | null;
  average_pace_s_per_km: number | null;
  average_speed_kmh: number | null;
  max_speed_kmh: number | null;
  average_incline_pct: number | null;
  max_incline_pct: number | null;
  calories: number | null;
  average_heart_rate: number | null;
  max_heart_rate: number | null;
  average_cadence_spm: number | null;
  elevation_gain_m: number | null;
  elevation_loss_m: number | null;
  perceived_effort: number | null;
  location_id: string | null;
  treadmill_id: string | null;
  route_id: string | null;
  country_code: string | null;
  city_or_area: string;
  free_text_location: string;
  notes: string;
  segments: RunSegment[];
  provenance: Record<string, "manual" | "device" | "derived" | "suunto" | "imported">;
};

function toLocalDateTimeInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromExisting(r: RunSession | null | undefined, defaults?: Partial<RunSession>): FormState {
  const base = r ?? defaults ?? {};
  return {
    started_at: toLocalDateTimeInput(r?.started_at ?? new Date().toISOString()),
    duration_seconds: base.duration_seconds ?? null,
    distance_meters: base.distance_meters ?? null,
    average_pace_s_per_km: base.average_pace_s_per_km ?? null,
    average_speed_kmh: base.average_speed_kmh ?? null,
    max_speed_kmh: base.max_speed_kmh ?? null,
    average_incline_pct: base.average_incline_pct ?? null,
    max_incline_pct: base.max_incline_pct ?? null,
    calories: base.calories ?? null,
    average_heart_rate: base.average_heart_rate ?? null,
    max_heart_rate: base.max_heart_rate ?? null,
    average_cadence_spm: base.average_cadence_spm ?? null,
    elevation_gain_m: base.elevation_gain_m ?? null,
    elevation_loss_m: base.elevation_loss_m ?? null,
    perceived_effort: base.perceived_effort ?? null,
    location_id: base.location_id ?? null,
    treadmill_id: base.treadmill_id ?? null,
    route_id: base.route_id ?? null,
    country_code: base.country_code ?? null,
    city_or_area: base.city_or_area ?? "",
    free_text_location: base.free_text_location ?? "",
    notes: base.notes ?? "",
    segments: base.segments ?? [],
    provenance: (base.provenance as FormState["provenance"]) ?? {},
  };
}

export function RunForm({ runType, existing, initial }: Props) {
  const navigate = useNavigate();
  const locations = useAllLocations().filter((l) => l.deleted_at == null && l.is_active);
  const lastUsed = runsRepo.getLastUsed();
  const routes = useActiveRoutes();

  const startingState = useMemo(
    () =>
      fromExisting(
        existing ?? undefined,
        initial ?? {
          location_id: lastUsed.location_id,
          treadmill_id: lastUsed.treadmill_id,
          route_id: lastUsed.route_id,
          country_code: lastUsed.country_code,
          city_or_area: lastUsed.city_or_area ?? undefined,
        },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [existing?.id],
  );
  const [state, setState] = useState<FormState>(startingState);
  const treadmills = useTreadmillsInLocation(state.location_id ?? "").filter(
    (t) => t.deleted_at == null && t.is_active,
  );

  // Manage the underlying draft record.
  const runIdRef = useRef<string | null>(existing?.id ?? null);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSegments, setShowSegments] = useState((existing?.segments?.length ?? 0) > 0);

  // Ensure a draft exists on first mount (only for new).
  useEffect(() => {
    if (runIdRef.current) return;
    const draft = runsRepo.createRun({
      run_type: runType,
      status: "draft",
      started_at: new Date(state.started_at).toISOString(),
      ended_at: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      duration_seconds: state.duration_seconds,
      distance_meters: state.distance_meters,
      average_speed_kmh: state.average_speed_kmh,
      max_speed_kmh: state.max_speed_kmh,
      average_pace_s_per_km: state.average_pace_s_per_km,
      average_incline_pct: state.average_incline_pct,
      max_incline_pct: state.max_incline_pct,
      calories: state.calories,
      average_heart_rate: state.average_heart_rate,
      max_heart_rate: state.max_heart_rate,
      average_cadence_spm: state.average_cadence_spm,
      elevation_gain_m: state.elevation_gain_m,
      elevation_loss_m: state.elevation_loss_m,
      location_id: state.location_id,
      treadmill_id: state.treadmill_id,
      route_id: state.route_id,
      country_code: state.country_code,
      city_or_area: state.city_or_area || null,
      free_text_location: state.free_text_location || null,
      perceived_effort: state.perceived_effort,
      notes: state.notes || null,
      segments: state.segments,
      provenance: state.provenance,
      outlier_overrides: [],
      data_completeness: 0,
      primary_source: "manual",
    });
    runIdRef.current = draft.id;
    // replace URL so refresh continues the same draft
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", `/running/${draft.id}/edit`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!runIdRef.current) return;
    setSavingStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      runsRepo.updateRun(runIdRef.current!, {
        started_at: new Date(state.started_at).toISOString(),
        duration_seconds: state.duration_seconds,
        distance_meters: state.distance_meters,
        average_speed_kmh: state.average_speed_kmh,
        max_speed_kmh: state.max_speed_kmh,
        average_pace_s_per_km: state.average_pace_s_per_km,
        average_incline_pct: state.average_incline_pct,
        max_incline_pct: state.max_incline_pct,
        calories: state.calories,
        average_heart_rate: state.average_heart_rate,
        max_heart_rate: state.max_heart_rate,
        average_cadence_spm: state.average_cadence_spm,
        elevation_gain_m: state.elevation_gain_m,
        elevation_loss_m: state.elevation_loss_m,
        location_id: state.location_id,
        treadmill_id: state.treadmill_id,
        route_id: state.route_id,
        country_code: state.country_code,
        city_or_area: state.city_or_area || null,
        free_text_location: state.free_text_location || null,
        perceived_effort: state.perceived_effort,
        notes: state.notes || null,
        segments: state.segments,
        provenance: state.provenance,
      });
      setSavingStatus("saved");
    }, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state]);

  const setField = useCallback(
    <K extends keyof FormState>(
      k: K,
      v: FormState[K],
      source: FormState["provenance"][string] = "manual",
    ) => {
      setState((prev) => {
        const provenance = { ...prev.provenance };
        if (typeof v === "number" || v === null) provenance[k as string] = source;
        return { ...prev, [k]: v, provenance };
      });
    },
    [],
  );

  // Live derived helpers for display.
  const derivedPace = useMemo(() => {
    if (state.average_pace_s_per_km != null) return state.average_pace_s_per_km;
    if (state.duration_seconds && state.distance_meters) {
      return state.duration_seconds / (state.distance_meters / 1000);
    }
    return null;
  }, [state.average_pace_s_per_km, state.duration_seconds, state.distance_meters]);

  const outliers = useMemo(
    () =>
      detectOutliers({
        duration_seconds: state.duration_seconds,
        distance_meters: state.distance_meters,
        average_speed_kmh: state.average_speed_kmh,
        max_speed_kmh: state.max_speed_kmh,
        average_pace_s_per_km: state.average_pace_s_per_km,
        average_incline_pct: state.average_incline_pct,
        max_incline_pct: state.max_incline_pct,
        calories: state.calories,
        average_heart_rate: state.average_heart_rate,
        max_heart_rate: state.max_heart_rate,
        average_cadence_spm: state.average_cadence_spm,
        elevation_gain_m: state.elevation_gain_m,
        elevation_loss_m: state.elevation_loss_m,
        perceived_effort: state.perceived_effort,
      }),
    [state],
  );

  async function saveAndComplete() {
    if (!runIdRef.current) return;
    const parsed = runFormSchema.safeParse({ ...state, run_type: runType, status: "completed" });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "טופס לא תקין");
      return;
    }
    runsRepo.updateRun(runIdRef.current, {
      status: "completed",
      ended_at: state.duration_seconds
        ? new Date(
            new Date(state.started_at).getTime() + state.duration_seconds * 1000,
          ).toISOString()
        : new Date().toISOString(),
      outlier_overrides: outliers.filter(
        (o: string) => o !== "perceived_effort",
      ) as RunNumericField[],
    });
    toast.success("הריצה נשמרה");
    navigate({ to: "/running/$id", params: { id: runIdRef.current } });
  }

  async function discardDraft() {
    if (!runIdRef.current) return;
    if (!window.confirm("למחוק את הטיוטה? הפעולה ניתנת לשחזור מסל המחזור.")) return;
    runsRepo.softDeleteRun(runIdRef.current);
    toast.info("הטיוטה הועברה לסל המחזור");
    navigate({ to: "/running" });
  }

  function duplicateAsNew() {
    if (!runIdRef.current) return;
    const dup = runsRepo.duplicateRun(runIdRef.current);
    if (dup) {
      toast.success("נוצרה טיוטה משוכפלת");
      navigate({ to: "/running/$id/edit", params: { id: dup.id } });
    }
  }

  const useLastLocation = () => setField("location_id", lastUsed.location_id);
  const useLastTreadmill = () => setField("treadmill_id", lastUsed.treadmill_id);

  return (
    <div className="space-y-4 px-4 sm:px-6" dir="rtl">
      <Tile variant="run" tone="soft" size="sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <TileLabel>סוג ריצה</TileLabel>
            <div className="text-lg font-black">{RUN_TYPE_LABELS[runType]}</div>
          </div>
          <SaveIndicator status={savingStatus} />
        </div>
      </Tile>

      <Tile size="md" className="gap-3">
        <SectionTitle>מדדי ליבה</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="תאריך ושעה">
            <Input
              type="datetime-local"
              value={state.started_at}
              onChange={(e) => setField("started_at", e.target.value)}
            />
          </Field>
          <Field label="משך (mm:ss / hh:mm:ss)">
            <Input
              inputMode="numeric"
              placeholder="0:00"
              defaultValue={
                state.duration_seconds != null ? formatDurationHMS(state.duration_seconds) : ""
              }
              onBlur={(e) => setField("duration_seconds", parseDurationInput(e.target.value))}
            />
          </Field>
          <Field label='מרחק (ק"מ)'>
            <Input
              inputMode="decimal"
              placeholder="0.0"
              defaultValue={
                state.distance_meters != null ? (state.distance_meters / 1000).toString() : ""
              }
              onBlur={(e) => {
                const v = parseDecimal(e.target.value);
                setField("distance_meters", v == null ? null : v * 1000);
              }}
            />
          </Field>
          <Field label='קצב ממוצע (mm:ss /ק"מ)'>
            <Input
              inputMode="numeric"
              placeholder="0:00"
              defaultValue={
                state.average_pace_s_per_km != null ? formatPace(state.average_pace_s_per_km) : ""
              }
              onBlur={(e) => setField("average_pace_s_per_km", parsePaceMSS(e.target.value))}
            />
          </Field>
          <Field label='מהירות ממוצעת (קמ"ש)'>
            <Input
              inputMode="decimal"
              placeholder={derivedPace ? (3600 / derivedPace).toFixed(1) : "—"}
              defaultValue={state.average_speed_kmh?.toString() ?? ""}
              onBlur={(e) => setField("average_speed_kmh", parseDecimal(e.target.value))}
            />
          </Field>
          {runType === "treadmill" ? (
            <>
              <Field label='מהירות מרבית (קמ"ש)'>
                <Input
                  inputMode="decimal"
                  placeholder="—"
                  defaultValue={state.max_speed_kmh?.toString() ?? ""}
                  onBlur={(e) => setField("max_speed_kmh", parseDecimal(e.target.value))}
                />
              </Field>
              <Field label="שיפוע ממוצע %">
                <Input
                  inputMode="decimal"
                  placeholder="—"
                  defaultValue={state.average_incline_pct?.toString() ?? ""}
                  onBlur={(e) => setField("average_incline_pct", parseDecimal(e.target.value))}
                />
              </Field>
              <Field label="שיפוע מרבי %">
                <Input
                  inputMode="decimal"
                  placeholder="—"
                  defaultValue={state.max_incline_pct?.toString() ?? ""}
                  onBlur={(e) => setField("max_incline_pct", parseDecimal(e.target.value))}
                />
              </Field>
            </>
          ) : null}
        </div>
        {derivedPace != null && state.average_pace_s_per_km == null ? (
          <TileFootnote>קצב מחושב: {formatPace(derivedPace)} /ק"מ (מבוסס משך+מרחק)</TileFootnote>
        ) : null}
        {outliers.length > 0 ? (
          <TileFootnote className="flex items-center gap-1 text-warning">
            <AlertCircle className="size-3" />
            שדות חורגים מטווח סביר: {outliers.length}. ניתן לשמור בכל זאת.
          </TileFootnote>
        ) : null}
      </Tile>

      <Tile size="md" className="gap-3">
        <SectionTitle>מיקום</SectionTitle>
        <div className="grid grid-cols-1 gap-3">
          <Field label="מקום">
            <div className="flex gap-2">
              <Select
                value={state.location_id ?? "__none"}
                onValueChange={(v) => {
                  setField("location_id", v === "__none" ? null : v);
                  setField("treadmill_id", null);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="בחר מקום" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— ללא מקום —</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lastUsed.location_id && lastUsed.location_id !== state.location_id ? (
                <Button type="button" variant="outline" size="sm" onClick={useLastLocation}>
                  אותו כמו קודם
                </Button>
              ) : null}
            </div>
          </Field>
          {runType === "treadmill" && state.location_id ? (
            <Field label="הליכון">
              <div className="flex gap-2">
                <Select
                  value={state.treadmill_id ?? "__none"}
                  onValueChange={(v) => setField("treadmill_id", v === "__none" ? null : v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="בחר הליכון" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— ללא —</SelectItem>
                    {treadmills.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lastUsed.treadmill_id && treadmills.find((t) => t.id === lastUsed.treadmill_id) ? (
                  <Button type="button" variant="outline" size="sm" onClick={useLastTreadmill}>
                    אותו כמו קודם
                  </Button>
                ) : null}
              </div>
            </Field>
          ) : null}
          {runType === "outdoor" ? (
            <>
              <Field label="מסלול קבוע">
                <Select
                  value={state.route_id ?? "__none"}
                  onValueChange={(v) => setField("route_id", v === "__none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ללא מסלול" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— ללא מסלול —</SelectItem>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="מדינה">
                <CountryPicker
                  value={state.country_code}
                  onChange={(c) => setField("country_code", c)}
                />
              </Field>
              <Field label="עיר / אזור">
                <Input
                  placeholder="למשל: כפר סבא, פארק הירקון"
                  defaultValue={state.city_or_area}
                  onBlur={(e) => setField("city_or_area", e.target.value)}
                />
              </Field>
              <Field label="מקום חופשי (אם אין מסלול)">
                <Input
                  placeholder="למשל: 'המרובע', סמטה מאחורי הבית"
                  defaultValue={state.free_text_location}
                  onBlur={(e) => setField("free_text_location", e.target.value)}
                />
              </Field>
            </>
          ) : null}
        </div>
      </Tile>

      <div className="flex items-center justify-between">
        <div className="text-sm font-bold">מדדים מתקדמים</div>
        <Switch
          checked={showAdvanced}
          onCheckedChange={setShowAdvanced}
          aria-label="הראה מדדים מתקדמים"
        />
      </div>
      {showAdvanced ? (
        <Tile size="md" className="gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="דופק ממוצע">
              <Input
                inputMode="numeric"
                placeholder="—"
                defaultValue={state.average_heart_rate?.toString() ?? ""}
                onBlur={(e) => setField("average_heart_rate", parseDecimal(e.target.value))}
              />
            </Field>
            <Field label="דופק מרבי">
              <Input
                inputMode="numeric"
                placeholder="—"
                defaultValue={state.max_heart_rate?.toString() ?? ""}
                onBlur={(e) => setField("max_heart_rate", parseDecimal(e.target.value))}
              />
            </Field>
            <Field label="Cadence (spm)">
              <Input
                inputMode="numeric"
                placeholder="—"
                defaultValue={state.average_cadence_spm?.toString() ?? ""}
                onBlur={(e) => setField("average_cadence_spm", parseDecimal(e.target.value))}
              />
            </Field>
            <Field label="קלוריות">
              <Input
                inputMode="numeric"
                placeholder="—"
                defaultValue={state.calories?.toString() ?? ""}
                onBlur={(e) => setField("calories", parseDecimal(e.target.value))}
              />
            </Field>
            {runType === "outdoor" ? (
              <>
                <Field label="עלייה (מ')">
                  <Input
                    inputMode="numeric"
                    placeholder="—"
                    defaultValue={state.elevation_gain_m?.toString() ?? ""}
                    onBlur={(e) => setField("elevation_gain_m", parseDecimal(e.target.value))}
                  />
                </Field>
                <Field label="ירידה (מ')">
                  <Input
                    inputMode="numeric"
                    placeholder="—"
                    defaultValue={state.elevation_loss_m?.toString() ?? ""}
                    onBlur={(e) => setField("elevation_loss_m", parseDecimal(e.target.value))}
                  />
                </Field>
              </>
            ) : null}
            <Field label="תחושת קושי (1-10)">
              <Input
                inputMode="numeric"
                placeholder="—"
                defaultValue={state.perceived_effort?.toString() ?? ""}
                onBlur={(e) => setField("perceived_effort", parseDecimal(e.target.value))}
              />
            </Field>
          </div>
        </Tile>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="text-sm font-bold">מקטעים</div>
        <Switch checked={showSegments} onCheckedChange={setShowSegments} aria-label="הראה מקטעים" />
      </div>
      {showSegments ? (
        <Tile size="md">
          <SegmentsEditor
            segments={state.segments}
            onChange={(segs) => setState((p) => ({ ...p, segments: segs }))}
            totals={{
              duration_seconds: state.duration_seconds,
              distance_meters: state.distance_meters,
            }}
          />
        </Tile>
      ) : null}

      <Tile size="md">
        <Field label="הערות">
          <Textarea
            rows={3}
            defaultValue={state.notes}
            placeholder="תחושה, מזג אוויר, פציעה קלה..."
            onBlur={(e) => setField("notes", e.target.value)}
          />
        </Field>
      </Tile>

      <div className="sticky bottom-20 z-20 flex gap-2 rounded-2xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur lg:bottom-4">
        <Button type="button" className="flex-1" onClick={saveAndComplete}>
          <Save className="me-1 size-4" />
          שמור וסיים
        </Button>
        <Button type="button" variant="outline" onClick={duplicateAsNew} aria-label="שכפל">
          <CopyIcon className="size-4" />
        </Button>
        <Button type="button" variant="ghost" onClick={discardDraft} className="text-destructive">
          מחק
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}
function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "saving") return <span className="text-xs text-muted-foreground">שומר…</span>;
  if (status === "saved")
    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <CheckCircle2 className="size-3" />
        נשמר
      </span>
    );
  return null;
}
