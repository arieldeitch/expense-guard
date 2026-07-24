/**
 * TemplateSummary — סיכום עובדתי של תבנית: משך משוער, עומס שרירים, בדיקת ציוד.
 * הכל תצוגה — ללא שיפוט "טוב/רע".
 */
import { AlertTriangle, Clock, Layers, MapPin } from "lucide-react";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import {
  checkTemplateEquipment,
  estimateTemplateDuration,
  summarizeTemplateMuscleLoad,
} from "@/lib/templates";
import { useMuscleGroups, useExercise } from "@/lib/exercises";
import { useLocation } from "@/lib/catalog";

interface Props {
  templateId: string;
}

export function TemplateSummary({ templateId }: Props) {
  const duration = estimateTemplateDuration(templateId);
  const load = summarizeTemplateMuscleLoad(templateId);
  const equipment = checkTemplateEquipment(templateId);
  const muscles = useMuscleGroups();
  const mgById = new Map(muscles.map((m) => [m.id, m]));

  const warnings = buildWarnings({ duration, load, equipment });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Tile size="sm">
        <TileLabel>
          <Clock aria-hidden className="me-1 inline size-3.5" />
          משך משוער
        </TileLabel>
        <div className="ltr-nums text-lg font-black">
          {duration.seconds > 0 ? `${duration.minMinutes}–${duration.maxMinutes} דקות` : "—"}
        </div>
        <TileFootnote>הערכה מבוססת סטים, סבבים ומנוחות. יכולה להשתנות בפועל.</TileFootnote>
      </Tile>

      <Tile size="sm">
        <TileLabel>
          <Layers aria-hidden className="me-1 inline size-3.5" />
          עומס לפי קבוצה
        </TileLabel>
        <div className="flex flex-wrap gap-1">
          {load.primary.slice(0, 4).map((p) => (
            <Chip key={p.muscle_group_id} tone="info">
              {mgById.get(p.muscle_group_id)?.name_he ?? "—"} · {p.sets}
            </Chip>
          ))}
          {load.primary.length === 0 ? <TileFootnote>אין תרגילים לחישוב</TileFootnote> : null}
        </div>
        <TileFootnote>
          עליון: {load.upperCount} · תחתון: {load.lowerCount} · דחיפה: {load.pushCount} · משיכה:{" "}
          {load.pullCount}
        </TileFootnote>
      </Tile>

      <Tile size="sm">
        <TileLabel>
          <MapPin aria-hidden className="me-1 inline size-3.5" />
          זמינות ציוד
        </TileLabel>
        {equipment.unknown ? (
          <>
            <div className="text-sm font-bold">לא נבחר מקום</div>
            <TileFootnote>בחר מקום כדי לבדוק זמינות ציוד</TileFootnote>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-1">
              <Chip tone="success">זמינים {equipment.availableExercises}</Chip>
              {equipment.partialExercises > 0 ? (
                <Chip tone="warning">חלקי {equipment.partialExercises}</Chip>
              ) : null}
              {equipment.unavailableExercises > 0 ? (
                <Chip tone="destructive">חסרים {equipment.unavailableExercises}</Chip>
              ) : null}
            </div>
            <TileFootnote>סה"כ {equipment.totalExercises} תרגילים במיקום שנבחר</TileFootnote>
          </>
        )}
      </Tile>

      {warnings.length > 0 ? (
        <div className="sm:col-span-3">
          <Tile size="sm" variant="warning" tone="soft">
            <TileLabel>
              <AlertTriangle aria-hidden className="me-1 inline size-3.5" />
              נקודות לתשומת לב (עובדתיות בלבד)
            </TileLabel>
            <ul className="ms-4 list-disc space-y-1 text-sm">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </Tile>
        </div>
      ) : null}
    </div>
  );
}

function buildWarnings(args: {
  duration: ReturnType<typeof estimateTemplateDuration>;
  load: ReturnType<typeof summarizeTemplateMuscleLoad>;
  equipment: ReturnType<typeof checkTemplateEquipment>;
}): string[] {
  const w: string[] = [];
  const { load, equipment, duration } = args;

  if (equipment.unavailableExercises > 0) {
    w.push(`${equipment.unavailableExercises} תרגילים דורשים ציוד שאינו זמין במקום הנוכחי.`);
  }
  if (load.totalExercises >= 3) {
    const top = load.primary[0];
    if (top && top.exercises === load.totalExercises) {
      w.push("כל התרגילים עובדים בעיקר על אותה קבוצת שריר.");
    }
  }
  if (duration.maxMinutes > 90) {
    w.push(`זמן האימון המשוער (${duration.maxMinutes} דקות) גבוה מ־90 דקות.`);
  }
  return w;
}

/** אריח קטן להצגת שם תרגיל חסר ציוד — לשימוש עתידי בתוך /edit או /$id. */
export function EquipmentGapRow({
  exerciseId,
  missing,
}: {
  exerciseId: string;
  missing: string[];
}) {
  const ex = useExercise(exerciseId);
  const location = useLocation(undefined);
  void location;
  if (!ex) return null;
  return (
    <div className="rounded-lg border border-warning/40 bg-warning-soft/40 p-2 text-xs">
      <div className="font-bold">{ex.name_he}</div>
      <div className="text-muted-foreground">חסר: {missing.join(", ")}</div>
    </div>
  );
}
