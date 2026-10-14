import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { STORAGE_KEY } from "@/lib/ai-studio/storage";
import type { PlannedPost } from "@/lib/ai-studio/types";
import { ContentCalendar } from "./content-calendar";
import { resetPlannedPostsForTests } from "./use-planned-posts";

const TODAY = "2026-10-09";

function post(id: string, date: string, time: string, caption: string): PlannedPost {
  return { id, date, time, platform: "instagram", caption, hashtags: ["#cafe"], ideaTitle: "Idea" };
}

function save(posts: PlannedPost[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, posts }));
  resetPlannedPostsForTests();
}

beforeEach(() => {
  window.localStorage.clear();
  resetPlannedPostsForTests();
});

afterEach(cleanup);

function monthView() {
  return screen.getByRole("region", { name: "Month view" });
}

function listView() {
  return screen.getByRole("region", { name: "List view" });
}

describe("ContentCalendar", () => {
  it("shows the current month with Sunday-first weekdays", () => {
    render(<ContentCalendar today={TODAY} />);
    expect(screen.getByRole("heading", { name: "October 2026" })).toBeDefined();
    const headers = within(monthView()).getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  });

  it("explains when nothing is planned this month", () => {
    render(<ContentCalendar today={TODAY} />);
    expect(within(listView()).getByText("No posts planned for October 2026.")).toBeDefined();
  });

  it("shows saved posts on their day in both views", () => {
    save([post("a", "2026-10-14", "19:00", "Pumpkin spice is here"), post("b", "2026-11-02", "09:00", "November post")]);
    render(<ContentCalendar today={TODAY} />);
    const day = within(monthView()).getByRole("gridcell", { name: /October 14/ });
    expect(within(day).getByText(/Pumpkin spice is here/)).toBeDefined();
    expect(within(listView()).getByText(/Pumpkin spice is here/)).toBeDefined();
    expect(screen.queryByText(/November post/)).toBeNull();
  });

  it("moves between months", () => {
    save([post("b", "2026-11-02", "09:00", "November post")]);
    render(<ContentCalendar today={TODAY} />);
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("heading", { name: "November 2026" })).toBeDefined();
    expect(within(listView()).getByText(/November post/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByRole("heading", { name: "September 2026" })).toBeDefined();
  });

  it("deletes a post", () => {
    save([post("a", "2026-10-14", "19:00", "Pumpkin spice is here")]);
    render(<ContentCalendar today={TODAY} />);
    fireEvent.click(within(listView()).getByRole("button", { name: "Delete post: Pumpkin spice is here" }));
    expect(screen.queryByText(/Pumpkin spice is here/)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).posts).toEqual([]);
  });

  it("edits a post's date, time, and caption", () => {
    save([post("a", "2026-10-14", "19:00", "Pumpkin spice is here")]);
    render(<ContentCalendar today={TODAY} />);
    fireEvent.click(within(listView()).getByRole("button", { name: "Edit post: Pumpkin spice is here" }));
    fireEvent.change(screen.getByLabelText("Edit date"), { target: { value: "2026-10-20" } });
    fireEvent.change(screen.getByLabelText("Edit time"), { target: { value: "08:15" } });
    fireEvent.change(screen.getByLabelText("Edit caption"), { target: { value: "Updated caption" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    const day = within(monthView()).getByRole("gridcell", { name: /October 20/ });
    expect(within(day).getByText(/Updated caption/)).toBeDefined();
    expect(within(listView()).getByText(/8:15 AM/)).toBeDefined();
  });

  it("says posts are saved in this browser only", () => {
    render(<ContentCalendar today={TODAY} />);
    expect(screen.getByText("Planned posts are saved in this browser only. Nothing is posted automatically.")).toBeDefined();
  });
});
