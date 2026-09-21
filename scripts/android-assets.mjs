/**
 * Generates the Android launcher icon and splash PNGs from ONE inline SVG mark, so the assets are
 * reproducible from the repository (no binary source of truth, no external design tool).
 *
 *   node scripts/android-assets.mjs            (needs playwright-core + Chrome; dev only)
 *
 * Mark: Fit Log pulse line (primary blue) with a run-orange dot on the app's dark-tinted background.
 * Colours are the app tokens: background #1a1d2b, primary ≈ #7ec2ff, run ≈ #ff9a3c.
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const RES = join(process.cwd(), "android", "app", "src", "main", "res");
const BG = "#1a1d2b";
const BLUE = "#7ec2ff";
const ORANGE = "#ff9a3c";

/** The pulse mark inside a 100×100 box, centred; safe for the 66% adaptive-icon zone. */
const mark = (scale = 1) => `
  <g transform="translate(50 50) scale(${scale}) translate(-50 -50)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="18,56 32,56 40,38 50,70 58,48 64,56 82,56" stroke="${BLUE}" stroke-width="7"/>
    <circle cx="82" cy="56" r="5.5" fill="${ORANGE}"/>
  </g>`;

const foregroundSvg = (px) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100">${mark(0.62)}</svg>`;
const legacySvg = (
  px,
  round,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100">
  ${round ? `<circle cx="50" cy="50" r="50" fill="${BG}"/>` : `<rect width="100" height="100" rx="22" fill="${BG}"/>`}
  ${mark(0.78)}</svg>`;
const splashSvg = (w, h) => {
  const s = Math.min(w, h) * 0.26;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <svg x="${(w - s) / 2}" y="${(h - s) / 2}" width="${s}" height="${s}" viewBox="0 0 100 100">${mark(1)}</svg>
</svg>`;
};

const targets = [];
const dpis = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [dpi, f] of Object.entries(dpis)) {
  targets.push({ file: `mipmap-${dpi}/ic_launcher_foreground.png`, svg: foregroundSvg(108 * f) });
  targets.push({ file: `mipmap-${dpi}/ic_launcher.png`, svg: legacySvg(48 * f, false) });
  targets.push({ file: `mipmap-${dpi}/ic_launcher_round.png`, svg: legacySvg(48 * f, true) });
}
const splash = {
  "drawable/splash.png": [480, 320],
  "drawable-land-mdpi/splash.png": [480, 320],
  "drawable-land-hdpi/splash.png": [800, 480],
  "drawable-land-xhdpi/splash.png": [1280, 720],
  "drawable-land-xxhdpi/splash.png": [1600, 960],
  "drawable-land-xxxhdpi/splash.png": [1920, 1280],
  "drawable-port-mdpi/splash.png": [320, 480],
  "drawable-port-hdpi/splash.png": [480, 800],
  "drawable-port-xhdpi/splash.png": [720, 1280],
  "drawable-port-xxhdpi/splash.png": [960, 1600],
  "drawable-port-xxxhdpi/splash.png": [1280, 1920],
};
for (const [file, [w, h]] of Object.entries(splash)) targets.push({ file, svg: splashSvg(w, h) });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const t of targets) {
  const m = t.svg.match(/width="(\d+)" height="(\d+)"/);
  const w = Number(m[1]);
  const h = Number(m[2]);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${t.svg}</body></html>`,
  );
  const png = await page.screenshot({
    omitBackground: true,
    clip: { x: 0, y: 0, width: w, height: h },
  });
  const out = join(RES, t.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  console.log("wrote", t.file, `${w}x${h}`);
}
await browser.close();
