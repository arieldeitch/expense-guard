/**
 * /backup — גיבוי ושחזור מקומי.
 *
 * ייצוא קובץ JSON versioned, ושחזור ממנו עם preview, snapshot אוטומטי ומדיניות
 * קונפליקטים מפורשת. **אין ענן ואין חשבון** — הקובץ יורד למכשיר שלך.
 * ראה ADR-0031.
 */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useHydrated } from "@/lib/storage/useHydrated";
import { AlertTriangle, Download, Upload } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { Tile, TileFootnote, TileLabel } from "@/components/tile/Tile";
import { Button } from "@/components/ui/button";
import {
  BACKUP_SCHEMA_VERSION,
  backupFileName,
  buildBackup,
  importBackup,
  previewImport,
  validateBackup,
  type ImportPreview,
  type ImportResult,
} from "@/lib/backup";

export const Route = createFileRoute("/backup/")({
  head: () => ({
    meta: [
      { title: "גיבוי ושחזור · Fit Log" },
      { name: "description", content: "ייצוא ושחזור של כל הנתונים המקומיים." },
    ],
  }),
  component: BackupPage,
});

function BackupPage() {
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<{ file: string; total: number } | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [pending, setPending] = useState<unknown>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleExport() {
    setExportError(null);
    const envelope = buildBackup(BACKUP_SCHEMA_VERSION);
    const report = validateBackup(envelope);
    if (!report.ok) {
      // לא מייצרים קובץ שנראה תקין כשהאימות נכשל.
      setExportError(
        `הגיבוי לא נוצר: הנתונים לא עברו אימות (${report.issues.filter((i) => i.severity === "error").length} שגיאות).`,
      );
      return;
    }
    const name = backupFileName(new Date());
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    setLastExport({ file: name, total: envelope.metadata.integrity.total_records });
  }

  async function handleFile(file: File) {
    setResult(null);
    try {
      const parsed: unknown = JSON.parse(await file.text());
      setPending(parsed);
      setPreview(previewImport(parsed));
    } catch {
      setPending(null);
      setPreview(null);
      setResult({
        ok: false,
        mode: "merge_keep_local",
        snapshotKey: null,
        applied: {},
        conflicts: {},
        error: "הקובץ אינו JSON תקין. לא בוצע שינוי בנתונים.",
      });
    }
  }

  // `buildBackup()` קורא את כל האחסון המקומי. ב-SSR האחסון ריק, ולכן קריאה
  // ישירה ב-render יוצרת אי-התאמה ב-hydration (ADR-0039). הספירות מוצגות רק
  // אחרי ה-hydration; הייצוא עצמו (handleExport) קורא תמיד נתונים אמיתיים.
  const hydrated = useHydrated();
  // נבנה בכל render (כמו קודם) כדי שהספירות יתעדכנו אחרי ייבוא/ייצוא, אך רק
  // אחרי hydration — ב-SSR האחסון ריק וקריאה כאן שברה את ה-hydration (ADR-0039).
  const envelope = hydrated ? buildBackup(BACKUP_SCHEMA_VERSION) : null;
  const counts: Record<string, number> = envelope?.metadata.entity_counts ?? {};
  const totalRecords = envelope?.metadata.integrity.total_records ?? 0;

  return (
    <AppShell topBar={{ title: "גיבוי ושחזור", back: { to: "/more" } }}>
      <PageHeader
        eyebrow="נתונים מקומיים"
        title="גיבוי ושחזור"
        description="הנתונים נשמרים בדפדפן הזה בלבד. ייצוא קובץ הוא הדרך היחידה לשמור עותק מחוץ למכשיר."
      />

      <div className="flex flex-col gap-3 px-4 pb-24 sm:px-6">
        <Tile>
          <TileLabel>מה יגובה</TileLabel>
          <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
            <Stat label="תוכניות ואימוני בית" value={counts.home ?? 0} />
            <Stat label="אימוני כוח" value={counts.sessions ?? 0} />
            <Stat label="תרגילים" value={counts.exercises ?? 0} />
            <Stat label="ריצות" value={counts.runs ?? 0} />
            <Stat label="יעדים" value={counts.goals ?? 0} />
            <Stat label="תבניות" value={counts.templates ?? 0} />
          </div>
          <TileFootnote>
            סה״כ {totalRecords} רשומות · גרסת schema{" "}
            {BACKUP_SCHEMA_VERSION}
          </TileFootnote>
        </Tile>

        <Button
          type="button"
          onClick={handleExport}
          className="min-h-12 rounded-xl bg-primary text-primary-foreground"
        >
          <Download aria-hidden className="size-5" /> הורד גיבוי
        </Button>

        {exportError ? <ErrorNote>{exportError}</ErrorNote> : null}
        {lastExport ? (
          <Tile variant="success" tone="soft">
            <TileLabel>הגיבוי הורד</TileLabel>
            <TileFootnote>
              {lastExport.file} · {lastExport.total} רשומות. שמור אותו מחוץ לדפדפן.
            </TileFootnote>
          </Tile>
        ) : null}

        <div className="mt-2 border-t border-border-strong pt-3">
          <h2 className="mb-2 text-sm font-black">שחזור מקובץ</h2>
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong text-sm font-bold text-muted-foreground">
            <Upload aria-hidden className="size-4" />
            בחר קובץ גיבוי
            <input
              type="file"
              accept="application/json,.json"
              aria-label="בחר קובץ גיבוי"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </label>
        </div>

        {preview ? <PreviewPanel preview={preview} onApply={applyImport} /> : null}
        {result ? <ResultPanel result={result} /> : null}
      </div>
    </AppShell>
  );

  function applyImport(mode: "merge_keep_local" | "merge_prefer_backup") {
    if (!pending) return;
    const r = importBackup(pending, mode);
    setResult(r);
    setPreview(null);
    setPending(null);
  }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-tint px-2 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="ltr-nums font-black tabular-nums">{value}</span>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs font-bold text-destructive"
    >
      <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function PreviewPanel({
  preview,
  onApply,
}: {
  preview: ImportPreview;
  onApply: (mode: "merge_keep_local" | "merge_prefer_backup") => void;
}) {
  const errors = preview.report.issues.filter((i) => i.severity === "error");
  const totalAdded = Object.values(preview.added).reduce((a, b) => a + b, 0);
  const totalUnchanged = Object.values(preview.unchanged).reduce((a, b) => a + b, 0);
  const totalConflicts = Object.values(preview.conflicts).reduce((a, b) => a + b, 0);

  if (errors.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        <ErrorNote>הקובץ לא עבר אימות. לא בוצע שינוי בנתונים.</ErrorNote>
        <ul className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          {errors.slice(0, 6).map((issue, i) => (
            <li key={i} className="rounded-lg bg-tint px-2 py-1">
              {issue.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <Tile>
      <TileLabel>מה ישתנה</TileLabel>
      <div className="mt-1 flex flex-col gap-1 text-xs">
        <Stat label="רשומות חדשות שיתווספו" value={totalAdded} />
        <Stat label="רשומות זהות (ללא שינוי)" value={totalUnchanged} />
        <Stat label="התנגשויות" value={totalConflicts} />
      </div>
      <TileFootnote>
        לפני כל שחזור נשמר snapshot של המצב הנוכחי. גרסת schema: {preview.report.schema_version}.
      </TileFootnote>
      <div className="mt-3 flex flex-col gap-2">
        <Button
          type="button"
          onClick={() => onApply("merge_keep_local")}
          className="min-h-12 rounded-xl bg-primary text-primary-foreground"
        >
          הוסף חדשים בלבד (שמור על המכשיר)
        </Button>
        {totalConflicts > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onApply("merge_prefer_backup")}
            className="min-h-12 rounded-xl border-border-strong"
          >
            העדף את הגיבוי בהתנגשויות ({totalConflicts})
          </Button>
        ) : null}
      </div>
    </Tile>
  );
}

function ResultPanel({ result }: { result: ImportResult }) {
  if (!result.ok) {
    return <ErrorNote>{result.error}</ErrorNote>;
  }
  const total = Object.values(result.applied).reduce((a, b) => a + b, 0);
  return (
    <Tile variant="success" tone="soft">
      <TileLabel>השחזור הושלם</TileLabel>
      <TileFootnote>
        {total} רשומות יובאו. {result.snapshotKey ? "נשמר snapshot של המצב הקודם." : ""}
      </TileFootnote>
    </Tile>
  );
}
