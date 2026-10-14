import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { bestTimes, formatSlot, nextBestTime } from "@/lib/ai-studio/best-time";
import type { ContentIdea } from "@/lib/ai-studio/types";
import { ScheduleForm } from "./schedule-form";

afterEach(cleanup);

// The test clock (vitest.setup.ts) is Fri 2026-10-09 at noon.
const TODAY = "2026-10-09";
const NOW = new Date(2026, 9, 9, 12);

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

function renderForm(onAdd = vi.fn()) {
  render(
    <ScheduleForm idea={idea} caption="Caption one." hashtags={["#cafe"]} today={TODAY} onAdd={onAdd} onBack={vi.fn()} />,
  );
  return onAdd;
}

function field(label: string) {
  return screen.getByLabelText(label) as HTMLInputElement | HTMLSelectElement;
}

describe("ScheduleForm", () => {
  it("starts on the idea's best platform at its next best time", () => {
    renderForm();
    const next = nextBestTime("tiktok", NOW);
    expect(field("Platform").value).toBe("tiktok");
    expect(field("Date").value).toBe(next.date);
    expect(field("Time").value).toBe(next.time);
    expect((field("Date") as HTMLInputElement).min).toBe(TODAY);
  });

  it("lists the best times for the chosen platform", () => {
    renderForm();
    for (const slot of bestTimes("tiktok")) {
      expect(screen.getByText(formatSlot(slot))).toBeDefined();
    }
  });

  it("moves to the new platform's next best time when the platform changes", () => {
    renderForm();
    fireEvent.change(field("Platform"), { target: { value: "linkedin" } });
    const next = nextBestTime("linkedin", NOW);
    expect(field("Date").value).toBe(next.date);
    expect(field("Time").value).toBe(next.time);
  });

  it("adds the post to the calendar", () => {
    const onAdd = renderForm();
    fireEvent.change(field("Date"), { target: { value: "2026-10-14" } });
    fireEvent.change(field("Time"), { target: { value: "18:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to calendar" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0]).toMatchObject({
      date: "2026-10-14",
      time: "18:30",
      platform: "tiktok",
      caption: "Caption one.",
      hashtags: ["#cafe"],
      ideaTitle: "Pumpkin spice drinks taste test",
    });
    expect(onAdd.mock.calls[0][0].id).toEqual(expect.any(String));
  });

  it("refuses dates in the past", () => {
    const onAdd = renderForm();
    fireEvent.change(field("Date"), { target: { value: "2026-10-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to calendar" }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Pick today or a later date.");
  });
});
