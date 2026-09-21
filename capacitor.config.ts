import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Fit Log — Android shell (ADR-0043).
 * The web app is bundled INSIDE the APK (webDir); nothing is loaded from the live site on open.
 * Local data lives in the WebView's localStorage under https://localhost — it survives restarts
 * and upgrades, and is separate from the browser's copy (see docs: data migration = export/restore).
 */
const config: CapacitorConfig = {
  appId: "com.arieldeitch.fitlog",
  appName: "Fit Log",
  webDir: "dist-android/client",
  android: {
    // Android 15+ draws edge-to-edge; let Capacitor pad the WebView for the system bars.
    adjustMarginsForEdgeToEdge: "force",
    allowMixedContent: false,
    backgroundColor: "#1a1d2b",
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: "#1a1d2b",
    },
  },
};

export default config;
