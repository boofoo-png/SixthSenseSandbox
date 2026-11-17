import { describe, expect, it } from "vitest";
import { TARGET_COUNTRIES, areaLabel, areasFor, firstTargetRegion, isTargetRegion, regionsFor, subdivisionsFor } from "./target-regions";

describe("target regions (Figma Make onboarding)", () => {
  it("offers the Make's seventeen countries, Canada first", () => {
    expect(TARGET_COUNTRIES).toHaveLength(17);
    expect(TARGET_COUNTRIES[0]).toBe("Canada");
    expect(TARGET_COUNTRIES).toContain("United Arab Emirates");
  });

  it("names the second level for the country", () => {
    expect(areaLabel("Canada")).toBe("Choose a province or territory");
    expect(areaLabel("United States")).toBe("Choose a state");
    expect(areaLabel("Japan")).toBe("Choose a state or region");
  });

  it("lists provinces, states, and regions per country", () => {
    expect(areasFor("Canada")).toHaveLength(13);
    expect(areasFor("United States")).toContain("District of Columbia");
    expect(areasFor("United Kingdom")).toEqual(["England", "Northern Ireland", "Scotland", "Wales"]);
    expect(areasFor("Atlantis")).toEqual([]);
  });

  it("uses named regions for Canada and generic ones elsewhere", () => {
    expect(regionsFor("Canada", "British Columbia")).toEqual([
      "Lower Mainland",
      "Fraser Valley",
      "Vancouver Island",
      "Thompson-Okanagan",
      "Northern British Columbia",
    ]);
    expect(regionsFor("United States", "Texas")[0]).toBe("Statewide — Texas");
    expect(regionsFor("Japan", "Kanto")).toEqual(["All of Kanto", "Northern Kanto", "Central Kanto", "Southern Kanto", "Major metro areas — Kanto"]);
  });

  it("offers subdivisions, with named cities where the Make has them", () => {
    expect(subdivisionsFor("British Columbia", "Lower Mainland")).toEqual([
      "Any area in Lower Mainland",
      "Vancouver",
      "Burnaby",
      "Richmond",
      "North Shore",
      "Surrey and Delta",
    ]);
    expect(subdivisionsFor("Kanto", "All of Kanto")).toEqual([
      "Any area in All of Kanto",
      "Urban areas — All of Kanto",
      "Suburban areas — All of Kanto",
      "Rural areas — All of Kanto",
      "Any area in Kanto",
    ]);
  });

  it("starts a country at its first province, region, and subdivision", () => {
    expect(firstTargetRegion("Canada")).toEqual({ country: "Canada", area: "Alberta", region: "Northern Alberta", subdivision: "Any area in Northern Alberta" });
  });

  it("accepts only a consistent choice at every level", () => {
    const ok = { country: "Canada", area: "British Columbia", region: "Lower Mainland", subdivision: "Richmond" };
    expect(isTargetRegion(ok)).toBe(true);
    expect(isTargetRegion({ ...ok, country: "Atlantis" })).toBe(false);
    expect(isTargetRegion({ ...ok, area: "Texas" })).toBe(false);
    expect(isTargetRegion({ ...ok, region: "Fraser Valley" })).toBe(false); // Richmond is not in the Fraser Valley
    expect(isTargetRegion({ country: "CA", province: "BC", area: "" })).toBe(false); // the old shape
  });
});
