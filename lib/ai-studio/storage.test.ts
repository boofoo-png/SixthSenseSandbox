import { describe, expect, it } from "vitest";
import { STORAGE_KEY, loadPosts, savePosts } from "./storage";
import type { PlannedPost } from "./types";

const valid: PlannedPost = {
  id: "a",
  date: "2026-10-12",
  time: "19:00",
  platform: "instagram",
  caption: "Hello",
  hashtags: ["#cafe"],
  ideaTitle: "Idea",
};

/** A minimal in-memory Storage for tests. */
function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

function throwingStorage(): Storage {
  const fail = () => {
    throw new Error("SecurityError");
  };
  return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}

describe("loadPosts", () => {
  it("loads saved posts", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, posts: [valid] }) });
    expect(loadPosts(storage)).toEqual([valid]);
  });

  it("returns an empty list when nothing is saved or storage is missing", () => {
    expect(loadPosts(memoryStorage())).toEqual([]);
    expect(loadPosts(undefined)).toEqual([]);
  });

  it("ignores corrupted data, other versions, and invalid posts", () => {
    expect(loadPosts(memoryStorage({ [STORAGE_KEY]: "{not json" }))).toEqual([]);
    expect(loadPosts(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 99, posts: [valid] }) }))).toEqual([]);
    expect(loadPosts(memoryStorage({ [STORAGE_KEY]: JSON.stringify([valid]) }))).toEqual([]);
    const mixed = { version: 1, posts: [valid, { id: "bad" }, "nope"] };
    expect(loadPosts(memoryStorage({ [STORAGE_KEY]: JSON.stringify(mixed) }))).toEqual([valid]);
  });

  it("returns an empty list when the browser blocks storage", () => {
    expect(loadPosts(throwingStorage())).toEqual([]);
  });
});

describe("savePosts", () => {
  it("saves posts so they load again", () => {
    const storage = memoryStorage();
    expect(savePosts(storage, [valid])).toBe(true);
    expect(loadPosts(storage)).toEqual([valid]);
  });

  it("reports failure instead of crashing when storage is blocked or missing", () => {
    expect(savePosts(throwingStorage(), [valid])).toBe(false);
    expect(savePosts(undefined, [valid])).toBe(false);
  });
});
