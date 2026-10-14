import type { Platform } from "@/lib/analytics/types";

export type ContentFormat = "photo" | "reel" | "carousel" | "story";

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  photo: "Photo post",
  reel: "Short video",
  carousel: "Carousel",
  story: "Story",
};

/** How to make the photo or video for an idea; the business creates the content itself. */
export type ContentBrief = {
  /** What to film or photograph, in order. */
  shots: string[];
  /** Ideal length, e.g. "15-30 seconds" or "5-7 slides". */
  length: string;
  tips: string[];
};

export type ContentIdea = {
  id: string;
  title: string;
  /** One sentence on how to make the post. */
  angle: string;
  /** The trend the idea is built on, e.g. "Pumpkin spice drinks". */
  trend: string;
  /** The topic in plain words, e.g. "pumpkin spice drinks" or "shop local". */
  topic: string;
  format: ContentFormat;
  /** Best platforms for this idea, best first. */
  platforms: Platform[];
  brief: ContentBrief;
};

export type CaptionTone = "friendly" | "playful" | "professional";

export const CAPTION_TONES: readonly { value: CaptionTone; label: string }[] = [
  { value: "friendly", label: "Friendly" },
  { value: "playful", label: "Playful" },
  { value: "professional", label: "Professional" },
];

export type PlannedPost = {
  id: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** 24-hour time (HH:MM). */
  time: string;
  platform: Platform;
  caption: string;
  hashtags: string[];
  ideaTitle: string;
};

/** A weekday (0 = Sunday) and hour (0-23) with its typical engagement rate. */
export type TimeSlot = { weekday: number; hour: number; rate: number };
