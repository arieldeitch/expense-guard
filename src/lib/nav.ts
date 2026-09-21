/**
 * Main navigation model (ADR-0042): five destinations, exactly one active for any pathname.
 * Pure so it can be unit-tested; the shell components only render it.
 */
const under = (pathname: string, p: string) => pathname === p || pathname.startsWith(p + "/");

/** Exactly one destination is active: report/history/plans/more by their screens, else ראשי. */
export function activeNavTarget(pathname: string): string {
  if (
    under(pathname, "/report") ||
    under(pathname, "/running/new") ||
    /^[/]running[/][^/]+[/]edit$/.test(pathname) ||
    under(pathname, "/home/quick") ||
    under(pathname, "/home/sessions") ||
    under(pathname, "/gym/new") ||
    under(pathname, "/sessions")
  )
    return "/report";
  if (under(pathname, "/history")) return "/history";
  if (
    under(pathname, "/plans") ||
    under(pathname, "/running/project") ||
    under(pathname, "/goals") ||
    under(pathname, "/templates") ||
    under(pathname, "/home/templates") ||
    under(pathname, "/home/goals") ||
    under(pathname, "/gym/goals")
  )
    return "/plans";
  if (
    under(pathname, "/more") ||
    under(pathname, "/backup") ||
    under(pathname, "/trash") ||
    under(pathname, "/locations") ||
    under(pathname, "/exercises") ||
    under(pathname, "/treadmills")
  )
    return "/more";
  return "/";
}
