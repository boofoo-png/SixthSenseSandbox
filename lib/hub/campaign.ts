import { formatShortDate, shiftDate } from "@/lib/analytics/dates";
import { THEMES, themeOf } from "./content/themes";

// Campaigns from the team's updated Figma Make (2026-11-05): a campaign brief and a generated,
// editable draft plan. The draft is a template built from the brief; nothing is published.

export const CAMPAIGN_GOALS = [
  { id: "Awareness", description: "Introduce your product or service to a new audience." },
  { id: "Lead", description: "Drive signups, demos, or qualified interest." },
  { id: "Sales", description: "Convert interest into purchases and revenue." },
] as const;
export type CampaignGoal = (typeof CAMPAIGN_GOALS)[number]["id"];

export const FOCUS_OPTIONS = [
  { id: "Product", description: "A physical or digital product offering." },
  { id: "Service", description: "A consulting, delivery, or support offering." },
] as const;

export const AUDIENCE_TYPES = ["B2B", "B2C", "Both"] as const;
export const SEGMENTS = [
  "Small business owners",
  "Boutique hotels (hospitality)",
  "Families and parents",
  "Students and young adults",
  "Travelers and tourists",
] as const;

export const CHANNELS = [
  { id: "LinkedIn", description: "Targeted B2B awareness and lead generation.", perWeek: 2 },
  { id: "Email", description: "Nurture saved audiences and warm leads.", perWeek: 0 },
  { id: "Instagram", description: "Visual storytelling for product and brand awareness.", perWeek: 3 },
] as const;
export type Channel = (typeof CHANNELS)[number]["id"];

export const MIN_DAYS = 7;
export const MAX_DAYS = 90;
export const MAX_FIELD = 300;

export type CampaignBrief = {
  goal: CampaignGoal;
  targetMetric: string;
  targetValue: string;
  targetReason: string;
  focus: (typeof FOCUS_OPTIONS)[number]["id"];
  offer: string;
  cta: string;
  audienceName: string;
  audienceDescription: string;
  audienceType: (typeof AUDIENCE_TYPES)[number];
  segments: string[];
  location: string;
  role: string;
  interests: string;
  painPoints: string;
  valueProposition: string;
  keyPainPoints: string;
  coreMessage: string;
  channels: Channel[];
  contentFormats: string;
  days: number;
  budget: string;
  /** YYYY-MM-DD */
  launchDate: string;
  summary: string;
};

/** The Make's example brief, launching on `launchDate`. */
export function exampleBrief(launchDate: string): CampaignBrief {
  return {
    goal: "Sales",
    targetMetric: "Qualified wholesale orders",
    targetValue: "12 new orders in 30 days",
    targetReason: "Grow recurring wholesale revenue ahead of the winter hospitality season.",
    focus: "Product",
    offer: "Refillable hotel amenity collection with low minimum order quantities and Canada-wide delivery.",
    cta: "Request a wholesale sample kit",
    audienceName: "Boutique Hotel Owners",
    audienceDescription: "Independent boutique hotel operators looking to improve guest experience while reducing single-use packaging.",
    audienceType: "B2B",
    segments: ["Small business owners", "Boutique hotels (hospitality)"],
    location: "British Columbia, Canada",
    role: "Owner, general manager, procurement lead",
    interests: "Guest experience, sustainable hospitality, operational efficiency",
    painPoints: "High minimum orders, inconsistent supply, and pressure to reduce single-use waste.",
    valueProposition: "Premium refillable amenities that simplify purchasing and create a more memorable, lower-waste guest stay.",
    keyPainPoints: "Limited storage, unpredictable demand, tight margins, and time-consuming supplier coordination.",
    coreMessage: "A small amenity change can make every stay feel more considered.",
    channels: ["LinkedIn", "Email", "Instagram"],
    contentFormats: "Product carousel, hotel case study, founder video, and sample-kit email",
    days: 30,
    budget: "$4,500 CAD · 30 days · 1 content owner",
    launchDate,
    summary: "A 30-day B2B campaign that turns sustainable guest amenities into qualified sample-kit requests from boutique hotels.",
  };
}

export type BriefField = keyof CampaignBrief;
export type BriefErrors = Partial<Record<BriefField, string>>;

const REQUIRED: [BriefField, string][] = [
  ["targetValue", "Add a target value, such as 12 new orders in 30 days."],
  ["offer", "Describe the product or service this campaign promotes."],
  ["cta", "Add a call to action."],
  ["audienceName", "Name the audience."],
  ["coreMessage", "Write the core message."],
];

const TEXT_FIELDS: BriefField[] = [
  "targetMetric", "targetValue", "targetReason", "offer", "cta", "audienceName", "audienceDescription", "location", "role",
  "interests", "painPoints", "valueProposition", "keyPainPoints", "coreMessage", "contentFormats", "budget", "summary",
];

/** What must be fixed before a draft can be generated; empty when the brief is ready. */
export function checkBrief(brief: CampaignBrief, today: string): BriefErrors {
  const errors: BriefErrors = {};
  for (const [field, message] of REQUIRED) {
    if (!String(brief[field]).trim()) errors[field] = message;
  }
  for (const field of TEXT_FIELDS) {
    if (!errors[field] && String(brief[field]).length > MAX_FIELD) errors[field] = `Keep this under ${MAX_FIELD} characters.`;
  }
  if (brief.channels.length === 0) errors.channels = "Choose at least one channel.";
  if (!Number.isInteger(brief.days) || brief.days < MIN_DAYS || brief.days > MAX_DAYS) {
    errors.days = `Choose between ${MIN_DAYS} and ${MAX_DAYS} days.`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(brief.launchDate)) errors.launchDate = "Choose a launch date.";
  else if (brief.launchDate < today) errors.launchDate = "Choose a launch date from today on.";
  return errors;
}

export type CampaignDraft = {
  title: string;
  window: string;
  stats: [string, string][];
  strategy: { label: string; text: string }[];
  channelPlan: { channel: Channel; cadence: string; purpose: string }[];
  starters: { type: string; title: string; text: string }[];
};

const PURPOSES: Record<Channel, Record<CampaignGoal, string>> = {
  LinkedIn: {
    Awareness: "Introduce the brand to owners and procurement leads with useful insight.",
    Lead: "Reach decision-makers with proof and invite them to talk.",
    Sales: "Reach hotel owners and procurement leads with proof and insight.",
  },
  Email: {
    Awareness: "Welcome new contacts and share the story behind the offer.",
    Lead: "Nurture warm contacts toward a call or a demo.",
    Sales: "Introduce the collection, build trust, and convert sample requests.",
  },
  Instagram: {
    Awareness: "Show the product in real rooms so it is easy to remember.",
    Lead: "Turn interest into direct messages and sign-ups.",
    Sales: "Show the product in-room and make the guest benefit tangible.",
  },
};

/** The editable draft plan for a ready brief. */
export function campaignDraft(brief: CampaignBrief): CampaignDraft {
  const theme = THEMES[themeOf(`${brief.offer} ${brief.coreMessage}`)];
  const end = shiftDate(brief.launchDate, brief.days - 1);
  const window = `${formatShortDate(brief.launchDate)} – ${formatShortDate(end)}, ${end.slice(0, 4)}`;
  const weeks = brief.days / 7;
  const order = CHANNELS.map((channel) => channel.id).filter((id) => brief.channels.includes(id));
  const second = brief.channels.includes("Email") ? "Proof-led email" : brief.channels.includes("LinkedIn") ? "Proof-led LinkedIn post" : "Proof-led Instagram post";
  return {
    title: theme.headlines[0].replace(/\.$/, ""),
    window,
    stats: [
      ["Audience", `${brief.audienceName} · ${brief.location || "Online"}`],
      ["Offer", brief.offer],
      ["Call to action", brief.cta],
      ["Budget", brief.budget || "Not set"],
      ["Launch", formatShortDate(brief.launchDate)],
      ["Duration", `${brief.days} days (${window})`],
    ],
    strategy: [
      { label: "Positioning", text: brief.valueProposition || theme.promise },
      { label: "Audience tension", text: brief.keyPainPoints || brief.painPoints || "Add the audience's pain points to sharpen this." },
      {
        label: "Creative direction",
        text: `Pair calm, premium imagery with practical proof, and close every piece with "${brief.cta}".`,
      },
    ],
    channelPlan: order.map((channel) => {
      const perWeek = CHANNELS.find((item) => item.id === channel)?.perWeek ?? 0;
      const cadence = perWeek === 0 ? `${brief.days >= 21 ? 3 : 2}-email sequence` : `${perWeek} posts per week (${Math.max(1, Math.round(perWeek * weeks))} in total)`;
      return { channel, cadence, purpose: PURPOSES[channel][brief.goal] };
    }),
    starters: [
      {
        type: brief.goal === "Awareness" ? "Awareness carousel" : "Benefit carousel",
        title: theme.headlines[1],
        text: `Lead with the guest experience, then show ${brief.offer.charAt(0).toLowerCase()}${brief.offer.slice(1).replace(/\.$/, "")} as one easy upgrade.`,
      },
      {
        type: second,
        title: theme.subject,
        text: `Address ${(brief.painPoints || "their main concerns").replace(/\.$/, "").toLowerCase()}, then invite ${brief.audienceName.toLowerCase()} to ${brief.cta.charAt(0).toLowerCase()}${brief.cta.slice(1)}.`,
      },
      {
        type: "Founder video",
        title: `Why we built this for ${brief.audienceName.toLowerCase()}`,
        text: `A short, personal story built around the core message: "${brief.coreMessage}"`,
      },
    ],
  };
}
