/**
 * Phase 1 security + fallback guarantees.
 *
 * The migration assertions read the real SQL file. They are the only automated
 * check that RLS is on and that ownership is auth.uid() until the migration is
 * actually applied to a database, so they are deliberately strict.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRepository } from "@/lib/repo";
import { toRepoGoal } from "@/lib/repo/supabase";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260801090000_phase1_profiles_and_goals.sql",
);
const sql = readFileSync(MIGRATION_PATH, "utf8");

/** Executable SQL only — prose in comments must not satisfy or break a check. */
const statements = sql
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

const USER_TABLES = ["public.profiles", "public.goals"];

describe("migration — RLS", () => {
  it("enables row level security on every table it creates", () => {
    for (const table of USER_TABLES) {
      expect(sql).toContain(`alter table ${table} enable row level security`);
    }
  });

  it("creates each table and its RLS in the same migration", () => {
    for (const table of USER_TABLES) {
      const created = sql.indexOf(`create table if not exists ${table}`);
      const secured = sql.indexOf(`alter table ${table} enable row level security`);
      expect(created).toBeGreaterThanOrEqual(0);
      expect(secured).toBeGreaterThan(created);
    }
  });

  it("scopes every policy by auth.uid()", () => {
    const policies = statements.match(/create policy[\s\S]*?;/g) ?? [];
    expect(policies.length).toBeGreaterThanOrEqual(6);
    for (const policy of policies) {
      expect(policy).toContain("auth.uid()");
    }
  });

  it("never uses USING (true)", () => {
    expect(statements.toLowerCase()).not.toMatch(/using\s*\(\s*true\s*\)/);
  });

  it("creates no delete policy — soft delete only", () => {
    expect(statements.toLowerCase()).not.toMatch(/create policy[^;]*for\s+delete/);
  });

  it("defaults goal ownership to the caller so a client cannot forge user_id", () => {
    expect(sql).toMatch(/user_id\s+uuid\s+not null\s+default auth\.uid\(\)/);
  });

  it("does not modify auth.users", () => {
    expect(statements.toLowerCase()).not.toMatch(/create trigger[\s\S]{0,120}on auth\.users/);
    expect(statements.toLowerCase()).not.toMatch(/(insert into|update|delete from|alter table)\s+auth\.users/);
  });

  it("contains no secret, key or password literal", () => {
    expect(sql).not.toMatch(/sb_secret_|sbp_|service_role_key|eyJ[A-Za-z0-9_-]{10,}/);
  });

  it("grants only select/insert/update to authenticated — never delete", () => {
    const grants = statements.match(/grant[^;]*;/g) ?? [];
    expect(grants.length).toBeGreaterThan(0);
    for (const grant of grants) {
      expect(grant).not.toMatch(/\bdelete\b/i);
      expect(grant).toContain("authenticated");
    }
  });

  it("uses numeric, never float or double precision", () => {
    expect(statements.toLowerCase()).not.toMatch(/\b(float|double precision|real)\b/);
    expect(statements).toContain("numeric");
  });
});

describe("repository — local fallback", () => {
  it("falls back to the local repository when nobody is signed in", async () => {
    const resolved = await resolveRepository();
    expect(resolved.kind).toBe("mock");
    expect(["signed_out", "not_configured", "error"]).toContain(resolved.reason);
  });

  it("still answers the full contract while local-only", async () => {
    const { repo } = await resolveRepository();
    await expect(repo.listActivities("running")).resolves.toEqual([]);
    await expect(repo.listAllActivities()).resolves.toEqual([]);
    await expect(repo.listGoals("running")).resolves.toEqual([]);
  });
});

describe("supabase adapter — row mapping", () => {
  const base = {
    id: "g1",
    domain: "running",
    name: "20 ק״מ",
    target_value: "20.5",
    target_unit: "ק״מ",
    current_value: "12.25",
    priority: 1,
    status: "active",
  };

  it("coerces PostgREST numeric strings without losing precision", () => {
    const mapped = toRepoGoal(base);
    expect(mapped?.targetValue).toBe(20.5);
    expect(mapped?.currentValue).toBe(12.25);
  });

  it("maps draft to active so a new goal is visible", () => {
    expect(toRepoGoal({ ...base, status: "draft" })?.status).toBe("active");
  });

  it("hides trashed, archived and cancelled goals rather than mislabelling them", () => {
    for (const status of ["trashed", "archived", "cancelled", "not_achieved"]) {
      expect(toRepoGoal({ ...base, status })).toBeNull();
    }
  });
});
