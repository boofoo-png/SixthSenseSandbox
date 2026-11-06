import { SAMPLE_SUPPLIERS } from "@/lib/competitors/hospitality";
import type { PeriodPreset } from "@/lib/date-range";

// The dashboard's Marketing Overview, from the team's Figma Make "Marketing Intelligence Hub"
// (2026-11-04). Every figure is sample data; the 30-day figures are the ones the Make shows.

export type OverviewPeriod = "7d" | "30d";

/** `param` is the date bar's `period` value, so the choice carries to the other pages. */
export const OVERVIEW_PERIODS: readonly { id: OverviewPeriod; label: string; param: PeriodPreset }[] = [
  { id: "7d", label: "7 days", param: "last-7-days" },
  { id: "30d", label: "30 days", param: "last-30-days" },
];

/** The Make opens on 30 days. */
export const DEFAULT_PERIOD: OverviewPeriod = "30d";

/** The overview period for the address's `period` (the date bar's); a week counts as 7 days. */
export function parsePeriod(value: string | string[] | undefined): OverviewPeriod {
  return value === "last-7-days" || value === "this-week" ? "7d" : DEFAULT_PERIOD;
}

export type CompetitorActivity = { name: string; change: number; posts: number };
export type ChannelMomentum = {
  channel: "Instagram" | "Facebook" | "Web" | "Email";
  /** Percent change in reach; null when the channel has no reach figure (Email). */
  momentum: number | null;
  /** Percent change in engagement; null when it is stable. */
  change: number | null;
};

export type Overview = {
  competitors: CompetitorActivity[];
  marketInterest: { score: number; change: number };
  audienceGrowth: { newMembers: number; change: number; channels: number };
  engagement: { rate: number; change: number; bars: number[] };
  /** Next recommended publishing window, YYYY-MM-DD. */
  nextWindow: string;
  channels: ChannelMomentum[];
};

const SAMPLE: Record<OverviewPeriod, Omit<Overview, "competitors" | "nextWindow"> & { competitorRows: [number, number][] }> = {
  "30d": {
    competitorRows: [
      [2.5, 10],
      [1.3, 30],
      [-0.5, 23],
    ],
    marketInterest: { score: 81.5, change: -2.6 },
    audienceGrowth: { newMembers: 100, change: 0.6, channels: 4 },
    engagement: { rate: 20, change: 3.5, bars: [35, 29, 74, 43, 59] },
    channels: [
      { channel: "Instagram", momentum: 10, change: 1.5 },
      { channel: "Facebook", momentum: -5, change: -1.5 },
      { channel: "Web", momentum: 5, change: 3.5 },
      { channel: "Email", momentum: null, change: null },
    ],
  },
  "7d": {
    competitorRows: [
      [0.8, 3],
      [0.4, 7],
      [-0.2, 6],
    ],
    marketInterest: { score: 83.1, change: -0.9 },
    audienceGrowth: { newMembers: 26, change: 0.2, channels: 4 },
    engagement: { rate: 18, change: 1.2, bars: [42, 38, 51, 47, 60] },
    channels: [
      { channel: "Instagram", momentum: 4, change: 0.6 },
      { channel: "Facebook", momentum: -2, change: -0.4 },
      { channel: "Web", momentum: 2, change: 1.1 },
      { channel: "Email", momentum: null, change: null },
    ],
  },
};

/** Hospitality Emporium's figures: a younger, more social business than Hotel Depot (sample data). */
const EMPORIUM: typeof SAMPLE = {
  "30d": {
    competitorRows: [
      [3.1, 14],
      [-1.2, 22],
      [0.9, 17],
    ],
    marketInterest: { score: 76.4, change: 1.8 },
    audienceGrowth: { newMembers: 164, change: 1.4, channels: 4 },
    engagement: { rate: 24, change: 2.1, bars: [41, 52, 48, 66, 71] },
    channels: [
      { channel: "Instagram", momentum: 14, change: 2.2 },
      { channel: "Facebook", momentum: 2, change: 0.4 },
      { channel: "Web", momentum: -3, change: -0.8 },
      { channel: "Email", momentum: null, change: null },
    ],
  },
  "7d": {
    competitorRows: [
      [1.1, 4],
      [-0.4, 6],
      [0.3, 5],
    ],
    marketInterest: { score: 77.9, change: 0.6 },
    audienceGrowth: { newMembers: 41, change: 0.5, channels: 4 },
    engagement: { rate: 22, change: 0.9, bars: [48, 55, 50, 62, 68] },
    channels: [
      { channel: "Instagram", momentum: 6, change: 0.9 },
      { channel: "Facebook", momentum: 1, change: 0.2 },
      { channel: "Web", momentum: -1, change: -0.3 },
      { channel: "Email", momentum: null, change: null },
    ],
  },
};

/** "+2.5%", "-0.5%", "0%". */
export function formatSignedPercent(value: number): string {
  if (value === 0) return "0%";
  return `${value > 0 ? "+" : "-"}${Math.abs(value)}%`;
}

const TUESDAY = 2;

/** The next Tuesday after `today` (YYYY-MM-DD): the sample data's best day to post. */
export function nextPublishingWindow(today: string): string {
  const date = new Date(`${today}T12:00:00Z`);
  const days = (TUESDAY - date.getUTCDay() + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Three competitors to show: the ones added at sign-up first, then sample suppliers. */
export function overviewCompetitors(signUpNames: readonly string[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...signUpNames, ...SAMPLE_SUPPLIERS.map((supplier) => supplier.name)]) {
    const name = raw.trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length === 3) break;
  }
  return names;
}

/** The overview cards for `period` and business (Hotel Depot, and any own company, use the Make's figures). */
export function overviewFor(period: OverviewPeriod, competitorNames: readonly string[], today: string, businessId = "hotel-depot"): Overview {
  const { competitorRows, ...rest } = (businessId === "hospitality-emporium" ? EMPORIUM : SAMPLE)[period];
  return {
    ...rest,
    competitors: competitorNames.slice(0, competitorRows.length).map((name, index) => ({
      name,
      change: competitorRows[index][0],
      posts: competitorRows[index][1],
    })),
    nextWindow: nextPublishingWindow(today),
  };
}
