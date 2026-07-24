/**
 * Repository entrypoint — מחזיר את ה־active repository.
 * כרגע: mock בלבד. כשיתחבר Supabase, נחליף כאן בלי לגעת ב־UI.
 */
import { mockRepository } from "./mock";
import type { Repository, RepoKind } from "./types";

export const activeRepo: Repository = mockRepository;
export const activeRepoKind: RepoKind = "mock";

export * from "./types";
export { createInMemoryRepo } from "./mock";
