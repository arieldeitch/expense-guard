/**
 * Mock repository — נתונים ריאליסטיים אך ניטרליים, deterministic.
 * מכוון להיות empty as default; משתמש יכול להפעיל demo mode ע"י flag בעתיד.
 * לפי דרישות המוצר: אין להמציא נתונים בשם המשתמש → default = ריק לחלוטין.
 */
import type { Repository, Activity, Goal, Domain } from "./types";

// Default: empty repo. To toggle demo data locally, set localStorage.setItem("fitlog:mock-mode","demo")
function isDemoMode(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem("fitlog:mock-mode") === "demo";
}

const DEMO_ACTIVITIES: Activity[] = [
  {
    id: "demo-run-1",
    domain: "running",
    occurredAt: daysAgo(2),
    distanceM: 7200,
    durationS: 2340,
    totalReps: null,
    paceSPerKm: 325,
  },
  {
    id: "demo-run-2",
    domain: "running",
    occurredAt: daysAgo(6),
    distanceM: 5100,
    durationS: 1680,
    totalReps: null,
    paceSPerKm: 329,
  },
  {
    id: "demo-gym-1",
    domain: "gym",
    occurredAt: daysAgo(1),
    distanceM: null,
    durationS: 3900,
    totalReps: null,
    paceSPerKm: null,
  },
  {
    id: "demo-gym-2",
    domain: "gym",
    occurredAt: daysAgo(4),
    distanceM: null,
    durationS: 3600,
    totalReps: null,
    paceSPerKm: null,
  },
  {
    id: "demo-home-1",
    domain: "home",
    occurredAt: daysAgo(3),
    distanceM: null,
    durationS: 1500,
    totalReps: 180,
    paceSPerKm: null,
  },
];

const DEMO_GOALS: Goal[] = [
  {
    id: "demo-goal-run",
    domain: "running",
    title: "20 ק״מ בשבוע",
    targetValue: 20,
    targetUnit: "ק״מ",
    currentValue: 12.3,
    priority: 1,
    status: "active",
  },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const mockRepository: Repository = {
  async listActivities(domain: Domain) {
    if (!isDemoMode()) return [];
    return DEMO_ACTIVITIES.filter((a) => a.domain === domain);
  },
  async listAllActivities() {
    if (!isDemoMode()) return [];
    return DEMO_ACTIVITIES;
  },
  async listGoals(domain: Domain) {
    if (!isDemoMode()) return [];
    return DEMO_GOALS.filter((g) => g.domain === domain);
  },
};

/** Testing helper — repo פונקציונלי עם נתונים מוזרקים. */
export function createInMemoryRepo(seed: {
  activities?: Activity[];
  goals?: Goal[];
}): Repository {
  const activities = seed.activities ?? [];
  const goals = seed.goals ?? [];
  return {
    async listActivities(domain) {
      return activities.filter((a) => a.domain === domain);
    },
    async listAllActivities() {
      return activities;
    },
    async listGoals(domain) {
      return goals.filter((g) => g.domain === domain);
    },
  };
}
