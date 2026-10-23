import { describe, expect, it, vi } from "vitest";
import { APP_NAME } from "@/lib/navigation";

vi.mock("next/font/google", () => ({
  Roboto: () => ({ variable: "font-roboto" }),
}));

const { default: RootLayout, metadata } = await import("./layout");

describe("fonts", () => {
  it("puts only Roboto, the design system font, on the page", () => {
    const html = RootLayout({ children: null } as Parameters<typeof RootLayout>[0]);
    const classes = String(html.props.className).split(/\s+/);
    expect(classes).toContain("font-roboto");
    expect(classes).not.toContain("font-sans");
    expect(classes).not.toContain("font-mono");
  });
});

describe("root metadata", () => {
  it("uses the product name instead of the starter title", () => {
    expect(metadata.title).toEqual({ default: APP_NAME, template: `%s | ${APP_NAME}` });
    expect(metadata.description).not.toContain("create next app");
  });

  it("describes the Sixth Sense product, not the old social media dashboard", () => {
    expect(metadata.description).toContain("research");
    expect(metadata.description).toContain("campaigns");
    expect(metadata.description).not.toContain("social media marketing in one simple dashboard");
  });
});
