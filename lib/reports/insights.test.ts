import { describe, expect, it } from "vitest";
import { csvCell } from "./insights";

describe("CSV", () => {
  it("never lets a spreadsheet run a cell as a formula", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("-5")).toBe("'-5");
    expect(csvCell(-5)).toBe("-5");
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
  });

});
