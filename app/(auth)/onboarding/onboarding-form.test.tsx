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

  it("picks one industry, and the sub-industries follow it (Figma Make)", () => {
    render(<OnboardingForm />);
    const industry = screen.getByRole("combobox", { name: "Industry" }) as HTMLSelectElement;
    const sub = () => screen.getByRole("combobox", { name: "Sub-industry" }) as HTMLSelectElement;
    expect(industry.options).toHaveLength(24); // the placeholder and 23 industries
    fireEvent.change(industry, { target: { value: "Hospitality and Tourism" } });
    expect(sub().value).toBe("Hotels and accommodation");
    expect(Array.from(sub().options).map((option) => option.text)).toContain("Hospitality supplies");
    fireEvent.change(industry, { target: { value: "Wholesale" } });
    expect(sub().value).toBe("Durable goods");
  });

  it("chooses a target region level by level, and adds and removes rows", () => {
    render(<OnboardingForm />);
    const value = (name: string | RegExp, index = 0) => (screen.getAllByRole("combobox", { name })[index] as HTMLSelectElement).value;
    expect(value("Choose a country")).toBe("Canada");
    fireEvent.change(screen.getByRole("combobox", { name: "Choose a province or territory" }), { target: { value: "British Columbia" } });
    expect(value("Choose a region")).toBe("Lower Mainland");
    expect(value("Choose a subdivision")).toBe("Any area in Lower Mainland");
    fireEvent.change(screen.getByRole("combobox", { name: "Choose a subdivision" }), { target: { value: "Richmond" } });
    expect(value("Choose a subdivision")).toBe("Richmond");

    fireEvent.click(screen.getByRole("button", { name: "Add another region" }));
    fireEvent.change(screen.getAllByRole("combobox", { name: "Choose a country" })[1], { target: { value: "United States" } });
    expect(value("Choose a state")).toBe("Alabama");
    expect(value("Choose a region", 1)).toBe("Statewide \u2014 Alabama");
    fireEvent.click(screen.getByRole("button", { name: "Remove region 2" }));
    expect(screen.getAllByRole("combobox", { name: "Choose a country" })).toHaveLength(1);
  });

  it("picks one of the four general audiences from a list", () => {
    render(<OnboardingForm />);
    const select = screen.getByRole("combobox", { name: "Choose a category" }) as HTMLSelectElement;
    expect(Array.from(select.options).map((option) => option.value)).toEqual(["", "Residential", "Commercial", "Industrial", "Institutional"]);
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
    expect((screen.getByRole("combobox", { name: "Industry" }) as HTMLSelectElement).value).toBe("Wholesale");
    expect((screen.getByRole("combobox", { name: "Sub-industry" }) as HTMLSelectElement).value).toBe("Hospitality and restaurant supplies");
    expect((screen.getByRole("combobox", { name: "Choose a subdivision" }) as HTMLSelectElement).value).toBe("Richmond");
    expect((screen.getByRole("combobox", { name: "Choose a category" }) as HTMLSelectElement).value).toBe("Commercial");
    expect((within(section("Goals")).getByRole("checkbox", { name: "Increase conversions by X%" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("slider")).toBeDefined();
    expect((screen.getByRole("textbox", { name: "Website" }) as HTMLInputElement).value).not.toBe("");
    expect(screen.getByText("Verified")).toBeDefined();
  });

  it("does not refill new rows with old answers after an error", async () => {
    vi.mocked(saveOnboarding).mockResolvedValue({
      errors: { "regions.2.region": "Choose a region" },
      values: {
        ...emptyOnboardingDraft(),
        regions: [
          { country: "Canada", area: "British Columbia", region: "Lower Mainland", subdivision: "Richmond" },
          { country: "Canada", area: "Ontario", region: "Eastern Ontario", subdivision: "Any area in Eastern Ontario" },
          { country: "Canada", area: "Alberta", region: "", subdivision: "" },
        ],
      },
    });
    render(<OnboardingForm />);
    fireEvent.click(screen.getByRole("button", { name: "Add another region" }));
    fireEvent.click(screen.getByRole("button", { name: "Add another region" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByText("Choose a region", { selector: "p" })).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Remove region 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Add another region" }));
    const areas = screen.getAllByRole("combobox", { name: "Choose a province or territory" }).map((select) => (select as HTMLSelectElement).value);
    expect(areas).toEqual(["British Columbia", "Alberta", ""]);
  });

  it("shows a message for the whole form when the answers are too big to save", async () => {
    vi.mocked(saveOnboarding).mockResolvedValue({
      errors: { form: "These answers are too long to save. Shorten some links or remove a few rows." },
      values: emptyOnboardingDraft(),
    });
    render(<OnboardingForm />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("These answers are too long to save"));
  });

  it("locks Continue and Back while one of them is working, so they cannot both run", async () => {
    let finish: (state: Awaited<ReturnType<typeof saveOnboarding>>) => void = () => {};
    vi.mocked(saveOnboarding).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<OnboardingForm />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect((screen.getByRole("button", { name: "Back" }) as HTMLButtonElement).disabled).toBe(true));
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    // Let the request finish: React holds later form actions until pending ones complete.
    finish({ errors: {}, values: emptyOnboardingDraft() });
    await waitFor(() => expect((screen.getByRole("button", { name: "Back" }) as HTMLButtonElement).disabled).toBe(false));
  });

  it("verifies a social account with Connect (simulated), and un-verifies it if the handle changes", () => {
    const { container } = render(<OnboardingForm />);
    const handle = screen.getByRole("textbox", { name: "Handle" });
    fireEvent.change(handle, { target: { value: "@harbourline" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect account 1" }));
    expect(screen.getByText("Verified")).toBeDefined();
    const verified = () => (container.querySelector('input[name="socialVerified"]') as HTMLInputElement).value;
    expect(verified()).toBe("1");
    fireEvent.change(handle, { target: { value: "@other" } });
    expect(screen.queryByText("Verified")).toBeNull();
    expect(verified()).toBe("");
  });

  it("does not verify a handle that is not valid", () => {
    render(<OnboardingForm />);
    fireEvent.change(screen.getByRole("textbox", { name: "Handle" }), { target: { value: "has spaces!" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect account 1" }));
    expect(screen.queryByText("Verified")).toBeNull();
    expect(screen.getByText("Enter a handle like @yourbrand")).toBeDefined();
  });

  it("generates an invite link that names the company, with a Copy button", () => {
    const { container } = render(<OnboardingForm company="Harbourline Supply Co." />);
    fireEvent.click(screen.getByRole("button", { name: "Generate a link" }));
    const link = (screen.getByRole("textbox", { name: "Invite link" }) as HTMLInputElement).value;
    expect(link).toMatch(/\/create-account\?invite=[\w-]+$/);
    expect((container.querySelector('input[name="inviteLink"]') as HTMLInputElement).value).toBe(link);
    expect(screen.getByRole("button", { name: "Copy invite link" })).toBeDefined();
  });

  it("lets each optional section be added later, and brought back with Add now", () => {
    const { container } = render(<OnboardingForm />);
    for (const name of ["Add social accounts later", "Add competitors later", "Add documents later", "Invite your team later"]) {
      fireEvent.click(screen.getByRole("button", { name }));
    }
    expect(screen.getAllByText("Skipped. You can add this later in Settings.")).toHaveLength(4);
    expect(container.querySelector('input[name="competitorName"]')).toBeNull();
    expect(container.querySelector('input[name="socialHandle"]')).toBeNull();
    expect(container.querySelector('input[name="invites"]')).toBeNull();
    expect(screen.getByRole("textbox", { name: "Website" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Add competitors now" }));
    expect(container.querySelector('input[name="competitorName"]')).not.toBeNull();
  });

  it("shows the problems from the server next to their fields", async () => {
    vi.mocked(saveOnboarding).mockResolvedValue({
      errors: {
        industry: "Choose an industry",
        audience: "Choose an audience",
        website: "Enter your website",
        "regions.0.area": "Choose a province or territory",
      },
      values: emptyOnboardingDraft(),
    });
    render(<OnboardingForm />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByText("Choose an industry", { selector: "p" })).toBeDefined());
    expect(screen.getByText("Choose an audience", { selector: "p" })).toBeDefined();
    expect(screen.getByRole("alert").textContent).toContain("Check the highlighted answers");
    expect(screen.getByRole("textbox", { name: "Website" }).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("combobox", { name: "Choose a province or territory" }).getAttribute("aria-invalid")).toBe("true");
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
          industry: "Wholesale",
          subIndustry: "Non-durable goods",
          website: "example.com",
          goals: ["conversions"],
          conversionTarget: "20",
          documents: ["plan.pdf"],
        }}
      />,
    );
    expect((screen.getByRole("combobox", { name: "Industry" }) as HTMLSelectElement).value).toBe("Wholesale");
    expect((screen.getByRole("combobox", { name: "Sub-industry" }) as HTMLSelectElement).value).toBe("Non-durable goods");
    expect((screen.getByRole("textbox", { name: "Website" }) as HTMLInputElement).value).toBe("example.com");
    expect((screen.getByRole("slider") as HTMLInputElement).value).toBe("20");
    expect((container.querySelector('input[name="documentName"]') as HTMLInputElement).value).toBe("plan.pdf");
  });
});
