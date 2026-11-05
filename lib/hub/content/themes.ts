// Shared pieces for the Content Creation templates (docs/DECISIONS.md 2026-10-30: suggestions are
// tested templates, not AI). Every tool finds the theme of what the person typed and writes from it.

export type Theme = "sustainability" | "delivery" | "pricing" | "care" | "guest" | "general";

const THEME_WORDS: [Theme, RegExp][] = [
  ["sustainability", /refill|sustainab|eco|waste|green|compost|bamboo|reuse/],
  ["delivery", /deliver|restock|shipping|next-day|fast/],
  ["pricing", /price|pricing|bulk|discount|bundle|budget|cost|saving/],
  ["care", /care|senior|health|hygiene|clinic/],
  ["guest", /guest|stay|experience|welcome|memorable|boutique/],
];

/** The theme a piece of text is about, from its words. */
export function themeOf(text: string): Theme {
  const lower = text.toLowerCase();
  return THEME_WORDS.find(([, pattern]) => pattern.test(lower))?.[0] ?? "general";
}

export type ThemeCopy = {
  headlines: [string, string, string];
  promise: string;
  proof: string;
  tags: [string, string];
  subject: string;
  /** Photo in public/content and its description. */
  image: { src: string; alt: string };
};

export const THEMES: Record<Theme, ThemeCopy> = {
  sustainability: {
    headlines: ["Small change, memorable stay.", "Less waste. More memorable stays.", "Refill the experience, not the landfill."],
    promise: "Refillable amenities help independent hotels reduce waste while creating a thoughtful guest experience.",
    proof: "Discover a practical switch your guests will notice.",
    tags: ["#GuestExperience", "#SustainableTravel"],
    subject: "A lower-waste room your guests will notice",
    image: { src: "/content/bottles.jpg", alt: "Refillable amenity bottles on a wooden shelf beside folded towels" },
  },
  delivery: {
    headlines: ["Stocked by check-in, every time.", "Never run out before a busy weekend.", "Tomorrow's linens, ordered today."],
    promise: "Next-day delivery keeps linens and amenities on the shelf when your rooms turn over fastest.",
    proof: "Order by 3pm and it arrives the next morning.",
    tags: ["#HotelOperations", "#NextDayDelivery"],
    subject: "Never run out before a busy weekend",
    image: { src: "/content/amenities.jpg", alt: "Amenity bottles and folded towels ready on a counter" },
  },
  pricing: {
    headlines: ["More rooms, lower cost per room.", "Bulk pricing that scales with you.", "Better supplies, smarter spend."],
    promise: "Volume pricing and ready-made bundles bring the cost of every room down without cutting quality.",
    proof: "See what your next order would cost at bulk rates.",
    tags: ["#BulkOrders", "#HotelSupply"],
    subject: "Your bulk pricing is ready",
    image: { src: "/content/amenities.jpg", alt: "Amenity bottles and folded towels ready on a counter" },
  },
  care: {
    headlines: ["Supplies your residents can count on.", "Dependable care, every shift.", "Less time restocking, more time caring."],
    promise: "Dependable bedding, towels, and hygiene supplies help care teams spend their time on people, not stockrooms.",
    proof: "Ask about starter bundles for care homes.",
    tags: ["#SeniorLiving", "#CareHomes"],
    subject: "Starter bundles for care homes",
    image: { src: "/content/counter.jpg", alt: "A bathroom counter set with towels and amenities" },
  },
  guest: {
    headlines: ["The details guests remember.", "Make every stay more thoughtful.", "Small touches, five-star stays."],
    promise: "Thoughtful amenities turn a good stay into one guests talk about and book again.",
    proof: "See the small upgrades that make the biggest difference.",
    tags: ["#GuestExperience", "#BoutiqueHotel"],
    subject: "Small upgrades guests talk about",
    image: { src: "/content/bathroom.jpg", alt: "A modern hotel bathroom with a refillable soap dispenser" },
  },
  general: {
    headlines: ["Everything your rooms need, in one order.", "One supplier, every room ready.", "Ready for the next guest."],
    promise: "From linens to amenities, one supplier keeps every room ready for the next guest.",
    proof: "Browse what's new this season.",
    tags: ["#HotelSupply", "#Hospitality"],
    subject: "What's new for your rooms this season",
    image: { src: "/content/counter.jpg", alt: "A bathroom counter set with towels and amenities" },
  },
};

/** A small, stable number from text, so the same input always gets the same suggestion. */
export function seedOf(text: string): number {
  let hash = 5381;
  for (const char of text) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash;
}

/** Picks one of `options`, moving to the next one on each Regenerate (`variant`). */
export function pick<T>(options: readonly T[], seed: string, variant: number): T {
  return options[(seedOf(seed) + variant) % options.length];
}

/** "Independent Hoteliers" -> "#IndependentHoteliers". */
export function tagOf(text: string): string {
  const words = text.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return `#${words.map((word) => word[0].toUpperCase() + word.slice(1)).join("")}`;
}

/** Sentences in a piece of text, trimmed, without empty ones. */
export function sentencesOf(text: string): string[] {
  return (text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]*/g) ?? []).map((sentence) => sentence.trim()).filter(Boolean);
}

/** Cuts text to at most `max` characters at a word break, ending with "…" when shortened. */
export function shorten(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}

const FILLER = /\b(very|really|just|actually|basically|simply|quite)\s+/gi;

/** Text without filler words, with a capital first letter and a full stop. */
export function tidy(text: string): { text: string; removed: number } {
  let removed = 0;
  const cleaned = text
    .replace(FILLER, () => {
      removed += 1;
      return "";
    })
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return { text: "", removed };
  const capital = cleaned[0].toUpperCase() + cleaned.slice(1);
  return { text: /[.!?…]$/.test(capital) ? capital : `${capital}.`, removed };
}

export const MAX_INPUT = 2000;

/** The check every tool runs on a required text box. */
export function checkText(value: string, label: string): string | null {
  const text = value.trim();
  if (!text) return `${label} is empty. Add a sentence or two to work from.`;
  if (text.length > MAX_INPUT) return `${label} is too long. Keep it under ${MAX_INPUT} characters.`;
  return null;
}
