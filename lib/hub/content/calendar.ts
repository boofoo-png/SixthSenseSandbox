import { CHANNELS, SUGGESTED_FORMAT, type Channel, type MixCategory, type PostFormat, type ScheduledPost } from "../posting-plan";
import { THEMES, shorten, themeOf } from "./themes";
import type { ToolSlug } from "./tools";

// Content Creation's "Add to calendar" (functionality list: a saved idea "can be edited or added to
// the calendar"): turns a tool's result into a post for the AI Management calendar.

const CHANNEL: Record<ToolSlug, Channel> = {
  "social-post": "Instagram",
  video: "TikTok",
  blog: "LinkedIn",
  "ad-copy": "Instagram",
  "edit-posts": "Instagram",
  "improve-copy": "LinkedIn",
  repurpose: "Instagram",
  upload: "LinkedIn",
};

const CATEGORY: Record<ToolSlug, MixCategory> = {
  "social-post": "Inspirational",
  video: "Behind the scenes",
  blog: "Educational",
  "ad-copy": "Promotional",
  "edit-posts": "Inspirational",
  "improve-copy": "Educational",
  repurpose: "Inspirational",
  upload: "Educational",
};

const isChannel = (value: string | undefined): value is Channel => (CHANNELS as readonly string[]).includes(value ?? "");

/** A post (not yet saved) for today at 9:00 AM, ready to edit in the post editor. Uses the platform chosen in the tool when it is a calendar channel. */
export function postFromContent(tool: ToolSlug, title: string, text: string, today: string, id: string, platform?: string): ScheduledPost {
  const channel = isChannel(platform) ? platform : CHANNEL[tool];
  const hashtags = [...new Set(text.match(/#[A-Za-z0-9_]+/g) ?? [])].slice(0, 5);
  const caption = text.replace(/(^|\s)#[A-Za-z0-9_]+/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const format: PostFormat = tool === "blog" ? "Link" : SUGGESTED_FORMAT[channel];
  return {
    id,
    date: today,
    time: "09:00",
    channel,
    format,
    title: shorten(title, 100),
    caption: caption.slice(0, 2200),
    hashtags,
    category: CATEGORY[tool],
    image: THEMES[themeOf(`${title} ${text}`)].image.src,
  };
}
