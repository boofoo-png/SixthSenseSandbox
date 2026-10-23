import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isActivePath } from "./navigation";

describe("NAV_ITEMS", () => {
  it("lists the sections in order", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Overview",
      "Analytics",
      "Competitors",
      "AI Studio",
      "Reports",
    ]);
  });

  it("marks only built sections as ready", () => {
    const ready = NAV_ITEMS.filter((item) => item.status === "ready").map((item) => item.href);
    expect(ready).toEqual(["/", "/analytics", "/competitors", "/ai-studio", "/reports"]);
  });

  it("uses unique hrefs that start with a slash", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href.startsWith("/")).toBe(true);
    }
  });
});

describe("isActivePath", () => {
  it("matches the overview only on the exact root path", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/", "/analytics")).toBe(false);
  });

  it("matches a section and its sub-pages", () => {
    expect(isActivePath("/analytics", "/analytics")).toBe(true);
    expect(isActivePath("/analytics", "/analytics/instagram")).toBe(true);
  });

  it("does not match a section that only shares a prefix", () => {
    expect(isActivePath("/reports", "/reports-archive")).toBe(false);
  });
});
