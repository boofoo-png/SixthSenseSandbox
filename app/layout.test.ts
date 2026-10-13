import { describe, expect, it, vi } from "vitest";
import { APP_NAME } from "@/lib/navigation";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans" }),
  Geist_Mono: () => ({ variable: "font-mono" }),
}));

const { metadata } = await import("./layout");

describe("root metadata", () => {
  it("uses the product name instead of the starter title", () => {
    expect(metadata.title).toEqual({ default: APP_NAME, template: `%s | ${APP_NAME}` });
    expect(metadata.description).not.toContain("create next app");
  });
});
