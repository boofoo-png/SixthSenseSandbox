import { describe, expect, it } from "vitest";
import { addPost, parsePlannedPost, postsByDay, removePost, sortPosts, updatePost } from "./planned-posts";
import type { PlannedPost } from "./types";

function post(id: string, date: string, time: string, extra: Partial<PlannedPost> = {}): PlannedPost {
  return { id, date, time, platform: "instagram", caption: `Post ${id}`, hashtags: ["#cafe"], ideaTitle: "Idea", ...extra };
}

describe("parsePlannedPost", () => {
  it("accepts a valid planned post", () => {
    const valid = post("a", "2026-10-12", "19:00");
    expect(parsePlannedPost(valid)).toEqual(valid);
  });

  it("rejects bad dates, times, platforms, or missing fields", () => {
    expect(parsePlannedPost(post("a", "2026-13-01", "19:00"))).toBeNull();
    expect(parsePlannedPost(post("a", "2026-10-12", "25:00"))).toBeNull();
    expect(parsePlannedPost(post("a", "2026-10-12", "7pm"))).toBeNull();
    expect(parsePlannedPost({ ...post("a", "2026-10-12", "19:00"), platform: "myspace" })).toBeNull();
    expect(parsePlannedPost({ ...post("a", "2026-10-12", "19:00"), hashtags: [1, 2] })).toBeNull();
    expect(parsePlannedPost({ id: "a" })).toBeNull();
    expect(parsePlannedPost(null)).toBeNull();
    expect(parsePlannedPost("text")).toBeNull();
  });

  it("rejects an empty id or caption", () => {
    expect(parsePlannedPost(post("", "2026-10-12", "19:00"))).toBeNull();
    expect(parsePlannedPost(post("a", "2026-10-12", "19:00", { caption: "   " }))).toBeNull();
  });
});

describe("sortPosts", () => {
  it("orders by date, then time", () => {
    const sorted = sortPosts([post("c", "2026-10-13", "09:00"), post("b", "2026-10-12", "19:00"), post("a", "2026-10-12", "08:30")]);
    expect(sorted.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
});

describe("addPost, updatePost, removePost", () => {
  const list = [post("a", "2026-10-12", "08:30"), post("b", "2026-10-14", "19:00")];

  it("adds a post in date order without changing the original list", () => {
    const next = addPost(list, post("c", "2026-10-13", "12:00"));
    expect(next.map((p) => p.id)).toEqual(["a", "c", "b"]);
    expect(list).toHaveLength(2);
  });

  it("replaces a post with the same id instead of duplicating it", () => {
    const next = addPost(list, post("a", "2026-10-15", "10:00"));
    expect(next.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("updates a post and keeps the order", () => {
    const next = updatePost(list, "b", { date: "2026-10-11", caption: "Moved" });
    expect(next.map((p) => p.id)).toEqual(["b", "a"]);
    expect(next[0].caption).toBe("Moved");
  });

  it("ignores updates that would make a post invalid", () => {
    expect(updatePost(list, "a", { time: "99:99" })).toEqual(list);
  });

  it("removes a post by id", () => {
    expect(removePost(list, "a").map((p) => p.id)).toEqual(["b"]);
  });
});

describe("postsByDay", () => {
  it("groups posts by date, in time order", () => {
    const groups = postsByDay([post("b", "2026-10-12", "19:00"), post("a", "2026-10-12", "08:30"), post("c", "2026-10-13", "09:00")]);
    expect([...groups.keys()]).toEqual(["2026-10-12", "2026-10-13"]);
    expect(groups.get("2026-10-12")!.map((p) => p.id)).toEqual(["a", "b"]);
  });
});
