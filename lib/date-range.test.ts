import { describe, expect, it } from "vitest";
import {
  NOTICES,
  dataRange,
  dateQuery,
  pageDates,
  describeSelection,
  rangeLabel,
  resolveDateRange,
  toSearchParams,
  withQuery,
} from "./date-range";

// The test clock (vitest.setup.ts) is Fri 2026-10-09; its week starts Sun 2026-10-04.
const TODAY = "2026-10-09";

describe("resolveDateRange: defaults and quick options", () => {
  it("defaults to this week so far vs the same days last week", () => {
    expect(resolveDateRange({}, TODAY)).toEqual({
      selection: { period: "this-week", compare: "previous" },
      current: { start: "2026-10-04", end: "2026-10-09" },
      comparison: { start: "2026-09-27", end: "2026-10-02" },
      notices: [],
    });
  });

  it("supports last 7 and last 30 days, compared with the period right before", () => {
    const week = resolveDateRange({ period: "last-7-days" }, TODAY);
    expect(week.current).toEqual({ start: "2026-10-03", end: "2026-10-09" });
    expect(week.comparison).toEqual({ start: "2026-09-26", end: "2026-10-02" });

    const month = resolveDateRange({ period: "last-30-days" }, TODAY);
    expect(month.current).toEqual({ start: "2026-09-10", end: "2026-10-09" });
    expect(month.comparison).toEqual({ start: "2026-08-11", end: "2026-09-09" });
  });

  it("compares with the same period last year", () => {
    const result = resolveDateRange({ compare: "last-year" }, TODAY);
    expect(result.comparison).toEqual({ start: "2025-10-04", end: "2025-10-09" });
  });

  it("moves Feb 29 to Feb 28 when going back a year", () => {
    const result = resolveDateRange(
      { period: "custom", from: "2024-02-29", to: "2024-02-29", compare: "last-year" },
      TODAY,
    );
    expect(result.comparison).toEqual({ start: "2023-02-28", end: "2023-02-28" });
  });

  it("takes the first value when a parameter appears twice", () => {
    expect(resolveDateRange({ period: ["last-7-days", "last-30-days"] }, TODAY).selection.period).toBe("last-7-days");
  });
});

describe("resolveDateRange: custom dates", () => {
  it("uses custom dates and compares with the same number of days right before", () => {
    const result = resolveDateRange({ period: "custom", from: "2026-08-01", to: "2026-08-10" }, TODAY);
    expect(result.current).toEqual({ start: "2026-08-01", end: "2026-08-10" });
    expect(result.comparison).toEqual({ start: "2026-07-22", end: "2026-07-31" });
    expect(result.notices).toEqual([]);
  });

  it("uses custom comparison dates", () => {
    const result = resolveDateRange({ compare: "custom", compareFrom: "2025-01-01", compareTo: "2025-01-07" }, TODAY);
    expect(result.comparison).toEqual({ start: "2025-01-01", end: "2025-01-07" });
  });

  it("swaps a start date that is after the end date", () => {
    const result = resolveDateRange({ period: "custom", from: "2026-08-10", to: "2026-08-01" }, TODAY);
    expect(result.current).toEqual({ start: "2026-08-01", end: "2026-08-10" });
  });

  it("stops at today when the end date is in the future", () => {
    const result = resolveDateRange({ period: "custom", from: "2026-10-01", to: "2026-12-01" }, TODAY);
    expect(result.current).toEqual({ start: "2026-10-01", end: "2026-10-09" });
    expect(result.notices).toEqual([NOTICES.future]);
  });

  it("falls back to the default when the whole range is in the future", () => {
    const result = resolveDateRange({ period: "custom", from: "2027-01-01", to: "2027-01-10" }, TODAY);
    expect(result.selection.period).toBe("this-week");
    expect(result.notices).toEqual([NOTICES.future]);
  });

  it("falls back to the default for malformed dates or unknown options", () => {
    expect(resolveDateRange({ period: "custom", from: "bad", to: "2026-08-10" }, TODAY).notices).toEqual([NOTICES.invalid]);
    expect(resolveDateRange({ period: "forever" }, TODAY)).toMatchObject({
      selection: { period: "this-week" },
      notices: [NOTICES.invalid],
    });
    expect(resolveDateRange({ compare: "custom", compareFrom: "2025-13-01", compareTo: "2025-01-07" }, TODAY)).toMatchObject({
      selection: { compare: "previous" },
      notices: [NOTICES.invalid],
    });
  });

  it("limits ranges to 366 days", () => {
    const result = resolveDateRange({ period: "custom", from: "2024-01-01", to: "2026-10-09" }, TODAY);
    expect(result.current).toEqual({ start: "2025-10-09", end: "2026-10-09" });
    expect(result.notices).toEqual([NOTICES.tooLong]);
  });
});

describe("toSearchParams", () => {
  it("leaves out the defaults", () => {
    expect(toSearchParams({ period: "this-week", compare: "previous" })).toBe("");
  });

  it("writes quick options and custom dates", () => {
    expect(toSearchParams({ period: "last-30-days", compare: "last-year" })).toBe("period=last-30-days&compare=last-year");
    expect(
      toSearchParams({
        period: "custom",
        from: "2026-08-01",
        to: "2026-08-10",
        compare: "custom",
        compareFrom: "2025-08-01",
        compareTo: "2025-08-10",
      }),
    ).toBe("period=custom&from=2026-08-01&to=2026-08-10&compare=custom&compareFrom=2025-08-01&compareTo=2025-08-10");
  });

  it("round-trips through resolveDateRange", () => {
    const selection = { period: "custom", from: "2026-08-01", to: "2026-08-10", compare: "last-year" } as const;
    const params = Object.fromEntries(new URLSearchParams(toSearchParams(selection)));
    expect(resolveDateRange(params, TODAY).selection).toEqual(selection);
  });
});

describe("withQuery", () => {
  it("adds the query string to a link only when there is one", () => {
    expect(withQuery("/analytics", "period=last-7-days")).toBe("/analytics?period=last-7-days");
    expect(withQuery("/analytics", "")).toBe("/analytics");
  });
});

describe("rangeLabel and describeSelection", () => {
  it("leaves out the year when both ranges are in the current year", () => {
    const resolved = resolveDateRange({}, TODAY);
    expect(rangeLabel(resolved, resolved.comparison, TODAY)).toBe("Sep 27 - Oct 2");
    expect(describeSelection(resolved, TODAY)).toBe("Showing Oct 4 - 9 compared with Sep 27 - Oct 2.");
  });

  it("adds years when a range is outside the current year", () => {
    expect(describeSelection(resolveDateRange({ compare: "last-year" }, TODAY), TODAY)).toBe(
      "Showing Oct 4 - 9, 2026 compared with Oct 4 - 9, 2025.",
    );
  });

  it("shows both years when a range crosses into a new year", () => {
    const resolved = resolveDateRange({ period: "custom", from: "2025-12-28", to: "2026-01-03" }, TODAY);
    expect(rangeLabel(resolved, resolved.current, TODAY)).toBe("Dec 28, 2025 - Jan 3, 2026");
  });
});

describe("dataRange", () => {
  it("covers both the shown and the comparison periods", () => {
    expect(dataRange(resolveDateRange({ compare: "last-year" }, TODAY))).toEqual({ start: "2025-10-04", end: "2026-10-09" });
    expect(dataRange(resolveDateRange({}, TODAY))).toEqual({ start: "2026-09-27", end: "2026-10-09" });
  });
});

describe("dateQuery", () => {
  it("keeps only the date bar's parameters from the address", () => {
    expect(dateQuery(new URLSearchParams("period=custom&from=2026-08-01&to=2026-08-10&utm_source=x"))).toBe(
      "period=custom&from=2026-08-01&to=2026-08-10",
    );
    expect(dateQuery(new URLSearchParams(""))).toBe("");
  });
});

describe("pageDates", () => {
  it("bundles everything a page needs about the chosen dates", () => {
    const dates = pageDates({ period: "last-7-days", utm_source: "x" }, TODAY);
    expect(dates.ranges).toEqual({
      current: { start: "2026-10-03", end: "2026-10-09" },
      comparison: { start: "2026-09-26", end: "2026-10-02" },
    });
    expect(dates.currentLabel).toBe("Oct 3 - 9");
    expect(dates.comparisonLabel).toBe("Sep 26 - Oct 2");
    expect(dates.dataRange).toEqual({ start: "2026-09-26", end: "2026-10-09" });
    expect(dates.query).toBe("period=last-7-days");
  });
});
