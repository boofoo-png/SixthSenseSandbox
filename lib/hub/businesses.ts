// The businesses a workspace manages (functionality list, 2026-11-05: separate schedules for Hotel
// Depot and Hospitality Emporium). Since 2026-11-06 the demo account manages only Sixth Sense, the
// team's own business, for testing; the clients' businesses are kept here so they can come back by
// adding them to the demo list in workspace.ts. An account made in this browser manages its own company. The chosen one is kept in a cookie so every page,
// including server-rendered ones, shows the same business.

export const BUSINESS_COOKIE = "ss_business";

export type WorkspaceBusiness = { id: string; name: string };

export const HOTEL_DEPOT = { id: "hotel-depot", name: "Hotel Depot" } as const;
export const HOSPITALITY_EMPORIUM = { id: "hospitality-emporium", name: "Hospitality Emporium" } as const;
/** The team's own business (2026-11-06), for testing live Instagram (@sixthsenseapp) without using a client's slot. */
export const SIXTH_SENSE = { id: "sixth-sense", name: "Sixth Sense" } as const;

/** The id used for the one company of an account made in this browser. */
export const OWN_BUSINESS_ID = "own";

/** The chosen business, or the first one when the choice is missing or not in the list. */
export function pickBusiness<T extends WorkspaceBusiness>(businesses: readonly T[], chosen: string | undefined): T {
  return businesses.find((business) => business.id === chosen) ?? businesses[0];
}
