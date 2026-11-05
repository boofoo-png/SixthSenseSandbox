import { describe, expect, it } from "vitest";
import { adCopy, blogPlan, sceneTimes, socialPost, videoPlan } from "./create";
import { analyseText, checkFile, editPost, improveCopy, repurpose } from "./edit";
import { SAVED_CONTENT_KEY, loadSavedContent, saveContent } from "./saved";
import { pick, sentencesOf, shorten, tagOf, themeOf, tidy } from "./themes";
import { CONTENT_TOOLS, findTool } from "./tools";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}
const memory = () => new MemoryStorage() as unknown as Storage;

const IDEA = "Create a practical sustainability story for independent hotel buyers.";
const audience = "Independent Hoteliers";

describe("themes", () => {
  it("finds the theme from words in the text", () => {
    expect(themeOf("Refillable guest amenities")).toBe("sustainability");
    expect(themeOf("Next-day DELIVERY")).toBe("delivery");
    expect(themeOf("bulk pricing")).toBe("pricing");
    expect(themeOf("care home bedding")).toBe("care");
    expect(themeOf("a memorable stay")).toBe("guest");
    expect(themeOf("our new catalogue")).toBe("general");
  });

  it("has small text helpers", () => {
    expect(tagOf("Independent Hoteliers")).toBe("#IndependentHoteliers");
    expect(sentencesOf("One. Two!  Three?")).toEqual(["One.", "Two!", "Three?"]);
    expect(shorten("one two three four", 12)).toBe("one two…");
    expect(shorten("short", 12)).toBe("short");
    expect(tidy("this is really just very good")).toEqual({ text: "This is good.", removed: 3 });
    expect(pick(["a", "b", "c"], "x", 0)).not.toBe(pick(["a", "b", "c"], "x", 1));
  });
});

describe("tools", () => {
  it("has the Make's four create and four edit tools", () => {
    expect(CONTENT_TOOLS.filter((tool) => tool.group === "create").map((tool) => tool.title)).toEqual(["Social Post", "Video", "Blog", "Ad Copy"]);
    expect(CONTENT_TOOLS.filter((tool) => tool.group === "edit").map((tool) => tool.title)).toEqual([
      "Edit Posts",
      "Improve Copy",
      "Repurpose content",
      "Upload your file",
    ]);
    expect(findTool("video")?.pageTitle).toBe("Create a Video");
    expect(findTool("nope")).toBeNull();
  });
});

describe("socialPost", () => {
  it("writes the Make's example caption for its example idea", () => {
    const post = socialPost({ idea: IDEA, goal: "Awareness", tone: "Professional", audience, variant: 0 });
    if (!post.ok) throw new Error(post.error);
    expect(post.caption[1]).toContain("Refillable amenities help independent hotels reduce waste");
    expect(post.hashtags).toEqual(["#GuestExperience", "#SustainableTravel", "#IndependentHoteliers"]);
    expect(post.visual.src).toBe("/content/bottles.jpg");
  });

  it("changes with the goal, tone, and Regenerate", () => {
    const base = { idea: IDEA, audience, variant: 0 } as const;
    const sales = socialPost({ ...base, goal: "Sales", tone: "Friendly" });
    const awareness = socialPost({ ...base, goal: "Awareness", tone: "Professional" });
    const again = socialPost({ ...base, goal: "Awareness", tone: "Professional", variant: 1 });
    expect(sales.ok && awareness.ok && sales.caption[1] !== awareness.caption[1]).toBe(true);
    expect(again.ok && awareness.ok && again.caption[0] !== awareness.caption[0]).toBe(true);
  });

  it("needs an idea", () => {
    expect(socialPost({ idea: " ", goal: "Sales", tone: "Casual", audience, variant: 0 })).toEqual({
      ok: false,
      error: "Your idea is empty. Add a sentence or two to work from.",
    });
  });
});

describe("videoPlan", () => {
  it("fits the hook, main content, and call to action to the duration", () => {
    expect(sceneTimes(15)).toEqual([
      { start: 0, end: 3 },
      { start: 3, end: 12 },
      { start: 12, end: 15 },
    ]);
    const long = videoPlan({ idea: IDEA, platform: "YouTube", goal: "Engagement", format: "Tutorial", seconds: 180, audience, variant: 0 });
    if (!long.ok) throw new Error(long.error);
    expect(long.scenes.map((scene) => scene.time)).toEqual(["0:00–0:36", "0:36–2:24", "2:24–3:00"]);
    expect(long.concept.notes[0]).toBe("Film in landscape (16:9).");
    const short = videoPlan({ idea: IDEA, platform: "TikTok", goal: "Sales", format: "Short-form", seconds: 15, audience, variant: 0 });
    expect(short.ok && short.scenes[0].time).toBe("0s–3s");
    expect(short.ok && short.concept.notes[0]).toBe("Film vertically (9:16) for the feed.");
  });
});

describe("blogPlan", () => {
  it("suggests two titles, an outline, key points, and SEO keywords", () => {
    const plan = blogPlan({ idea: IDEA, audience, variant: 0 });
    if (!plan.ok) throw new Error(plan.error);
    expect(plan.titles).toHaveLength(2);
    expect(plan.outline).toHaveLength(4);
    expect(plan.points).toEqual(["Lead with the guest benefit", "Use one measurable result", "End with a practical next step"]);
    expect(plan.keywords[0]).toBe("#GuestExperience");
  });
});

describe("adCopy", () => {
  it("writes headlines under 40 characters and calls to action for the goal", () => {
    const ad = adCopy({ product: "Refillable hotel amenity collection", goal: "Leads", format: "Carousel", audience, variant: 0 });
    if (!ad.ok) throw new Error(ad.error);
    expect(ad.headlines).toHaveLength(3);
    for (const headline of ad.headlines) expect(headline.length).toBeLessThanOrEqual(40);
    expect(ad.ctas).toEqual(["Get a Quote", "Contact Us", "Book a Call"]);
    expect(ad.guidelines[0]).toMatch(/3 to 5 cards/);
    expect(ad.copy[0]).toContain("refillable hotel amenity collection");
  });

  it("needs a product", () => {
    expect(adCopy({ product: "", goal: "Sales", format: "Story", audience, variant: 0 }).ok).toBe(false);
  });
});

describe("editPost", () => {
  it("cleans the post, adds what was asked for, and offers three alternatives", () => {
    const edited = editPost({
      post: "We really just launched refillable amenities for hotels",
      change: "Make it clearer",
      instructions: "Add one detail about the guest experience and end with a direct next step.",
      variant: 0,
    });
    if (!edited.ok) throw new Error(edited.error);
    expect(edited.caption[1]).toBe(
      "We launched refillable amenities for hotels. Guests notice the difference from the moment they walk in. Discover a practical switch your guests will notice.",
    );
    expect(edited.alternatives.map((item) => item.label)).toEqual(["Direct & concise", "Warm & inviting", "Benefit-led"]);
  });
});

describe("improveCopy", () => {
  it("removes filler, leads with a benefit, and lists what changed", () => {
    const result = improveCopy({ type: "Caption", text: "Refillable amenities really help hotels.", goal: "More persuasive", instructions: "", variant: 0 });
    if (!result.ok) throw new Error(result.error);
    expect(result.improved).toMatch(/^Small change, memorable stay\. Refillable amenities help hotels\./);
    expect(result.improvements[0]).toBe("Removed 1 filler word so it reads faster");
    expect(result.alternatives.map((item) => item.label)).toEqual(["Shorter", "More persuasive", "More conversational"]);
  });

  it("keeps ad copy short when asked to be concise", () => {
    const result = improveCopy({ type: "Ad copy", text: "x ".repeat(100), goal: "", instructions: "Keep the copy concise", variant: 0 });
    expect(result.ok && result.improved.length).toBeLessThanOrEqual(125);
  });
});

describe("repurpose", () => {
  const text = "Refillable amenities help independent hotels reduce everyday waste while improving the guest experience.";

  it("makes one version per platform within its length", () => {
    const result = repurpose({ text, platforms: ["Instagram", "TikTok", "Blog"], instructions: "" });
    if (!result.ok) throw new Error(result.error);
    expect(result.versions.map((version) => version.title)).toEqual(["Instagram Caption", "TikTok Caption", "Blog Introduction"]);
    expect(result.versions[1].text.length).toBeLessThanOrEqual(150);
    expect(result.adjustments[2]).toBe("Kept the TikTok caption under 150 characters");
  });

  it("needs at least one platform", () => {
    expect(repurpose({ text, platforms: [], instructions: "" })).toEqual({ ok: false, error: "Choose at least one platform to repurpose for." });
  });
});

describe("files", () => {
  it("accepts the listed types up to 10 MB, reading only text files here", () => {
    expect(checkFile("draft.TXT", 100)).toEqual({ ok: true, readable: true });
    expect(checkFile("brief.docx", 100)).toEqual({ ok: true, readable: false });
    expect(checkFile("virus.exe", 100).ok).toBe(false);
    expect(checkFile("huge.pdf", 11 * 1024 * 1024)).toEqual({ ok: false, error: "That file is over 10 MB. Choose a smaller one." });
  });

  it("analyses the text for the chosen focus", () => {
    const result = analyseText("Our bamboo towels reduce waste. They last 200 washes.", "Copy");
    if (!result.ok) throw new Error(result.error);
    expect(result.summary).toBe("Our bamboo towels reduce waste.");
    expect(result.words).toBe(9);
    expect(result.actions).toEqual(["Turn into ad copy", "Write a caption", "Pull out a headline"]);
    expect(result.takeaways[0]).toBe("The sustainability message is the strongest angle");
    expect(result.takeaways[2]).toMatch(/^Keep the numbers/);
  });
});

describe("saved content", () => {
  it("saves newest first and replaces an item with the same id", () => {
    const storage = memory();
    saveContent(storage, { id: "a", tool: "blog", title: "One", text: "1", savedAt: 1 });
    saveContent(storage, { id: "b", tool: "video", title: "Two", text: "2", savedAt: 2 });
    saveContent(storage, { id: "a", tool: "blog", title: "One again", text: "1", savedAt: 3 });
    expect(loadSavedContent(storage).map((item) => item.title)).toEqual(["One again", "Two"]);
  });

  it("ignores broken data and missing storage", () => {
    const storage = memory();
    storage.setItem(SAVED_CONTENT_KEY, "{oops");
    expect(loadSavedContent(storage)).toEqual([]);
    storage.setItem(SAVED_CONTENT_KEY, JSON.stringify({ version: 2, items: [{ id: "x", tool: "fax" }] }));
    expect(loadSavedContent(storage)).toEqual([]);
    expect(saveContent(undefined, { id: "a", tool: "blog", title: "t", text: "x", savedAt: 1 })).toBe(false);
  });
});
