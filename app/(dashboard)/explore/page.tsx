import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { LineIcon } from "@/components/line-icons";
import {
  FILTERS,
  FILTER_KEYS,
  audienceStats,
  defaultAudienceSlug,
  filterSegments,
  findAudience,
  formatPeople,
  isFiltered,
  parseAudienceFilters,
  parseView,
  suggestedAudiences,
  type AudienceSegment,
} from "@/lib/hub/audience";
import { SESSION_COOKIE } from "@/lib/hub/constants";
import { profileForSession } from "@/lib/hub/demo-profile";
import { availableCompetitors, trackedCompetitors } from "@/lib/hub/tracking";
import { workspaceFor } from "@/lib/hub/workspace";
import { MakePageHeader, StatCard, chipClass, eyebrowClass, makePageClass, panelClass, panelTitleClass } from "../_components/make-ui";
import { AudienceSearch } from "./_components/audience-search";
import { saveDefaultAudience } from "./actions";

export const metadata: Metadata = {
  title: "Audience",
  description: "Find the people most likely to care: search audiences by category and filter by industry, age, region, and interest.",
};

// The Audience page from the team's Figma Make "Marketing Intelligence Hub" (docs/FUNCTIONALITY.md,
// Target Audience). Search, filters, view, and the chosen audience live in the address; the default
// audience is saved in the business profile. Audiences and figures are sample data.

type Params = Record<string, string | string[] | undefined>;

/** This page's address with some parameters changed (null removes one); `saved` never carries over. */
function hrefWith(params: Params, changes: Record<string, string | null>): string {
  const next = new URLSearchParams();
  for (const key of ["q", ...FILTER_KEYS, "view", "audience"]) {
    const value = params[key];
    if (typeof value === "string" && value) next.set(key, value);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  return query ? `/explore?${query}` : "/explore";
}

export default async function AudiencePage({ searchParams }: PageProps<"/explore">) {
  const params = (await searchParams) as Params;
  const filters = parseAudienceFilters(params);
  const view = parseView(params.view);
  const jar = await cookies();
  const email = jar.get(SESSION_COOKIE)?.value ?? "";
  const profile = email ? profileForSession(jar, email) : null;
  const workspace = workspaceFor(jar);

  const defaultSlug = defaultAudienceSlug(profile);
  const usingSignUpDefault = !profile?.defaultAudience || !findAudience(profile.defaultAudience);
  const defaultAudience = findAudience(defaultSlug) as AudienceSegment;
  const active = findAudience(typeof params.audience === "string" ? params.audience : undefined) ?? defaultAudience;
  const isDefault = active.slug === defaultSlug;
  const justSaved = params.saved === "1" && isDefault;

  const visible = filterSegments(filters);
  const stats = audienceStats(visible);
  const competitors = trackedCompetitors(profile, availableCompetitors(profile)).map((competitor) => competitor.name);
  const suggestions = suggestedAudiences(competitors);
  const signals = [
    [active.interest, Math.min(99, active.match + 6)],
    [active.industry, active.match - 8],
    [active.region, active.match - 22],
  ] as const;

  const selectHref = (slug: string) => hrefWith(params, { audience: slug });
  const filterQuery = new URLSearchParams(hrefWith(params, { q: null, audience: null }).split("?")[1] ?? "").toString();

  return (
    <main className={makePageClass}>
      <MakePageHeader
        eyebrow="Target audience"
        title="Find the people most likely to care"
        description="Explore audience signals by demographic, age, region, and interest, then save an audience as your workspace default."
        question="Which audience should we focus on?"
      />

      <form
        action="/explore"
        method="get"
        role="search"
        aria-label="Audiences"
        className="relative mb-3 flex flex-wrap items-center gap-2 rounded-[11px] border border-brand-teal/12 bg-brand-cream p-2.5 min-[1101px]:flex-nowrap"
      >
        <AudienceSearch initial={filters.q} baseQuery={filterQuery} />
        {FILTER_KEYS.map((key) => (
          <select
            key={key}
            name={key}
            defaultValue={filters[key]}
            aria-label={FILTERS[key].label}
            className="min-h-[38px] flex-[1_1_calc(50%-8px)] cursor-pointer rounded-lg border border-brand-teal/20 bg-white/60 px-2.5 text-[12px] text-[#4f5357] min-[621px]:flex-none"
          >
            <option value="">{FILTERS[key].all}</option>
            {FILTERS[key].options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ))}
        {view === "chart" && <input type="hidden" name="view" value="chart" />}
        <button
          type="submit"
          className="flex h-10 items-center gap-2 rounded-lg bg-brand-teal px-[15px] text-[12px] font-semibold text-brand-cream shadow-[0_5px_12px_rgba(0,84,95,0.14)] hover:bg-[#00545f] min-[1101px]:ml-auto"
        >
          <LineIcon name="search" size={16} /> Apply filters
        </button>
        {isFiltered(filters) && (
          <Link href={hrefWith(params, { q: null, industry: null, age: null, region: null, interest: null })} className="px-1 text-[12px] font-semibold text-brand-teal underline-offset-2 hover:underline">
            Clear filters
          </Link>
        )}
      </form>

      <div className="mb-3 flex flex-wrap items-center gap-[11px] rounded-[10px] border border-[rgba(116,195,101,0.52)] bg-brand-cream/90 px-3.5 py-3 min-[621px]:flex-nowrap">
        <span className="grid size-[27px] place-items-center rounded-[7px] bg-[#ecffb6] text-[#00804c]">
          <LineIcon name="sparkles" size={16} />
        </span>
        <p className="grid flex-1 gap-[3px] text-[12px] leading-[1.45] text-[#4f5d5f]">
          <strong className="text-[13px] text-brand-navy">
            {usingSignUpDefault ? "Starting from your onboarding audience" : "Your default audience"}
          </strong>
          Searches and reports currently use {defaultAudience.name} as the default audience for {workspace.company.replace(/\.$/, "")}.
        </p>
        <span className="rounded-[20px] bg-brand-teal px-2 py-1 text-[10px] font-bold text-brand-cream">Default</span>
      </div>

      <div className="mb-3 grid gap-3 min-[621px]:grid-cols-2 min-[901px]:grid-cols-3">
        <StatCard icon="audience" label="Reachable audience" value={formatPeople(stats.reachable)} detail="Across matching audiences" />
        <StatCard
          icon="activity"
          label="Fastest-growing interest"
          value={stats.fastest ? `+${stats.fastest.growth}%` : "—"}
          detail={stats.fastest ? stats.fastest.interest : "No matching audiences"}
          warm
        />
        <StatCard icon="target" label="Audience fit" value={`${active.match}%`} detail={`${active.name}, from competitor analytics`} warm />
      </div>

      <div className="grid gap-3 min-[901px]:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <section aria-labelledby="results-title" className={`${panelClass} min-[901px]:min-h-[410px]`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={eyebrowClass}>Trend search by category</p>
              <h2 id="results-title" className={panelTitleClass}>
                Audience and interest results
              </h2>
            </div>
            <nav aria-label="Show results as" className="flex shrink-0 rounded-lg border border-brand-teal/15 bg-white/50 p-[3px]">
              {(["list", "chart"] as const).map((mode) => (
                <Link
                  key={mode}
                  href={hrefWith(params, { view: mode === "list" ? null : "chart" })}
                  scroll={false}
                  aria-current={view === mode ? "page" : undefined}
                  className={`rounded-[5px] px-[11px] py-1.5 text-[11px] ${view === mode ? "bg-[#eeece8] font-semibold text-brand-navy" : "text-[#6f7377] hover:text-brand-navy"}`}
                >
                  {mode === "list" ? "List" : "Chart"}
                </Link>
              ))}
            </nav>
          </div>

          {visible.length === 0 ? (
            <div className="mt-[18px] grid justify-items-center gap-1.5 rounded-[9px] border border-dashed border-[#cdd6d5] px-5 py-10 text-center text-[#6f7377]">
              <LineIcon name="search" size={22} />
              <strong className="text-[13px] text-brand-navy">No audiences match these filters</strong>
              <p className="text-[12px]">Try another keyword or change one of the filters.</p>
              <Link
                href={hrefWith(params, { q: null, industry: null, age: null, region: null, interest: null })}
                className="mt-1 text-[12px] font-semibold text-brand-teal underline-offset-2 hover:underline"
              >
                Clear filters
              </Link>
            </div>
          ) : view === "list" ? (
            <ul className="mt-[18px] grid gap-2">
              {visible.map((segment) => {
                const selected = segment.slug === active.slug;
                return (
                  <li key={segment.slug}>
                    <Link
                      href={selectHref(segment.slug)}
                      scroll={false}
                      aria-current={selected ? "true" : undefined}
                      className={`grid min-h-[78px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[13px] rounded-[9px] border p-3 text-left transition-colors min-[621px]:grid-cols-[auto_minmax(0,1fr)_auto_48px] ${
                        selected ? "border-brand-lime bg-[#f2f7f6]" : "border-brand-teal/12 bg-[#fafaf8] hover:border-brand-lime hover:bg-[#f2f7f6]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`size-4 rounded-full bg-brand-cream ${selected ? "border-4 border-brand-teal" : "border border-[#c6c8c9]"}`}
                      />
                      <span className="grid min-w-0 gap-[3px]">
                        <strong className="text-[13px] text-brand-navy">{segment.name}</strong>
                        <small className="text-[11px] text-[#6f7377]">{segment.detail}</small>
                        <em className={`${chipClass} mt-0.5`}>{segment.category}</em>
                      </span>
                      <span className="grid gap-[3px] text-right">
                        <strong className="text-[13px] text-brand-navy">{formatPeople(segment.size)}</strong>
                        <small className="text-[11px] text-[#6f7377]">people</small>
                      </span>
                      <span className="hidden text-[12px] font-bold text-brand-teal min-[621px]:block">+{segment.growth}%</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="mt-5 grid gap-2.5">
              {visible.map((segment) => {
                const selected = segment.slug === active.slug;
                return (
                  <li key={segment.slug}>
                    <Link
                      href={selectHref(segment.slug)}
                      scroll={false}
                      aria-current={selected ? "true" : undefined}
                      className={`grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border p-2.5 text-left min-[621px]:grid-cols-[minmax(145px,0.8fr)_minmax(140px,1.4fr)_44px] ${
                        selected ? "border-brand-lime bg-brand-lime/28" : "border-brand-teal/12 bg-[#fafaf8] hover:border-brand-lime"
                      }`}
                    >
                      <span className="grid gap-[3px]">
                        <strong className="text-[12px] text-brand-navy">{segment.name}</strong>
                        <small className="text-[11px] text-[#6f7377]">{formatPeople(segment.size)} people</small>
                      </span>
                      <span aria-hidden="true" className="col-span-full row-start-2 h-[7px] overflow-hidden rounded-md bg-[#e8e6e2] min-[621px]:col-span-1 min-[621px]:row-start-auto">
                        <i className="block h-full rounded-[inherit] bg-linear-to-r from-brand-lime to-brand-teal" style={{ width: `${Math.min(100, segment.growth * 3)}%` }} />
                      </span>
                      <em className="text-right text-[12px] font-bold text-brand-teal not-italic">
                        +{segment.growth}%<span className="sr-only"> growth in interest</span>
                      </em>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="active-title" className={`${panelClass} min-[901px]:min-h-[410px]`}>
          <p className={eyebrowClass}>Active audience</p>
          <h2 id="active-title" className={panelTitleClass}>
            {active.name}
          </h2>
          <span className="mt-1.5 inline-flex rounded-[20px] bg-brand-lime px-[7px] py-1 text-[10px] font-semibold text-brand-teal">
            {active.category} · {active.industry}
          </span>
          <div
            role="img"
            aria-label={`Match score ${active.match} percent`}
            className="relative mx-auto my-[18px] flex size-[190px] flex-col items-center justify-center rounded-full bg-[radial-gradient(circle,#f8fbfa_0_38%,#e9f2f1_39%_40%,transparent_41%)]"
          >
            <span aria-hidden="true" className="absolute inset-4 rounded-full border border-[#dbe8e7]" />
            <span aria-hidden="true" className="absolute inset-[38px] rounded-full border border-[#dbe8e7]" />
            <span aria-hidden="true" className="absolute top-[30px] left-[52px] size-[9px] rounded-full border-2 border-brand-cream bg-brand-coral shadow-[0_2px_5px_rgba(0,31,63,0.16)]" />
            <span aria-hidden="true" className="absolute top-[62px] right-[22px] size-[9px] rounded-full border-2 border-brand-cream bg-brand-coral shadow-[0_2px_5px_rgba(0,31,63,0.16)]" />
            <span aria-hidden="true" className="absolute bottom-[34px] left-[40px] size-[9px] rounded-full border-2 border-brand-cream bg-brand-coral shadow-[0_2px_5px_rgba(0,31,63,0.16)]" />
            <strong className="relative z-[2] text-[26px] tracking-[-0.05em] text-brand-navy">{active.match}%</strong>
            <small className="relative z-[2] text-[11px] text-[#6f7377]">match score</small>
          </div>
          <dl className="border-t border-brand-teal/12">
            {signals.map(([name, score]) => (
              <div key={name} className="flex items-center justify-between gap-4 border-b border-brand-teal/12 px-0.5 py-2.5 text-[12px] text-[#5f6366]">
                <dt>{name}</dt>
                <dd className="font-semibold text-brand-teal">{score}%</dd>
              </div>
            ))}
          </dl>
          {isDefault ? (
            <p
              role="status"
              className="mt-3 flex min-h-[34px] items-center justify-center gap-[7px] rounded-[7px] border border-[#c8e2d8] bg-[#edf7f2] text-[12px] font-semibold text-brand-teal"
            >
              <LineIcon name="sparkles" size={16} /> {justSaved ? "Saved as default audience" : "Your default audience"}
            </p>
          ) : (
            <form action={saveDefaultAudience}>
              <input type="hidden" name="audience" value={active.slug} />
              <input type="hidden" name="query" value={hrefWith(params, {}).split("?")[1] ?? ""} />
              <button
                type="submit"
                className="mt-3 flex min-h-[34px] w-full items-center justify-center gap-[7px] rounded-[7px] border border-[#cbdada] bg-[#f0f6f5] text-[12px] font-semibold text-brand-teal hover:bg-[#e3efed]"
              >
                <LineIcon name="target" size={16} /> Set as default audience
              </button>
            </form>
          )}
        </section>
      </div>

      <section aria-labelledby="suggest-title" className={`${panelClass} mt-3`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={eyebrowClass}>Suggest a target audience</p>
            <h2 id="suggest-title" className={panelTitleClass}>
              Suggestions from direct competitor analytics
            </h2>
          </div>
          <span className="text-[11px] text-[#6f7377]">
            {competitors.length > 0
              ? `Updated from ${competitors.length} competitor${competitors.length === 1 ? "" : "s"}`
              : "Add competitors on Research Competitors for sharper suggestions"}
          </span>
        </div>
        <ul className="mt-3.5 grid gap-2 min-[621px]:grid-cols-2 min-[901px]:grid-cols-3">
          {suggestions.map((suggestion) => (
            <li key={suggestion.slug} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 rounded-[9px] border border-brand-teal/12 bg-[#fafaf8] p-3">
              <span className="grid size-[34px] place-items-center rounded-[9px] bg-brand-lime-bright text-brand-navy">
                <LineIcon name="sparkles" size={16} />
              </span>
              <div className="grid content-center gap-1">
                <strong className="text-[12px] text-brand-navy">{suggestion.name}</strong>
                <p className="text-[11px] leading-[1.45] text-[#5f6366]">{suggestion.reason}</p>
                <small className="text-[10px] font-bold text-brand-teal">{suggestion.fit}% fit</small>
              </div>
              <Link
                href={selectHref(suggestion.slug)}
                scroll={false}
                aria-label={`Use audience: ${suggestion.name}`}
                aria-current={suggestion.slug === active.slug ? "true" : undefined}
                className="col-span-full inline-flex min-h-[29px] w-full items-center justify-center rounded-md border border-brand-teal/15 bg-[#fafaf9] text-[11px] font-medium text-[#4f5357] hover:border-brand-teal hover:text-brand-teal"
              >
                {suggestion.slug === active.slug ? "In use" : "Use audience"}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-[#6f7377]">
          Suggestions are templates built from sample competitor data, not live AI. All audience figures are samples.
        </p>
      </section>
    </main>
  );
}
