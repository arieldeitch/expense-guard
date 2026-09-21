import { describe, expect, it } from "vitest";
import { activeNavTarget } from "./nav";

describe("main navigation — exactly one active destination", () => {
  it.each([
    ["/", "/"],
    ["/running", "/"],
    ["/gym", "/"],
    ["/home", "/"],
    ["/running/abc", "/"],
    ["/report", "/report"],
    ["/running/new/treadmill", "/report"],
    ["/running/abc/edit", "/report"],
    ["/home/quick", "/report"],
    ["/home/sessions/abc", "/report"],
    ["/gym/new", "/report"],
    ["/sessions/abc", "/report"],
    ["/history", "/history"],
    ["/plans", "/plans"],
    ["/running/project", "/plans"],
    ["/goals/new", "/plans"],
    ["/home/templates", "/plans"],
    ["/more", "/more"],
    ["/backup", "/more"],
    ["/exercises/abc", "/more"],
    ["/treadmills/abc", "/more"],
  ])("%s → %s", (pathname, expected) => {
    expect(activeNavTarget(pathname)).toBe(expected);
  });
});
