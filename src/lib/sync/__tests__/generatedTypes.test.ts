/**
 * R-35 regression guard.
 *
 * Phase 1 briefly carried a hand-written copy of the goals/profiles row shapes
 * because the generated types were empty. They are generated now, and these
 * assertions fail if a duplicate ever creeps back or if the generated schema
 * drifts away from what the adapter and the uploader assume.
 */
import { describe, expect, expectTypeOf, it } from "vitest";
import type { Database } from "@/integrations/supabase/types";
import type { GoalSummaryRow } from "@/lib/repo/supabase";
import type { CloudGoalRow, PlannedGoalRow } from "@/lib/sync/goalsUpload";

type GeneratedGoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
type GeneratedGoalRow = Database["public"]["Tables"]["goals"]["Row"];
type GeneratedProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

describe("generated types are the single source of truth", () => {
  it("uses the generated Insert type for uploads, not a local copy", () => {
    expectTypeOf<CloudGoalRow>().toEqualTypeOf<GeneratedGoalInsert>();
  });

  it("keeps PlannedGoalRow a refinement of the generated Insert, never a rewrite", () => {
    expectTypeOf<PlannedGoalRow>().toMatchTypeOf<GeneratedGoalInsert>();
    // The only difference: the planner always sets op_id.
    expectTypeOf<PlannedGoalRow["op_id"]>().toEqualTypeOf<string>();
  });

  it("derives the repository's projection from the generated Row", () => {
    expectTypeOf<GoalSummaryRow>().toMatchTypeOf<Partial<GeneratedGoalRow>>();
    expectTypeOf<GoalSummaryRow["id"]>().toEqualTypeOf<string>();
    expectTypeOf<GoalSummaryRow["user_id" & keyof GoalSummaryRow]>().toEqualTypeOf<never>();
  });

  it("still models profiles as keyed by the auth user id", () => {
    expectTypeOf<GeneratedProfileInsert["id"]>().toEqualTypeOf<string>();
  });

  it("has no hand-written Supabase table shim left in the tree", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    expect(existsSync(join(process.cwd(), "src", "lib", "supabase", "tables.ts"))).toBe(false);
  });
});
