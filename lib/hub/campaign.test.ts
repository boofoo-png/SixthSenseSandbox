import { describe, expect, it } from "vitest";
import { campaignDraft, checkBrief, exampleBrief } from "./campaign";

const today = "2026-11-05";
const brief = exampleBrief("2026-11-10");

describe("checkBrief", () => {
  it("accepts the Make's example brief", () => {
    expect(checkBrief(brief, today)).toEqual({});
  });

  it("asks for the required fields, a channel, a sensible length, and a future launch", () => {
    const errors = checkBrief({ ...brief, audienceName: " ", coreMessage: "", channels: [], days: 120, launchDate: "2026-11-01" }, today);
    expect(errors).toEqual({
      audienceName: "Name the audience.",
      coreMessage: "Write the core message.",
      channels: "Choose at least one channel.",
      days: "Choose between 7 and 90 days.",
      launchDate: "Choose a launch date from today on.",
    });
  });

  it("limits long answers", () => {
    expect(checkBrief({ ...brief, summary: "x".repeat(301) }, today).summary).toBe("Keep this under 300 characters.");
  });
});

describe("campaignDraft", () => {
  it("builds the Make's draft from the example brief", () => {
    const draft = campaignDraft(brief);
    expect(draft.title).toBe("Small change, memorable stay");
    expect(draft.window).toBe("Nov 10 – Dec 9, 2026");
    expect(draft.stats.map(([label]) => label)).toEqual(["Audience", "Offer", "Call to action", "Budget", "Launch", "Duration"]);
    expect(draft.channelPlan).toEqual([
      { channel: "LinkedIn", cadence: "2 posts per week (9 in total)", purpose: "Reach hotel owners and procurement leads with proof and insight." },
      { channel: "Email", cadence: "3-email sequence", purpose: "Introduce the collection, build trust, and convert sample requests." },
      { channel: "Instagram", cadence: "3 posts per week (13 in total)", purpose: "Show the product in-room and make the guest benefit tangible." },
    ]);
    expect(draft.starters.map((item) => item.type)).toEqual(["Benefit carousel", "Proof-led email", "Founder video"]);
  });

  it("plans only the chosen channels, for the chosen goal and length", () => {
    const draft = campaignDraft({ ...brief, goal: "Awareness", channels: ["Instagram"], days: 14 });
    expect(draft.channelPlan).toEqual([
      { channel: "Instagram", cadence: "3 posts per week (6 in total)", purpose: "Show the product in real rooms so it is easy to remember." },
    ]);
    expect(draft.starters[0].type).toBe("Awareness carousel");
    expect(draft.starters[1].type).toBe("Proof-led Instagram post");
  });
});
