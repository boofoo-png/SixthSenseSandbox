import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SelectField, TextField } from "./text-field";

afterEach(cleanup);

describe("TextField", () => {
  it("labels the input so it can be found by its label", () => {
    render(<TextField label="Email address" name="email" type="email" />);
    const input = screen.getByLabelText("Email address") as HTMLInputElement;
    expect(input.name).toBe("email");
    expect(input.type).toBe("email");
  });

  it("marks required fields with an asterisk that screen readers skip", () => {
    render(<TextField label="Email" name="email" required />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.getAttribute("aria-required")).toBe("true");
    expect(screen.getByText("*").getAttribute("aria-hidden")).toBe("true");
  });

  it("shows helper text and links it to the input", () => {
    render(<TextField label="Email" name="email" helperText="Will be used for login" />);
    const input = screen.getByLabelText("Email");
    const helper = screen.getByText("Will be used for login");
    expect(input.getAttribute("aria-describedby")).toBe(helper.id);
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("shows an error in place of the helper text and marks the input invalid", () => {
    render(<TextField label="Email" name="email" helperText="Will be used for login" error="Enter your email address" />);
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByText("Will be used for login")).toBeNull();
    expect(screen.getByText("Enter your email address").id).toBe(input.getAttribute("aria-describedby"));
  });

  it("lets a password be shown and hidden again", () => {
    render(<TextField label="Password" name="password" type="password" revealable />);
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(input.type).toBe("password");
    fireEvent.click(toggle);
    expect(input.type).toBe("text");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(toggle);
    expect(input.type).toBe("password");
  });

  it("keeps the starting value", () => {
    render(<TextField label="City" name="city" defaultValue="Richmond" />);
    expect((screen.getByLabelText("City") as HTMLInputElement).value).toBe("Richmond");
  });
});

describe("SelectField", () => {
  const options = [
    { value: "CA", label: "Canada" },
    { value: "US", label: "United States" },
  ];

  it("labels the select and lists its options", () => {
    render(<SelectField label="Country" name="country" options={options} defaultValue="CA" />);
    const select = screen.getByLabelText("Country") as HTMLSelectElement;
    expect(select.value).toBe("CA");
    expect(Array.from(select.options).map((option) => option.textContent)).toEqual(["Canada", "United States"]);
  });

  it("offers an empty placeholder choice when given one", () => {
    render(<SelectField label="Province" name="province" options={options} placeholder="Choose a province" />);
    const select = screen.getByLabelText("Province") as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(select.options[0].textContent).toBe("Choose a province");
  });

  it("shows an error and marks the select invalid", () => {
    render(<SelectField label="Province" name="province" options={options} error="Choose a province" />);
    expect(screen.getByLabelText("Province").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Choose a province")).toBeDefined();
  });
});
