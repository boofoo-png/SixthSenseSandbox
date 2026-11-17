import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SAVED_CONTENT_KEY } from "@/lib/hub/content/saved";
import { SCHEDULE_KEY } from "@/lib/hub/posting-plan";
import { resetSchedulesForTests } from "../ai-management/_components/use-schedules";
import { CalendarTargetProvider } from "./_components/calendar-target";
import { AdCopyTool, BlogTool, SocialPostTool, VideoTool } from "./_components/create-tools";
import { EditPostsTool, ImproveCopyTool, RepurposeTool, UploadTool } from "./_components/edit-tools";
import { ToolHeader } from "./_components/tool-ui";
import { resetSavedContentForTests } from "./_components/use-saved-content";
import ContentPage from "./page";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

beforeEach(() => {
  window.localStorage.clear();
  resetSavedContentForTests();
  resetSchedulesForTests();
});
afterEach(cleanup);

const audience = "Independent Hoteliers";
const suggestions = (name: RegExp | string) => screen.getByRole("region", { name });
const box = (label: string) => screen.getByLabelText(label) as HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement;

describe("Content Creation hub (Figma Make)", () => {
  it("has four tools to create and four to edit, each linking to its page", () => {
    render(<ContentPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Content Creation" })).toBeDefined();
    const create = screen.getByRole("region", { name: "Create new AI-guided content" });
    const edit = screen.getByRole("region", { name: "Edit and enhance existing content" });
    expect(within(create).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/content/social-post",
      "/content/video",
      "/content/blog",
      "/content/ad-copy",
    ]);
    expect(within(edit).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/content/edit-posts",
      "/content/improve-copy",
      "/content/repurpose",
      "/content/upload",
    ]);
  });

  it("opens My Content and, with Campaigns out of the sidebar, starts a campaign", () => {
    render(<ContentPage />);
    expect(screen.getByRole("link", { name: "My Content" }).getAttribute("href")).toBe("/content/my-content");
    const campaign = screen.getByRole("link", { name: /^Campaign\s*Build an editable campaign plan/ });
    expect(campaign.getAttribute("href")).toBe("/campaigns");
    expect(within(campaign).getByText("Create campaign")).toBeDefined();
  });
});

describe("Tool header", () => {
  it("opens My Content, which comes back to the tool", () => {
    render(<ToolHeader slug="blog" title="Create a Blog Post" description="Titles and outlines." />);
    expect(screen.getByRole("link", { name: "Back to Content Creation" }).getAttribute("href")).toBe("/content");
    expect(screen.getByRole("link", { name: "My Content" }).getAttribute("href")).toBe("/content/my-content?from=blog");
  });
});

describe("Social Post", () => {
  it("shows suggestions for the example idea straight away, labelled as templates", () => {
    render(<SocialPostTool audience={audience} />);
    const panel = suggestions("AI Content Suggestions");
    expect(within(panel).getByText(/Refillable amenities help independent hotels reduce waste/)).toBeDefined();
    expect(within(panel).getByText("#IndependentHoteliers")).toBeDefined();
    expect(within(panel).getByText(/not live AI/)).toBeDefined();
  });

  it("uses the chosen goal only after Generate", () => {
    render(<SocialPostTool audience={audience} />);
    fireEvent.change(box("Content Goal"), { target: { value: "Sales" } });
    expect(screen.queryByText(/quote this week|by your next check-in/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Generate with AI" }));
    expect(screen.getByText(/quote this week|by your next check-in/)).toBeDefined();
  });

  it("asks for an idea when the box is empty", () => {
    render(<SocialPostTool audience={audience} />);
    fireEvent.change(box("Describe your idea"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate with AI" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Your idea is empty/);
    expect(within(suggestions("AI Content Suggestions")).getByText(/will appear here/)).toBeDefined();
  });

  it("writes another version with Regenerate and saves it in the browser", () => {
    render(<SocialPostTool audience={audience} />);
    const headline = () => within(suggestions("AI Content Suggestions")).getAllByText(/./, { selector: "p.font-bold" })[0].textContent;
    const first = headline();
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(headline()).not.toBe(first);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("button", { name: "Saved" })).toBeDefined();
    const saved = JSON.parse(window.localStorage.getItem(SAVED_CONTENT_KEY) ?? "{}");
    expect(saved.items).toHaveLength(1);
    expect(saved.items[0].tool).toBe("social-post");
  });

  it("refuses an upload that is not a PNG or JPG", () => {
    render(<SocialPostTool audience={audience} />);
    const input = screen.getByLabelText(/Upload your post/) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] } });
    expect(screen.getByRole("alert").textContent).toBe("Choose a PNG or JPG image.");
  });
});

describe("Video", () => {
  it("fits the storyboard to the chosen duration", () => {
    render(<VideoTool audience={audience} />);
    expect(within(suggestions("AI Video Suggestions")).getByText("0s–3s")).toBeDefined();
    fireEvent.change(box("Video Duration"), { target: { value: "1 minute" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate with AI" }));
    expect(within(suggestions("AI Video Suggestions")).getByText("0:00–0:12")).toBeDefined();
  });
});

describe("Blog", () => {
  it("suggests titles, an outline, key points, and SEO keywords", () => {
    render(<BlogTool audience={audience} />);
    const panel = suggestions("AI Blog Suggestions");
    for (const title of ["Suggested Titles", "Article Outline", "Key Points & Content Guidance", "SEO Keywords"]) {
      expect(within(panel).getByRole("heading", { name: title })).toBeDefined();
    }
  });
});

describe("Ad Copy", () => {
  it("offers calls to action for the campaign goal", () => {
    render(<AdCopyTool audience={audience} />);
    fireEvent.change(box("Campaign Goal"), { target: { value: "Leads" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate with AI" }));
    expect(within(suggestions("AI Ad Copy Suggestions")).getByText("Get Started")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save Content" })).toBeDefined();
  });

  it("copies a headline", async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });
    render(<AdCopyTool audience={audience} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Copy line 1" })[0]);
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
  });
});

describe("Edit Posts", () => {
  it("reads an uploaded text file into the caption", async () => {
    render(<EditPostsTool />);
    const input = screen.getByLabelText(/Upload your post/) as HTMLInputElement;
    const file = new File(["Our bulk pricing just got better."], "post.txt", { type: "text/plain" });
    Object.defineProperty(file, "text", { value: async () => "Our bulk pricing just got better." });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(box("Post caption").value).toBe("Our bulk pricing just got better."));
    expect(screen.getByText("post.txt")).toBeDefined();
  });

  it("shows an enhanced caption and three alternatives", () => {
    render(<EditPostsTool />);
    expect(screen.getByRole("button", { name: "Enhance with AI" })).toBeDefined();
    const panel = suggestions("AI Enhanced Suggestions");
    expect(within(panel).getByText("Direct & concise")).toBeDefined();
    expect(within(panel).getByText("Warm & inviting")).toBeDefined();
    expect(within(panel).getByText("Benefit-led")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDefined();
  });
});

describe("Improve Copy", () => {
  it("lists the key improvements", () => {
    render(<ImproveCopyTool />);
    expect(within(suggestions("AI Improved Suggestions")).getByText("Leads with a clear benefit in the first line")).toBeDefined();
    expect(screen.getByRole("button", { name: "Improve with AI" })).toBeDefined();
  });
});

describe("Repurpose content", () => {
  it("makes a version for each chosen platform, shown in tabs", () => {
    render(<RepurposeTool />);
    const tabs = () => within(suggestions("AI Repurposed Content")).getAllByRole("tab").map((tab) => tab.textContent);
    expect(tabs()).toEqual(["Instagram", "Blog"]);
    fireEvent.click(screen.getByRole("button", { name: "TikTok" }));
    fireEvent.click(screen.getByRole("button", { name: "Enhance with AI" }));
    expect(tabs()).toEqual(["Instagram", "TikTok", "Blog"]);
    fireEvent.click(screen.getByRole("tab", { name: "TikTok" }));
    expect(screen.getByRole("heading", { name: "TikTok Caption" })).toBeDefined();
  });

  it("needs at least one platform", () => {
    render(<RepurposeTool />);
    fireEvent.click(screen.getByRole("button", { name: "Instagram" }));
    fireEvent.click(screen.getByRole("button", { name: "Blog" }));
    fireEvent.click(screen.getByRole("button", { name: "Enhance with AI" }));
    expect(screen.getByRole("alert").textContent).toBe("Choose at least one platform to repurpose for.");
  });

  it("starts from a sample reused from My Content", () => {
    render(<RepurposeTool from="sample-8" />);
    expect(box("Paste your content").value).toBe("Travel lighter.\n\nRefill. Reuse. Respect. Five habits for mindful travel.");
  });

  it("starts from saved content reused from My Content", () => {
    window.localStorage.setItem(
      SAVED_CONTENT_KEY,
      JSON.stringify({ version: 2, items: [{ id: "abc", tool: "blog", title: "Saved blog", text: "My saved blog text.", savedAt: 1 }] }),
    );
    render(<RepurposeTool from="saved-abc" />);
    expect(box("Paste your content").value).toBe("My saved blog text.");
  });

  it("ignores an unknown item", () => {
    render(<RepurposeTool from="sample-999" />);
    expect(box("Paste your content").value).toMatch(/^Refillable amenities help independent hotels/);
  });
});

describe("Upload your file", () => {
  it("asks for pasted text when the file type cannot be read here", async () => {
    render(<UploadTool />);
    const input = screen.getByLabelText(/Upload your file/) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["%PDF"], "brief.pdf", { type: "application/pdf" })] } });
    await screen.findByText(/can't read that file type yet/);
  });

  it("refuses other file types", async () => {
    render(<UploadTool />);
    const input = screen.getByLabelText(/Upload your file/) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["x"], "app.exe")] } });
    expect((await screen.findByRole("alert")).textContent).toBe("Choose a TXT, MD, CSV, PDF, DOCX, PNG, or JPG file.");
  });

  it("switches the suggested actions with the focus", () => {
    render(<UploadTool />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    fireEvent.click(screen.getByRole("button", { name: "Analyze with AI" }));
    const panel = suggestions("AI Suggestions");
    expect(within(panel).getByRole("link", { name: /Turn into ad copy/ }).getAttribute("href")).toBe("/content/ad-copy");
    fireEvent.click(within(panel).getByRole("tab", { name: "Summary" }));
    expect(within(panel).getByRole("heading", { name: "Summary" })).toBeDefined();
  });
});

describe("Add to calendar", () => {
  const target = { business: { id: "hospitality-emporium", name: "Hospitality Emporium" }, today: "2026-11-05" };

  it("opens the post editor filled in from the result and saves it to the chosen business's calendar", () => {
    render(
      <CalendarTargetProvider value={target}>
        <VideoTool audience={audience} />
      </CalendarTargetProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to calendar" }));
    const dialog = screen.getByRole("dialog", { name: "Add to the Hospitality Emporium calendar" });
    expect((within(dialog).getByLabelText("Channel") as HTMLSelectElement).value).toBe("Instagram"); // the video's platform
    expect((within(dialog).getByLabelText("Title") as HTMLInputElement).value).not.toBe("");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save post" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(/Added to the Hospitality Emporium calendar/)).toBeDefined();
    const saved = JSON.parse(window.localStorage.getItem(SCHEDULE_KEY) ?? "{}");
    const posts = saved.businesses["hospitality-emporium"].posts.filter((post: { id: string }) => post.id.startsWith("content-"));
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ channel: "Instagram", date: "2026-11-05" });
  });

  it("is not offered without a business to plan for", () => {
    render(<VideoTool audience={audience} />);
    expect(screen.queryByRole("button", { name: "Add to calendar" })).toBeNull();
  });
});
