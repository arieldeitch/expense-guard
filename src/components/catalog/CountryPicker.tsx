/**
 * CountryPicker — בחירת מדינה מתוך רשימה סטטית, עם חיפוש בעברית/אנגלית.
 * נבחר במכוון להיות פשוט (Popover + Input + רשימה מסוננת) — ללא map ולא API חיצוני.
 */
import { useMemo, useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COUNTRIES, findCountry, searchCountries } from "@/lib/catalog";

export function CountryPicker({
  value,
  onChange,
  disabled,
  id,
}: {
  value: string | null;
  onChange: (code: string | null) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = findCountry(value);
  const results = useMemo(() => searchCountries(query).slice(0, 40), [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className="grid min-h-11 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border-border-strong bg-surface text-start"
        >
          <Globe2 aria-hidden className="size-4 text-muted-foreground" />
          <span className="min-w-0 truncate text-sm">
            {selected ? `${selected.he} · ${selected.en}` : "בחרו מדינה (לא חובה)"}
          </span>
          <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" className="w-[min(92vw,22rem)] p-2" dir="rtl">
        <Input
          autoFocus
          placeholder="חיפוש (עברית/אנגלית/קוד)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-2 min-h-11 rounded-xl"
        />
        {value ? (
          <button
            type="button"
            className="mb-2 grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg px-2 py-2 text-start text-xs text-muted-foreground hover:bg-tint"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            <span aria-hidden>✕</span>
            <span>ניקוי בחירה</span>
          </button>
        ) : null}
        <ul className="max-h-64 space-y-0.5 overflow-y-auto">
          {results.length === 0 ? (
            <li className="p-3 text-center text-sm text-muted-foreground">אין תוצאות</li>
          ) : (
            results.map((c) => {
              const active = c.code === value;
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                    }}
                    className={cn(
                      "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2 py-2 text-start text-sm hover:bg-tint",
                      active && "bg-tint",
                    )}
                  >
                    <span className="w-8 text-xs font-mono text-muted-foreground">{c.code}</span>
                    <span className="min-w-0 truncate">
                      <span className="font-semibold">{c.he}</span>
                      <span className="ms-1 text-xs text-muted-foreground">{c.en}</span>
                    </span>
                    {active ? <Check aria-hidden className="size-4 text-primary" /> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div className="mt-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          {COUNTRIES.length} מדינות ברשימה. לא נשלח מיקום לספק חיצוני.
        </div>
      </PopoverContent>
    </Popover>
  );
}
