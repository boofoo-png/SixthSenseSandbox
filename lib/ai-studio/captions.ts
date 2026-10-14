// Template-based captions (see docs/DECISIONS.md: AI Studio template suggestions).
import type { Platform } from "@/lib/analytics/types";
import type { CaptionTone, ContentIdea } from "./types";

/** Maximum caption length per platform (characters). */
export const CAPTION_LIMITS: Record<Platform, number> = {
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  linkedin: 3000,
};

// {topic} is the idea's topic, {cafe} the business name.
const TEMPLATES: Record<CaptionTone, readonly string[]> = {
  friendly: [
    "We have been loving {topic} lately, and we think you will too. Come say hi at {cafe} and tell us what you think!",
    "Nothing beats {topic} on a cozy day. Swing by {cafe} this week and make it your new favourite.",
    "Have you tried {topic} at {cafe} yet? Tag a friend you would bring along.",
  ],
  playful: [
    "Plot twist: {topic} just stole the show at {cafe}. Come see what the fuss is about!",
    "Warning: {topic} may cause sudden happiness. Side effects include visiting {cafe} again tomorrow.",
    "Our team voted and {topic} wins this week. Do you agree? Prove it at {cafe}.",
  ],
  professional: [
    "This week at {cafe}, we are featuring {topic}. Visit us to experience it for yourself.",
    "Introducing {topic} at {cafe}, crafted with care and quality ingredients. We look forward to welcoming you.",
    "Discover {topic} at {cafe}, available now for a limited time. Plan your visit today.",
  ],
};

function fitToLimit(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 3).trimEnd()}...`;
}

/**
 * Three caption options for an idea in the chosen tone, trimmed to the
 * platform's length limit. Plain ASCII, so it pastes cleanly anywhere.
 */
export function suggestCaptions(
  idea: ContentIdea,
  tone: CaptionTone,
  platform: Platform = idea.platforms[0] ?? "instagram",
  cafeName = "our cafe",
): string[] {
  return TEMPLATES[tone].map((template) =>
    fitToLimit(template.replaceAll("{topic}", idea.topic).replaceAll("{cafe}", cafeName), CAPTION_LIMITS[platform]),
  );
}
