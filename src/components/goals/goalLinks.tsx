/**
 * Type-safe domain-scoped goal links.
 *
 * יעדים מנוהלים בתוך התחום שלהם בלבד (החלטת מוצר: אין מסך יעדים גלובלי).
 * TanStack `<Link to>` דורש route literal לבדיקת טיפוסים — לכן כאן ענפים מפורשים
 * לכל domain במקום מחרוזת דינמית. זה שומר type-safety מלא ומונע drift.
 */
import { Link, Navigate } from "@tanstack/react-router";
import type { GoalDomain } from "@/lib/goals";
import type { ReactNode } from "react";

interface LinkProps {
  domain: GoalDomain;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}

/** קישור לרשימת היעדים של התחום. */
export function GoalListLink({ domain, className, children, ...rest }: LinkProps) {
  if (domain === "running")
    return (
      <Link to="/running/goals" className={className} {...rest}>
        {children}
      </Link>
    );
  if (domain === "gym")
    return (
      <Link to="/gym/goals" className={className} {...rest}>
        {children}
      </Link>
    );
  return (
    <Link to="/home/goals" className={className} {...rest}>
      {children}
    </Link>
  );
}

/** קישור ליצירת יעד חדש בתוך התחום. */
export function GoalNewLink({ domain, className, children, ...rest }: LinkProps) {
  if (domain === "running")
    return (
      <Link to="/running/goals/new" className={className} {...rest}>
        {children}
      </Link>
    );
  if (domain === "gym")
    return (
      <Link to="/gym/goals/new" className={className} {...rest}>
        {children}
      </Link>
    );
  return (
    <Link to="/home/goals/new" className={className} {...rest}>
      {children}
    </Link>
  );
}

interface IdLinkProps extends LinkProps {
  id: string;
}

/** קישור לפרטי יעד בתוך התחום. */
export function GoalDetailLink({ domain, id, className, children, ...rest }: IdLinkProps) {
  if (domain === "running")
    return (
      <Link to="/running/goals/$id" params={{ id }} className={className} {...rest}>
        {children}
      </Link>
    );
  if (domain === "gym")
    return (
      <Link to="/gym/goals/$id" params={{ id }} className={className} {...rest}>
        {children}
      </Link>
    );
  return (
    <Link to="/home/goals/$id" params={{ id }} className={className} {...rest}>
      {children}
    </Link>
  );
}

/** קישור לעריכת יעד בתוך התחום. */
export function GoalEditLink({ domain, id, className, children, ...rest }: IdLinkProps) {
  if (domain === "running")
    return (
      <Link to="/running/goals/$id/edit" params={{ id }} className={className} {...rest}>
        {children}
      </Link>
    );
  if (domain === "gym")
    return (
      <Link to="/gym/goals/$id/edit" params={{ id }} className={className} {...rest}>
        {children}
      </Link>
    );
  return (
    <Link to="/home/goals/$id/edit" params={{ id }} className={className} {...rest}>
      {children}
    </Link>
  );
}

// ---------- Redirect helpers (compatibility routes) ----------

/** redirect בטוח לרשימת יעדי התחום. */
export function GoalListRedirect({ domain }: { domain: GoalDomain }) {
  if (domain === "running") return <Navigate to="/running/goals" replace />;
  if (domain === "gym") return <Navigate to="/gym/goals" replace />;
  return <Navigate to="/home/goals" replace />;
}

/** redirect בטוח ליצירת יעד בתחום. */
export function GoalNewRedirect({ domain }: { domain: GoalDomain }) {
  if (domain === "running") return <Navigate to="/running/goals/new" replace />;
  if (domain === "gym") return <Navigate to="/gym/goals/new" replace />;
  return <Navigate to="/home/goals/new" replace />;
}

/** redirect בטוח לפרטי יעד בתחום — היעד קיים ותחומו ידוע. */
export function GoalDetailRedirect({ domain, id }: { domain: GoalDomain; id: string }) {
  if (domain === "running") return <Navigate to="/running/goals/$id" params={{ id }} replace />;
  if (domain === "gym") return <Navigate to="/gym/goals/$id" params={{ id }} replace />;
  return <Navigate to="/home/goals/$id" params={{ id }} replace />;
}
