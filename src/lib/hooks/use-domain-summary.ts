/**
 * useDomainSummary — מחזיר את ה־DomainSummary עבור דומיין נתון.
 * טוען דרך TanStack Query, מבודד את ה־UI מהשכבה התחתונה.
 */
import { useQuery } from "@tanstack/react-query";
import { activeRepo } from "@/lib/repo";
import type { Domain } from "@/lib/repo";
import { computeDomainSummary, type DomainSummary } from "@/lib/selectors/domain-summary";

export function domainSummaryQueryKey(domain: Domain) {
  return ["domain-summary", domain] as const;
}

export function useDomainSummary(domain: Domain) {
  return useQuery<DomainSummary>({
    queryKey: domainSummaryQueryKey(domain),
    queryFn: async () => {
      const [activities, goals] = await Promise.all([
        activeRepo.listActivities(domain),
        activeRepo.listGoals(domain),
      ]);
      return computeDomainSummary(domain, activities, goals);
    },
    staleTime: 30_000,
  });
}
