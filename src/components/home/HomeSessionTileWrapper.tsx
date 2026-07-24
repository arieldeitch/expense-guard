/**
 * HomeSessionTileWrapper — עוטף חישובים ליחידת אריח לפי sessionId.
 */
import {
  listEntrySets,
  listSessionEntries,
  useHomeSession,
  sumReps,
} from "@/lib/home";
import { HomeSessionTile } from "./HomeSessionTile";

export function HomeSessionTileWrapper({ sessionId }: { sessionId: string }) {
  const session = useHomeSession(sessionId);
  if (!session) return null;
  const entries = listSessionEntries(sessionId);
  let totalSets = 0;
  let totalReps = 0;
  for (const e of entries) {
    const sets = listEntrySets(e.id);
    totalSets += sets.filter((s) => s.completed && !s.skipped).length;
    totalReps += sumReps(sets);
  }
  const primary =
    session.is_quick_entry && entries[0]
      ? entries[0].snapshot.exercise_name
      : session.name;
  return (
    <HomeSessionTile
      session={session}
      primaryLabel={primary}
      totalReps={totalReps}
      totalSets={totalSets}
      totalExercises={entries.length}
      durationSeconds={session.duration_seconds}
      recordsCount={0}
    />
  );
}

export default HomeSessionTileWrapper;
