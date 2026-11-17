import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APP_NAME, SIDEBAR_ITEMS, isActivePath } from "./navigation";

describe("APP_NAME", () => {
  it("is the product name from the mid-fi", () => {
    expect(APP_NAME).toBe("Sixth Sense");
  });
});

describe("SIDEBAR_ITEMS", () => {
  it("has the Figma Make's menu, in its order", () => {
    expect(SIDEBAR_ITEMS.map((item) => item.label)).toEqual([
      "Overview",
      "Audience Trends",
      "Competitors",
      "Content Creation",
      "AI Management",
      "Reports",
    ]);
  });

  it("links every item (and every page it stays active on) to a page this app has, each to a different one", () => {
    const hrefs = SIDEBAR_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of [...hrefs, ...SIDEBAR_ITEMS.flatMap((item) => item.also ?? [])]) {
      expect(existsSync(`app/(dashboard)${href === "/" ? "" : href}/page.tsx`), href).toBe(true);
    }
  });
});

describe("isActivePath", () => {
  it("matches the dashboard only on the exact root path", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/", "/insights")).toBe(false);
  });

  it("matches an area and its sub-pages", () => {
    expect(isActivePath("/content", "/content")).toBe(true);
    expect(isActivePath("/content", "/content/social-post")).toBe(true);
  });

  it("does not match an area that only shares a prefix", () => {
    expect(isActivePath("/content", "/content-archive")).toBe(false);
  });
});
