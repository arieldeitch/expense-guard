/**
 * Ownership — one contract for "whose record is this" (ADR-0047).
 *
 * The app is used by one person today and must stay that way in the UI, but the DATA must not
 * assume it. Every domain already stamps `owner_id` on its records; until now each module had
 * its own private `CURRENT_OWNER_ID = "single-user"` constant, which made "who owns this" an
 * accident of eight separate literals rather than a decision.
 *
 * This module is that decision:
 *  - `LOCAL_OWNER_ID` keeps the historical value `"single-user"`, so every record already on
 *    Ariel's device stays readable and no migration is needed.
 *  - `currentOwnerId()` is the single place that answers "who is writing now". When a signed-in
 *    user is introduced it resolves to their `auth.uid()` here, and nowhere else.
 *  - `ownedByCurrent` / `assertOwned` let repositories filter by owner without every caller
 *    re-implementing the check.
 *
 * What this deliberately does NOT do: create a second user, expose any family/parent UI, or
 * change what is uploaded. Cloud tables already scope rows by `auth.uid()`; that stays as is.
 */

/** The owner id used by every record written on this device so far. Never change this value. */
export const LOCAL_OWNER_ID = "single-user";

/** Anything that carries ownership. System catalogue rows use `SYSTEM_OWNER_ID` instead. */
export interface Owned {
  owner_id: string;
}

/**
 * Shared, non-personal data (the seeded exercise catalogue, muscle groups). It is identical for
 * everyone and must NOT be duplicated per user when a second person is added.
 */
export const SYSTEM_OWNER_ID = "system";

let overrideOwnerId: string | null = null;

/**
 * The owner for records written right now.
 *
 * Today: the local single owner. When authentication is switched on, this returns the signed-in
 * user's id — one change, in one file, instead of eight constants spread across the domains.
 */
export function currentOwnerId(): string {
  return overrideOwnerId ?? LOCAL_OWNER_ID;
}

/**
 * Test/bootstrap seam for acting as another owner. Production code never calls this; it exists
 * so multi-user behaviour can be proven by tests before any UI exists.
 */
export function withOwner<T>(ownerId: string, fn: () => T): T {
  const previous = overrideOwnerId;
  overrideOwnerId = ownerId;
  try {
    return fn();
  } finally {
    overrideOwnerId = previous;
  }
}

/** True when the record belongs to the person using the app right now. */
export function ownedByCurrent(record: Owned): boolean {
  return record.owner_id === currentOwnerId();
}

/** True for shared system data, which every owner may read. */
export function isSystemOwned(record: Owned): boolean {
  return record.owner_id === SYSTEM_OWNER_ID;
}

/**
 * Records this owner may see: their own, plus shared system data.
 * Legacy rows written before ownership existed (no `owner_id`) are treated as the local
 * owner's, so nothing on the device disappears.
 */
export function visibleToCurrentOwner<T extends Partial<Owned>>(records: T[]): T[] {
  const owner = currentOwnerId();
  return records.filter(
    (r) => !r.owner_id || r.owner_id === owner || r.owner_id === SYSTEM_OWNER_ID,
  );
}
