import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { emptyOnboardingDraft } from "@/lib/hub/onboarding";
import { saveOnboarding } from "../actions";
import { OnboardingForm } from "./onboarding-form";

vi.mock("../actions", () => ({ saveOnboarding: vi.fn(), signOut: vi.fn(), goBackToStepOne: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.mocked(saveOnboarding).mockReset();
});

const section = (name: string) => screen.getByRole("group", { name });

describe("OnboardingForm", () => {
  it("is step 2 of creating an account, with the mid-fi sections", () => {
    render(<OnboardingForm />);
    expect(screen.getByText("Step 2 of 2")).toBeDefined();
    expect(screen.getByRole("heading", { level: 1, name: "Tell us about your industry" })).toBeDefined();
    for (const name of [
      "Industry",
      "Who are you trying to reach?",
      "Goals",
      "Link your accounts",
      "Competitors",
      "Upload Documents",
      "Invite your team",
    ]) {
      expect(screen.getByRole("heading", { name })).toBeDefined();
    }
  });

  it("lets you pick several industries as chips", () => {
    render(<OnboardingForm />);
    const wholesale = within(section("Industries")).getByRole("checkbox", { name: "Wholesale" }) as HTMLInputElement;
    const retail = within(section("Industries")).getByRole("checkbox", { name: "Retail" }) as HTMLInputElement;
    fireEvent.click(wholesale);
    fireEvent.click(retail);
    expect(wholesale.checked && retail.checked).toBe(true);
  });

  it("adds and removes target regions, switching provinces to states by country", () => {
    render(<OnboardingForm />);
    const regions = () => screen.getAllByRole("combobox", { name: /^(Province|State)$/ });
    expect(regions()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Add another region" }));
    expect(regions()).toHaveLength(2);
    fireEvent.change(screen.getAllByRole("combobox", { name: "Country" })[1], { target: { value: "US" } });
    expect(screen.getByRole("combobox", { name: "State" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Remove region 2" }));
    expect(regions()).toHaveLength(1);
  });

  it("offers the four general audiences", () => {
    render(<OnboardingForm />);
    const audience = screen.getByRole("combobox", { name: "Which general audience do you want to reach?" });
    expect(within(audience).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Choose a category",
      "Residential",
      "Commercial",
      "Industrial",
      "Institutional",
    ]);
  });

  it("shows the conversion slider only when that goal is ticked", () => {
    render(<OnboardingForm />);
    const goals = section("Goals");
    expect(within(goals).getAllByRole("checkbox")).toHaveLength(12);
    expect(screen.queryByRole("slider")).toBeNull();
    fireEvent.click(within(goals).getByRole("checkbox", { name: "Increase conversions by X%" }));
    const slider = screen.getByRole("slider", { name: "Target increase in conversions" }) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "15" } });
    expect(screen.getByText("15%")).toBeDefined();
  });

  it("is honest that accounts are not connected, files are not uploaded, and invites are not sent", () => {
    render(<OnboardingForm />);
    expect(screen.getByText(/Connecting to the platforms isn't available in the prototype yet/)).toBeDefined();
    expect(screen.getByText(/only the file names are saved/)).toBeDefined();
    expect(screen.getByText(/Invites aren't sent in the prototype/)).toBeDefined();
  });

  it("keeps the names of chosen files and turns away the wrong kind", () => {
    const { container } = render(<OnboardingForm />);
    const input = screen.getByLabelText(/Click or drag and drop to upload/) as HTMLInputElement;
    const report = new File(["x"], "Q3 results.xlsx");
    const song = new File(["x"], "song.mp3");
    fireEvent.change(input, { target: { files: [report, song] } });
    expect(screen.getByText("Q3 results.xlsx")).toBeDefined();
    expect(screen.getByText(/song.mp3 isn't a PDF, PNG, JPG, DOCX, or XLSX file/)).toBeDefined();
    const names = Array.from(container.querySelectorAll<HTMLInputElement>('input[name="documentName"]')).map((i) => i.value);
    expect(names).toEqual(["Q3 results.xlsx"]);
    fireEvent.click(screen.getByRole("button", { name: "Remove Q3 results.xlsx" }));
    expect(container.querySelectorAll('input[name="documentName"]')).toHaveLength(0);
  });

  it("offers a Fill with sample data button only when asked to (local development)", () => {
    render(<OnboardingForm />);
    expect(screen.queryByRole("button", { name: /Fill with sample data/ })).toBeNull();
    cleanup();
    render(<OnboardingForm showDevTools />);
    fireEvent.click(screen.getByRole("button", { name: /Fill with sample data/ }));
    const industries = within(section("Industries"));
    expect((industries.getByRole("checkbox", { name: "Wholesale" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("combobox", { name: "Province" }) as HTMLSelectElement).value).toBe("BC");
    expect((screen.getByRole("combobox", { name: "Which general audience do you want to reach?" }) as HTMLSelectElement).value).toBe(
      "Commercial",
    );
    expect((within(section("Goals")).getByRole("checkbox", { name: "Increase conversions by X%" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("slider")).toBeDefined();
    expect((screen.getByRole("textbox", { name: "Website" }) as HTMLInputElement).value).not.toBe("");
  });

  it("shows the problems from the server next to their fields", async () => {
    vi.mocked(saveOnboarding).mockResolvedValue({
      errors: { industries: "Choose at least one industry", website: "Enter your website", "regions.0.province": "Choose a province" },
      values: emptyOnboardingDraft(),
    });
    render(<OnboardingForm />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByText("Choose at least one industry")).toBeDefined());
    expect(screen.getByRole("alert").textContent).toContain("Check the highlighted answers");
    expect(screen.getByRole("textbox", { name: "Website" }).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("combobox", { name: "Province" }).getAttribute("aria-invalid")).toBe("true");
  });

  it("always has Continue and a Back button that keeps the answers while returning to step 1", () => {
    render(<OnboardingForm />);
    const back = screen.getByRole("button", { name: "Back" });
    expect(back.getAttribute("type")).toBe("submit");
    expect(back.closest("form")).toBe(screen.getByRole("button", { name: "Continue" }).closest("form"));
    expect(back.hasAttribute("formaction")).toBe(true);
    // Pressing Enter in a field uses the first submit button, which must be Continue (mid-fi order too).
    expect(back.closest("form")?.querySelector('button[type="submit"]')?.textContent).toContain("Continue");
  });

  it("is filled in again after coming back from step 1", () => {
    const { container } = render(
      <OnboardingForm
        initialDraft={{
          ...emptyOnboardingDraft(),
          industries: ["Wholesale"],
          website: "example.com",
          goals: ["conversions"],
          conversionTarget: "20",
          documents: ["plan.pdf"],
        }}
      />,
    );
    expect((within(section("Industries")).getByRole("checkbox", { name: "Wholesale" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("textbox", { name: "Website" }) as HTMLInputElement).value).toBe("example.com");
    expect((screen.getByRole("slider") as HTMLInputElement).value).toBe("20");
    expect((container.querySelector('input[name="documentName"]') as HTMLInputElement).value).toBe("plan.pdf");
  });
});
