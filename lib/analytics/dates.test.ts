import { describe, expect, it } from "vitest";
import {
  dayName,
  describePeriods,
  formatDateRange,
  formatShortDate,
  isIsoDate,
  shiftDate,
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

describe("weekStart and dayName", () => {
  it("finds the Sunday that starts the week", () => {
    expect(weekStart("2026-10-13")).toBe("2026-10-11");
    expect(weekStart("2026-10-11")).toBe("2026-10-11");
    expect(weekStart("2026-10-10")).toBe("2026-10-04");
  });

  it("names the day of the week", () => {
    expect(dayName("2026-10-13")).toBe("Tue");
    expect(dayName("2026-10-11")).toBe("Sun");
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

describe("describePeriods", () => {
  it("names both full weeks with their dates", () => {
    expect(
      describePeriods({
        week: { start: "2026-10-11", end: "2026-10-17" },
        current: { start: "2026-10-11", end: "2026-10-17" },
        previous: { start: "2026-10-04", end: "2026-10-10" },
        complete: true,
      }),
    ).toBe("This week (Oct 11 - 17) compared with last week (Oct 4 - 10).");
  });

  it("explains an unfinished week is compared with the same days last week", () => {
    expect(
      describePeriods({
        week: { start: "2026-10-11", end: "2026-10-17" },
        current: { start: "2026-10-11", end: "2026-10-13" },
        previous: { start: "2026-10-04", end: "2026-10-06" },
        complete: false,
      }),
    ).toBe("This week (Oct 11 - 17, so far Sun - Tue) compared with the same days last week (Oct 4 - 6).");
  });

  it("handles a week that has only reached Sunday", () => {
    expect(
      describePeriods({
        week: { start: "2026-10-11", end: "2026-10-17" },
        current: { start: "2026-10-11", end: "2026-10-11" },
        previous: { start: "2026-10-04", end: "2026-10-04" },
        complete: false,
      }),
    ).toBe("This week (Oct 11 - 17, so far Sun) compared with the same day last week (Oct 4).");
  });

  it("says there is no data yet when there are no dates", () => {
    expect(describePeriods(null)).toBe("No data yet.");
  });
});
