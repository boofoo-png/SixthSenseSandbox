import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { CONVERSATIONS, INBOX_KEY } from "@/lib/hub/inbox";
import { resetInboxForTests } from "./_components/community-inbox";
import AiManagementPage from "./page";

beforeEach(() => {
  window.localStorage.clear();
  resetInboxForTests();
});
afterEach(cleanup);

const inbox = () => screen.getByRole("region", { name: "Needs your review" });
const card = (name: string) => within(inbox()).getByText(name).closest("li") as HTMLElement;

describe("AI Management (Figma Make)", () => {
  it("has the Make's heading and lists every conversation as open", () => {
    render(<AiManagementPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Keep every conversation moving" })).toBeDefined();
    expect(within(inbox()).getAllByRole("listitem")).toHaveLength(CONVERSATIONS.length);
    expect(within(inbox()).getByText(`${CONVERSATIONS.length} open`)).toBeDefined();
    expect(within(inbox()).getByText(/nothing is posted/)).toBeDefined();
  });

  it("approves a suggested reply, remembers it, and counts one fewer open", () => {
    render(<AiManagementPage />);
    fireEvent.click(within(card("Jamie Cole")).getByRole("button", { name: "Approve & reply" }));
    expect(within(card("Jamie Cole")).getByRole("button", { name: "Approved" })).toBeDefined();
    expect(within(inbox()).getByText(`${CONVERSATIONS.length - 1} open`)).toBeDefined();
    expect(JSON.parse(window.localStorage.getItem(INBOX_KEY) ?? "{}").replies["jamie-cole"].text).toMatch(/^Absolutely, Jamie/);
  });

  it("lets you adjust a reply before approving it, and refuses an empty one", () => {
    render(<AiManagementPage />);
    fireEvent.click(within(card("Sarah Malik")).getByRole("button", { name: "Adjust" }));
    const box = within(card("Sarah Malik")).getByRole("textbox", { name: "Reply to Sarah Malik" });
    fireEvent.change(box, { target: { value: "" } });
    fireEvent.click(within(card("Sarah Malik")).getByRole("button", { name: "Approve & reply" }));
    expect(within(card("Sarah Malik")).getByRole("alert").textContent).toBe("Write a reply before approving it.");
    fireEvent.change(box, { target: { value: "Hi Sarah, the minimum is 24 units." } });
    fireEvent.click(within(card("Sarah Malik")).getByRole("button", { name: "Approve & reply" }));
    expect(within(card("Sarah Malik")).getByText("Hi Sarah, the minimum is 24 units.")).toBeDefined();
  });

  it("shows sentiment shares that add up to 100", () => {
    render(<AiManagementPage />);
    const panel = screen.getByRole("region", { name: "Conversation sentiment" });
    const values = within(panel).getAllByRole("definition").map((item) => Number(item.textContent?.replace("%", "")));
    expect(values.reduce((sum, value) => sum + value, 0)).toBe(100);
  });
});
