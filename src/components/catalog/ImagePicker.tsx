/**
 * ImagePicker — טעינת תמונה מקובץ מקומי לתוך data-URL קטן.
 * הגבלות: MIME image/*, גודל עד 500KB. אין העלאה חיצונית כרגע.
 * ADR: תמונות ייטענו ל־Supabase Storage כשה־backend יחובר. עד אז — inline.
 */
import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_BYTES = 500 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ImagePicker({
  value,
  onChange,
  label = "תמונה",
  className,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError("סוג קובץ לא נתמך. JPEG/PNG/WEBP/GIF בלבד.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("קובץ גדול מ־500KB. נסו תמונה קטנה יותר.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (dataUrl) onChange(dataUrl);
    };
    reader.onerror = () => setError("שגיאה בטעינת הקובץ.");
    reader.readAsDataURL(file);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-3">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border-strong bg-tint text-muted-foreground">
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <ImagePlus aria-hidden className="size-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED.join(",")}
            className="hidden"
            onChange={handleFile}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl border-border-strong"
              onClick={() => inputRef.current?.click()}
            >
              {value ? "החלפת תמונה" : "בחירת תמונה"}
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 rounded-xl text-muted-foreground"
                onClick={() => onChange(null)}
              >
                <X aria-hidden className="me-1 size-4" />
                הסרה
              </Button>
            ) : null}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            עד 500KB · JPEG/PNG/WEBP/GIF · אין העלאה לספק חיצוני
          </div>
        </div>
      </div>
      {error ? (
        <div
          className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
