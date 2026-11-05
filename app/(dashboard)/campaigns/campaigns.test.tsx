import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { CampaignBuilder } from "./_components/campaign-builder";

afterEach(cleanup);

function renderBuilder() {
  render(<CampaignBuilder today="2026-11-05" launchDate="2026-11-10" defaultAudience="Independent Hoteliers" />);
}

const generate = () => fireEvent.click(screen.getByRole("button", { name: "Generate Campaign" }));

describe("Campaigns (Figma Make)", () => {
  it("starts from the Make's example brief, in eight sections", () => {
    renderBuilder();
    expect(screen.getByRole("heading", { level: 1, name: "Create Campaign" })).toBeDefined();
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "1. Business goal",
      "2. Success target",
      "3. Focus / product / offer",
      "4. Target audience and niche",
      "5. Messaging",
      "6. Channels and content formats",
      "7. Timing and budget",
      "8. Review before generation",
    ]);
    expect((screen.getByLabelText("Audience name") as HTMLInputElement).value).toBe("Boutique Hotel Owners");
    expect(screen.getByRole("button", { name: /^Sales/ }).getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByLabelText("Launch date") as HTMLInputElement).value).toBe("2026-11-10");
  });

  it("fills in the default audience from the Audience page", () => {
    renderBuilder();
    fireEvent.click(screen.getByRole("button", { name: "Use my default audience (Independent Hoteliers)" }));
    expect((screen.getByLabelText("Audience name") as HTMLInputElement).value).toBe("Independent Hoteliers");
  });

  it("keeps the review summary in step with the brief", () => {
    renderBuilder();
    fireEvent.click(screen.getByRole("button", { name: /^Instagram/ }));
    fireEvent.change(screen.getByLabelText("Campaign window"), { target: { value: "45" } });
    const review = screen.getByRole("region", { name: "Review before generation" });
    expect(within(review).getByText("LinkedIn, Email")).toBeDefined();
    expect(screen.getByText("45 days")).toBeDefined();
  });

  it("explains what to fix instead of generating an incomplete brief", () => {
    renderBuilder();
    fireEvent.change(screen.getByLabelText("Audience name"), { target: { value: "" } });
    for (const channel of ["LinkedIn", "Email", "Instagram"]) fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${channel}`) }));
    generate();
    expect(screen.getByRole("alert").textContent).toBe("Fix 2 fields above to generate the campaign.");
    expect(screen.getByText("Name the audience.")).toBeDefined();
    expect(screen.getByText("Choose at least one channel.")).toBeDefined();
    expect(document.activeElement).toBe(screen.getByLabelText("Audience name"));
  });

  it("generates an editable draft for the chosen channels and goes back to the brief", () => {
    renderBuilder();
    fireEvent.click(screen.getByRole("button", { name: /^Email/ }));
    generate();
    const draft = screen.getByRole("article", { name: "Campaign draft" });
    expect(screen.getByRole("heading", { level: 1, name: "Small change, memorable stay" })).toBeDefined();
    expect(within(draft).getByText("12 new orders in 30 days")).toBeDefined();
    const channels = within(draft).getByRole("region", { name: "Channel plan" });
    expect(within(channels).getAllByRole("listitem").map((item) => item.firstChild?.textContent)).toEqual(["LinkedIn", "Instagram"]);
    expect(within(draft).getByText(/mock proposal/)).toBeDefined();
    fireEvent.click(screen.getAllByRole("button", { name: "Edit campaign" })[0]);
    expect(screen.getByRole("button", { name: /^Email/ }).getAttribute("aria-pressed")).toBe("false");
  });

  it("resets to the example brief with Cancel", () => {
    renderBuilder();
    fireEvent.change(screen.getByLabelText("Core message"), { target: { value: "Something else" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect((screen.getByLabelText("Core message") as HTMLInputElement).value).toBe("A small amenity change can make every stay feel more considered.");
  });
});
