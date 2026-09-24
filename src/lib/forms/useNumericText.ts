/**
 * useNumericText — the fix for "I cannot type 7.15" (ADR-0044).
 *
 * A controlled input whose `value` is derived from a number cannot hold an intermediate
 * string: typing "7." parses to 7, the component re-renders as "7", and the decimal point
 * is eaten before the user reaches "15". This hook keeps the RAW text the user typed as the
 * source of truth while the field is being edited, parses it for the model, and re-syncs
 * from the model only when the model changes from somewhere else (load, reset, derived value).
 *
 * The same pattern serves duration fields ("mm:ss"), which have the same problem while the
 * user is still mid-way through typing "4", "42", "42:", "42:1", "42:15".
 */
import { useCallback, useRef, useState } from "react";

export interface NumericTextField<T> {
  /** What the input shows — always exactly what the user typed while editing. */
  text: string;
  /** Parsed value, or null when the text is empty or not yet valid. */
  value: T | null;
  /** True when there is text that does not parse — show an error, never save silently. */
  invalid: boolean;
  onChange: (next: string) => void;
  /** Re-formats the text from the parsed value (call on blur for a canonical display). */
  onBlur: () => void;
  /** Push a value in from the model (load / reset / derived) without fighting the typist. */
  setFromModel: (next: T | null) => void;
}

export function useNumericText<T>(options: {
  initial: T | null;
  parse: (raw: string) => T | null;
  format: (value: T | null) => string;
  onValue: (value: T | null) => void;
}): NumericTextField<T> {
  const { parse, format, onValue } = options;
  const [text, setText] = useState(() => format(options.initial));
  const lastPushed = useRef<T | null>(options.initial);

  const onChange = useCallback(
    (next: string) => {
      setText(next);
      const parsed = parse(next);
      lastPushed.current = parsed;
      onValue(parsed);
    },
    [parse, onValue],
  );

  const onBlur = useCallback(() => {
    setText((current) => {
      if (current.trim() === "") return "";
      const parsed = parse(current);
      return parsed == null ? current : format(parsed);
    });
  }, [parse, format]);

  const setFromModel = useCallback(
    (next: T | null) => {
      if (next === lastPushed.current) return;
      lastPushed.current = next;
      setText(format(next));
    },
    [format],
  );

  const parsed = parse(text);
  return {
    text,
    value: parsed,
    invalid: text.trim() !== "" && parsed == null,
    onChange,
    onBlur,
    setFromModel,
  };
}
