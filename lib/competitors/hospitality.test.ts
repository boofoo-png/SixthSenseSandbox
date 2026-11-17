import { describe, expect, it } from "vitest";
import { SAMPLE_SUPPLIERS } from "./hospitality";

describe("sample hospitality suppliers", () => {
  it("are five fictional suppliers with URL-safe, unique slugs", () => {
    expect(SAMPLE_SUPPLIERS).toHaveLength(5);
    const slugs = SAMPLE_SUPPLIERS.map((supplier) => supplier.slug);
    expect(new Set(slugs).size).toBe(5);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });
});
