// Competitor performance from the team's Figma Make (CompetitorsPage in SixthSenseApp.tsx,
// re-checked 2026-11-16; also docs/FUNCTIONALITY.md "Competitors: Competitor Performance"):
// findings filter, competitor campaign cards, a comparison with your content, an evidence note,
// and Your next move. All figures are the Make's samples. The Make names real suppliers; this
// app uses its own fictional ones (lib/competitors/hospitality.ts) so no real business gets
// made-up figures.

export const FINDINGS = [
  "All findings",
  "Most viewed post",
  "Most liked post",
  "Most popular item",
  "Most popular trends",
  "Common reused layouts",
  "Most used by users",
] as const;
export type Finding = (typeof FINDINGS)[number];

type Side = { count: number; engagement: number };

export type CompetitorCampaign = {
  id: string;
  brand: string;
  date: string;
  title: string;
  description: string;
  tags: readonly Exclude<Finding, "All findings">[];
  channel: string;
  image: { src: string; alt: string };
  /** What the counts count: "Reel", "post", or "story". */
  unit: { one: string; many: string };
  business: Side;
  competitor: Side;
  /** "a stronger ___ next week" */
  focus: string;
  /** Step 2 of Your next move. */
  plan: string;
};

export const COMPARISON_PERIOD = "Last 30 days";

export const COMPETITOR_CAMPAIGNS: readonly CompetitorCampaign[] = [
  {
    id: "product-launch",
    brand: "Coastline Linen Co.",
    date: "7 Oct · 2 weeks ago",
    title: "Product launch announcement",
    description: "Explore how competitors frame product launches across paid and organic channels.",
    tags: ["Most popular trends", "Most liked post"],
    channel: "Paid social",
    image: { src: "/content/dispenser.jpg", alt: "" },
    unit: { one: "Reel", many: "Reels" },
    business: { count: 4, engagement: 1.8 },
    competitor: { count: 12, engagement: 3.6 },
    focus: "product demo",
    plan: "Film a 20–30s demo: customer problem → product solution → question. Try a different use case on Friday.",
  },
  {
    id: "seasonal-offer",
    brand: "Northbay Hospitality Supply",
    date: "6 Aug · 1 month ago",
    title: "Seasonal offer campaign",
    description: "Compare seasonal offers across email, web and paid campaigns.",
    tags: ["Most viewed post", "Common reused layouts"],
    channel: "Cross-channel",
    image: { src: "/content/bottles.jpg", alt: "" },
    unit: { one: "post", many: "posts" },
    business: { count: 6, engagement: 2.1 },
    competitor: { count: 15, engagement: 4.2 },
    focus: "seasonal offer post",
    plan: "Lead with the offer and its end date, reuse one simple layout, and close with a single booking link. Repeat the layout on Friday with a new product.",
  },
  {
    id: "community-spotlight",
    brand: "Evergreen Amenities",
    date: "21 Oct · 21h ago",
    title: "Community spotlight",
    description: "See how community stories encourage engagement and content sharing.",
    tags: ["Most popular item", "Most used by users"],
    channel: "Organic",
    image: { src: "/content/counter.jpg", alt: "" },
    unit: { one: "story", many: "stories" },
    business: { count: 5, engagement: 2.4 },
    competitor: { count: 11, engagement: 4 },
    focus: "community story",
    plan: "Feature one customer property in their own words, then ask followers to share theirs. Share a second story on Friday.",
  },
];

const round1 = (value: number) => Math.round(value * 10) / 10;

export function matchesFinding(campaign: CompetitorCampaign, finding: Finding): boolean {
  return finding === "All findings" || (campaign.tags as readonly string[]).includes(finding);
}

/** The competitor's lead in engagement points (negative when the business leads). */
export function engagementGap(campaign: CompetitorCampaign): number {
  return round1(campaign.competitor.engagement - campaign.business.engagement);
}

/** The first engagement goal: a third of the way to the competitor, or a little above a lead. */
export function firstTarget(campaign: CompetitorCampaign): number {
  const gap = engagementGap(campaign);
  return round1(campaign.business.engagement + (gap > 0 ? gap / 3 : 0.2));
}

/** Your next move: the Make's three steps, worked out from the selected campaign. */
export function nextMoves(campaign: CompetitorCampaign): { title: string; detail: string }[] {
  const yours = campaign.business.engagement;
  const theirs = campaign.competitor.engagement;
  const leads = engagementGap(campaign) <= 0;
  return [
    {
      title: "Spot the opportunity",
      detail: leads
        ? `Your ${yours}% engagement leads ${campaign.brand} at ${theirs}%. Keep testing a ${campaign.focus} to hold the lead.`
        : `Your ${yours}% engagement trails ${campaign.brand} at ${theirs}%. Test a stronger ${campaign.focus} next week.`,
    },
    { title: "Post Tuesday, repeat Friday", detail: campaign.plan },
    {
      title: `Review each ${campaign.unit.one} after 7 days`,
      detail: `Beat your ${yours}% baseline. Aim first for ${firstTarget(campaign)}%; the competitor benchmark is ${theirs}%.`,
    },
  ];
}
