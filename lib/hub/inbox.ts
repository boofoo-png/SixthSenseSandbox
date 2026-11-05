// AI Management as the Figma Make's community inbox (2026-11-05): messages from connected
// channels with a suggested reply each. Messages are samples and replies are templates; approving
// one records it in this browser but sends nothing (no real accounts are connected).

export type Sentiment = "positive" | "neutral" | "negative";

export type Conversation = {
  id: string;
  initials: string;
  name: string;
  channel: "Instagram" | "TikTok" | "Email" | "Facebook";
  minutesAgo: number;
  sentiment: Sentiment;
  message: string;
  reply: string;
};

export const CONVERSATIONS: readonly Conversation[] = [
  {
    id: "jamie-cole",
    initials: "JC",
    name: "Jamie Cole",
    channel: "Instagram",
    minutesAgo: 18,
    sentiment: "positive",
    message: "Do you offer refillable dispensers for independent hotels?",
    reply: "Absolutely, Jamie. Our refillable collection is designed for independent hotels and can be tailored to your guest experience.",
  },
  {
    id: "sarah-malik",
    initials: "SM",
    name: "Sarah Malik",
    channel: "TikTok",
    minutesAgo: 34,
    sentiment: "positive",
    message: "Can you share more about minimum order quantities?",
    reply: "Of course, Sarah. We offer flexible order quantities for growing hospitality teams. I can send the details directly.",
  },
  {
    id: "rowan-hotels",
    initials: "RH",
    name: "Rowan Hotels",
    channel: "Email",
    minutesAgo: 52,
    sentiment: "positive",
    message: "We'd like to compare the sustainable collections.",
    reply: "We'd be happy to help. I'll share a concise comparison of materials, formats, and ideal property types.",
  },
  {
    id: "maple-court-care",
    initials: "MC",
    name: "Maple Court Care",
    channel: "Facebook",
    minutesAgo: 75,
    sentiment: "neutral",
    message: "Do your towels hold up to daily commercial laundry?",
    reply: "Good question. Our care-home towels are rated for daily commercial washing; I can send the wash-test results and a sample.",
  },
  {
    id: "lena-ortiz",
    initials: "LO",
    name: "Lena Ortiz",
    channel: "Instagram",
    minutesAgo: 120,
    sentiment: "negative",
    message: "My last order arrived two days late, right before a full weekend.",
    reply: "I'm sorry, Lena, that's not the experience we want for you. I've flagged your account for priority delivery and will follow up today.",
  },
];

/** Whole-number shares of each sentiment that add up to 100 (largest remainders get the extra points). */
export function sentimentShares(items: readonly Pick<Conversation, "sentiment">[]): Record<Sentiment, number> {
  const kinds: Sentiment[] = ["positive", "neutral", "negative"];
  if (items.length === 0) return { positive: 0, neutral: 0, negative: 0 };
  const exact = kinds.map((kind) => (items.filter((item) => item.sentiment === kind).length / items.length) * 100);
  const shares = exact.map(Math.floor);
  let left = 100 - shares.reduce((sum, value) => sum + value, 0);
  const order = exact.map((value, index) => ({ index, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest);
  for (const { index } of order) {
    if (left === 0) break;
    shares[index] += 1;
    left -= 1;
  }
  return { positive: shares[0], neutral: shares[1], negative: shares[2] };
}

export type ApprovedReply = { text: string; approvedAt: number };
export type Replies = Record<string, ApprovedReply>;

export function openCount(items: readonly Conversation[], replies: Replies): number {
  return items.filter((item) => !replies[item.id]).length;
}

export const MAX_REPLY = 1000;

export function checkReply(text: string): string | null {
  if (!text.trim()) return "Write a reply before approving it.";
  if (text.length > MAX_REPLY) return "Keep the reply under 1,000 characters.";
  return null;
}

export const INBOX_KEY = "sixthsense.inbox-replies";
const VERSION = 1;

function isReplies(value: unknown): value is Replies {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every(
    (reply) => typeof reply === "object" && reply !== null && typeof (reply as ApprovedReply).text === "string" && typeof (reply as ApprovedReply).approvedAt === "number",
  );
}

/** Approved replies saved in this browser; anything broken is ignored. */
export function loadReplies(storage: Storage | undefined): Replies {
  try {
    const raw = storage?.getItem(INBOX_KEY);
    if (!raw) return {};
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== "object" || saved === null || (saved as { version?: unknown }).version !== VERSION) return {};
    const replies = (saved as { replies?: unknown }).replies;
    return isReplies(replies) ? replies : {};
  } catch {
    return {};
  }
}

export function saveReplies(storage: Storage | undefined, replies: Replies): boolean {
  if (!storage) return false;
  try {
    storage.setItem(INBOX_KEY, JSON.stringify({ version: VERSION, replies }));
    return true;
  } catch {
    return false;
  }
}
