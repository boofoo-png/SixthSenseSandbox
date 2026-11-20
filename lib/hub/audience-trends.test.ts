import { describe, expect, it } from "vitest";
import {
  AUDIENCE_TRENDS_KEY,
  MAX_SAVED_AUDIENCES,
  PLATFORM_FILTERS,
  STARTER_STATE,
  TRENDS,
  addAudience,
  adviceSlug,
  loadTrackerState,
  matchingSuggestions,
  saveTrackerState,
  visibleTrends,
  type TrackerState,
  type TrendAudience,
} from "./audience-trends";

const buyers: TrendAudience = { id: "a1", name: "Hospitality buyers", type: "niche", description: "" };
const travellers: TrendAudience = { id: "a2", name: "Conscious travellers", type: "broad", description: "" };
const custom: TrendAudience = { id: "a3", name: "Eco restaurant owners", type: "niche", description: "" };

const names = (list: { name: string }[]) => list.map((item) => item.name);

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

describe("visibleTrends", () => {
  it("shows every trend with no audience selected and no filters", () => {
    expect(visibleTrends([], "All platforms")).toHaveLength(TRENDS.length);
  });

  it("keeps trends for a selected audience by name or by its depth (the Make's rule)", () => {
    // Hospitality buyers is niche, so every niche trend matches too.
    expect(names(visibleTrends([buyers], "All platforms"))).toEqual([
      "Proof over promises",
      "Direct booking value",
      "Low-waste room resets",
      "Silent room unboxing",
    ]);
  });

  it("combines several selected audiences", () => {
    expect(visibleTrends([buyers, travellers], "All platforms")).toHaveLength(TRENDS.length);
  });

  it("filters by source", () => {
    expect(names(visibleTrends([], "TikTok"))).toEqual(["Small luxury moments", "Low-waste room resets", "Budget travel swaps"]);
    expect(names(visibleTrends([travellers], "Instagram"))).toEqual(["Experience-first travel"]);
  });

  it("only uses Instagram and TikTok (LinkedIn is not used)", () => {
    expect(PLATFORM_FILTERS).toEqual(["All platforms", "Instagram", "TikTok"]);
    expect(TRENDS.every((trend) => trend.platform === "Instagram" || trend.platform === "TikTok")).toBe(true);
  });
});

describe("matchingSuggestions", () => {
  it("finds suggested audiences by name, case-insensitively, leaving out saved ones", () => {
    expect(names(matchingSuggestions("TRAVEL", []))).toEqual(["Conscious travellers", "Leisure travellers"]);
    expect(names(matchingSuggestions("travel", [travellers]))).toEqual(["Leisure travellers"]);
  });

  it("shows nothing for an empty search", () => {
    expect(matchingSuggestions("   ", [])).toEqual([]);
  });
});

describe("addAudience", () => {
  it("adds a trimmed audience with a fresh id", () => {
    const result = addAudience([buyers], { name: "  Eco restaurant owners ", type: "niche", description: " Kitchens " }, "id-9");
    expect(result).toEqual({ ok: true, audience: { id: "id-9", name: "Eco restaurant owners", type: "niche", description: "Kitchens" } });
  });

  it("needs a name", () => {
    expect(addAudience([], { name: "  ", type: "broad", description: "" }, "x")).toEqual({ ok: false, error: "Enter an audience name." });
  });

  it("refuses a name already saved", () => {
    expect(addAudience([buyers], { name: "hospitality BUYERS", type: "niche", description: "" }, "x")).toEqual({
      ok: false,
      error: "Hospitality buyers is already saved to your profile.",
    });
  });

  it("limits the name, description, and number of audiences", () => {
    expect(addAudience([], { name: "x".repeat(81), type: "niche", description: "" }, "x").ok).toBe(false);
    expect(addAudience([], { name: "Ok", type: "niche", description: "x".repeat(241) }, "x").ok).toBe(false);
    const full = Array.from({ length: MAX_SAVED_AUDIENCES }, (_, i) => ({ ...custom, id: `c${i}`, name: `Audience ${i}` }));
    expect(addAudience(full, { name: "One more", type: "niche", description: "" }, "x")).toEqual({
      ok: false,
      error: `You can save up to ${MAX_SAVED_AUDIENCES} audiences. Remove one first.`,
    });
  });
});

describe("adviceSlug", () => {
  it("turns advice into a class-friendly key", () => {
    expect(adviceSlug("Use with care")).toBe("use-with-care");
    expect(adviceSlug("Act now")).toBe("act-now");
  });
});

describe("tracker storage", () => {
  const state: TrackerState = { audiences: [buyers, custom], selected: ["a3"], watchlist: ["Proof over promises"] };

  it("starts from the Make's sample audiences and watchlist", () => {
    expect(names(STARTER_STATE.audiences)).toEqual(["Hospitality buyers", "Conscious travellers"]);
    expect(STARTER_STATE.selected).toEqual(STARTER_STATE.audiences.map((audience) => audience.id));
    expect(STARTER_STATE.watchlist).toEqual(["Direct booking value"]);
  });

  it("saves and loads the state", () => {
    const storage = memoryStorage();
    expect(saveTrackerState(storage, state)).toBe(true);
    expect(loadTrackerState(storage)).toEqual(state);
  });

  it("uses the starter state when nothing is saved, storage is missing, or the value is broken", () => {
    expect(loadTrackerState(undefined)).toEqual(STARTER_STATE);
    expect(loadTrackerState(memoryStorage())).toEqual(STARTER_STATE);
    expect(loadTrackerState(memoryStorage({ [AUDIENCE_TRENDS_KEY]: "{not json" }))).toEqual(STARTER_STATE);
    expect(loadTrackerState(memoryStorage({ [AUDIENCE_TRENDS_KEY]: JSON.stringify({ version: 99, ...state }) }))).toEqual(STARTER_STATE);
  });

  it("drops broken audiences, selections of missing audiences, and unknown trends", () => {
    const raw = {
      version: 1,
      audiences: [buyers, { id: 5, name: "Bad" }, { ...custom, type: "huge" }],
      selected: ["a1", "gone"],
      watchlist: ["Proof over promises", "Not a trend"],
    };
    expect(loadTrackerState(memoryStorage({ [AUDIENCE_TRENDS_KEY]: JSON.stringify(raw) }))).toEqual({
      audiences: [buyers],
      selected: ["a1"],
      watchlist: ["Proof over promises"],
    });
  });

  it("reports a failed save when storage is missing or blocked", () => {
    expect(saveTrackerState(undefined, state)).toBe(false);
    const blocked = memoryStorage();
    blocked.setItem = () => {
      throw new Error("quota");
    };
    expect(saveTrackerState(blocked, state)).toBe(false);
  });
});
