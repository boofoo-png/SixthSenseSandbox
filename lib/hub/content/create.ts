import { THEMES, checkText, pick, shorten, tagOf, themeOf } from "./themes";

// Create tools from the Figma Make's Content Creation: Social Post, Video, Blog, and Ad Copy.
// Each writes for the business's default audience. `variant` changes with every Regenerate.

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

export const GOALS = ["Awareness", "Engagement", "Sales"] as const;
export const TONES = ["Professional", "Casual", "Friendly"] as const;

export type SocialInput = { idea: string; goal: (typeof GOALS)[number]; tone: (typeof TONES)[number]; audience: string; variant: number };
export type SocialPost = {
  caption: [string, string];
  visual: { src: string; alt: string; guidelines: string[] };
  hashtags: string[];
};

const OPENERS: Record<SocialInput["tone"], string[]> = {
  Professional: ["", "", ""],
  Casual: ["Quick one: ", "Real talk: ", "Here's an easy win: "],
  Friendly: ["Hi friends! ", "Good news for your guests: ", "We love this one: "],
};
const GOAL_ENDINGS: Record<SocialInput["goal"], string[]> = {
  Awareness: ["Follow along for more ideas like this.", "Share this with someone who runs a property."],
  Engagement: ["Which change would your guests notice first? Tell us below.", "Would this work at your property? Let us know in the comments."],
  Sales: ["Message us for a quote this week.", "Order today and have it by your next check-in."],
};

export function socialPost(input: SocialInput): Result<SocialPost> {
  const error = checkText(input.idea, "Your idea");
  if (error) return { ok: false, error };
  const theme = THEMES[themeOf(input.idea)];
  const key = `${input.idea}|${input.audience}`;
  return {
    ok: true,
    caption: [
      pick(theme.headlines, key, input.variant),
      `${pick(OPENERS[input.tone], key, input.variant)}${theme.promise} ${pick(GOAL_ENDINGS[input.goal], key, input.variant)}`,
    ],
    visual: {
      ...theme.image,
      guidelines: [
        "Show the product in use in a real guest room, not on a plain background.",
        "Keep natural light and warm wood or linen textures.",
        `Leave space at the top for the headline, written for ${input.audience}.`,
      ],
    },
    hashtags: [...theme.tags, tagOf(input.audience)],
  };
}

export const VIDEO_PLATFORMS = ["Instagram", "TikTok", "YouTube", "LinkedIn"] as const;
export const VIDEO_FORMATS = ["Short-form", "Tutorial", "Product Demo"] as const;
export const VIDEO_DURATIONS = [
  { label: "15 seconds", seconds: 15 },
  { label: "30 seconds", seconds: 30 },
  { label: "1 minute", seconds: 60 },
  { label: "3 minutes", seconds: 180 },
] as const;

export type VideoInput = {
  idea: string;
  platform: (typeof VIDEO_PLATFORMS)[number];
  goal: (typeof GOALS)[number];
  format: (typeof VIDEO_FORMATS)[number];
  seconds: number;
  audience: string;
  variant: number;
};
export type VideoPlan = {
  script: [string, string];
  concept: { src: string; alt: string; notes: string[] };
  scenes: { label: string; time: string; direction: string }[];
};

/** "0:00" style for longer videos, "12s" for short ones. */
function stamp(seconds: number, long: boolean): string {
  return long ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : `${seconds}s`;
}

/** Hook, main content, and call to action, sized 20/60/20 to fit the chosen duration. */
export function sceneTimes(seconds: number): { start: number; end: number }[] {
  const hook = Math.max(2, Math.round(seconds * 0.2));
  const cta = Math.max(2, Math.round(seconds * 0.2));
  return [
    { start: 0, end: hook },
    { start: hook, end: seconds - cta },
    { start: seconds - cta, end: seconds },
  ];
}

export function videoPlan(input: VideoInput): Result<VideoPlan> {
  const error = checkText(input.idea, "Your idea");
  if (error) return { ok: false, error };
  const theme = THEMES[themeOf(input.idea)];
  const key = `${input.idea}|${input.platform}`;
  const long = input.seconds >= 60;
  const hooks = [
    "What if one small change could make every stay better?",
    `${input.audience}: here's what your guests notice first.`,
    "Watch how one room gets ready for the next guest.",
  ];
  const middle =
    input.format === "Tutorial"
      ? "Walk through the switch in three simple steps"
      : input.format === "Product Demo"
        ? "Show the product up close, then in a real room"
        : "Cut quickly between the product and a guest using it";
  const directions = [pick(hooks, key, input.variant), `${middle}. ${theme.promise}`, `${theme.proof} ${GOAL_ENDINGS[input.goal][0]}`];
  return {
    ok: true,
    script: [pick(hooks, key, input.variant), `${middle}, then close on the guest experience. ${theme.proof}`],
    concept: {
      ...theme.image,
      notes: [
        input.platform === "YouTube" || input.platform === "LinkedIn" ? "Film in landscape (16:9)." : "Film vertically (9:16) for the feed.",
        "Add captions: most people watch with the sound off.",
        `Keep it to ${input.seconds >= 60 ? `${input.seconds / 60} minute${input.seconds > 60 ? "s" : ""}` : `${input.seconds} seconds`} with the product on screen in the first 3 seconds.`,
      ],
    },
    scenes: sceneTimes(input.seconds).map((time, index) => ({
      label: `Scene ${index + 1} — ${["Hook", "Main Content", "Call to Action"][index]}`,
      time: `${stamp(time.start, long)}–${stamp(time.end, long)}`,
      direction: directions[index],
    })),
  };
}

export type BlogInput = { idea: string; audience: string; variant: number };
export type BlogPlan = { titles: [string, string]; outline: string[]; points: string[]; keywords: string[] };

export function blogPlan(input: BlogInput): Result<BlogPlan> {
  const error = checkText(input.idea, "Your topic");
  if (error) return { ok: false, error };
  const themeId = themeOf(input.idea);
  const theme = THEMES[themeId];
  const key = `${input.idea}|${input.audience}`;
  const subject = shorten(input.idea.replace(/^(create|write|make)\s+(a|an)?\s*/i, ""), 60).replace(/\.$/, "");
  const titles: [string, string][] = [
    [theme.headlines[0].replace(/\.$/, ""), `The Practical Guide to ${subject[0].toUpperCase()}${subject.slice(1)}`],
    [`What ${input.audience} Should Know About ${themeId === "general" ? "Room Supplies" : `${themeId[0].toUpperCase()}${themeId.slice(1)}`}`, theme.headlines[1].replace(/\.$/, "")],
  ];
  return {
    ok: true,
    titles: pick(titles, key, input.variant),
    outline: [
      `Why ${input.audience.toLowerCase()} are paying attention now`,
      `How it works in practice: ${theme.promise.charAt(0).toLowerCase()}${theme.promise.slice(1).replace(/\.$/, "")}`,
      "A practical checklist for choosing the right supplier",
      `Next step: ${theme.proof.charAt(0).toLowerCase()}${theme.proof.slice(1)}`,
    ],
    points: ["Lead with the guest benefit", "Use one measurable result", "End with a practical next step"],
    keywords: [...theme.tags, tagOf(subject.split(" ").slice(0, 3).join(" "))],
  };
}

export const AD_GOALS = ["Awareness", "Traffic", "Leads", "Sales"] as const;
export const AD_FORMATS = ["Image Ad", "Video Ad", "Carousel", "Story"] as const;
/** The functionality list's six calls to action; each goal recommends three of them. */
export const CTA_OPTIONS = ["Learn More", "Book Now", "Shop Now", "Get Started", "Sign Up", "Discover More"] as const;
const CTAS: Record<(typeof AD_GOALS)[number], string[]> = {
  Awareness: ["Learn More", "Discover More", "Sign Up"],
  Traffic: ["Learn More", "Discover More", "Shop Now"],
  Leads: ["Sign Up", "Get Started", "Book Now"],
  Sales: ["Shop Now", "Book Now", "Get Started"],
};

export type AdInput = { product: string; goal: (typeof AD_GOALS)[number]; format: (typeof AD_FORMATS)[number]; audience: string; variant: number };
export type AdPlan = { headlines: string[]; copy: string[]; ctas: string[]; guidelines: string[] };

export function adCopy(input: AdInput): Result<AdPlan> {
  const error = checkText(input.product, "Product or service");
  if (error) return { ok: false, error };
  const theme = THEMES[themeOf(input.product)];
  const product = shorten(input.product, 60).replace(/\.$/, "");
  const key = `${input.product}|${input.goal}`;
  const rotate = <T,>(list: readonly T[]) => list.map((_, index) => list[(index + input.variant) % list.length]);
  return {
    ok: true,
    headlines: rotate(theme.headlines.map((headline) => shorten(headline, 40))),
    copy: rotate([
      `Upgrade your guest experience with our ${product.toLowerCase()}.`,
      `${theme.promise}`,
      `Made for ${input.audience.toLowerCase()}: ${theme.proof.charAt(0).toLowerCase()}${theme.proof.slice(1)}`,
    ]),
    ctas: CTAS[input.goal],
    guidelines: [
      input.format === "Carousel"
        ? "Use 3 to 5 cards: the problem, the product, the result, then the offer."
        : input.format === "Story"
          ? "Full-screen vertical; put the call to action in the bottom third."
          : input.format === "Video Ad"
            ? "Show the product in the first 2 seconds and add captions."
            : "One clear product photo with the headline on top.",
      "Keep the headline under 40 characters so it is not cut off.",
      pick(["Use a real room, not a studio background.", "Show a guest benefit, not just the product."], key, input.variant),
    ],
  };
}
