/**
 * ADR-0044 — the single duration/decimal contract, from Ariel's real usage feedback:
 * "42:15" must never read as a decimal, and 40 seconds must not require typing "0:40".
 */
import { describe, it, expect } from "vitest";
import {
  describeDuration,
  formatDurationInput,
  parseDecimal,
  parseDurationInput,
  parsePaceMSS,
} from "@/lib/runs";

describe("duration parsing — one contract everywhere", () => {
  it("reads mm:ss as minutes and seconds, never as a decimal", () => {
    expect(parseDurationInput("42:15")).toBe(2535);
    expect(parseDurationInput("0:40")).toBe(40);
    expect(parseDurationInput("1:20")).toBe(80);
    expect(parseDurationInput("10:00")).toBe(600);
    // 42.15 minutes would be 2529s — proof we are not treating ":15" as a fraction.
    expect(parseDurationInput("42:15")).not.toBe(Math.round(42.15 * 60));
  });

  it("accepts a bare number as seconds", () => {
    expect(parseDurationInput("40")).toBe(40);
    expect(parseDurationInput("7")).toBe(7);
    expect(parseDurationInput("90")).toBe(90);
    expect(parseDurationInput("0")).toBe(0);
  });

  it("handles boundaries and the hour rollover", () => {
    expect(parseDurationInput("0:00")).toBe(0);
    expect(parseDurationInput("0:59")).toBe(59);
    expect(parseDurationInput("59:59")).toBe(3599);
    expect(parseDurationInput("60:00")).toBe(3600);
    expect(parseDurationInput("1:00:00")).toBe(3600);
    expect(parseDurationInput("1:02:03")).toBe(3723);
    expect(parseDurationInput("2:00:00")).toBe(7200);
  });

  it("refuses invalid input instead of saving something wrong", () => {
    for (const bad of [
      "",
      "  ",
      "abc",
      "1.5",
      "5:60",
      "1:60:00",
      "1:2:3:4",
      "-5",
      "5:-1",
      ":30",
      "5:",
    ])
      expect(parseDurationInput(bad)).toBeNull();
  });

  it("round-trips display → parse → display", () => {
    for (const seconds of [0, 40, 80, 600, 2535, 3599, 3600, 3723]) {
      const text = formatDurationInput(seconds);
      expect(parseDurationInput(text)).toBe(seconds);
      expect(formatDurationInput(parseDurationInput(text))).toBe(text);
    }
    expect(formatDurationInput(40)).toBe("0:40");
    expect(formatDurationInput(2535)).toBe("42:15");
    expect(formatDurationInput(3723)).toBe("1:02:03");
  });

  it("uses the same contract for pace", () => {
    expect(parsePaceMSS("5:30")).toBe(330);
    expect(parsePaceMSS("45")).toBe(45);
    expect(parsePaceMSS("5.5")).toBeNull();
  });

  it("describes a duration in words so a misread is visible before saving", () => {
    expect(describeDuration(2535)).toBe("42 דקות ו-15 שניות");
    expect(describeDuration(40)).toBe("40 שניות");
    expect(describeDuration(60)).toBe("דקה");
    expect(describeDuration(3723)).toBe("שעה ו-2 דקות ו-3 שניות");
    expect(describeDuration(null)).toBe("");
  });
});

describe("decimal parsing — 7.15 must survive", () => {
  it("accepts the values Ariel types", () => {
    expect(parseDecimal("7")).toBe(7);
    expect(parseDecimal("7.1")).toBe(7.1);
    expect(parseDecimal("7.15")).toBe(7.15);
    expect(parseDecimal("0.5")).toBe(0.5);
    expect(parseDecimal("10.00")).toBe(10);
    expect(parseDecimal("7,15")).toBe(7.15);
  });

  it("rejects text that is not a number", () => {
    for (const bad of ["", "abc", "7.1.5", "7km", "--7"]) expect(parseDecimal(bad)).toBeNull();
  });

  it("does not round away the last digits", () => {
    expect(String(parseDecimal("7.15"))).toBe("7.15");
    expect(String(parseDecimal("12.345"))).toBe("12.345");
  });
});
