// Template-based content ideas (see docs/DECISIONS.md: AI Studio template suggestions).
import { platformBreakdown } from "@/lib/analytics/kpis";
import type { DailyMetrics, Platform } from "@/lib/analytics/types";
import { topTrends } from "@/lib/competitors/trends";
import type { Trend } from "@/lib/competitors/types";
import type { ContentBrief, ContentFormat, ContentIdea } from "./types";

/** Platforms each format works well on. */
export const FORMAT_PLATFORMS: Record<ContentFormat, readonly Platform[]> = {
  reel: ["tiktok", "instagram", "facebook"],
  carousel: ["instagram", "linkedin", "facebook"],
  photo: ["instagram", "facebook", "linkedin"],
  story: ["instagram", "facebook"],
};

type IdeaTemplate = { key: string; format: ContentFormat; title: string; angle: string; brief: ContentBrief };

// {topic} is replaced with the trend in plain words; {Topic} is the same, capitalised.
const TEMPLATES: readonly IdeaTemplate[] = [
  {
    key: "behind-the-scenes",
    format: "reel",
    title: "Behind the scenes: making {topic}",
    angle: "Film a 20-second clip of {topic} being made, start to finish.",
    brief: {
      shots: ["Ingredients laid out on the counter", "Close-up of {topic} being made", "Hands finishing the last step", "The finished {topic} with the cafe behind it"],
      length: "15-30 seconds",
      tips: ["Film vertically in natural light", "Keep each shot 2-4 seconds", "Add trending audio when you post"],
    },
  },
  {
    key: "taste-test",
    format: "reel",
    title: "{Topic} taste test",
    angle: "Invite regulars to try {topic} on camera and share their honest reactions.",
    brief: {
      shots: ["A regular introduces themselves", "Their first reaction to {topic}", "Their one-line verdict", "{Topic} on the menu board"],
      length: "20-40 seconds",
      tips: ["Ask permission before filming anyone", "Film vertically", "Add on-screen text, since many people watch muted"],
    },
  },
  {
    key: "five-things",
    format: "carousel",
    title: "5 things to know about {topic}",
    angle: "Share five quick facts or tips about {topic}, one per slide.",
    brief: {
      shots: ["Cover slide: a bold photo of {topic} with the title", "Five slides, one fact or tip each", "Last slide: invite people to visit"],
      length: "5-7 slides",
      tips: ["Use the same font and colours on every slide", "Keep each slide to one short sentence", "Use square or portrait images"],
    },
  },
  {
    key: "of-the-week",
    format: "photo",
    title: "{Topic} of the week",
    angle: "Feature one standout photo of {topic} with the short story behind it.",
    brief: {
      shots: ["One hero photo of {topic} near a window", "Optional: a close-up detail from another angle"],
      length: "1-2 photos",
      tips: ["Shoot in daylight and avoid flash", "Keep the background tidy", "Portrait photos fill the most screen"],
    },
  },
  {
    key: "poll",
    format: "story",
    title: "Poll: how do you feel about {topic}?",
    angle: "Run a quick poll about {topic} and share the results the next day.",
    brief: {
      shots: ["A photo or short clip of {topic}", "A poll sticker with two clear options", "Next day: a story sharing the results"],
      length: "1-3 story frames",
      tips: ["Keep poll options to one or two words", "Thank everyone who voted when you share the results"],
    },
  },
  {
    key: "customer-favourites",
    format: "photo",
    title: "Customer favourites: {topic}",
    angle: "Repost a customer photo or review that mentions {topic}, with their permission.",
    brief: {
      shots: ["The customer's photo or a screenshot of their review of {topic}", "Optional: your own photo to pair with it"],
      length: "1-2 images",
      tips: ["Always ask permission and credit the customer", "Reply in the comments to thank them"],
    },
  },
];

const HASHTAG_WORDS: Record<string, string> = {
  "#fallvibes": "fall vibes",
  "#shoplocal": "shop local",
  "#booktok": "book tok",
};

/** A trend as plain lowercase words: "Pumpkin spice drinks" -> "pumpkin spice drinks", "#shoplocal" -> "shop local". */
export function topicFromTrend(trend: Trend): string {
  const label = trend.label.toLowerCase();
  if (trend.kind === "hashtag") {
    return HASHTAG_WORDS[label] ?? label.replace(/^#/, "");
  }
  return label;
}

/** Platforms ordered by engagement rate in the given data, best first. */
export function rankPlatforms(rows: readonly DailyMetrics[]): Platform[] {
  return platformBreakdown(rows)
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .map((p) => p.platform);
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function fill(template: string, topic: string): string {
  const capitalised = topic.charAt(0).toUpperCase() + topic.slice(1);
  return template.replaceAll("{Topic}", capitalised).replaceAll("{topic}", topic);
}

type IdeaOptions = {
  trends: readonly Trend[];
  /** The user's platforms, best first (see rankPlatforms). */
  bestPlatforms: readonly Platform[];
  /** Which set of ideas to show; each page shows new trend-and-template pairs. */
  page?: number;
  count?: number;
};

/**
 * Content ideas built from relevant trends (fastest growing first) and idea
 * templates. Pages step through every trend-and-template pair in a fixed
 * order, so "show different ideas" never repeats until all pairs are used.
 */
export function generateIdeas({ trends, bestPlatforms, page = 0, count = 3 }: IdeaOptions): ContentIdea[] {
  const relevant = topTrends(trends, trends.length).filter((trend) => trend.relevant);
  if (relevant.length === 0) {
    return [];
  }

  return Array.from({ length: count }, (_, k) => {
    const i = page * count + k;
    const trend = relevant[i % relevant.length];
    const round = Math.floor(i / relevant.length) % TEMPLATES.length;
    const template = TEMPLATES[(i % relevant.length + round) % TEMPLATES.length];
    const topic = topicFromTrend(trend);
    const allowed = FORMAT_PLATFORMS[template.format];
    const suited = bestPlatforms.filter((platform) => allowed.includes(platform)).slice(0, 2);

    return {
      id: `${slug(topic)}-${template.key}`,
      title: fill(template.title, topic),
      angle: fill(template.angle, topic),
      trend: trend.label,
      topic,
      format: template.format,
      platforms: suited.length > 0 ? suited : [allowed[0]],
      brief: {
        shots: template.brief.shots.map((shot) => fill(shot, topic)),
        length: template.brief.length,
        tips: [...template.brief.tips],
      },
    };
  });
}
