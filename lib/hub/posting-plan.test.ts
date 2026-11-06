import { describe, expect, it } from "vitest";
import {
  BUSINESSES,
  SCHEDULE_KEY,
  checkPost,
  checkSettings,
  dayLabel,
  defaultSettings,
  findBusiness,
  generateDrafts,
  hourLabel,
  loadSchedules,
  monthGrid,
  monthLabel,
  planPreview,
  postingDates,
  recommendationsFor,
  regenerateDraft,
  sampleSchedule,
  saveSchedules,
  scheduleFor,
  shiftMonth,
  timeLabel,
  upcomingPosts,
  windowLabel,
} from "./posting-plan";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

const today = "2026-11-05";
const [depot, emporium] = BUSINESSES;

describe("businesses", () => {
  it("has the two businesses from the functionality list", () => {
    expect(BUSINESSES.map((business) => business.name)).toEqual(["Hotel Depot", "Hospitality Emporium"]);
    expect(findBusiness("hospitality-emporium").name).toBe("Hospitality Emporium");
    expect(findBusiness("nope").name).toBe("Hotel Depot");
  });
});

describe("recommendationsFor", () => {
  it("picks four best days and a morning and evening window from sample engagement", () => {
    const rec = recommendationsFor(depot);
    expect(rec.bestDays).toHaveLength(4);
    expect([...rec.bestDays].sort((a, b) => a - b)).toEqual(rec.bestDays);
    expect(rec.windows[0].start).toBeGreaterThanOrEqual(7);
    expect(rec.windows[0].start).toBeLessThanOrEqual(11);
    expect(rec.windows[1].start).toBeGreaterThanOrEqual(17);
    expect(rec.windows[1].end - rec.windows[1].start).toBe(2);
    const mix = Object.values(rec.mix);
    expect(mix.reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it("differs between the two businesses", () => {
    expect(recommendationsFor(depot)).not.toEqual(recommendationsFor(emporium));
  });
});

describe("labels", () => {
  it("formats times, windows, days, and months", () => {
    expect(hourLabel(9)).toBe("9:00 AM");
    expect(hourLabel(18)).toBe("6:00 PM");
    expect(hourLabel(12)).toBe("12:00 PM");
    expect(windowLabel({ label: "Morning", start: 9, end: 11 })).toBe("9:00 AM – 11:00 AM");
    expect(timeLabel("18:30")).toBe("6:30 PM");
    expect(dayLabel("2026-04-02")).toBe("Thu, Apr 2");
    expect(monthLabel("2026-04")).toBe("April 2026");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("monthGrid", () => {
  it("covers the month in Sunday-first weeks", () => {
    const grid = monthGrid("2026-04");
    expect(grid).toHaveLength(5);
    expect(grid[0][0]).toEqual({ date: "2026-03-29", inMonth: false });
    expect(grid[0][3]).toEqual({ date: "2026-04-01", inMonth: true });
    expect(grid[4][6]).toEqual({ date: "2026-05-02", inMonth: false });
    expect(monthGrid("2026-02")).toHaveLength(4); // Feb 2026 starts on a Sunday and has 28 days
  });
});

describe("postingDates", () => {
  it("matches the design's preview: April 2026, Mon / Tue / Thu / Fri, 4 a week = 17 posts", () => {
    expect(postingDates("2026-04-01", "2026-04-30", [1, 2, 4, 5], 4)).toHaveLength(17);
  });

  it("never goes over the weekly limit", () => {
    expect(postingDates("2026-04-05", "2026-04-11", [0, 1, 2, 3, 4, 5, 6], 3)).toEqual(["2026-04-05", "2026-04-06", "2026-04-07"]);
  });
});

describe("sample schedule", () => {
  it("fills the rest of this month and next month on the best days, from today", () => {
    const posts = sampleSchedule(depot, today);
    expect(posts.length).toBeGreaterThan(5);
    expect(posts.every((post) => post.date >= today && post.date <= "2026-12-31")).toBe(true);
    const days = new Set(posts.map((post) => new Date(`${post.date}T12:00:00Z`).getUTCDay()));
    for (const day of days) expect(recommendationsFor(depot).bestDays).toContain(day);
  });

  it("lists upcoming posts soonest first", () => {
    const upcoming = upcomingPosts(sampleSchedule(depot, today), today);
    expect(upcoming).toHaveLength(5);
    expect(upcoming.map((post) => post.date)).toEqual([...upcoming.map((post) => post.date)].sort());
  });
});

describe("generate a plan", () => {
  it("starts next month with the business's recommendations", () => {
    const settings = defaultSettings(depot, today);
    expect(settings.start).toBe("2026-12-01");
    expect(settings.end).toBe("2026-12-31");
    expect(settings.days).toEqual(recommendationsFor(depot).bestDays);
    expect(checkSettings(settings, today)).toEqual({});
  });

  it("explains what to fix", () => {
    const settings = { ...defaultSettings(depot, today), brief: "", direction: "", channels: [], days: [], windows: [], start: "2026-11-01" };
    expect(checkSettings(settings, today)).toEqual({
      brief: "Write a caption or brief, or describe what the plan should focus on.",
      dates: "Start from today or later.",
      channels: "Choose at least one channel.",
      days: "Choose at least one posting day.",
      windows: "Choose at least one time window.",
    });
    expect(checkSettings({ ...defaultSettings(depot, today), end: "2027-04-01" }, today).dates).toBe("Plan up to three months at a time.");
  });

  it("previews the estimated posts and drafts one per posting date", () => {
    const settings = { ...defaultSettings(depot, today), start: "2027-04-01", end: "2027-04-30", days: [1, 2, 4, 5], postsPerWeek: 4 };
    const preview = planPreview(depot, settings);
    expect(preview.days).toBe("Mon, Tue, Thu, Fri");
    const drafts = generateDrafts(depot, settings);
    expect(drafts).toHaveLength(preview.estimatedPosts);
    expect(new Set(drafts.map((draft) => draft.channel))).toEqual(new Set(settings.channels));
    expect(drafts.find((draft) => draft.channel === "TikTok")?.format).toBe("Video");
  });

  it("uses the brief for the first draft and changes the set on Regenerate all", () => {
    const settings = { ...defaultSettings(depot, today), brief: "Our new compostable slippers are in stock.", contentType: "Video" as const };
    const drafts = generateDrafts(depot, settings);
    expect(drafts[0].title).toBe("Our new compostable slippers are in stock");
    expect(drafts[0].format).toBe("Video");
    expect(generateDrafts(depot, settings, 1).map((draft) => draft.title)).not.toEqual(drafts.map((draft) => draft.title));
  });

  it("uses default times when audience insights are off", () => {
    const settings = { ...defaultSettings(emporium, today), windows: ["Morning" as const], useInsights: false };
    expect(new Set(generateDrafts(emporium, settings).map((draft) => draft.time))).toEqual(new Set(["09:00"]));
  });

  it("rewrites one draft in the same category", () => {
    const draft = generateDrafts(depot, defaultSettings(depot, today))[1];
    const again = regenerateDraft(draft, "", 0);
    expect(again.category).toBe(draft.category);
    expect(again.title).not.toBe(draft.title);
    expect(again.date).toBe(draft.date);
  });
});

describe("checkPost", () => {
  it("needs a title, a date from today, and a time", () => {
    expect(checkPost({ title: "", caption: "", date: "2026-11-01", time: "" }, today)).toEqual({
      title: "Add a title.",
      date: "Choose today or a later date.",
      time: "Choose a time.",
    });
    expect(checkPost({ title: "Hi", caption: "", date: today, time: "09:00" }, today)).toEqual({});
  });
});

describe("saved schedules", () => {
  it("keeps each business separate and falls back to the sample schedule", () => {
    const storage = new MemoryStorage() as unknown as Storage;
    const posts = sampleSchedule(depot, today).slice(0, 2);
    expect(saveSchedules(storage, { "hotel-depot": { posts, autoPublish: true } })).toBe(true);
    const saved = loadSchedules(storage);
    expect(scheduleFor(saved, depot, today)).toEqual({ posts, autoPublish: true });
    expect(scheduleFor(saved, emporium, today).autoPublish).toBe(false);
    expect(scheduleFor(saved, emporium, today).posts.length).toBeGreaterThan(5);
  });

  it("ignores broken data", () => {
    const storage = new MemoryStorage() as unknown as Storage;
    storage.setItem(SCHEDULE_KEY, "nope");
    expect(loadSchedules(storage)).toEqual({});
    storage.setItem(SCHEDULE_KEY, JSON.stringify({ version: 1, businesses: { "hotel-depot": { posts: [{ id: 1 }], autoPublish: false } } }));
    expect(loadSchedules(storage)).toEqual({ "hotel-depot": { posts: [], autoPublish: false } });
    expect(saveSchedules(undefined, {})).toBe(false);
  });
});
