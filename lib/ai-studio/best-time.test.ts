import { describe, expect, it } from "vitest";
import { bestTimes, formatSlot, formatTime, nextBestTime } from "./best-time";
import { sampleEngagementByHour } from "./sample-timing";

describe("sampleEngagementByHour", () => {
  it("has one slot for every weekday and hour", () => {
    expect(sampleEngagementByHour("instagram")).toHaveLength(7 * 24);
  });

  it("is the same every time", () => {
    expect(sampleEngagementByHour("tiktok")).toEqual(sampleEngagementByHour("tiktok"));
  });

  it("reflects each platform's habits", () => {
    const average = (platform: Parameters<typeof sampleEngagementByHour>[0], test: (weekday: number, hour: number) => boolean) => {
      const slots = sampleEngagementByHour(platform).filter((s) => test(s.weekday, s.hour));
      return slots.reduce((sum, s) => sum + s.rate, 0) / slots.length;
    };
    // LinkedIn is busier on weekdays; TikTok in the evening.
    expect(average("linkedin", (d) => d >= 1 && d <= 5)).toBeGreaterThan(average("linkedin", (d) => d === 0 || d === 6));
    expect(average("tiktok", (_, h) => h >= 19 && h <= 22)).toBeGreaterThan(average("tiktok", (_, h) => h >= 6 && h <= 9));
  });
});

describe("bestTimes", () => {
  it("returns the top slots for a platform, best first", () => {
    const top = bestTimes("instagram", 3);
    expect(top).toHaveLength(3);
    expect(top[0].rate).toBeGreaterThanOrEqual(top[1].rate);
    expect(top[1].rate).toBeGreaterThanOrEqual(top[2].rate);
  });

  it("keeps the top slots on different days so the advice is varied", () => {
    const days = bestTimes("tiktok", 3).map((slot) => slot.weekday);
    expect(new Set(days).size).toBe(3);
  });
});

describe("formatSlot", () => {
  it("shows the day and a 12-hour time", () => {
    expect(formatSlot({ weekday: 2, hour: 19 })).toBe("Tue 7 PM");
    expect(formatSlot({ weekday: 0, hour: 0 })).toBe("Sun 12 AM");
    expect(formatSlot({ weekday: 6, hour: 12 })).toBe("Sat 12 PM");
  });
});

describe("nextBestTime", () => {
  it("finds the next upcoming best slot", () => {
    const top = bestTimes("instagram", 3);
    // Fri 2026-10-09 at noon (local time).
    const next = nextBestTime("instagram", new Date(2026, 9, 9, 12, 0));
    expect(next.time).toMatch(/^\d{2}:00$/);
    const when = new Date(`${next.date}T${next.time}:00`);
    expect(when.getTime()).toBeGreaterThan(new Date(2026, 9, 9, 12, 0).getTime());
    expect(top.some((slot) => slot.weekday === when.getDay() && slot.hour === when.getHours())).toBe(true);
  });

  it("never suggests a time that has already passed today", () => {
    const now = new Date(2026, 9, 9, 23, 30);
    const next = nextBestTime("tiktok", now);
    expect(new Date(`${next.date}T${next.time}:00`).getTime()).toBeGreaterThan(now.getTime());
  });
});

describe("formatTime", () => {
  it("turns 24-hour times into 12-hour times", () => {
    expect(formatTime("19:00")).toBe("7:00 PM");
    expect(formatTime("08:15")).toBe("8:15 AM");
    expect(formatTime("00:30")).toBe("12:30 AM");
    expect(formatTime("12:00")).toBe("12:00 PM");
  });
});
