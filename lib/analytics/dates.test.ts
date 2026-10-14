import { describe, expect, it } from "vitest";
import {
  daysInRange,
  formatDateRange,
  formatShortDate,
  isIsoDate,
  shiftDate,
  shiftYear,
  todayIsoDate,
  weekStart,
} from "./dates";

describe("shiftDate", () => {
  it("moves forwards and backwards across month boundaries", () => {
    expect(shiftDate("2026-10-01", -1)).toBe("2026-09-30");
    expect(shiftDate("2026-09-30", 2)).toBe("2026-10-02");
  });
});

describe("isIsoDate", () => {
  it("accepts real YYYY-MM-DD dates only", () => {
    expect(isIsoDate("2026-10-09")).toBe(true);
    expect(isIsoDate("2026-10-9")).toBe(false);
    expect(isIsoDate("2026-02-31")).toBe(false);
  });
});

describe("formatShortDate", () => {
  it("shows the month name and day without a leading zero", () => {
    expect(formatShortDate("2026-10-09")).toBe("Oct 9");
    expect(formatShortDate("2026-09-26")).toBe("Sep 26");
  });
});

describe("weekStart", () => {
  it("finds the Sunday that starts the week", () => {
    expect(weekStart("2026-10-13")).toBe("2026-10-11");
    expect(weekStart("2026-10-11")).toBe("2026-10-11");
    expect(weekStart("2026-10-10")).toBe("2026-10-04");
  });
});

describe("formatDateRange", () => {
  it("shows a single day once", () => {
    expect(formatDateRange({ start: "2026-10-04", end: "2026-10-04" })).toBe("Oct 4");
  });

  it("shortens ranges within one month", () => {
    expect(formatDateRange({ start: "2026-10-03", end: "2026-10-09" })).toBe("Oct 3 - 9");
  });

  it("shows both months when a range crosses months", () => {
    expect(formatDateRange({ start: "2026-09-26", end: "2026-10-02" })).toBe("Sep 26 - Oct 2");
  });
  it("adds the year when asked", () => {
    expect(formatDateRange({ start: "2026-10-04", end: "2026-10-09" }, true)).toBe("Oct 4 - 9, 2026");
    expect(formatDateRange({ start: "2025-09-27", end: "2025-10-02" }, true)).toBe("Sep 27 - Oct 2, 2025");
    expect(formatDateRange({ start: "2025-10-04", end: "2025-10-04" }, true)).toBe("Oct 4, 2025");
  });

  it("always shows both years when a range crosses years", () => {
    expect(formatDateRange({ start: "2025-12-28", end: "2026-01-03" })).toBe("Dec 28, 2025 - Jan 3, 2026");
  });
});

describe("daysInRange and shiftYear", () => {
  it("counts days inclusively", () => {
    expect(daysInRange({ start: "2026-10-04", end: "2026-10-09" })).toBe(6);
    expect(daysInRange({ start: "2026-10-04", end: "2026-10-04" })).toBe(1);
  });

  it("moves a date back a year, turning Feb 29 into Feb 28", () => {
    expect(shiftYear("2026-10-09", -1)).toBe("2025-10-09");
    expect(shiftYear("2024-02-29", -1)).toBe("2023-02-28");
  });
});

describe("todayIsoDate", () => {
  it("formats the local calendar date as YYYY-MM-DD", () => {
    expect(todayIsoDate(new Date(2026, 9, 9, 23, 30))).toBe("2026-10-09");
    expect(todayIsoDate(new Date(2026, 0, 5, 0, 1))).toBe("2026-01-05");
  });

  it("defaults to the current time", () => {
    // vitest.setup.ts fixes the clock to 2026-10-09.
    expect(todayIsoDate()).toBe("2026-10-09");
  });
});
