import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { DEMO_ACCOUNT } from "@/lib/hub/constants";
import { NOTIFICATION_TYPES, type AccountSettings } from "@/lib/hub/settings";
import { SettingsView } from "./_components/settings-view";

vi.mock("@/app/(auth)/actions", () => ({ signOut: vi.fn() }));
vi.mock("./actions", () => ({
  saveSettings: vi.fn(async (_previous: unknown, formData: FormData) => ({
    status: formData.get("firstName") ? "saved" : "invalid",
    errors: formData.get("firstName") ? {} : { firstName: "Enter your first name." },
  })),
  changePassword: vi.fn(async () => ({ status: "invalid", errors: { current: "That isn't your current password." } })),
  disconnectMeta: vi.fn(),
}));

afterEach(cleanup);

const settings: AccountSettings = {
  email: DEMO_ACCOUNT.email,
  firstName: "Demo",
  lastName: "User",
  role: "Marketing lead",
  phone: "",
  company: "Harbourline Supply Co.",
  website: "https://harbourline.example",
  industry: "Wholesale",
  timeZone: "Pacific Time (PT)",
  notifications: { competitor: true, trends: true, reports: false, posts: true },
};

function renderSettings(props: Partial<Parameters<typeof SettingsView>[0]> = {}) {
  render(<SettingsView initial={settings} startSection="Profile" isDemo connected={["Instagram"]} {...props} />);
}

const nav = () => screen.getByRole("navigation", { name: "Settings sections" });

describe("Settings (Figma Make)", () => {
  it("has the Make's four sections, a profile summary, and Sign out", () => {
    renderSettings();
    expect(screen.getByRole("heading", { level: 1, name: "Profile and settings" })).toBeDefined();
    expect(within(nav()).getAllByRole("button").map((button) => button.textContent)).toEqual(["Profile", "Workspace", "Notifications", "Security"]);
    expect(screen.getAllByText("Demo User").length).toBeGreaterThan(0);
    const signOut = screen.getAllByRole("button", { name: "Sign out" })[0];
    expect(signOut.getAttribute("type")).toBe("submit");
  });

  it("shows the profile fields, with the email fixed", () => {
    renderSettings();
    expect((screen.getByLabelText("First name") as HTMLInputElement).value).toBe("Demo");
    const email = screen.getByLabelText("Email address") as HTMLInputElement;
    expect(email.disabled).toBe(true);
    expect(screen.getByText(/can't be changed here/)).toBeDefined();
  });

  it("switches sections and starts on the one asked for", () => {
    renderSettings({ startSection: "Workspace" });
    expect(within(nav()).getByRole("button", { name: "Workspace" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("1 channel listed at sign-up")).toBeDefined();
    fireEvent.click(within(nav()).getByRole("button", { name: "Notifications" }));
    for (const type of NOTIFICATION_TYPES) expect(screen.getByRole("switch", { name: new RegExp(type.title) })).toBeDefined();
    expect((screen.getByRole("switch", { name: /Report reminders/ }) as HTMLInputElement).checked).toBe(false);
  });

  it("saves every section with one button and confirms it", async () => {
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Your changes were saved in this browser.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Changes saved" })).toBeDefined();
  });

  it("shows what to fix when a save fails", async () => {
    renderSettings();
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Enter your first name.")).toBeDefined();
    expect(screen.getByText("Check the highlighted fields.")).toBeDefined();
  });

  it("keeps the demo account's password fixed and lists this browser's session", () => {
    renderSettings({ startSection: "Security" });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(screen.getByText(/password is fixed/)).toBeDefined();
    expect((screen.getByLabelText("Current password") as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Review sessions" }));
    expect(screen.getByText(/signed in as demo@sixthsense.app/)).toBeDefined();
  });
});

describe("Instagram and Facebook connection", () => {
  const card = () => screen.getByText(/^Instagram and Facebook for/).closest("div[aria-labelledby]") as HTMLElement;

  it("offers Connect for the chosen business, read only", () => {
    renderSettings({ startSection: "Workspace", metaCard: { summary: { status: "not-connected" }, result: null, businessName: "Hotel Depot" } });
    expect(within(card()).getByText("Instagram and Facebook for Hotel Depot")).toBeDefined();
    expect(within(card()).getByText(/nothing is ever posted/)).toBeDefined();
    expect(within(card()).getByRole("link", { name: "Connect Instagram and Facebook" }).getAttribute("href")).toBe("/api/meta/connect");
    expect(within(card()).queryByRole("button", { name: "Disconnect" })).toBeNull();
  });

  it("shows the connected account with Reconnect and Disconnect, and confirms the connection", () => {
    const at = Date.parse("2026-11-06T12:00:00Z");
    renderSettings({
      startSection: "Workspace",
      metaCard: { summary: { status: "connected", igUsername: "sixthsense", pageName: "Sixth Sense Test", connectedAt: at, expiresAt: at + 59 * 864e5 }, result: "connected", businessName: "Hotel Depot" },
    });
    expect(card().textContent).toContain("@sixthsense");
    expect(card().textContent).toContain("Sixth Sense Test");
    expect(within(card()).getByRole("status").textContent).toMatch(/^Connected\./);
    expect(within(card()).getByRole("link", { name: "Reconnect" })).toBeDefined();
    expect(within(card()).getByRole("button", { name: "Disconnect" })).toBeDefined();
  });

  it("explains what went wrong", () => {
    renderSettings({ startSection: "Workspace", metaCard: { summary: { status: "not-connected" }, result: "no-instagram", businessName: "Hotel Depot" } });
    expect(within(card()).getByRole("status").textContent).toMatch(/Instagram professional account linked/);
  });

  it("says when the Meta app is not set up, without a Connect button", () => {
    renderSettings({ startSection: "Workspace", metaCard: { summary: { status: "not-configured" }, result: null, businessName: "Hotel Depot" } });
    expect(card().textContent).toMatch(/not set up/);
    expect(within(card()).queryByRole("link")).toBeNull();
  });
});
