/**
 * /templates/$id/edit — עורך תבנית מרכזי.
 * שדות מוצר: שם, מקום, מנוחה ברירת מחדל. בלוקים ותרגילים. סיכום עובדתי.
 * כל שינוי → שמירה מיידית ל־storage (autosave מובנה).
 */
import { useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useHydrated } from "@/lib/storage/useHydrated";
import { CheckCircle2, History, Plus, Save } from "lucide-react";
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
import { Tile } from "@/components/tile/Tile";
import { Chip } from "@/components/catalog/shared";
import { TemplateBlockCard } from "@/components/templates/TemplateBlockCard";
import { ExercisePickerSheet } from "@/components/templates/ExercisePickerSheet";
import { TemplateSummary } from "@/components/templates/TemplateSummary";
import { useAllLocations } from "@/lib/catalog";
import {
  activateTemplate,
  addExerciseToBlock,
  BLOCK_TYPE_LABELS,
  createBlock,
  createSupersetFromExercises,
  saveVersion,
  updateTemplate,
  useTemplate,
  useTemplateBlocks,
  type BlockType,
} from "@/lib/templates";

export const Route = createFileRoute("/templates/$id/edit")({
  head: () => ({
    meta: [
      { title: "עריכת תבנית · Fit Log" },
      { name: "description", content: "עריכת מבנה תבנית: תרגילים, סופרסטים, סטים ומנוחות." },
      { property: "og:title", content: "עריכת תבנית · Fit Log" },
      { property: "og:description", content: "עריכת תבנית אימון כוח." },
    ],
  }),
  component: EditTemplatePage,
});

function EditTemplatePage() {
  const { id } = Route.useParams();
  const template = useTemplate(id);
  const blocks = useTemplateBlocks(id);
  const locations = useAllLocations().filter((l) => !l.deleted_at);
  const navigate = useNavigate();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetBlockId, setPickerTargetBlockId] = useState<string | null>(null);

  const hydrated = useHydrated();
  // ראה ADR-0039 — אין לזרוק notFound() ב-render של השרת (אין שם localStorage).
  if (!hydrated) return null;
  if (!template) throw notFound();

  function openPicker(blockId: string | null) {
    setPickerTargetBlockId(blockId);
    setPickerOpen(true);
  }

  function addBlock(type: BlockType) {
    createBlock(template!.id, { block_type: type });
  }

  function handleSelectFromPicker(exerciseIds: string[], asSuperset: boolean) {
    if (!template) return;
    // Add to existing block
    if (pickerTargetBlockId) {
      exerciseIds.forEach((exId) => addExerciseToBlock(pickerTargetBlockId, { exercise_id: exId }));
      return;
    }
    // No target block — create block(s)
    if (asSuperset && exerciseIds.length >= 2) {
      const block = createBlock(template.id, { block_type: "superset" });
      exerciseIds.forEach((exId) => addExerciseToBlock(block.id, { exercise_id: exId }));
    } else {
      exerciseIds.forEach((exId) => {
        const block = createBlock(template.id, { block_type: "single" });
        addExerciseToBlock(block.id, { exercise_id: exId });
      });
    }
  }

  const canActivate = template.status !== "active" && blocks.length > 0;

  return (
    <AppShell
      topBar={{
        title: "עריכת תבנית",
        back: { to: `/templates/${template.id}` },
        action: (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success-soft/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success"
            aria-label="נשמר"
          >
            <CheckCircle2 aria-hidden className="size-3" />
            שמור
          </span>
        ),
      }}
    >
      <PageHeader
        eyebrow="תבנית"
        title={template.name || "ללא שם"}
        description="כל שינוי נשמר אוטומטית. שמור גרסה כדי לתעד שינוי משמעותי."
      />

      {/* מטא־דאטה */}
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6">
        <Tile>
          <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">
            שם התבנית
            <Input
              value={template.name}
              onChange={(e) => updateTemplate(template.id, { name: e.target.value })}
              className="min-h-11 rounded-xl border-border-strong text-base font-bold text-foreground"
              placeholder="למשל: Push A / רגליים כבדות"
            />
          </label>
        </Tile>
        <Tile>
          <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">
            מקום אימון
            <Select
              value={template.location_id ?? ""}
              onValueChange={(v) => updateTemplate(template.id, { location_id: v || null })}
            >
              <SelectTrigger className="min-h-11 rounded-xl border-border-strong">
                <SelectValue placeholder="בחר מקום" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {locations.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground">
                    אין מקומות מוגדרים. הוסף ב־/מקומות.
                  </div>
                ) : (
                  locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </label>
          <p className="text-[11px] text-muted-foreground">
            המקום משפיע על זמינות ציוד לתרגילים. שינוי מקום לא מוחק תרגילים.
          </p>
        </Tile>
        <Tile>
          <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">
            מנוחה ברירת מחדל (שניות)
            <Input
              type="number"
              min={0}
              value={template.default_rest_seconds}
              onChange={(e) =>
                updateTemplate(template.id, {
                  default_rest_seconds: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="min-h-11 rounded-xl border-border-strong"
            />
          </label>
        </Tile>
        <Tile>
          <label className="flex flex-col gap-1 text-xs font-bold text-muted-foreground">
            תיאור (רשות)
            <Input
              value={template.description ?? ""}
              onChange={(e) => updateTemplate(template.id, { description: e.target.value || null })}
              className="min-h-11 rounded-xl border-border-strong"
              placeholder="למשל: יום כוח עליון עם דגש על חזה"
            />
          </label>
        </Tile>
      </div>

      {/* סיכום */}
      <section className="mt-4 px-4 sm:px-6">
        <TemplateSummary templateId={template.id} />
      </section>

      {/* בלוקים */}
      <section className="mt-6 flex flex-col gap-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            בלוקים ({blocks.length})
          </h2>
          <div className="flex flex-wrap gap-1">
            <AddBlockButton type="single" onClick={() => addBlock("single")}>
              + תרגיל
            </AddBlockButton>
            <AddBlockButton type="superset" onClick={() => addBlock("superset")}>
              + סופרסט
            </AddBlockButton>
            <AddBlockButton type="warmup" onClick={() => addBlock("warmup")}>
              + חימום
            </AddBlockButton>
            <AddBlockButton type="cooldown" onClick={() => addBlock("cooldown")}>
              + סיום
            </AddBlockButton>
          </div>
        </div>

        {blocks.length === 0 ? (
          <EmptyState
            icon={<Plus aria-hidden />}
            title="ריקה — בואו נוסיף תרגילים"
            description="בחירת תרגיל בודד יוצרת בלוק חדש. בחירת 2 או יותר → אפשרות ליצור סופרסט."
            action={
              <Button
                type="button"
                onClick={() => openPicker(null)}
                className="min-h-11 rounded-xl bg-primary text-primary-foreground"
              >
                <Plus aria-hidden className="me-1 size-4" />
                הוספת תרגילים
              </Button>
            }
          />
        ) : (
          <>
            {blocks.map((b, i) => (
              <TemplateBlockCard
                key={b.id}
                block={b}
                positionIndex={i}
                siblingsCount={blocks.length}
                onAddExercise={openPicker}
              />
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={() => openPicker(null)}
              className="min-h-11 justify-center rounded-xl border border-dashed border-border-strong"
            >
              <Plus aria-hidden className="me-1 size-4" />
              הוספת בלוק / סופרסט מתרגילים
            </Button>
          </>
        )}
      </section>

      {/* פעולות תחתונות */}
      <section className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Chip>גרסה {template.version}</Chip>
          <Button
            type="button"
            variant="ghost"
            onClick={() => saveVersion(template.id, "עריכה ידנית")}
            className="min-h-11 rounded-xl border border-border-strong"
          >
            <Save aria-hidden className="me-1 size-4" />
            שמור גרסה
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: "/templates/$id/history", params: { id: template.id } })}
            className="min-h-11 rounded-xl border border-border-strong"
          >
            <History aria-hidden className="me-1 size-4" />
            היסטוריית גרסאות
          </Button>
        </div>
        {canActivate ? (
          <Button
            type="button"
            onClick={() => activateTemplate(template.id)}
            className="min-h-11 rounded-xl bg-gym text-white"
          >
            הפעלת תבנית
          </Button>
        ) : null}
      </section>

      <ExercisePickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        locationId={template.location_id}
        onSelect={handleSelectFromPicker}
        title={pickerTargetBlockId ? "הוספת תרגיל לבלוק" : "הוספת תרגילים לתבנית"}
      />
    </AppShell>
  );
}

// unused helper preserved for future block-type selector UX
void BLOCK_TYPE_LABELS;
void createSupersetFromExercises;

function AddBlockButton({
  onClick,
  children,
}: {
  type: BlockType;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border-strong bg-surface px-3 text-xs font-bold hover:bg-surface-elevated"
    >
      {children}
    </button>
  );
}
