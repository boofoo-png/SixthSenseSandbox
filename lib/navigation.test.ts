import { describe, expect, it } from "vitest";
import { ACCOUNT_ITEMS, APP_NAME, NAV_ITEMS, isActivePath } from "./navigation";

describe("APP_NAME", () => {
  it("is the product name from the mid-fi", () => {
    expect(APP_NAME).toBe("Sixth Sense");
  });
});

describe("NAV_ITEMS", () => {
  it("lists the dashboard, then the seven areas in dashboard tile order", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Dashboard",
      "Insight Report",
      "Revisit Findings",
      "Research Competitors",
      "Explore Audience and Trend",
      "AI Management",
      "Content Creation",
      "Campaigns",
    ]);
  });

  it("gives each area its own address", () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      "/",
      "/insights",
      "/findings",
      "/competitors",
      "/explore",
      "/ai-management",
      "/content",
      "/campaigns",
    ]);
  });

  it("marks only built areas as ready", () => {
    const ready = NAV_ITEMS.filter((item) => item.status === "ready").map((item) => item.href);
    expect(ready).toEqual(["/", "/insights", "/competitors"]);
  });

  it("describes what is planned for every area that is not built yet", () => {
    for (const item of [...NAV_ITEMS, ...ACCOUNT_ITEMS]) {
      if (item.status === "coming-soon") {
        expect(item.summary.length).toBeGreaterThan(0);
        expect(item.planned.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("ACCOUNT_ITEMS", () => {
  it("has the profile and settings pages from the top bar", () => {
    expect(ACCOUNT_ITEMS.map((item) => [item.label, item.href])).toEqual([
      ["Profile", "/profile"],
      ["Settings", "/settings"],
    ]);
  });
});

describe("all items", () => {
  it("use unique hrefs that start with a slash", () => {
    const hrefs = [...NAV_ITEMS, ...ACCOUNT_ITEMS].map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href.startsWith("/")).toBe(true);
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
