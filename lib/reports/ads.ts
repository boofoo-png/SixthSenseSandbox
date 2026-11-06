import { shiftDate, type DateRange } from "@/lib/analytics/dates";
import { seedOf } from "@/lib/hub/content/themes";
import { csvCell } from "./insights";

// Reports ("Insights / Reports") from the team's design file and functionality list (2026-11-05):
// ad spend, revenue, ROAS, impressions, conversions, and clicks from Google and Meta campaigns.
// The prototype has no ad accounts, so this is generated sample data: the same day always gets
// the same numbers, and every view says it is a sample (user's choice, 2026-11-05).

export const AD_PLATFORMS = ["Google", "Meta"] as const;
export type AdPlatform = (typeof AD_PLATFORMS)[number];

export type AdCampaign = { id: string; name: string; platform: AdPlatform; dailyBudget: number; baseRoas: number };

export const CAMPAIGNS: readonly AdCampaign[] = [
  { id: "meta-refill", name: "Refillable amenities", platform: "Meta", dailyBudget: 210, baseRoas: 8.2 },
  { id: "google-search", name: "Hotel supply search", platform: "Google", dailyBudget: 260, baseRoas: 6.1 },
  { id: "meta-care", name: "Care home bundles", platform: "Meta", dailyBudget: 120, baseRoas: 7.4 },
  { id: "google-shopping", name: "Linen shopping ads", platform: "Google", dailyBudget: 150, baseRoas: 5.6 },
  { id: "meta-retarget", name: "Website retargeting", platform: "Meta", dailyBudget: 90, baseRoas: 9.0 },
  { id: "google-brand", name: "Brand search", platform: "Google", dailyBudget: 60, baseRoas: 10.5 },
];

export const COUNTRIES = [
  { code: "CA", name: "Canada", flag: "🇨🇦", share: 0.46 },
  { code: "US", name: "United States", flag: "🇺🇸", share: 0.27 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", share: 0.12 },
  { code: "AU", name: "Australia", flag: "🇦🇺", share: 0.09 },
  { code: "DE", name: "Germany", flag: "🇩🇪", share: 0.06 },
] as const;

export type AdRow = {
  date: string;
  campaign: string;
  platform: AdPlatform;
  spend: number;
  revenue: number;
  conversions: number;
  impressions: number;
  clicks: number;
};

/** A repeatable number between 0 and 1 for a key. */
function noise(key: string): number {
  return (seedOf(key) % 1000) / 1000;
}

/** How each business's ad budget compares with Hotel Depot's (Hospitality Emporium spends less). */
const BUDGET_SCALE: Record<string, number> = { "hospitality-emporium": 0.62 };

/** Sample ad results for every campaign on every day of `range`, for a business. */
export function adRowsBetween({ start, end }: DateRange, businessId = "hotel-depot"): AdRow[] {
  const scale = BUDGET_SCALE[businessId] ?? 1;
  // Hotel Depot, Sixth Sense, and an account's own company keep the original numbers; others get their own.
  const salt = businessId === "hotel-depot" || businessId === "sixth-sense" || businessId === "own" ? "" : `${businessId}|`;
  const rows: AdRow[] = [];
  for (let date = start; date <= end; date = shiftDate(date, 1)) {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    // Thursdays and Fridays sell best; Sundays least (hotel buyers order midweek).
    const dayLift = [0.7, 0.95, 1, 1.05, 1.25, 1.15, 0.8][weekday];
    // A slow climb over the year so periods differ.
    const trend = 1 + (Date.parse(`${date}T00:00:00Z`) / 86_400_000 - 20_400) / 4000;
    for (const campaign of CAMPAIGNS) {
      const n = noise(`${salt}${campaign.id}|${date}`);
      const spend = Math.round(campaign.dailyBudget * scale * (0.85 + n * 0.3) * 100) / 100;
      const roas = campaign.baseRoas * dayLift * trend * (0.8 + noise(`${salt}${date}|${campaign.id}|r`) * 0.4);
      const revenue = Math.round(spend * roas * 100) / 100;
      const conversions = Math.max(0, Math.round(revenue / (campaign.platform === "Meta" ? 14 : 18)));
      const impressions = Math.round(spend * (campaign.platform === "Meta" ? 210 : 95) * (0.9 + n * 0.2));
      const clicks = Math.round(impressions * (campaign.platform === "Meta" ? 0.045 : 0.062));
      rows.push({ date, campaign: campaign.id, platform: campaign.platform, spend, revenue, conversions, impressions, clicks });
    }
  }
  return rows;
}

export type AdTotals = { spend: number; revenue: number; roas: number; impressions: number; conversions: number; clicks: number };

export function totals(rows: readonly AdRow[]): AdTotals {
  const sum = (key: keyof Omit<AdRow, "date" | "campaign" | "platform">) => rows.reduce((total, row) => total + row[key], 0);
  const spend = sum("spend");
  const revenue = sum("revenue");
  return {
    spend,
    revenue,
    roas: spend === 0 ? 0 : revenue / spend,
    impressions: sum("impressions"),
    conversions: sum("conversions"),
    clicks: sum("clicks"),
  };
}

/** Fractional change, or null when there is nothing to compare with. */
export function change(current: number, previous: number): number | null {
  return previous === 0 ? null : (current - previous) / previous;
}

export type ReportPeriod = { days: 7 | 30; current: DateRange; previous: DateRange };

/** The last 7 or 30 days up to `today`, and the same number of days before. */
export function reportPeriod(days: 7 | 30, today: string): ReportPeriod {
  const current = { start: shiftDate(today, -(days - 1)), end: today };
  return { days, current, previous: { start: shiftDate(current.start, -days), end: shiftDate(current.start, -1) } };
}

const inRange = (rows: readonly AdRow[], { start, end }: DateRange) => rows.filter((row) => row.date >= start && row.date <= end);

export type Kpi = { key: keyof AdTotals; label: string; value: number; change: number | null };

/** The six KPI cards: Total Spend, Revenue, ROAS, Impressions, Conversions, Clicks. */
export function kpis(rows: readonly AdRow[], period: ReportPeriod): Kpi[] {
  const now = totals(inRange(rows, period.current));
  const before = totals(inRange(rows, period.previous));
  const labels: [keyof AdTotals, string][] = [
    ["spend", "Total Spend"],
    ["revenue", "Revenue"],
    ["roas", "ROAS"],
    ["impressions", "Impressions"],
    ["conversions", "Conversions"],
    ["clicks", "Clicks"],
  ];
  return labels.map(([key, label]) => ({ key, label, value: now[key], change: change(now[key], before[key]) }));
}

/** Totals per platform for the current period (the details behind each KPI card). */
export function byPlatform(rows: readonly AdRow[], range: DateRange): Record<AdPlatform, AdTotals> {
  const current = inRange(rows, range);
  return { Google: totals(current.filter((row) => row.platform === "Google")), Meta: totals(current.filter((row) => row.platform === "Meta")) };
}

export type DailyRevenue = { date: string; Google: number; Meta: number };

export function dailyRevenue(rows: readonly AdRow[], range: DateRange): DailyRevenue[] {
  const days: DailyRevenue[] = [];
  for (let date = range.start; date <= range.end; date = shiftDate(date, 1)) {
    const day = rows.filter((row) => row.date === date);
    const sum = (platform: AdPlatform) => Math.round(day.filter((row) => row.platform === platform).reduce((total, row) => total + row.revenue, 0));
    days.push({ date, Google: sum("Google"), Meta: sum("Meta") });
  }
  return days;
}

/** The day with the highest total revenue, compared with the previous period's daily average. */
export function peakDay(days: readonly DailyRevenue[], previousAverage: number): { date: string; revenue: number; change: number | null } | null {
  if (days.length === 0) return null;
  const best = days.reduce((top, day) => (day.Google + day.Meta > top.Google + top.Meta ? day : top));
  const revenue = best.Google + best.Meta;
  return { date: best.date, revenue, change: change(revenue, previousAverage) };
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type Insights = { lines: string[]; topPerformer: string; underperformer: string; suggestion: string };

/** Written insights from the numbers (templates, not AI). `variant` changes the wording on Refresh. */
export function adInsights(rows: readonly AdRow[], period: ReportPeriod, variant = 0): Insights {
  const now = byPlatform(rows, period.current);
  const before = byPlatform(rows, period.previous);
  const roasChange = (platform: AdPlatform) => change(now[platform].roas, before[platform].roas) ?? 0;
  const cpa = (t: AdTotals) => (t.conversions === 0 ? 0 : t.spend / t.conversions);
  const cpaChange = (platform: AdPlatform) => change(cpa(now[platform]), cpa(before[platform])) ?? 0;
  const top: AdPlatform = now.Meta.roas >= now.Google.roas ? "Meta" : "Google";
  const other: AdPlatform = top === "Meta" ? "Google" : "Meta";
  const days = dailyRevenue(rows, period.current);
  const pct = (value: number) => `${value >= 0 ? "+" : ""}${Math.round(value * 100)}%`;
  const word = period.days === 7 ? "week" : "month";
  const lines = [
    `${top} delivered the strongest ROAS this ${word} (${now[top].roas.toFixed(1)}×, ${pct(roasChange(top))}), while ${other}'s cost per conversion changed ${pct(cpaChange(other))}.`,
  ];
  const bestDay = days.length ? days.reduce((a, b) => (b.Google + b.Meta > a.Google + a.Meta ? b : a)) : null;
  if (bestDay) {
    const driver: AdPlatform = bestDay.Meta >= bestDay.Google ? "Meta" : "Google";
    lines.push(`${WEEKDAY_NAMES[new Date(`${bestDay.date}T12:00:00Z`).getUTCDay()]} recorded your best day, driven by ${driver} conversions.`);
  }
  const reworded = variant % 2 === 1 ? [...lines].reverse() : lines;
  return {
    lines: reworded,
    topPerformer: `${top} ROAS ${pct(roasChange(top))}`,
    underperformer: `${other} CPA ${pct(cpaChange(other))}`,
    suggestion: `Reallocate 10% of spend from ${other} to ${top} for about ${Math.max(1, Math.round((now[top].roas / Math.max(0.1, now[other].roas) - 1) * 10))}% more predicted conversions.`,
  };
}

export type CountryResult = { code: string; name: string; flag: string; revenue: number; conversions: number };

/** Revenue and conversions by country (sample split), highest revenue first. */
export function byCountry(rows: readonly AdRow[], range: DateRange): CountryResult[] {
  const t = totals(inRange(rows, range));
  return COUNTRIES.map((country) => {
    const wobble = 0.9 + noise(`${country.code}|${range.start}`) * 0.2;
    return { code: country.code, name: country.name, flag: country.flag, revenue: Math.round(t.revenue * country.share * wobble), conversions: Math.round(t.conversions * country.share * wobble) };
  }).sort((a, b) => b.revenue - a.revenue);
}

export type CampaignResult = { id: string; name: string; platform: AdPlatform; spend: number; revenue: number; conversions: number; roas: number; revenueChange: number | null };

/** Each campaign's results for the period, highest revenue first. */
export function topCampaigns(rows: readonly AdRow[], period: ReportPeriod): CampaignResult[] {
  return CAMPAIGNS.map((campaign) => {
    const now = totals(inRange(rows, period.current).filter((row) => row.campaign === campaign.id));
    const before = totals(inRange(rows, period.previous).filter((row) => row.campaign === campaign.id));
    return { id: campaign.id, name: campaign.name, platform: campaign.platform, spend: now.spend, revenue: now.revenue, conversions: now.conversions, roas: now.roas, revenueChange: change(now.revenue, before.revenue) };
  }).sort((a, b) => b.revenue - a.revenue);
}

export const TARGET_ROAS = 7;

/** Share of spend (0-100) that went to campaigns at or above the target ROAS. */
export function performanceScore(campaigns: readonly CampaignResult[]): number {
  const spend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  if (spend === 0) return 0;
  const good = campaigns.filter((campaign) => campaign.roas >= TARGET_ROAS).reduce((sum, campaign) => sum + campaign.spend, 0);
  return Math.round((good / spend) * 100);
}

/** "$12,450", "$89.5K" when short. */
export function money(value: number, short = false): string {
  if (short && Math.abs(value) >= 10_000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** "2.53M", "112,576". */
export function count(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return Math.round(value).toLocaleString("en-US");
}

/** The report's ad rows as CSV (formula-safe), oldest first. */
export function adCsv(rows: readonly AdRow[], range: DateRange): string {
  const names = new Map(CAMPAIGNS.map((campaign) => [campaign.id, campaign.name]));
  const header = ["Date", "Platform", "Campaign", "Spend", "Revenue", "Conversions", "Impressions", "Clicks"];
  const lines = inRange(rows, range)
    .toSorted((a, b) => a.date.localeCompare(b.date) || a.campaign.localeCompare(b.campaign))
    .map((row) => [row.date, row.platform, names.get(row.campaign) ?? row.campaign, row.spend.toFixed(2), row.revenue.toFixed(2), row.conversions, row.impressions, row.clicks].map(csvCell).join(","));
  return [header.join(","), ...lines].join("\r\n");
}
