import { describe, expect, it } from "vitest";
import { CONVERSATIONS, INBOX_KEY, checkReply, loadReplies, openCount, saveReplies, sentimentShares } from "./inbox";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

describe("CONVERSATIONS", () => {
  it("starts with the Figma Make's three messages and has unique ids", () => {
    expect(CONVERSATIONS.slice(0, 3).map((item) => item.name)).toEqual(["Jamie Cole", "Sarah Malik", "Rowan Hotels"]);
    expect(new Set(CONVERSATIONS.map((item) => item.id)).size).toBe(CONVERSATIONS.length);
  });
});

describe("sentimentShares", () => {
  it("gives whole percentages that add up to 100", () => {
    const shares = sentimentShares(CONVERSATIONS);
    expect(shares.positive + shares.neutral + shares.negative).toBe(100);
    expect(sentimentShares([{ sentiment: "positive" }, { sentiment: "positive" }, { sentiment: "neutral" }])).toEqual({
      positive: 67,
      neutral: 33,
      negative: 0,
    });
  });

  it("is all zero without conversations", () => {
    expect(sentimentShares([])).toEqual({ positive: 0, neutral: 0, negative: 0 });
  });
});

describe("replies", () => {
  it("counts conversations that still need a reply", () => {
    expect(openCount(CONVERSATIONS, {})).toBe(CONVERSATIONS.length);
    expect(openCount(CONVERSATIONS, { [CONVERSATIONS[0].id]: { text: "Thanks!", approvedAt: 1 } })).toBe(CONVERSATIONS.length - 1);
  });

  it("checks an adjusted reply", () => {
    expect(checkReply("  ")).toBe("Write a reply before approving it.");
    expect(checkReply("x".repeat(1001))).toBe("Keep the reply under 1,000 characters.");
    expect(checkReply("Thanks, Jamie!")).toBeNull();
  });

  it("saves approved replies in the browser and ignores broken data", () => {
    const storage = new MemoryStorage() as unknown as Storage;
    expect(saveReplies(storage, { a: { text: "Hi", approvedAt: 5 } })).toBe(true);
    expect(loadReplies(storage)).toEqual({ a: { text: "Hi", approvedAt: 5 } });
    storage.setItem(INBOX_KEY, JSON.stringify({ version: 1, replies: { a: { text: 3 } } }));
    expect(loadReplies(storage)).toEqual({});
    storage.setItem(INBOX_KEY, "nope");
    expect(loadReplies(storage)).toEqual({});
    expect(loadReplies(undefined)).toEqual({});
  });
});
