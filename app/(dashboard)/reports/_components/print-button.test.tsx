import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PrintButton } from "./print-button";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PrintButton", () => {
  it("opens the browser's print dialog", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<PrintButton />);
    fireEvent.click(screen.getByRole("button", { name: "Print / Save as PDF" }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("explains where to find Save as PDF", () => {
    render(<PrintButton />);
    expect(screen.getByText("To get a PDF, choose Save as PDF as the printer.")).toBeDefined();
  });
});
