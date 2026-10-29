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

  it("lets you choose several of the four general audiences", () => {
    render(<OnboardingForm />);
    const group = within(section("Which general audience do you want to reach?"));
    const boxes = group.getAllByRole("checkbox") as HTMLInputElement[];
    expect(boxes.map((box) => box.value)).toEqual(["Residential", "Commercial", "Industrial", "Institutional"]);
    fireEvent.click(group.getByRole("checkbox", { name: "Commercial" }));
    fireEvent.click(group.getByRole("checkbox", { name: "Institutional" }));
    expect(boxes.filter((box) => box.checked).map((box) => box.value)).toEqual(["Commercial", "Institutional"]);
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
    expect(
      (within(section("Which general audience do you want to reach?")).getByRole("checkbox", { name: "Commercial" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect((within(section("Goals")).getByRole("checkbox", { name: "Increase conversions by X%" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("slider")).toBeDefined();
    expect((screen.getByRole("textbox", { name: "Website" }) as HTMLInputElement).value).not.toBe("");
    expect(screen.getByText("Verified")).toBeDefined();
  });

  it("does not refill new rows with old answers after an error", async () => {
    vi.mocked(saveOnboarding).mockResolvedValue({
      errors: { "regions.2.province": "Choose a province" },
      values: {
        ...emptyOnboardingDraft(),
        regions: [
          { country: "CA", province: "BC", area: "Area one" },
          { country: "CA", province: "ON", area: "Area two" },
          { country: "CA", province: "", area: "Area three" },
        ],
      },
    });
    render(<OnboardingForm />);
    fireEvent.click(screen.getByRole("button", { name: "Add another region" }));
    fireEvent.click(screen.getByRole("button", { name: "Add another region" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByText("Choose a province", { selector: "p" })).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Remove region 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Add another region" }));
    const areas = screen.getAllByRole("textbox", { name: "Region or city (optional)" }).map((input) => (input as HTMLInputElement).value);
    expect(areas).toEqual(["Area one", "Area three", ""]);
    const provinces = screen.getAllByRole("combobox", { name: "Province" }).map((select) => (select as HTMLSelectElement).value);
    expect(provinces).toEqual(["BC", "", ""]);
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
        industries: "Choose at least one industry",
        audiences: "Choose at least one audience",
        website: "Enter your website",
        "regions.0.province": "Choose a province",
      },
      values: emptyOnboardingDraft(),
    });
    render(<OnboardingForm />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByText("Choose at least one industry")).toBeDefined());
    expect(screen.getByText("Choose at least one audience")).toBeDefined();
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
