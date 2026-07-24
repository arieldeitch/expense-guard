import { describe, it, expect, beforeEach } from "vitest";
import {
  readPreferences,
  writePreferences,
  hasLandedThisSession,
  markLandedThisSession,
  LANDING_MODULE_ROUTES,
} from "../index";

// Minimal in-memory storage polyfill (vitest node env has no Web Storage).
class MemStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
  key() {
    return null;
  }
  get length() {
    return this.map.size;
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  (globalThis as unknown as { sessionStorage: MemStorage }).sessionStorage = new MemStorage();
});

describe("preferences", () => {
  it("ברירת מחדל = landingModule 'home' כשאין דבר בזיכרון", () => {
    expect(readPreferences()).toEqual({ landingModule: "home" });
  });

  it("write ואז read מחזירים את הערך החדש", () => {
    writePreferences({ landingModule: "running" });
    expect(readPreferences().landingModule).toBe("running");
  });

  it("ערך לא חוקי נופל לברירת מחדל", () => {
    localStorage.setItem("fitlog:preferences:v1", JSON.stringify({ landingModule: "not-a-thing" }));
    expect(readPreferences().landingModule).toBe("home");
  });

  it("JSON פגום נופל לברירת מחדל", () => {
    localStorage.setItem("fitlog:preferences:v1", "{not json");
    expect(readPreferences().landingModule).toBe("home");
  });
});

describe("session landing flag", () => {
  it("false כברירת מחדל, true אחרי mark", () => {
    expect(hasLandedThisSession()).toBe(false);
    markLandedThisSession();
    expect(hasLandedThisSession()).toBe(true);
  });
});

describe("routing map", () => {
  it("כל landing module ממופה ל־route קיים", () => {
    expect(LANDING_MODULE_ROUTES.home).toBe("/");
    expect(LANDING_MODULE_ROUTES.running).toBe("/running");
    expect(LANDING_MODULE_ROUTES.gym).toBe("/gym");
    expect(LANDING_MODULE_ROUTES["home-workout"]).toBe("/home");
  });
});
