import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ContentIdea } from "@/lib/ai-studio/types";
import { IdeaPicker } from "./idea-picker";

afterEach(cleanup);

const ideas: ContentIdea[] = [
  {
    id: "a",
    title: "Pumpkin spice drinks taste test",
    angle: "Invite regulars to try pumpkin spice drinks on camera.",
    trend: "Pumpkin spice drinks",
    topic: "pumpkin spice drinks",
    format: "reel",
    platforms: ["tiktok", "instagram"],
    brief: { shots: ["Pumpkin spice drinks being made", "Finished drink"], length: "15-30 seconds", tips: ["Film vertically", "Short shots"] },
  },
  {
    id: "b",
    title: "5 things to know about matcha desserts",
    angle: "Share five quick facts about matcha desserts.",
    trend: "Matcha desserts",
    topic: "matcha desserts",
    format: "carousel",
    platforms: ["instagram"],
    brief: { shots: ["Cover slide of matcha desserts", "One fact per slide"], length: "5-7 slides", tips: ["Same font", "Short text"] },
  },
];

describe("IdeaPicker", () => {
  it("shows each idea with its trend, format, and platforms", () => {
    render(<IdeaPicker ideas={ideas} onChoose={vi.fn()} onShowMore={vi.fn()} />);
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByRole("heading", { name: "Pumpkin spice drinks taste test" })).toBeDefined();
    expect(within(cards[0]).getByText("Trend: Pumpkin spice drinks")).toBeDefined();
    expect(within(cards[0]).getByText("Short video for TikTok, Instagram")).toBeDefined();
  });

  it("chooses an idea", () => {
    const onChoose = vi.fn();
    render(<IdeaPicker ideas={ideas} onChoose={onChoose} onShowMore={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Use this idea: 5 things to know about matcha desserts" }));
    expect(onChoose).toHaveBeenCalledWith(ideas[1]);
  });

  it("asks for different ideas", () => {
    const onShowMore = vi.fn();
    render(<IdeaPicker ideas={ideas} onChoose={vi.fn()} onShowMore={onShowMore} />);
    fireEvent.click(screen.getByRole("button", { name: "Show different ideas" }));
    expect(onShowMore).toHaveBeenCalled();
  });

  it("explains when there are no ideas", () => {
    render(<IdeaPicker ideas={[]} onChoose={vi.fn()} onShowMore={vi.fn()} />);
    expect(screen.getByText("No trend ideas right now. Check back when new trends appear.")).toBeDefined();
  });
});
