import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import MyContentPage from "./page";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

afterEach(cleanup);

const renderPage = async (from?: string) =>
  render(await MyContentPage({ searchParams: Promise.resolve(from ? { from } : {}), params: Promise.resolve({}) }));

describe("My Content page", () => {
  it("goes back to the tool that opened it", async () => {
    await renderPage("video");
    expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe("/content/video");
  });

  it("goes back to Content Creation otherwise, even for an unknown tool", async () => {
    await renderPage("https://elsewhere.example");
    expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe("/content");
  });
});
