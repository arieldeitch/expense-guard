/**
 * Builds the Fit Log Android APK reproducibly — the same steps locally and in CI (ADR-0043):
 *   1. bun run build:android:web     (dist-android/client — SPA shell of the very same app)
 *   2. bunx cap sync android         (copies web assets + plugins into android/)
 *   3. gradlew assemble<Variant>     (debug by default; release only with FITLOG_KEYSTORE_* env)
 *   4. renames the APK to fitlog-<version>-<versionCode>-<commit>-<variant>.apk and writes .sha256
 *
 *   node scripts/android-apk.mjs [--variant debug|release] [--skip-web]
 *
 * Fails fast when JAVA_HOME / ANDROID_HOME are missing or point at the wrong tool versions.
 */
import { execSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const variant = args.includes("--variant") ? args[args.indexOf("--variant") + 1] : "debug";
const skipWeb = args.includes("--skip-web");
if (variant !== "debug" && variant !== "release") throw new Error(`unknown variant ${variant}`);

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const [major = 0, minor = 0, patch = 0] = String(pkg.version)
  .split(".")
  .map((n) => Number(n) || 0);
const versionCode = major * 10000 + minor * 100 + patch;
const commit =
  (process.env.GITHUB_SHA ?? "").slice(0, 10) ||
  execSync("git rev-parse --short=10 HEAD", { cwd: root }).toString().trim();

function need(name, hint) {
  if (!process.env[name]) throw new Error(`${name} is not set. ${hint}`);
}
need("JAVA_HOME", "Point it at a JDK 21 (Capacitor 8 / AGP 8.13 requirement).");
need("ANDROID_HOME", "Point it at an Android SDK with platform 36 and build-tools 36.");
if (!existsSync(join(process.env.ANDROID_HOME, "platforms", "android-36")))
  throw new Error("ANDROID_HOME has no platforms/android-36 — install it with sdkmanager.");
if (variant === "release") {
  for (const k of [
    "FITLOG_KEYSTORE_PATH",
    "FITLOG_KEYSTORE_PASSWORD",
    "FITLOG_KEY_ALIAS",
    "FITLOG_KEY_PASSWORD",
  ])
    need(k, "A release APK needs a keystore supplied through the environment (never committed).");
}

function run(cmd, cmdArgs, cwd = root) {
  console.log(`\n$ ${cmd} ${cmdArgs.join(" ")}`);
  // On Windows a .bat/.cmd must go through cmd.exe; the command line is built verbatim so a path
  // with spaces ("AI projects") survives cmd's quote handling (/s strips the outer pair).
  const win = process.platform === "win32";
  const r = win
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", `""${cmd}" ${cmdArgs.join(" ")}"`], {
        cwd,
        stdio: "inherit",
        windowsVerbatimArguments: true,
      })
    : spawnSync(cmd, cmdArgs, { cwd, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${cmd} failed with ${r.status}`);
}

if (!skipWeb) run("bunx", ["vite", "build", "--config", "vite.android.config.ts"]);
run("bunx", ["cap", "sync", "android"]);
const gradleTask = `assemble${variant[0].toUpperCase()}${variant.slice(1)}`;
// The wrapper is invoked by absolute path (quoted for cmd.exe) — never resolved through PATH.
const gradlew = join(root, "android", process.platform === "win32" ? "gradlew.bat" : "gradlew");
run(gradlew, [gradleTask, "--no-daemon", "--console=plain"], join(root, "android"));

const built = join(
  root,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  variant,
  `app-${variant}.apk`,
);
if (!existsSync(built)) throw new Error(`APK not found at ${built}`);
const outDir = join(root, "android", "app", "build", "outputs", "fitlog");
mkdirSync(outDir, { recursive: true });
const name = `fitlog-${pkg.version}-${versionCode}-${commit}-${variant}.apk`;
const out = join(outDir, name);
copyFileSync(built, out);
const sha = createHash("sha256").update(readFileSync(out)).digest("hex");
writeFileSync(`${out}.sha256`, `${sha}  ${name}\n`);
const summary = {
  file: name,
  path: out,
  version_name: pkg.version,
  version_code: versionCode,
  commit,
  variant,
  signing:
    variant === "debug"
      ? "debug keystore (internal install only, NOT Play Store)"
      : "release keystore from environment",
  sha256: sha,
  built_at: new Date().toISOString(),
};
writeFileSync(join(outDir, "fitlog-apk.json"), JSON.stringify(summary, null, 2) + "\n");
console.log("\nAPK ready:\n" + JSON.stringify(summary, null, 2));
