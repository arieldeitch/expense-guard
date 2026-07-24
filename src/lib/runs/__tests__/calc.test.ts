import { describe, expect, it } from "vitest";
import {
  paceFromTimeDistance,
  speedFromTimeDistance,
  distanceFromTimeSpeed,
  distanceFromTimePace,
  timeFromDistancePace,
  timeFromDistanceSpeed,
  kmhToPaceSPerKm,
  paceSPerKmToKmh,
  weightedAveragePaceByDistance,
  formatPace,
  formatDurationHMS,
  formatDistanceKm,
  parseDurationInput,
  parsePaceMSS,
  parseDecimal,
} from "@/lib/runs/calc";

describe("run calc", () => {
  it("pace from time+distance", () => {
    expect(paceFromTimeDistance(1800, 5000)).toBe(360); // 6:00 /km
    expect(paceFromTimeDistance(0, 5000)).toBeNull();
    expect(paceFromTimeDistance(1800, 0)).toBeNull();
  });

  it("speed from time+distance", () => {
    expect(speedFromTimeDistance(3600, 10000)).toBeCloseTo(10, 5);
  });

  it("distance from time+speed and time+pace", () => {
    expect(distanceFromTimeSpeed(3600, 10)).toBeCloseTo(10_000, 3);
    expect(distanceFromTimePace(1800, 360)).toBeCloseTo(5000, 3);
  });

  it("time from distance+pace/speed", () => {
    expect(timeFromDistancePace(5000, 360)).toBe(1800);
    expect(timeFromDistanceSpeed(10_000, 10)).toBeCloseTo(3600, 3);
  });

  it("pace<->speed conversion", () => {
    expect(paceSPerKmToKmh(360)).toBeCloseTo(10, 5);
    expect(kmhToPaceSPerKm(10)).toBeCloseTo(360, 5);
  });

  it("weighted average pace by distance", () => {
    // 5km @ 6:00 (360s/km), 5km @ 4:00 (240s/km) → total 10km in 3000s → 300s/km avg
    const avg = weightedAveragePaceByDistance([
      { pace_s_per_km: 360, distance_meters: 5000 },
      { pace_s_per_km: 240, distance_meters: 5000 },
    ]);
    expect(avg).toBeCloseTo(300, 5);
    // NOT a naïve average which would also be 300; try skewed distances:
    const skewed = weightedAveragePaceByDistance([
      { pace_s_per_km: 360, distance_meters: 9000 },
      { pace_s_per_km: 240, distance_meters: 1000 },
    ]);
    // total = 9000*360/1000 + 1000*240/1000 = 3240 + 240 = 3480s over 10km → 348s/km
    expect(skewed).toBeCloseTo(348, 5);
    // naive would be 300 — proves weighting works
    expect(skewed).not.toBeCloseTo(300, 1);
  });

  it("weighted average handles missing", () => {
    expect(
      weightedAveragePaceByDistance([{ pace_s_per_km: null, distance_meters: 1000 }]),
    ).toBeNull();
    expect(weightedAveragePaceByDistance([])).toBeNull();
  });

  it("formatting", () => {
    expect(formatPace(360)).toBe("6:00");
    expect(formatPace(null)).toBe("–");
    expect(formatDurationHMS(3661)).toBe("1:01:01");
    expect(formatDurationHMS(65)).toBe("1:05");
    expect(formatDistanceKm(5432)).toBe("5.43");
  });

  it("parsers", () => {
    expect(parseDurationInput("45:30")).toBe(45 * 60 + 30);
    expect(parseDurationInput("1:02:03")).toBe(3723);
    expect(parseDurationInput("30")).toBe(1800); // 30 minutes
    expect(parsePaceMSS("5:30")).toBe(330);
    expect(parseDecimal("5,5")).toBe(5.5);
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
  });
});
