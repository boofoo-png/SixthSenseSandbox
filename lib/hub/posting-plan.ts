import { shiftDate } from "@/lib/analytics/dates";
import type { Platform } from "@/lib/analytics/types";
import { sampleEngagementByHour } from "@/lib/ai-studio/sample-timing";
import { THEMES, seedOf, shorten, themeOf } from "./content/themes";

// AI Management as the team's functionality list and design file describe it (2026-11-05): an AI
// posting plan, a content calendar, upcoming posts, and a three-step plan generator, kept
// separately for two sample businesses. Recommendations come from sample engagement
// (lib/ai-studio); drafts are templates. Auto Publishing is simulated: nothing is ever posted.

export const TIME_ZONE = "Pacific Time (PST)";

export const CHANNELS = ["Instagram", "TikTok", "LinkedIn", "YouTube", "X (Twitter)"] as const;
export type Channel = (typeof CHANNELS)[number];

export const FORMATS = ["Image", "Video", "Carousel", "Text only", "Link"] as const;
export type PostFormat = (typeof FORMATS)[number];

/** Formats suggested for each channel (functionality list: carousel for Instagram, video for TikTok). */
export const SUGGESTED_FORMAT: Record<Channel, PostFormat> = {
  Instagram: "Carousel",
  TikTok: "Video",
  LinkedIn: "Carousel",
  YouTube: "Video",
  "X (Twitter)": "Text only",
};

export const MIX = ["Educational", "Inspirational", "Promotional", "Behind the scenes"] as const;
export type MixCategory = (typeof MIX)[number];

export const GOALS = ["Increase engagement", "Grow followers", "Drive website visits", "Promote an offer"] as const;
export type PlanGoal = (typeof GOALS)[number];

export type Business = {
  id: "hotel-depot" | "hospitality-emporium";
  name: string;
  handle: string;
  /** How much each sample platform's audience counts when picking days and times. */
  weights: Partial<Record<Platform, number>>;
  postsPerWeek: [number, number];
  mix: Record<MixCategory, number>;
};

/** The two businesses on the functionality list, each with its own schedule. */
export const BUSINESSES: readonly Business[] = [
  {
    id: "hotel-depot",
    name: "Hotel Depot",
    handle: "@hoteldepot",
    weights: { linkedin: 1.2, instagram: 1, tiktok: 0.5 },
    postsPerWeek: [4, 5],
    mix: { Educational: 40, Inspirational: 25, Promotional: 20, "Behind the scenes": 15 },
  },
  {
    id: "hospitality-emporium",
    name: "Hospitality Emporium",
    handle: "@hospitalityemporium",
    weights: { instagram: 1.2, tiktok: 1.1, linkedin: 0.4 },
    postsPerWeek: [5, 6],
    mix: { Educational: 30, Inspirational: 30, Promotional: 25, "Behind the scenes": 15 },
  },
];

export type BusinessId = Business["id"];

export function findBusiness(id: string | undefined): Business {
  return BUSINESSES.find((business) => business.id === id) ?? BUSINESSES[0];
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type TimeWindow = { label: "Morning" | "Evening"; start: number; end: number };

export type Recommendations = {
  postsPerWeek: [number, number];
  /** Weekday numbers (0 = Sunday), in week order. */
  bestDays: number[];
  windows: [TimeWindow, TimeWindow];
  mix: Record<MixCategory, number>;
};

function weightedSlots(business: Business) {
  const totals = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const [platform, weight] of Object.entries(business.weights) as [Platform, number][]) {
    for (const slot of sampleEngagementByHour(platform)) totals[slot.weekday][slot.hour] += slot.rate * weight;
  }
  return totals;
}

/** Recommended frequency, best days, best time windows, and content mix for a business. */
export function recommendationsFor(business: Business): Recommendations {
  const totals = weightedSlots(business);
  const dayScores = totals.map((hours) => hours.reduce((sum, rate) => sum + rate, 0));
  const bestDays = dayScores
    .map((score, weekday) => ({ score, weekday }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((day) => day.weekday)
    .sort((a, b) => a - b);
  const hourScores = Array.from({ length: 24 }, (_, hour) => totals.reduce((sum, day) => sum + day[hour], 0));
  const best = (from: number, to: number) => {
    let top = from;
    for (let hour = from; hour <= to; hour++) if (hourScores[hour] > hourScores[top]) top = hour;
    return top;
  };
  const morning = best(7, 11);
  const evening = best(17, 21);
  return {
    postsPerWeek: business.postsPerWeek,
    bestDays,
    windows: [
      { label: "Morning", start: morning, end: morning + 2 },
      { label: "Evening", start: evening, end: evening + 2 },
    ],
    mix: business.mix,
  };
}

/** 9 -> "9:00 AM", 18 -> "6:00 PM". */
export function hourLabel(hour: number): string {
  const suffix = hour < 12 || hour === 24 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:00 ${suffix}`;
}

/** Times used when "Use audience insights" is off. */
export const DEFAULT_WINDOWS: TimeWindow[] = [
  { label: "Morning", start: 9, end: 11 },
  { label: "Evening", start: 18, end: 20 },
];

export function windowLabel(window: TimeWindow): string {
  return `${hourLabel(window.start)} – ${hourLabel(window.end)}`;
}

/** "09:00" -> "9:00 AM". */
export function timeLabel(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  return hourLabel(hour).replace(":00", `:${String(minute).padStart(2, "0")}`);
}

function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT_MONTHS = MONTH_NAMES.map((name) => name.slice(0, 3));

/** "Thu, Apr 2". */
export function dayLabel(date: string): string {
  return `${WEEKDAYS[weekdayOf(date)]}, ${SHORT_MONTHS[Number(date.slice(5, 7)) - 1]} ${Number(date.slice(8, 10))}`;
}

/** "April 2026" for "2026-04". */
export function monthLabel(month: string): string {
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

/** The month before or after "YYYY-MM". */
export function shiftMonth(month: string, by: number): string {
  const index = Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1 + by;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** Sunday-first weeks covering a month, each day marked as in the month or not. */
export function monthGrid(month: string): { date: string; inMonth: boolean }[][] {
  const first = `${month}-01`;
  let day = shiftDate(first, -weekdayOf(first));
  const weeks: { date: string; inMonth: boolean }[][] = [];
  do {
    const week = Array.from({ length: 7 }, (_, index) => {
      const date = shiftDate(day, index);
      return { date, inMonth: date.slice(0, 7) === month };
    });
    weeks.push(week);
    day = shiftDate(day, 7);
  } while (day.slice(0, 7) === month);
  return weeks;
}

export type ScheduledPost = {
  id: string;
  date: string;
  /** "HH:MM", Pacific Time. */
  time: string;
  channel: Channel;
  format: PostFormat;
  title: string;
  caption: string;
  hashtags: string[];
  category: MixCategory;
  /** Image in public/content shown as the post's thumbnail. */
  image: string;
};

const IDEAS: Record<MixCategory, { title: string; caption: string }[]> = {
  Educational: [
    { title: "How to choose refillable amenities", caption: "Three questions to ask before you switch your guest amenities." },
    { title: "Linen care that lasts", caption: "Simple washing habits that keep hotel linens bright for longer." },
    { title: "Stocking for a busy weekend", caption: "A checklist to make sure every room is ready before check-in." },
  ],
  Inspirational: [
    { title: "Small change, memorable stay", caption: "The little details guests remember long after checkout." },
    { title: "A greener guest room", caption: "What a lower-waste room looks like, from the bathroom to the bedside." },
    { title: "Five-star touches on any budget", caption: "Upgrades that make a room feel considered without the cost." },
  ],
  Promotional: [
    { title: "Bulk pricing for 50+ rooms", caption: "Lower per-room prices when you order for the whole property." },
    { title: "Care home starter bundles", caption: "Bedding, towels, and hygiene supplies in one bundle price." },
    { title: "Next-day delivery is here", caption: "Order by 3pm and it arrives the next morning." },
  ],
  "Behind the scenes": [
    { title: "Inside our warehouse", caption: "How an order gets picked, packed, and on the road the same day." },
    { title: "Meet the team that tests our towels", caption: "Two hundred washes later: why our towels pass the test." },
    { title: "A day with a hotel partner", caption: "What a housekeeping team needs from its supplier." },
  ],
};

const IMAGES = ["/content/bottles.jpg", "/content/counter.jpg", "/content/bathroom.jpg", "/content/amenities.jpg", "/content/dispenser.jpg"];

function categoryFor(mix: Record<MixCategory, number>, index: number): MixCategory {
  // Repeats the mix in blocks of 20 so each category gets its share (40% = 8 of 20).
  const slot = index % 20;
  let total = 0;
  for (const category of MIX) {
    total += Math.round(mix[category] / 5);
    if (slot < total) return category;
  }
  return "Educational";
}

/** The `index`-th post idea for a category, shaped by the plan's direction when there is one. */
function idea(category: MixCategory, index: number, direction: string) {
  const options = IDEAS[category];
  const base = options[index % options.length];
  if (!direction.trim() || index % 3 !== 0) return base;
  const theme = THEMES[themeOf(direction)];
  return { title: theme.headlines[index % 3].replace(/\.$/, ""), caption: theme.promise };
}

/** Dates in [start, end] on the chosen weekdays, at most `perWeek` per Sunday-to-Saturday week. */
export function postingDates(start: string, end: string, days: readonly number[], perWeek: number): string[] {
  const dates: string[] = [];
  let weekKey = "";
  let inWeek = 0;
  for (let date = start; date <= end; date = shiftDate(date, 1)) {
    const weekday = weekdayOf(date);
    const key = shiftDate(date, -weekday);
    if (key !== weekKey) {
      weekKey = key;
      inWeek = 0;
    }
    if (days.includes(weekday) && inWeek < perWeek) {
      dates.push(date);
      inWeek += 1;
    }
  }
  return dates;
}

function hashtagsFor(category: MixCategory, title: string): string[] {
  const theme = THEMES[themeOf(title)];
  return [theme.tags[0], category === "Promotional" ? "#HotelSupply" : "#Hospitality"];
}

/** The sample schedule a business starts with: from `today` to the end of next month. */
export function sampleSchedule(business: Business, today: string): ScheduledPost[] {
  const rec = recommendationsFor(business);
  const end = shiftDate(`${shiftMonth(today.slice(0, 7), 2)}-01`, -1);
  const channels = (Object.keys(business.weights) as Platform[]).map((platform) =>
    platform === "linkedin" ? "LinkedIn" : platform === "tiktok" ? "TikTok" : "Instagram",
  ) as Channel[];
  return postingDates(today, end, rec.bestDays, rec.postsPerWeek[0]).map((date, index) => {
    const category = categoryFor(business.mix, index + seedOf(business.id));
    const { title, caption } = idea(category, index, "");
    const channel = [...channels, "YouTube", "X (Twitter)"][index % (channels.length + 2)] as Channel;
    const window = rec.windows[index % 2];
    return {
      id: `${business.id}-sample-${date}`,
      date,
      time: `${String(window.start).padStart(2, "0")}:00`,
      channel,
      format: SUGGESTED_FORMAT[channel],
      title,
      caption,
      hashtags: hashtagsFor(category, title),
      category,
      image: IMAGES[index % IMAGES.length],
    };
  });
}

/** Posts from today on, soonest first. */
export function upcomingPosts(posts: readonly ScheduledPost[], today: string, limit = 5): ScheduledPost[] {
  return posts
    .filter((post) => post.date >= today)
    .toSorted((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, limit);
}

// ----- Generate a plan (three steps) -----

export const MAX_PLAN_DAYS = 92;

export type PlanSettings = {
  contentType: PostFormat;
  brief: string;
  start: string;
  end: string;
  goal: PlanGoal;
  channels: Channel[];
  postsPerWeek: number;
  days: number[];
  windows: ("Morning" | "Evening")[];
  direction: string;
  useInsights: boolean;
};

/** Step 1's starting values for a business: next month, its best days, all channels. */
export function defaultSettings(business: Business, today: string): PlanSettings {
  const rec = recommendationsFor(business);
  const start = `${shiftMonth(today.slice(0, 7), 1)}-01`;
  return {
    contentType: "Image",
    brief: "",
    start,
    end: shiftDate(`${shiftMonth(today.slice(0, 7), 2)}-01`, -1),
    goal: "Increase engagement",
    channels: [...CHANNELS],
    postsPerWeek: rec.postsPerWeek[0],
    days: rec.bestDays,
    windows: ["Morning", "Evening"],
    direction: "Refillable amenities, guest experience, and practical tips for hotel and care-home buyers.",
    useInsights: true,
  };
}

export type SettingsErrors = Partial<Record<"brief" | "dates" | "channels" | "days" | "windows" | "postsPerWeek", string>>;

export function checkSettings(settings: PlanSettings, today: string): SettingsErrors {
  const errors: SettingsErrors = {};
  if (!settings.brief.trim() && !settings.direction.trim()) errors.brief = "Write a caption or brief, or describe what the plan should focus on.";
  if (settings.brief.length > 1000 || settings.direction.length > 1000) errors.brief = "Keep the brief and direction under 1,000 characters each.";
  const valid = /^\d{4}-\d{2}-\d{2}$/;
  if (!valid.test(settings.start) || !valid.test(settings.end)) errors.dates = "Choose a start and end date.";
  else if (settings.start < today) errors.dates = "Start from today or later.";
  else if (settings.end < settings.start) errors.dates = "The end date must be after the start date.";
  else if ((Date.parse(settings.end) - Date.parse(settings.start)) / 86_400_000 + 1 > MAX_PLAN_DAYS) errors.dates = "Plan up to three months at a time.";
  if (settings.channels.length === 0) errors.channels = "Choose at least one channel.";
  if (settings.days.length === 0) errors.days = "Choose at least one posting day.";
  if (settings.windows.length === 0) errors.windows = "Choose at least one time window.";
  if (!Number.isInteger(settings.postsPerWeek) || settings.postsPerWeek < 1 || settings.postsPerWeek > 14) errors.postsPerWeek = "Choose 1 to 14 posts a week.";
  return errors;
}

export type PlanPreview = { estimatedPosts: number; channels: number; postsPerWeek: number; days: string; mix: Record<MixCategory, number> };

export function planPreview(business: Business, settings: PlanSettings): PlanPreview {
  const days = settings.days.toSorted((a, b) => a - b).map((day) => WEEKDAYS[day]);
  return {
    estimatedPosts: postingDates(settings.start, settings.end, settings.days, settings.postsPerWeek).length,
    channels: settings.channels.length,
    postsPerWeek: settings.postsPerWeek,
    days: days.join(", "),
    mix: business.mix,
  };
}

/** Draft posts for the plan; `variant` changes them on Regenerate all. Nothing is scheduled. */
export function generateDrafts(business: Business, settings: PlanSettings, variant = 0): ScheduledPost[] {
  const rec = recommendationsFor(business);
  // With audience insights off, posts go out at plain default times instead of the recommended ones.
  const source: TimeWindow[] = settings.useInsights ? rec.windows : DEFAULT_WINDOWS;
  const windows = source.filter((window) => settings.windows.includes(window.label));
  const dates = postingDates(settings.start, settings.end, settings.days, settings.postsPerWeek);
  const brief = settings.brief.trim();
  return dates.map((date, index) => {
    const position = index + variant * 7;
    const category = categoryFor(business.mix, position);
    const base = idea(category, position, settings.direction);
    const channel = settings.channels[(index + variant) % settings.channels.length];
    const window = windows[index % windows.length];
    const usesBrief = brief !== "" && index === 0;
    return {
      id: `draft-${business.id}-${date}-${index}-${variant}`,
      date,
      time: `${String(window.start).padStart(2, "0")}:00`,
      channel,
      format: usesBrief ? settings.contentType : SUGGESTED_FORMAT[channel],
      title: usesBrief ? shorten(brief, 60).replace(/[.…]$/, "") : base.title,
      caption: usesBrief ? brief : base.caption,
      hashtags: hashtagsFor(category, base.title),
      category,
      image: IMAGES[(index + variant) % IMAGES.length],
    };
  });
}

/** One draft rewritten (Regenerate on a single post): the next idea in its category. */
export function regenerateDraft(post: ScheduledPost, direction: string, round: number): ScheduledPost {
  const options = IDEAS[post.category];
  const next = idea(post.category, (options.findIndex((option) => option.title === post.title) + 1 + round) % options.length + 1, direction);
  return { ...post, title: next.title, caption: next.caption, hashtags: hashtagsFor(post.category, next.title) };
}

export type PostErrors = Partial<Record<"title" | "caption" | "date" | "time", string>>;

/** Checks a post before it is saved from the edit form. */
export function checkPost(post: Pick<ScheduledPost, "title" | "caption" | "date" | "time">, today: string): PostErrors {
  const errors: PostErrors = {};
  if (!post.title.trim()) errors.title = "Add a title.";
  else if (post.title.length > 120) errors.title = "Keep the title under 120 characters.";
  if (post.caption.length > 2200) errors.caption = "Keep the caption under 2,200 characters.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) errors.date = "Choose a date.";
  else if (post.date < today) errors.date = "Choose today or a later date.";
  if (!/^\d{2}:\d{2}$/.test(post.time)) errors.time = "Choose a time.";
  return errors;
}

// ----- Saved in this browser -----

export const SCHEDULE_KEY = "sixthsense.posting-plan";
const VERSION = 1;

export type BusinessSchedule = { posts: ScheduledPost[]; autoPublish: boolean };
export type SavedSchedules = Partial<Record<BusinessId, BusinessSchedule>>;

function isPost(value: unknown): value is ScheduledPost {
  if (typeof value !== "object" || value === null) return false;
  const post = value as Partial<ScheduledPost>;
  return (
    typeof post.id === "string" &&
    typeof post.date === "string" &&
    typeof post.time === "string" &&
    CHANNELS.includes(post.channel as Channel) &&
    FORMATS.includes(post.format as PostFormat) &&
    typeof post.title === "string" &&
    typeof post.caption === "string" &&
    Array.isArray(post.hashtags) &&
    MIX.includes(post.category as MixCategory) &&
    typeof post.image === "string"
  );
}

export function loadSchedules(storage: Storage | undefined): SavedSchedules {
  try {
    const raw = storage?.getItem(SCHEDULE_KEY);
    if (!raw) return {};
    const saved = JSON.parse(raw) as { version?: unknown; businesses?: Record<string, unknown> };
    if (saved.version !== VERSION || typeof saved.businesses !== "object" || saved.businesses === null) return {};
    const result: SavedSchedules = {};
    for (const business of BUSINESSES) {
      const entry = saved.businesses[business.id] as { posts?: unknown; autoPublish?: unknown } | undefined;
      if (entry && Array.isArray(entry.posts) && typeof entry.autoPublish === "boolean") {
        result[business.id] = { posts: entry.posts.filter(isPost), autoPublish: entry.autoPublish };
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function saveSchedules(storage: Storage | undefined, schedules: SavedSchedules): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SCHEDULE_KEY, JSON.stringify({ version: VERSION, businesses: schedules }));
    return true;
  } catch {
    return false;
  }
}

/** A business's saved schedule, or its sample schedule (Auto Publishing off) when nothing is saved. */
export function scheduleFor(saved: SavedSchedules, business: Business, today: string): BusinessSchedule {
  return saved[business.id] ?? { posts: sampleSchedule(business, today), autoPublish: false };
}
