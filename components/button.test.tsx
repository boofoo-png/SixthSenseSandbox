import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Button, buttonClassName } from "./button";

afterEach(cleanup);

/** The element's individual class names, so "bg-primary" does not match "hover:bg-primary/4". */
function classesOf(element: HTMLElement): string[] {
  return element.className.split(/\s+/);
}

describe("Button", () => {
  it("renders a native button with its label", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.tagName).toBe("BUTTON");
  });

  it("does not submit forms unless asked to", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("button");
    cleanup();
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("submit");
  });

  it("calls onClick when pressed", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("defaults to the medium text variant, like MUI", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button");
    expect(button.dataset.variant).toBe("text");
    expect(button.dataset.size).toBe("medium");
    const classes = classesOf(button);
    expect(classes).toContain("text-primary");
    expect(classes).not.toContain("bg-primary");
    expect(classes.some((name) => name.startsWith("border-primary"))).toBe(false);
  });

  it("fills the contained variant with the primary color and an elevation", () => {
    render(<Button variant="contained">Save</Button>);
    const classes = classesOf(screen.getByRole("button"));
    expect(classes).toContain("bg-primary");
    expect(classes).toContain("text-primary-contrast");
    expect(classes).toContain("shadow-elevation-2");
  });

  it("draws the outlined variant with a half-opacity primary border", () => {
    render(<Button variant="outlined">Save</Button>);
    const classes = classesOf(screen.getByRole("button"));
    expect(classes).toContain("border-primary/50");
    expect(classes).toContain("text-primary");
    expect(classes).not.toContain("bg-primary");
  });

  it("uses the design's type style for each size", () => {
    render(<Button size="small">Save</Button>);
    expect(screen.getByRole("button").className).toContain("text-[13px]");
    cleanup();
    render(<Button size="medium">Save</Button>);
    expect(screen.getByRole("button").className).toContain("text-[14px]");
    cleanup();
    render(<Button size="large">Save</Button>);
    expect(screen.getByRole("button").className).toContain("text-[15px]");
  });

  it("uses the design's padding for each size and variant", () => {
    render(
      <Button variant="contained" size="large">
        Save
      </Button>,
    );
    expect(screen.getByRole("button").className).toContain("px-[22px]");
    cleanup();
    // The 1px border sits inside the box in Figma, so CSS padding is 1px less.
    render(
      <Button variant="outlined" size="large">
        Save
      </Button>,
    );
    expect(screen.getByRole("button").className).toContain("px-[21px]");
    cleanup();
    render(
      <Button variant="text" size="small">
        Save
      </Button>,
    );
    expect(screen.getByRole("button").className).toContain("px-[5px]");
  });

  it("shows a spinner while loading and blocks presses", () => {
    const onClick = vi.fn();
    render(
      <Button variant="contained" loading onClick={onClick}>
        Save
      </Button>,
    );
    // The label stays as the accessible name even though only the spinner is visible.
    const button = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByTestId("button-spinner")).toBeDefined();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows no spinner when not loading", () => {
    render(<Button>Save</Button>);
    expect(screen.queryByTestId("button-spinner")).toBeNull();
    expect(screen.getByRole("button").getAttribute("aria-busy")).toBeNull();
  });

  it("shares its classes so links and plain buttons can look the same", () => {
    render(
      <Button variant="outlined" size="small">
        Save
      </Button>,
    );
    expect(screen.getByRole("button").className).toBe(buttonClassName({ variant: "outlined", size: "small" }));
    expect(buttonClassName()).toBe(buttonClassName({ variant: "text", size: "medium" }));
    expect(classesOf({ className: buttonClassName({ variant: "contained" }) } as HTMLElement)).toContain("bg-primary");
  });

  it("passes through extra attributes and classes", () => {
    render(
      <Button aria-describedby="hint" className="w-full">
        Save
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-describedby")).toBe("hint");
    expect(button.className).toContain("w-full");
  });
});
