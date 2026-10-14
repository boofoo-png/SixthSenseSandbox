import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import { NOTICES, resolveDateRange, type SearchParams } from "@/lib/date-range";
import { DateRangeBar } from "./date-range-bar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(), useRouter: vi.fn() }));

const TODAY = "2026-10-09";
const push = vi.fn();

beforeEach(() => {
  push.mockReset();
  vi.mocked(usePathname).mockReturnValue("/analytics");
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

afterEach(cleanup);

function renderBar(params: SearchParams = {}) {
  render(<DateRangeBar resolved={resolveDateRange(params, TODAY)} today={TODAY} />);
}

function select(name: string) {
  return screen.getByRole("combobox", { name }) as HTMLSelectElement;
}

describe("DateRangeBar", () => {
  it("shows the current choices and a sentence describing them", () => {
    renderBar({ period: "last-7-days", compare: "last-year" });
    expect(select("Show").value).toBe("last-7-days");
    expect(select("Compare to").value).toBe("last-year");
    expect(screen.getByText("Showing Oct 3 - 9, 2026 compared with Oct 3 - 9, 2025.")).toBeDefined();
  });

  it("updates the page address when a quick option is picked", () => {
    renderBar();
    fireEvent.change(select("Show"), { target: { value: "last-30-days" } });
    expect(push).toHaveBeenCalledWith("/analytics?period=last-30-days");
  });

  it("keeps the other choice when one changes", () => {
    renderBar({ period: "last-30-days" });
    fireEvent.change(select("Compare to"), { target: { value: "last-year" } });
    expect(push).toHaveBeenCalledWith("/analytics?period=last-30-days&compare=last-year");
  });

  it("goes back to the plain address for the default choices", () => {
    renderBar({ period: "last-30-days" });
    fireEvent.change(select("Show"), { target: { value: "this-week" } });
    expect(push).toHaveBeenCalledWith("/analytics");
  });

  it("asks for custom dates, which stop at today, before applying them", () => {
    renderBar();
    fireEvent.change(select("Show"), { target: { value: "custom" } });
    expect(push).not.toHaveBeenCalled();

    const start = screen.getByLabelText("Start date") as HTMLInputElement;
    const end = screen.getByLabelText("End date") as HTMLInputElement;
    expect(start.value).toBe("2026-10-04");
    expect(end.max).toBe(TODAY);

    fireEvent.change(start, { target: { value: "2026-08-01" } });
    fireEvent.change(end, { target: { value: "2026-08-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
    expect(push).toHaveBeenCalledWith("/analytics?period=custom&from=2026-08-01&to=2026-08-10");
  });

  it("asks for custom comparison dates", () => {
    renderBar();
    fireEvent.change(select("Compare to"), { target: { value: "custom" } });
    fireEvent.change(screen.getByLabelText("Comparison start date"), { target: { value: "2025-10-04" } });
    fireEvent.change(screen.getByLabelText("Comparison end date"), { target: { value: "2025-10-09" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
    expect(push).toHaveBeenCalledWith("/analytics?compare=custom&compareFrom=2025-10-04&compareTo=2025-10-09");
  });

  it("hides the date boxes and Apply button for quick options", () => {
    renderBar();
    expect(screen.queryByLabelText("Start date")).toBeNull();
    expect(screen.queryByRole("button", { name: "Apply dates" })).toBeNull();
  });

  it("shows notices about dates that could not be used", () => {
    renderBar({ period: "custom", from: "2026-10-01", to: "2027-01-01" });
    expect(screen.getByRole("status").textContent).toContain(NOTICES.future);
  });
});
