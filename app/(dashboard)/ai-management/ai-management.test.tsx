import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SCHEDULE_KEY, findBusiness, recommendationsFor, sampleSchedule } from "@/lib/hub/posting-plan";
import { resetSavedContentForTests } from "../content/_components/use-saved-content";
import { PlanWizard } from "./_components/plan-wizard";
import { PostingPlan } from "./_components/posting-plan";
import { resetSchedulesForTests } from "./_components/use-schedules";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

beforeEach(() => {
  window.localStorage.clear();
  resetSchedulesForTests();
  resetSavedContentForTests();
});
afterEach(cleanup);

const today = "2026-11-05";
const depot = findBusiness("hotel-depot");

function renderPlan(id: "hotel-depot" | "hospitality-emporium" = "hotel-depot") {
  render(<PostingPlan businessId={id} businessName={findBusiness(id).name} today={today} rec={recommendationsFor(findBusiness(id))} />);
}
const saved = () => JSON.parse(window.localStorage.getItem(SCHEDULE_KEY) ?? "{}");

describe("AI Posting Plan", () => {
  it("shows the four recommendations from the design", () => {
    renderPlan();
    const cards = within(screen.getByRole("list", { name: "Recommendations" })).getAllByRole("listitem", { hidden: false });
    expect(cards[0].textContent).toMatch(/Recommended frequency4–5 posts per week/);
    expect(screen.getByText("Best days to post")).toBeDefined();
    expect(screen.getByText("Best time to post (PST)")).toBeDefined();
    expect(screen.getByText("Recommended content mix")).toBeDefined();
    expect(screen.getByRole("link", { name: "Generate New Plan" }).getAttribute("href")).toBe("/ai-management/plan");
  });

  it("plans for the business chosen in the top bar", () => {
    renderPlan("hospitality-emporium");
    expect(screen.getByText("Hospitality Emporium", { selector: "strong" })).toBeDefined();
    expect(screen.getByText(/5–6 posts per week/)).toBeDefined();
  });

  it("shows this month's sample posts in the calendar and lists the next five", () => {
    renderPlan();
    const calendar = screen.getByRole("table", { name: /Scheduled posts in November 2026/ });
    const first = sampleSchedule(depot, today)[0];
    expect(within(calendar).getAllByRole("button", { name: new RegExp(first.title) }).length).toBeGreaterThan(0);
    const upcoming = screen.getByRole("region", { name: "Upcoming Posts" });
    expect(within(upcoming).getAllByRole("listitem")).toHaveLength(5);
    fireEvent.click(within(upcoming).getByRole("button", { name: "View All" }));
    expect(within(upcoming).getAllByRole("listitem").length).toBeGreaterThan(5);
  });

  it("moves between months and filters by channel", () => {
    renderPlan();
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("table", { name: /December 2026/ })).toBeDefined();
    const filter = screen.getByRole("group", { name: "Filter by channel" });
    fireEvent.click(within(filter).getByRole("button", { name: /^TikTok/ }));
    const titles = within(screen.getByRole("table")).queryAllByRole("button").map((button) => button.textContent);
    expect(titles.every((text) => /TikTok/.test(text ?? ""))).toBe(true);
  });

  it("adds a post with the editor, suggesting a format for the channel", () => {
    renderPlan();
    fireEvent.click(screen.getByRole("button", { name: "+ New post" }));
    const dialog = screen.getByRole("dialog", { name: "New post for Hotel Depot" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save post" }));
    expect(within(dialog).getByText("Add a title.")).toBeDefined();
    fireEvent.change(within(dialog).getByLabelText("Title"), { target: { value: "Holiday kits are back" } });
    fireEvent.change(within(dialog).getByLabelText("Channel"), { target: { value: "TikTok" } });
    expect(within(dialog).getByRole("button", { name: "Suggested for TikTok: Video" })).toBeDefined();
    fireEvent.click(within(dialog).getByRole("button", { name: "Suggested for TikTok: Video" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Save post" }));
    expect(screen.getByText("Post added to the calendar.")).toBeDefined();
    const post = saved().businesses["hotel-depot"].posts.find((item: { title: string }) => item.title === "Holiday kits are back");
    expect(post).toMatchObject({ channel: "TikTok", format: "Video", date: today });
  });

  it("turns on a simulated Auto Publishing that says nothing is posted", () => {
    renderPlan();
    const toggle = screen.getByRole("switch", { name: "Auto Publishing" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText(/Simulated: nothing is posted/)).toBeDefined();
    expect(saved().businesses["hotel-depot"].autoPublish).toBe(true);
  });
});

describe("Generate a new plan", () => {
  const renderWizard = () => render(<PlanWizard businessId="hotel-depot" businessName="Hotel Depot" today={today} />);

  it("starts on step 1 with a live plan preview", () => {
    renderWizard();
    expect(screen.getByRole("heading", { level: 1, name: "Generate a new plan" })).toBeDefined();
    const steps = screen.getByRole("list", { name: "Plan creation steps" });
    expect(within(steps).getByText("Plan settings").closest("li")?.getAttribute("aria-current")).toBe("step");
    const preview = screen.getByRole("region", { name: "Plan preview" });
    const before = within(preview).getByText("Estimated posts").previousElementSibling?.textContent;
    fireEvent.change(screen.getByLabelText("Posting frequency"), { target: { value: "1" } });
    expect(within(preview).getByText("Estimated posts").previousElementSibling?.textContent).not.toBe(before);
  });

  it("explains what to fix before generating", () => {
    renderWizard();
    const channels = screen.getByRole("group", { name: "Connected channels" });
    for (const button of within(channels).getAllByRole("button")) fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: "Generate plan →" }));
    expect(screen.getByRole("alert").textContent).toBe("Fix 1 thing above to generate the plan.");
    expect(screen.getByText("Choose at least one channel.")).toBeDefined();
  });

  it("goes from settings to review to the calendar, adding only the selected drafts", () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: "Generate plan →" }));
    expect(screen.getByRole("heading", { level: 1, name: "Review your suggestions" })).toBeDefined();
    const table = screen.getByRole("table", { name: "Suggested posts" });
    const boxes = within(table).getAllByRole("checkbox").slice(1);
    const total = boxes.length;
    fireEvent.click(boxes[0]);
    expect(screen.getByRole("button", { name: `Add ${total - 1} posts to calendar →` })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: `Add ${total - 1} posts to calendar →` }));
    expect(screen.getByRole("heading", { level: 1, name: "Add to calendar" })).toBeDefined();
    expect(screen.getByText(`${total - 1} posts added to your calendar`)).toBeDefined();
    expect(screen.getByText(`${total - 1} scheduled · 0 published`)).toBeDefined();
    const plan = saved().businesses["hotel-depot"].posts.filter((post: { id: string }) => post.id.startsWith("plan-"));
    expect(plan).toHaveLength(total - 1);
    expect(screen.getByRole("link", { name: "Go to Content Calendar →" }).getAttribute("href")).toBe("/ai-management");
  });

  it("filters drafts by format, regenerates them, and edits one", () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: "Generate plan →" }));
    const preview = () => screen.getByRole("region", { name: "Post preview" });
    const title = within(preview()).getByRole("heading", { level: 3 }).textContent;
    fireEvent.click(within(preview()).getByRole("button", { name: "Regenerate" }));
    expect(within(preview()).getByRole("heading", { level: 3 }).textContent).not.toBe(title);
    fireEvent.click(within(preview()).getByRole("button", { name: "Edit post" }));
    const dialog = screen.getByRole("dialog", { name: "Edit draft" });
    fireEvent.change(within(dialog).getByLabelText("Title"), { target: { value: "Edited draft" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save post" }));
    expect(within(preview()).getByRole("heading", { level: 3 }).textContent).toBe("Edited draft");
    const formats = screen.getByRole("group", { name: "Filter by format" });
    fireEvent.click(within(formats).getByRole("button", { name: /^Videos/ }));
    const rows = within(screen.getByRole("table", { name: "Suggested posts" })).getAllByRole("row").slice(1);
    expect(rows.every((row) => /Video/.test(row.textContent ?? ""))).toBe(true);
  });
});
