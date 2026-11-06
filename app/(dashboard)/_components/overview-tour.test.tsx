import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Workspace } from "@/lib/hub/workspace";
import { dismissWelcome } from "../actions";
import { OverviewTour, TOUR_STEPS } from "./overview-tour";

vi.mock("../actions", () => ({ dismissWelcome: vi.fn(async () => {}) }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const workspace: Workspace = {
  name: "Jane Doe",
  firstName: "Jane",
  initials: "JD",
  company: "Doe Hospitality Supply",
  email: "jane@example.com",
  competitors: [],
  businesses: [{ id: "own", name: "Doe Hospitality Supply" }],
  business: { id: "own", name: "Doe Hospitality Supply" },
};

function renderWithTargets(showWelcome = true) {
  return render(
    <>
      {TOUR_STEPS.map((step) => (
        <div key={step.target} data-tour={step.target}>
          {step.target}
        </div>
      ))}
      <OverviewTour showWelcome={showWelcome} workspace={workspace} />
    </>,
  );
}

function startTour() {
  fireEvent.click(screen.getByRole("button", { name: "Explore my dashboard" }));
}

const tour = () => screen.getByRole("dialog");

describe("OverviewTour", () => {
  it("welcomes the new account with its email and business", () => {
    renderWithTargets();
    const dialog = screen.getByRole("dialog", { name: "Welcome to SixthSense, Jane" });
    expect(dialog.textContent).toContain("Your Doe Hospitality Supply workspace is ready");
    expect(within(dialog).getByText("jane@example.com")).toBeDefined();
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Explore my dashboard" }));
  });

  it("shows nothing for a returning account", () => {
    renderWithTargets(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("remembers the welcome was seen and starts the tour at step 1", () => {
    renderWithTargets();
    startTour();
    expect(dismissWelcome).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog", { name: /Welcome/ })).toBeNull();
    expect(within(tour()).getByRole("heading", { name: "Your workspace navigation" })).toBeDefined();
    expect(within(tour()).queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("highlights the part of the page each step is about", () => {
    renderWithTargets();
    startTour();
    const highlighted = () => Array.from(document.querySelectorAll("[data-tour-active]")).map((element) => element.getAttribute("data-tour"));
    expect(highlighted()).toEqual(["navigation"]);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(highlighted()).toEqual(["topbar"]);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(highlighted()).toEqual(["navigation"]);
  });

  it("walks through all seven steps and finishes", () => {
    renderWithTargets();
    startTour();
    for (let step = 1; step < TOUR_STEPS.length; step++) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    }
    expect(within(tour()).getByRole("heading", { name: "Watch competitor activity" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector("[data-tour-active]")).toBeNull();
  });

  it("can be skipped, with the button or Escape", () => {
    renderWithTargets();
    startTour();
    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    cleanup();
    renderWithTargets();
    startTour();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
