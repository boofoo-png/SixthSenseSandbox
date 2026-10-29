import {
  SAMPLE_SUPPLIERS,
  competitorFromSignUp,
  type Audience,
  type TrackableCompetitor,
} from "@/lib/competitors/hospitality";
import { AUDIENCES, type BusinessProfile } from "./onboarding";

// Which competitors a business can track and tracks (docs/FUNCTIONALITY.md, Competitors:
// audience-based selection, starting with the competitors added during sign-up).

/** Competitors added at sign-up first, then the fictional sample suppliers. */
export function availableCompetitors(profile: BusinessProfile | null): TrackableCompetitor[] {
  const taken = new Set(SAMPLE_SUPPLIERS.map((supplier) => supplier.slug));
  const fromSignUp = (profile?.competitors ?? []).map((entry) => {
    const competitor = competitorFromSignUp(entry);
    let slug = competitor.slug;
    for (let n = 2; taken.has(slug); n += 1) slug = `${competitor.slug}-${n}`;
    taken.add(slug);
    return { ...competitor, slug };
  });
  return [...fromSignUp, ...SAMPLE_SUPPLIERS];
}

/** Sign-up competitors, plus sample suppliers selling to `audience` (everyone when it is null). */
export function competitorsForAudience(list: readonly TrackableCompetitor[], audience: Audience | null): TrackableCompetitor[] {
  return list.filter((competitor) => !audience || competitor.source === "sign-up" || competitor.audiences.includes(audience));
}

/**
 * The competitors being tracked: the saved choice when there is one; otherwise the sign-up
 * competitors, or, without any, the sample suppliers that sell to the business's audiences.
 */
export function trackedCompetitors(profile: BusinessProfile | null, available: readonly TrackableCompetitor[]): TrackableCompetitor[] {
  if (profile?.trackedCompetitors) {
    const chosen = new Set(profile.trackedCompetitors);
    return available.filter((competitor) => chosen.has(competitor.slug));
  }
  const fromSignUp = available.filter((competitor) => competitor.source === "sign-up");
  if (fromSignUp.length > 0) return fromSignUp;
  const audiences = profile?.audiences ?? [];
  return available.filter((competitor) => competitor.audiences.some((audience) => audiences.includes(audience)));
}

/** The audience chosen on the page, if it is one of the business's audiences. */
export function selectedAudience(value: string | undefined, profile: BusinessProfile | null): Audience | null {
  const audiences = profile?.audiences ?? [];
  return value && audiences.includes(value) && (AUDIENCES as readonly string[]).includes(value) ? (value as Audience) : null;
}
