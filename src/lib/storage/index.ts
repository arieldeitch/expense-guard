/**
 * שכבת האחסון המקומי — primitive כתיבה, גרסת schema, מיגרציות ו-snapshot.
 * ראה ADR-0032 (כשלי כתיבה) ו-ADR-0033 (schema מקומי גרסאי).
 */
export * from "./safeStorage";
export * from "./checksum";
export * from "./schema";
export * from "./snapshot";
export * from "./migrations";
export * from "./hooks";
