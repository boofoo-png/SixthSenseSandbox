import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import LoginLayout from "./layout";

vi.mock("next/font/google", () => ({ Montserrat: () => ({ className: "montserrat" }) }));

afterEach(cleanup);

describe("LoginLayout", () => {
  it("shows the logo, named for screen readers, beside the page", () => {
    const { container } = render(
      <LoginLayout>
        <p>Form</p>
      </LoginLayout>,
    );
    const logo = screen.getByRole("img", { name: "Sixth Sense" });
    expect(logo.getAttribute("src")).toContain("sixth-sense-mark.svg");
    expect(screen.getByText("Form")).toBeDefined();
    expect(container.firstElementChild?.className).toContain("montserrat");
  });

  it("shows the welcome and tagline from the Log In frame", () => {
    render(
      <LoginLayout>
        <p>Form</p>
      </LoginLayout>,
    );
    expect(screen.getByText("WELCOME TO")).toBeDefined();
    expect(screen.getByText("SixthSense")).toBeDefined();
    expect(screen.getByText("Everything Marketing,")).toBeDefined();
    expect(screen.getByText("All in ONE PLACE")).toBeDefined();
  });
});
