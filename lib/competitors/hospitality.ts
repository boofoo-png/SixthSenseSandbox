// Fictional hospitality suppliers (not real companies), named on the Overview's Competitor
// Activities and, as the Competitors page's campaign brands, in lib/hub/competitor-performance.ts.
// The generated posts, ads, and tracking that used to live here went with the old Competitors page
// (2026-11-16, docs/DECISIONS.md).

export type SampleSupplier = { slug: string; name: string; handle: string };

export const SAMPLE_SUPPLIERS: readonly SampleSupplier[] = [
  { slug: "coastline-linen-co", name: "Coastline Linen Co.", handle: "@coastlinelinen" },
  { slug: "northbay-hospitality-supply", name: "Northbay Hospitality Supply", handle: "@northbaysupply" },
  { slug: "evergreen-amenities", name: "Evergreen Amenities", handle: "@evergreenamenities" },
  { slug: "granite-facility-goods", name: "Granite Facility Goods", handle: "@granitefacility" },
  { slug: "harbour-and-home-textiles", name: "Harbour & Home Textiles", handle: "@harbourhome" },
];
