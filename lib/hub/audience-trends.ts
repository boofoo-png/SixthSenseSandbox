// The Audience Trends tracker from the team's Figma Make "Marketing Intelligence Hub": audiences
// saved to the profile, depth and source filters, a momentum-versus-fit radar, a watchlist, and
// campaign direction for the chosen trend. Trends and suggestions are the Make's sample data, not
// live signals. Saved audiences and the watchlist are kept in this browser (see DECISIONS.md).

export type AudienceDepth = "broad" | "niche";
export type DepthFilter = "All" | "Broad" | "Niche";
export type TrendPlatform = "LinkedIn" | "Instagram" | "TikTok";
export type PlatformFilter = "All platforms" | TrendPlatform;
export type TrendAdvice = "Act now" | "Use with care" | "Watch" | "Skip";

export type TrendAudience = { id: string; name: string; type: AudienceDepth; description: string };

export type Trend = {
  name: string;
  audience: string;
  scope: "Broad" | "Niche";
  platform: TrendPlatform;
  format: string;
  /** How quickly interest is growing, 0 to 100. */
  momentum: number;
  /** How naturally the trend belongs to the audience and business, 0 to 100. */
  fit: number;
  advice: TrendAdvice;
  change: string;
  hook: string;
  angle: string;
  why: string;
};

export const DEPTH_FILTERS: readonly DepthFilter[] = ["All", "Broad", "Niche"];
export const PLATFORM_FILTERS: readonly PlatformFilter[] = ["All platforms", "LinkedIn", "Instagram", "TikTok"];

export const MAX_NAME = 80;
export const MAX_DESCRIPTION = 240;
export const MAX_SAVED_AUDIENCES = 12;

export const TRENDS: readonly Trend[] = [
  {
    name: "Proof over promises",
    audience: "Hospitality buyers",
    scope: "Niche",
    platform: "LinkedIn",
    format: "Data-led carousel",
    momentum: 88,
    fit: 96,
    advice: "Act now",
    change: "+31%",
    hook: "What does sustainable supply actually save per occupied room?",
    angle: "Turn product evidence into a simple cost-and-waste comparison buyers can validate.",
    why: "Fast-growing and highly relevant to procurement teams. Strong enough for a focused campaign test.",
  },
  {
    name: "Experience-first travel",
    audience: "Conscious travellers",
    scope: "Broad",
    platform: "Instagram",
    format: "Short-form story",
    momentum: 83,
    fit: 70,
    advice: "Act now",
    change: "+24%",
    hook: "The detail guests remember long after checkout.",
    angle: "Show one thoughtful room detail through the guest's point of view.",
    why: "Large and still growing. Use it to build awareness, then narrow the message by guest type.",
  },
  {
    name: "Direct booking value",
    audience: "Hospitality buyers",
    scope: "Niche",
    platform: "LinkedIn",
    format: "Talking-head video",
    momentum: 79,
    fit: 91,
    advice: "Act now",
    change: "+19%",
    hook: "A direct-booking perk guests can see, use, and remember.",
    angle: "Frame premium amenities as high-perceived-value booking incentives without room discounting.",
    why: "A strong commercial fit that connects guest experience directly to hotel margin.",
  },
  {
    name: "Small luxury moments",
    audience: "Boutique hotel guests",
    scope: "Broad",
    platform: "TikTok",
    format: "Room-detail montage",
    momentum: 72,
    fit: 78,
    advice: "Use with care",
    change: "+12%",
    hook: "Three tiny details that made this stay feel considered.",
    angle: "Use tactile close-ups and guest reactions instead of a full product showcase.",
    why: "Good audience interest, but the brand needs a natural creator-led execution to feel credible.",
  },
  {
    name: "Low-waste room resets",
    audience: "Hospitality buyers",
    scope: "Niche",
    platform: "TikTok",
    format: "Behind-the-scenes vlog",
    momentum: 67,
    fit: 84,
    advice: "Use with care",
    change: "+17%",
    hook: "Resetting 40 rooms with less single-use waste.",
    angle: "Follow a real housekeeping workflow and let operational details lead the story.",
    why: "Relevant and practical, but should feature real hospitality staff rather than scripted product placement.",
  },
  {
    name: "Silent room unboxing",
    audience: "Boutique hotel guests",
    scope: "Niche",
    platform: "Instagram",
    format: "ASMR reel",
    momentum: 43,
    fit: 62,
    advice: "Watch",
    change: "+6%",
    hook: "No voiceover—just the first five minutes in the room.",
    angle: "Capture packaging, textures, and room sounds with minimal branding.",
    why: "The format is gaining attention, but current audience fit is not yet strong enough to prioritise.",
  },
  {
    name: "Budget travel swaps",
    audience: "Conscious travellers",
    scope: "Broad",
    platform: "TikTok",
    format: "Comparison list",
    momentum: 76,
    fit: 28,
    advice: "Skip",
    change: "+29%",
    hook: "Five travel swaps that keep more money in your trip budget.",
    angle: "A price-first list of alternatives for cost-conscious travellers.",
    why: "Momentum is high, but the topic has weak relevance to the current premium hospitality offer.",
  },
];

export const AUDIENCE_SUGGESTIONS: readonly Omit<TrendAudience, "id">[] = [
  { name: "Hospitality buyers", type: "niche", description: "Hotel owners, procurement leads, and operations teams." },
  { name: "Conscious travellers", type: "broad", description: "Travellers interested in responsible and lower-impact stays." },
  { name: "Boutique hotel guests", type: "niche", description: "Experience-led guests choosing independent hotels." },
  { name: "Independent hotel owners", type: "niche", description: "Owner-operators focused on margins and guest loyalty." },
  { name: "Leisure travellers", type: "broad", description: "People researching holidays, stays, and travel experiences." },
];

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Trends for the selected audiences (by name or depth), depth filter, and source, in the Make's order. */
export function visibleTrends(selected: readonly TrendAudience[], depth: DepthFilter, platform: PlatformFilter): Trend[] {
  return TRENDS.filter(
    (trend) =>
      (selected.length === 0 || selected.some((audience) => same(audience.name, trend.audience) || audience.type === trend.scope.toLowerCase())) &&
      (depth === "All" || trend.scope === depth) &&
      (platform === "All platforms" || trend.platform === platform),
  );
}

/** Suggested audiences whose name contains the search, leaving out ones already saved. */
export function matchingSuggestions(search: string, saved: readonly TrendAudience[]) {
  const text = search.trim().toLowerCase();
  if (!text) return [];
  return AUDIENCE_SUGGESTIONS.filter(
    (suggestion) => suggestion.name.toLowerCase().includes(text) && !saved.some((audience) => same(audience.name, suggestion.name)),
  );
}

export type AddResult = { ok: true; audience: TrendAudience } | { ok: false; error: string };

/** Checks a new audience against the saved ones; `id` is used for it when it is accepted. */
export function addAudience(saved: readonly TrendAudience[], input: Omit<TrendAudience, "id">, id: string): AddResult {
  const name = input.name.trim();
  const description = input.description.trim();
  if (!name) return { ok: false, error: "Enter an audience name." };
  if (name.length > MAX_NAME) return { ok: false, error: `Keep the audience name under ${MAX_NAME} characters.` };
  if (description.length > MAX_DESCRIPTION) return { ok: false, error: `Keep the description under ${MAX_DESCRIPTION} characters.` };
  const existing = saved.find((audience) => same(audience.name, name));
  if (existing) return { ok: false, error: `${existing.name} is already saved to your profile.` };
  if (saved.length >= MAX_SAVED_AUDIENCES) return { ok: false, error: `You can save up to ${MAX_SAVED_AUDIENCES} audiences. Remove one first.` };
  return { ok: true, audience: { id, name, type: input.type, description } };
}

/** "Use with care" becomes "use-with-care". */
export function adviceSlug(advice: TrendAdvice): string {
  return advice.toLowerCase().replaceAll(" ", "-");
}

// Browser storage

export const AUDIENCE_TRENDS_KEY = "sixthsense.audience-trends";
const VERSION = 1;

export type TrackerState = { audiences: TrendAudience[]; selected: string[]; watchlist: string[] };

const starter = AUDIENCE_SUGGESTIONS.slice(0, 2).map((suggestion) => ({
  ...suggestion,
  id: `starter-${suggestion.name.toLowerCase().replaceAll(" ", "-")}`,
}));

/** A first visit: two of the Make's sample audiences, both selected, and its sample watchlist. */
export const STARTER_STATE: TrackerState = {
  audiences: starter,
  selected: starter.map((audience) => audience.id),
  watchlist: ["Direct booking value"],
};

function isAudience(value: unknown): value is TrendAudience {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<TrendAudience>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    item.name.length > 0 &&
    item.name.length <= MAX_NAME &&
    (item.type === "broad" || item.type === "niche") &&
    typeof item.description === "string" &&
    item.description.length <= MAX_DESCRIPTION
  );
}

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

/** The saved tracker; the starter state when nothing usable is saved. */
export function loadTrackerState(storage: Storage | undefined): TrackerState {
  try {
    const raw = storage?.getItem(AUDIENCE_TRENDS_KEY);
    if (!raw) return STARTER_STATE;
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== "object" || saved === null || (saved as { version?: unknown }).version !== VERSION) return STARTER_STATE;
    const { audiences, selected, watchlist } = saved as Record<string, unknown>;
    const kept = (Array.isArray(audiences) ? audiences.filter(isAudience) : []).slice(0, MAX_SAVED_AUDIENCES);
    const ids = new Set(kept.map((audience) => audience.id));
    const trendNames = new Set(TRENDS.map((trend) => trend.name));
    return {
      audiences: kept,
      selected: strings(selected).filter((id) => ids.has(id)),
      watchlist: strings(watchlist).filter((name) => trendNames.has(name)),
    };
  } catch {
    return STARTER_STATE;
  }
}

/** Saves the tracker; false when storage is missing or blocked. */
export function saveTrackerState(storage: Storage | undefined, state: TrackerState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(AUDIENCE_TRENDS_KEY, JSON.stringify({ version: VERSION, ...state }));
    return true;
  } catch {
    return false;
  }
}
