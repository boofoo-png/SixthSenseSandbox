import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ContentIdea } from "@/lib/ai-studio/types";
import { CaptionStudio } from "./caption-studio";

const idea: ContentIdea = {
  id: "a",
  title: "Pumpkin spice drinks taste test",
  angle: "Invite regulars to try pumpkin spice drinks on camera.",
  trend: "Pumpkin spice drinks",
  topic: "pumpkin spice drinks",
  format: "reel",
  platforms: ["tiktok", "instagram"],
  brief: {
    shots: ["Close-up of pumpkin spice drinks being made", "The finished drink on the counter"],
    length: "15-30 seconds",
    tips: ["Film vertically in natural light", "Keep each shot 2-4 seconds"],
  },
};

const captions = ["Caption one.", "Caption two.", "Caption three."];
const hashtags = ["#pumpkinspicedrinks", "#cafe"];
const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

afterEach(cleanup);

function renderStudio(overrides: Partial<Parameters<typeof CaptionStudio>[0]> = {}) {
  const props = {
    idea,
    tone: "friendly" as const,
    captions,
    hashtags,
    selected: 0,
    onToneChange: vi.fn(),
    onSelect: vi.fn(),
    onBack: vi.fn(),
    onNext: vi.fn(),
    ...overrides,
  };
  render(<CaptionStudio {...props} />);
  return props;
}

describe("CaptionStudio", () => {
  it("shows the idea, the tone choice, three captions, and hashtags", () => {
    renderStudio();
    expect(screen.getByRole("heading", { name: "Pumpkin spice drinks taste test" })).toBeDefined();
    expect((screen.getByRole("radio", { name: "Friendly" }) as HTMLInputElement).checked).toBe(true);
    for (const caption of captions) {
      expect(screen.getByText(caption)).toBeDefined();
    }
    expect(screen.getByText("#pumpkinspicedrinks #cafe")).toBeDefined();
  });

  it("changes the tone", () => {
    const props = renderStudio();
    fireEvent.click(screen.getByRole("radio", { name: "Playful" }));
    expect(props.onToneChange).toHaveBeenCalledWith("playful");
  });

  it("chooses a caption", () => {
    const props = renderStudio();
    fireEvent.click(screen.getByRole("radio", { name: "Use caption 2" }));
    expect(props.onSelect).toHaveBeenCalledWith(1);
  });

  it("copies a caption and confirms it", async () => {
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Copy caption 2" }));
    expect(writeText).toHaveBeenCalledWith("Caption two.");
    expect(await screen.findByText("Copied caption 2.")).toBeDefined();
  });

  it("copies the hashtags", async () => {
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Copy hashtags" }));
    expect(writeText).toHaveBeenCalledWith("#pumpkinspicedrinks #cafe");
    expect(await screen.findByText("Copied hashtags.")).toBeDefined();
  });

  it("explains when copying is not possible", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Copy hashtags" }));
    expect(await screen.findByText("Could not copy. Select the text and copy it instead.")).toBeDefined();
  });

  it("goes back or on to scheduling", () => {
    const props = renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Back to ideas" }));
    fireEvent.click(screen.getByRole("button", { name: "Next: schedule" }));
    expect(props.onBack).toHaveBeenCalled();
    expect(props.onNext).toHaveBeenCalled();
  });
});

describe("CaptionStudio content brief", () => {
  it("shows how to make the photo or video", () => {
    renderStudio();
    const brief = screen.getByRole("region", { name: "How to make it" });
    expect(within(brief).getByText("Close-up of pumpkin spice drinks being made")).toBeDefined();
    expect(within(brief).getByText("Length: 15-30 seconds")).toBeDefined();
    expect(within(brief).getByText("Film vertically in natural light")).toBeDefined();
    expect(within(brief).getByText("You create and post the photo or video yourself; this is a plan to help.")).toBeDefined();
  });
});
