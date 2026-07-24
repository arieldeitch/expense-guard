/**
 * Run calculations — pace/speed/distance/time, weighted averages, formatting.
 * טהור, ללא side effects. יחידות בסיס: מטרים, שניות, ק"מ/שעה, שניות/ק"מ.
 *
 * חוקי חישוב:
 * - קצב s/km מ-time+distance: seconds / (distance_m/1000).
 * - מהירות km/h מ-time+distance: (distance_m/1000) / (seconds/3600).
 * - קצב<->מהירות: pace_s_per_km = 3600 / kmh.
 * - זמן מ-מרחק+קצב: seconds = pace_s_per_km * (distance_m/1000).
 * - מרחק מ-זמן+מהירות: distance_m = kmh * (seconds/3600) * 1000.
 *
 * ממוצע קצב על ריצות מרובות = משוקלל לפי מרחק, לא ממוצע פשוט של pace.
 */

export const kmToMeters = (km: number) => km * 1000;
export const metersToKm = (m: number) => m / 1000;
export const kmhToPaceSPerKm = (kmh: number) => (kmh > 0 ? 3600 / kmh : null);
export const paceSPerKmToKmh = (pace: number) => (pace > 0 ? 3600 / pace : null);

export function paceFromTimeDistance(seconds: number, meters: number): number | null {
  if (!isFinite(seconds) || !isFinite(meters) || seconds <= 0 || meters <= 0) return null;
  return seconds / (meters / 1000);
}

export function speedFromTimeDistance(seconds: number, meters: number): number | null {
  if (!isFinite(seconds) || !isFinite(meters) || seconds <= 0 || meters <= 0) return null;
  return meters / 1000 / (seconds / 3600);
}

export function distanceFromTimeSpeed(seconds: number, kmh: number): number | null {
  if (!isFinite(seconds) || !isFinite(kmh) || seconds <= 0 || kmh <= 0) return null;
  return kmh * (seconds / 3600) * 1000;
}

export function distanceFromTimePace(seconds: number, paceSPerKm: number): number | null {
  if (!isFinite(seconds) || !isFinite(paceSPerKm) || seconds <= 0 || paceSPerKm <= 0) return null;
  return (seconds / paceSPerKm) * 1000;
}

export function timeFromDistancePace(meters: number, paceSPerKm: number): number | null {
  if (!isFinite(meters) || !isFinite(paceSPerKm) || meters <= 0 || paceSPerKm <= 0) return null;
  return paceSPerKm * (meters / 1000);
}

export function timeFromDistanceSpeed(meters: number, kmh: number): number | null {
  if (!isFinite(meters) || !isFinite(kmh) || meters <= 0 || kmh <= 0) return null;
  return (meters / 1000 / kmh) * 3600;
}

/** ממוצע קצב משוקלל לפי מרחק. מחזיר s/km. */
export function weightedAveragePaceByDistance(
  entries: { pace_s_per_km: number | null; distance_meters: number | null }[],
): number | null {
  let totalTime = 0;
  let totalMeters = 0;
  for (const e of entries) {
    if (e.pace_s_per_km == null || e.distance_meters == null) continue;
    if (e.pace_s_per_km <= 0 || e.distance_meters <= 0) continue;
    const time = timeFromDistancePace(e.distance_meters, e.pace_s_per_km);
    if (time == null) continue;
    totalTime += time;
    totalMeters += e.distance_meters;
  }
  if (totalMeters <= 0) return null;
  return paceFromTimeDistance(totalTime, totalMeters);
}

/** ממוצע קצב מסך זמן ומרחק ישירות (כשיש לנו את הסך). */
export function averagePaceFromTotals(totalSeconds: number, totalMeters: number): number | null {
  return paceFromTimeDistance(totalSeconds, totalMeters);
}

// ---------- Formatting ----------

export function formatDurationHMS(seconds: number | null | undefined): string {
  if (seconds == null || !isFinite(seconds) || seconds < 0) return "–";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** קצב s/km → "m:ss /ק"מ" */
export function formatPace(paceSPerKm: number | null | undefined): string {
  if (paceSPerKm == null || !isFinite(paceSPerKm) || paceSPerKm <= 0) return "–";
  const total = Math.round(paceSPerKm);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatSpeed(kmh: number | null | undefined, digits = 1): string {
  if (kmh == null || !isFinite(kmh)) return "–";
  return kmh.toFixed(digits);
}

export function formatDistanceKm(meters: number | null | undefined, digits = 2): string {
  if (meters == null || !isFinite(meters)) return "–";
  return (meters / 1000).toFixed(digits);
}

/** Parses "5", "5.5", "5,5", "5:30" (m:ss for pace) → number or null. */
export function parseDecimal(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** "m:ss" → seconds. */
export function parsePaceMSS(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (!t.includes(":")) {
    const n = parseDecimal(t);
    return n == null ? null : n * 60;
  }
  const [mm, ss] = t.split(":");
  const m = Number(mm);
  const s = Number(ss);
  if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
  return m * 60 + s;
}

/** "h:mm:ss" | "mm:ss" | "mm" → seconds. */
export function parseDurationInput(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const parts = t.split(":").map((p) => Number(p));
  if (parts.some((p) => !Number.isFinite(p) || p < 0)) return null;
  if (parts.length === 1) return parts[0] * 60; // minutes
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

/** מחשב data_completeness (0..1) על סמך מספר שדות מספריים מלאים. */
export function computeCompleteness(fields: (number | null | undefined)[]): number {
  if (fields.length === 0) return 0;
  const filled = fields.filter((v) => v != null && Number.isFinite(v)).length;
  return +(filled / fields.length).toFixed(2);
}
