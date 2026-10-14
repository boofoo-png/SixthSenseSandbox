import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "@/lib/ai-studio/storage";
import type { PlannedPost } from "@/lib/ai-studio/types";
import { resetPlannedPostsForTests, usePlannedPosts } from "./use-planned-posts";

const post: PlannedPost = {
  id: "a",
  date: "2026-10-12",
  time: "19:00",
  platform: "instagram",
  caption: "Hello",
  hashtags: ["#cafe"],
  ideaTitle: "Idea",
};

beforeEach(() => {
  window.localStorage.clear();
  resetPlannedPostsForTests();
});

afterEach(cleanup);

describe("usePlannedPosts", () => {
  it("starts empty and saves added posts to browser storage", () => {
    const { result } = renderHook(() => usePlannedPosts());
    expect(result.current.posts).toEqual([]);
    act(() => result.current.add(post));
    expect(result.current.posts).toEqual([post]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual({ version: 1, posts: [post] });
  });

  it("loads posts already saved in the browser", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, posts: [post] }));
    resetPlannedPostsForTests();
    const { result } = renderHook(() => usePlannedPosts());
    expect(result.current.posts).toEqual([post]);
  });

  it("shares changes between components using the hook", () => {
    const first = renderHook(() => usePlannedPosts());
    const second = renderHook(() => usePlannedPosts());
    act(() => first.result.current.add(post));
    expect(second.result.current.posts).toEqual([post]);
    act(() => second.result.current.update("a", { caption: "Edited" }));
    expect(first.result.current.posts[0].caption).toBe("Edited");
    act(() => first.result.current.remove("a"));
    expect(second.result.current.posts).toEqual([]);
  });

  it("picks up changes made in another browser tab", () => {
    const { result } = renderHook(() => usePlannedPosts());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, posts: [post] }));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    });
    expect(result.current.posts).toEqual([post]);
  });
});
