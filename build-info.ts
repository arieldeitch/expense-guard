/**
 * Build identity shared by the web build and the Android build (ADR-0043).
 * Reads package.json version and the current git commit; never reads secrets.
 * In CI, GITHUB_SHA is used when git is unavailable.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

export type BuildTarget = "web" | "android";

export function readVersion(): string {
  const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
    version?: string;
  };
  return pkg.version ?? "0.0.0";
}

export function readCommit(): string {
  try {
    return execSync("git rev-parse --short=10 HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return (process.env.GITHUB_SHA ?? "unknown").slice(0, 10);
  }
}

/** Deterministic Android versionCode from semver: 1.1.0 → 10100. */
export function versionCodeOf(version: string): number {
  const [major = 0, minor = 0, patch = 0] = version.split(".").map((n) => Number(n) || 0);
  return major * 10000 + minor * 100 + patch;
}

export function buildInfoDefine(target: BuildTarget) {
  const version = readVersion();
  return {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(version),
    "import.meta.env.VITE_APP_VERSION_CODE": JSON.stringify(String(versionCodeOf(version))),
    "import.meta.env.VITE_GIT_SHA": JSON.stringify(readCommit()),
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(new Date().toISOString()),
    "import.meta.env.VITE_APP_TARGET": JSON.stringify(target),
  };
}
