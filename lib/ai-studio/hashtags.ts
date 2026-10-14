import type { ContentFormat, ContentIdea } from "./types";

const FORMAT_TAGS: Record<ContentFormat, string> = {
  reel: "#reels",
  carousel: "#tips",
  photo: "#photooftheday",
  story: "#poll",
};

/** Always-useful tags for a cafe. */
const CAFE_TAGS = ["#cafe", "#coffeeshop", "#shoplocal", "#coffee"];

const MAX_TAGS = 8;

/** "Oat-milk lattes!" -> "#oatmilklattes"; null when no letters or digits remain. */
export function toHashtag(text: string): string | null {
  const word = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  return word === "" ? null : `#${word}`;
}

/**
 * 5-8 hashtags for an idea: the trend first, then the user's own best tags,
 * the format, and general cafe tags. No duplicates; all lowercase.
 */
export function suggestHashtags(idea: ContentIdea, ownTopTags: readonly string[] = []): string[] {
  const candidates = [idea.trend, idea.topic, ...ownTopTags.slice(0, 3), FORMAT_TAGS[idea.format], ...CAFE_TAGS];
  const tags: string[] = [];
  for (const candidate of candidates) {
    const tag = toHashtag(candidate);
    if (tag !== null && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags.slice(0, MAX_TAGS);
}
