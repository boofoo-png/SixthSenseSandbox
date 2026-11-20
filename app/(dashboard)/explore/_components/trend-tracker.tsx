"use client";

import Link from "next/link";
import { useId, useState, type SubmitEvent } from "react";
import { LineIcon } from "@/components/line-icons";
import {
  MAX_DESCRIPTION,
  MAX_NAME,
  PLATFORM_FILTERS,
  TRENDS,
  addAudience,
  adviceSlug,
  matchingSuggestions,
  visibleTrends,
  type AudienceDepth,
  type PlatformFilter,
  type Trend,
  type TrendAdvice,
  type TrendAudience,
} from "@/lib/hub/audience-trends";
import { eyebrowClass, panelClass } from "../../_components/make-ui";
import { useTrackerState } from "./use-tracker-state";

// The Make's "Live audience trend tracker" (AudiencePage in SixthSenseApp.tsx). Sample trends;
// saved audiences and the watchlist stay in this browser.

const titleClass = "text-[16px] font-semibold tracking-[-0.025em] text-brand-navy";
const hintClass = "text-[11px] text-[#6f7377]";
const smallCapsClass = "text-[10px] font-bold tracking-[0.06em] text-[#7d8384] uppercase";
const softButtonClass =
  "inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-brand-teal/15 bg-[#fafaf9] px-3 text-[12px] font-medium text-[#4f5357] hover:border-brand-teal hover:text-brand-teal";
const inputClass =
  "h-9 w-full rounded-[7px] border border-brand-teal/15 bg-brand-cream px-2.5 text-[12px] text-brand-navy outline-none focus:border-brand-lime focus:shadow-[0_0_0_3px_rgba(116,195,101,0.15)]";

const ADVICE_CLASS: Record<string, string> = {
  "act-now": "bg-brand-teal text-brand-cream",
  "use-with-care": "bg-[#f2cf72] text-brand-navy",
  watch: "bg-[#7c8384] text-brand-cream",
  skip: "bg-[#e5e7e4] text-[#777d7e]",
};

function AdviceTag({ advice }: { advice: TrendAdvice }) {
  return (
    <em className={`w-max rounded-[3px] px-1.5 py-1 text-[10px] font-bold uppercase not-italic ${ADVICE_CLASS[adviceSlug(advice)]}`}>{advice}</em>
  );
}

function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex max-w-full overflow-x-auto rounded-lg border border-brand-teal/15 bg-brand-cream p-[3px]">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`shrink-0 rounded-[5px] px-[11px] py-1.5 text-[11px] ${value === option ? "bg-[#eeece8] font-semibold text-brand-navy" : "text-[#6f7377] hover:text-brand-navy"}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function TrendTracker() {
  const { state, update } = useTrackerState();
  const ids = useId();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<{ name: string; type: AudienceDepth; description: string }>({ name: "", type: "niche", description: "" });
  const [message, setMessage] = useState("");
  const [platform, setPlatform] = useState<PlatformFilter>("All platforms");
  // A trend picked from the watchlist stays chosen even when the filters hide it, as in the Make;
  // otherwise the first matching trend takes over when the filters leave the chosen one out.
  const [chosen, setChosen] = useState<{ name: string; pinned: boolean }>({ name: TRENDS[0].name, pinned: false });

  const selected = state.audiences.filter((audience) => state.selected.includes(audience.id));
  const visible = visibleTrends(selected, platform);
  const activeName = chosen.pinned || visible.some((trend) => trend.name === chosen.name) ? chosen.name : (visible[0]?.name ?? chosen.name);
  const active = TRENDS.find((trend) => trend.name === activeName) ?? TRENDS[0];
  const suggestions = matchingSuggestions(search, state.audiences);

  const unpin = () => setChosen({ name: activeName, pinned: false });
  const choose = (trend: Trend | string, pinned = false) => setChosen({ name: typeof trend === "string" ? trend : trend.name, pinned });

  function save(input: Omit<TrendAudience, "id">): boolean {
    const result = addAudience(state.audiences, input, newId());
    if (!result.ok) {
      setMessage(result.error);
      return false;
    }
    setMessage("");
    unpin();
    update((current) => ({ ...current, audiences: [...current.audiences, result.audience], selected: [...current.selected, result.audience.id] }));
    setSearch("");
    return true;
  }

  function submitCustom(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (save(draft)) {
      setDraft({ name: "", type: "niche", description: "" });
      setShowForm(false);
    }
  }

  function toggleAudience(id: string) {
    unpin();
    update((current) => ({
      ...current,
      selected: current.selected.includes(id) ? current.selected.filter((item) => item !== id) : [...current.selected, id],
    }));
  }

  function removeAudience(id: string) {
    unpin();
    setMessage("");
    update((current) => ({
      ...current,
      audiences: current.audiences.filter((audience) => audience.id !== id),
      selected: current.selected.filter((item) => item !== id),
    }));
  }

  function toggleWatch(name: string) {
    update((current) => ({
      ...current,
      watchlist: current.watchlist.includes(name) ? current.watchlist.filter((item) => item !== name) : [...current.watchlist, name],
    }));
  }

  const rankedTitle = `Ranked signals for ${selected.length ? selected.map((audience) => audience.name).join(", ") : "all audiences"}`;
  const directionTitle = `${active.name} × ${active.audience}`;

  return (
    <>
      <div className="mb-3 flex min-h-[58px] flex-wrap items-start gap-[11px] rounded-[10px] border border-[rgba(116,195,101,0.62)] bg-[#edf4f3] px-3.5 py-[11px] min-[621px]:flex-nowrap min-[621px]:items-center">
        <span aria-hidden="true" className="mt-1 size-[7px] shrink-0 rounded-full border-2 border-[#d2e7df] bg-brand-teal shadow-[0_0_0_3px_rgba(0,128,76,0.11)] min-[621px]:mt-0" />
        <p className="grid min-w-0 flex-1 gap-[3px]">
          <strong className="text-[12px] text-brand-navy">Live audience trend tracker</strong>
          <span className="text-[11px] text-[#697779]">Sense AI is continuously scanning search, social, competitor, and industry activity.</span>
        </p>
        <span className="ml-[18px] inline-flex items-center gap-[5px] rounded-[20px] bg-[#ecffb6] px-[7px] py-1 text-[10px] font-bold text-[#00804c] before:size-[5px] before:rounded-full before:bg-brand-coral before:content-[''] min-[621px]:ml-0">
          Live &middot; updated just now
        </span>
      </div>

      <section aria-labelledby={`${ids}-filters`} className={`${panelClass} mb-3`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={eyebrowClass}>Choose an audience</p>
            <h2 id={`${ids}-filters`} className={titleClass}>
              Whose interests do you want to explore?
            </h2>
          </div>
          <span className={hintClass}>Filters update the radar and trend list</span>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2 min-[621px]:flex-nowrap">
          <label className="flex h-[38px] w-full items-center gap-2 rounded-lg border border-brand-teal/15 bg-brand-cream px-3 text-[#96989c] focus-within:border-brand-teal min-[621px]:w-[min(420px,100%)] min-[621px]:flex-1">
            <LineIcon name="search" size={16} />
            <input
              type="search"
              aria-label="Search audiences"
              value={search}
              maxLength={MAX_NAME}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search or add an audience"
              className="h-9 w-full bg-transparent text-[12px] text-brand-navy outline-none placeholder:text-[#a2a4a8]"
            />
          </label>
          <button
            type="button"
            aria-expanded={showForm}
            onClick={() => {
              setDraft((current) => ({ ...current, name: search.trim() || current.name }));
              setShowForm(!showForm);
              setMessage("");
            }}
            className={`${softButtonClass} min-h-[38px]`}
          >
            <span aria-hidden="true" className="text-[15px] leading-none">
              +
            </span>
            Add custom audience
          </button>
        </div>

        {search.trim() && (
          <div className="mt-2 grid gap-1.5 rounded-[9px] border border-brand-teal/12 bg-[#fafaf8] p-[9px]">
            <span className={smallCapsClass} id={`${ids}-suggested`}>
              Suggested audiences
            </span>
            {suggestions.length > 0 ? (
              <ul aria-labelledby={`${ids}-suggested`} className="grid gap-1.5">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.name}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[9px] rounded-[7px] bg-brand-cream p-2 min-[621px]:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
                  >
                    <span className="grid size-[29px] place-items-center rounded-[7px] bg-[#dbe8e8] text-brand-teal">
                      <LineIcon name="audience" size={15} />
                    </span>
                    <p className="grid gap-[3px]">
                      <strong className="text-[12px] text-brand-navy">{suggestion.name}</strong>
                      <small className="text-[10px] text-[#828789]">{suggestion.description}</small>
                    </p>
                    <em className="rounded-[20px] bg-[#e5eeee] px-1.5 py-[3px] text-[10px] font-bold text-brand-teal uppercase not-italic">{suggestion.type}</em>
                    <button
                      type="button"
                      aria-label={`Add ${suggestion.name} to profile`}
                      onClick={() => save(suggestion)}
                      className={`${softButtonClass} col-span-full min-h-[30px] text-[11px] min-[621px]:col-span-1`}
                    >
                      Add to profile
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-1 text-[11px] text-[#7c8384]">No suggested audiences match. Add it as a custom audience instead.</p>
            )}
          </div>
        )}

        {showForm && (
          <form
            aria-label="Add custom audience"
            onSubmit={submitCustom}
            className="mt-2.5 grid gap-[9px] rounded-[9px] border border-[rgba(116,195,101,0.5)] bg-[rgba(236,255,182,0.2)] p-3"
          >
            <div className="flex flex-col gap-2 min-[621px]:flex-row">
              <label className="grid min-w-0 flex-1 gap-[5px]">
                <span className="text-[10px] font-bold text-[#6f7778]">Audience name</span>
                <input
                  maxLength={MAX_NAME}
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="e.g. Eco-conscious restaurant owners"
                  className={inputClass}
                />
              </label>
              <label className="grid min-w-0 flex-1 gap-[5px]">
                <span className="text-[10px] font-bold text-[#6f7778]">Audience type</span>
                <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as AudienceDepth })} className={inputClass}>
                  <option value="broad">Broad audience</option>
                  <option value="niche">Niche audience</option>
                </select>
              </label>
            </div>
            <label className="grid min-w-0 gap-[5px]">
              <span className="text-[10px] font-bold text-[#6f7778]">What defines this audience?</span>
              <input
                maxLength={MAX_DESCRIPTION}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                placeholder="Add interests, roles, behaviours, or needs"
                className={inputClass}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex h-10 items-center gap-2 rounded-lg bg-brand-teal px-[15px] text-[12px] font-semibold text-brand-cream shadow-[0_5px_12px_rgba(0,84,95,0.14)] hover:bg-[#00545f]"
              >
                Save to profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setMessage("");
                }}
                className={softButtonClass}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-3.5 flex flex-wrap items-baseline gap-2">
          <span className={smallCapsClass} id={`${ids}-saved`}>
            Saved to your profile
          </span>
          <small className="text-[10px] text-[#989b9d]">Select one or more audiences to compare their trends.</small>
        </div>
        <div role="group" aria-labelledby={`${ids}-saved`} className="mt-2 flex flex-wrap gap-[7px]">
          {state.audiences.map((audience) => {
            const isSelected = state.selected.includes(audience.id);
            return (
              <div
                key={audience.id}
                className={`flex overflow-hidden rounded-lg border ${isSelected ? "border-brand-teal bg-[#edf4f3]" : "border-brand-teal/15 bg-[#fafaf8]"}`}
              >
                <label className="flex min-h-[42px] cursor-pointer items-center gap-2 px-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-teal">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => toggleAudience(audience.id)}
                    aria-label={`${audience.name} (${audience.type})`}
                  />
                  <span
                    aria-hidden="true"
                    className={`grid size-[15px] place-items-center rounded-[4px] border text-brand-cream ${isSelected ? "border-brand-teal bg-brand-teal" : "border-[#bac1c0] bg-brand-cream"}`}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m2.5 6.2 2.3 2.3 4.7-5" />
                      </svg>
                    )}
                  </span>
                  <span className="grid gap-0.5 text-left">
                    <strong className="text-[11px] text-brand-navy">{audience.name}</strong>
                    <small className="text-[9px] text-[#888d8f] uppercase">{audience.type}</small>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => removeAudience(audience.id)}
                  aria-label={`Remove ${audience.name} from profile`}
                  title={`Remove ${audience.name} from profile`}
                  className="min-h-[42px] border-l border-brand-teal/15 px-[9px] text-[#a0a4a5] hover:bg-brand-coral/8 hover:text-brand-coral"
                >
                  <svg aria-hidden="true" viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="m3 3 6 6M9 3 3 9" />
                  </svg>
                </button>
              </div>
            );
          })}
          {state.audiences.length === 0 && (
            <p className="w-full rounded-lg border border-dashed border-[#cdd6d5] p-[11px] text-center text-[11px] leading-normal text-[#7c8384]">
              Search above or add your first custom audience. Until then, the tracker shows all live trends.
            </p>
          )}
        </div>
        {message && (
          <p role="alert" className="mt-2 text-[11px] leading-normal text-[#c94f4f]">
            {message}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-brand-teal/12 pt-3 min-[621px]:flex-nowrap">
          <span className="w-full text-[10px] font-bold text-[#888c8f] uppercase min-[621px]:w-auto">Source</span>
          <Segmented
            label="Source"
            options={PLATFORM_FILTERS}
            value={platform}
            onChange={(value) => {
              unpin();
              setPlatform(value);
            }}
          />
        </div>
      </section>

      <div className="mb-3 grid gap-3 min-[901px]:grid-cols-[minmax(0,1.6fr)_minmax(230px,0.6fr)]">
        <section aria-labelledby={`${ids}-radar`} className={`${panelClass} min-[901px]:min-h-[360px]`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={eyebrowClass}>Trend radar</p>
              <h2 id={`${ids}-radar`} className={titleClass}>
                Momentum versus audience fit
              </h2>
            </div>
            <span className={hintClass}>Select a dot or row to investigate</span>
          </div>
          <div
            role="group"
            aria-label="Trend momentum and audience fit chart"
            className="relative mt-[18px] mb-6 h-[235px] border-b border-l border-[#dfe2df] min-[621px]:h-[275px]"
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] border-t border-brand-navy/14" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 z-[1] border-l border-brand-navy/10" />
            {[
              ["Watch & prepare", "top-2 left-2"],
              ["Act now", "top-2 right-2"],
              ["Skip", "bottom-2 left-2"],
              ["Popular, poor fit", "right-2 bottom-2"],
              ["Audience fit", "-bottom-5 left-0"],
              ["Momentum", "right-0 -bottom-5"],
            ].map(([text, place]) => (
              <span key={text} aria-hidden="true" className={`absolute z-[1] text-[10px] font-semibold tracking-[0.06em] text-[#a3a6a5] uppercase ${place}`}>
                {text}
              </span>
            ))}
            {visible.map((trend) => {
              const isActive = trend.name === active.name;
              return (
                <button
                  key={trend.name}
                  type="button"
                  onClick={() => choose(trend)}
                  aria-label={`${trend.name}: ${trend.momentum} momentum, ${trend.fit} fit`}
                  aria-pressed={isActive}
                  title={`${trend.name}: ${trend.momentum} momentum, ${trend.fit} fit`}
                  style={{ left: `${trend.momentum}%`, bottom: `${trend.fit}%` }}
                  className={`absolute z-[2] translate-x-[-50%] translate-y-1/2 rounded-full border-2 border-brand-cream shadow-[0_1px_5px_rgba(0,31,63,0.17)] ${
                    isActive ? "size-4 bg-brand-coral" : "size-[13px] bg-[#888d8b] hover:bg-brand-teal"
                  }`}
                >
                  {isActive && (
                    <strong className="absolute bottom-[17px] left-1/2 w-max max-w-[150px] -translate-x-1/2 rounded bg-brand-navy px-1.5 py-1 text-[10px] font-semibold text-brand-cream">
                      {trend.name}
                    </strong>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="grid content-start gap-3 min-[621px]:max-[900px]:grid-cols-2">
          <section aria-labelledby={`${ids}-watch`} className={`${panelClass} p-[15px]`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={eyebrowClass}>Watchlist</p>
                <h2 id={`${ids}-watch`} className={titleClass}>
                  Saved signals
                </h2>
              </div>
              <span className="grid size-6 place-items-center rounded-full bg-brand-lime-bright text-[11px] font-bold text-brand-navy">{state.watchlist.length}</span>
            </div>
            {state.watchlist.length ? (
              <div className="mt-3 grid gap-1.5">
                {state.watchlist.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => choose(name, true)}
                    className="flex items-center gap-[7px] rounded-md bg-[#f4f7f4] p-2 text-left text-[11px] text-brand-navy hover:bg-[#e8f0ec]"
                  >
                    <LineIcon name="trend" size={14} />
                    {name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2.5 text-[11px] leading-[1.55] text-[#737b7c]">Star a trend to keep an eye on it.</p>
            )}
          </section>
          <section aria-label="How to read this" className={`${panelClass} p-[15px]`}>
            <p className={eyebrowClass}>How to read this</p>
            <p className="mt-2.5 text-[11px] leading-[1.55] text-[#737b7c]">
              <strong className="text-brand-navy">Momentum</strong> shows how quickly interest is growing.
            </p>
            <p className="mt-[7px] text-[11px] leading-[1.55] text-[#737b7c]">
              <strong className="text-brand-navy">Fit</strong> shows how naturally the trend belongs to the selected audience and your business.
            </p>
          </section>
        </aside>
      </div>

      <section aria-labelledby={`${ids}-list`} className={`${panelClass} mb-3`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={eyebrowClass}>Live trend list</p>
            <h2 id={`${ids}-list`} className={titleClass}>
              {rankedTitle}
            </h2>
          </div>
          <span className={hintClass}>
            {visible.length} matching trend{visible.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div
              aria-hidden="true"
              className="mt-4 grid grid-cols-[minmax(190px,1.5fr)_minmax(90px,0.8fr)_70px_42px_82px_24px] items-center gap-2.5 px-2.5 pb-[7px] text-[10px] font-bold text-[#9a9d9f] uppercase"
            >
              <span>Trend</span>
              <span>Recent trend</span>
              <span>Momentum</span>
              <span>Fit</span>
              <span>Advice</span>
              <span />
            </div>
            <ul className="border-t border-brand-teal/12">
              {visible.map((trend) => {
                const isActive = trend.name === active.name;
                const watched = state.watchlist.includes(trend.name);
                return (
                  <li
                    key={trend.name}
                    className={`grid grid-cols-[minmax(0,1fr)_24px] items-center gap-2.5 border-b border-brand-teal/12 pr-2.5 ${
                      isActive ? "bg-[rgba(236,255,182,0.35)]" : "hover:bg-[rgba(236,255,182,0.2)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => choose(trend)}
                      aria-label={`Investigate ${trend.name}`}
                      aria-pressed={isActive}
                      className="grid min-h-[58px] grid-cols-[minmax(190px,1.5fr)_minmax(90px,0.8fr)_70px_42px_82px] items-center gap-2.5 py-2 pl-2.5 text-left"
                    >
                      <span className="grid min-w-0 gap-1">
                        <strong className="text-[12px] text-brand-navy">{trend.name}</strong>
                        <small className="text-[10px] text-[#8a8d8f]">
                          {trend.platform} &middot; {trend.format} &middot; {trend.scope}
                        </small>
                      </span>
                      <span aria-hidden="true" className="flex h-[22px] items-end gap-0.5 border-b border-[#d7dbd8]">
                        {[-4, 6, -4, -9, -4].map((angle, index) => (
                          <i key={index} className="block h-px w-[13px] bg-[#89918f]" style={{ transform: `rotate(${angle}deg)` }} />
                        ))}
                        <b className="-mb-[3px] size-[5px] rounded-full bg-brand-coral" />
                      </span>
                      <strong className="text-[12px] text-brand-navy">
                        {trend.momentum}
                        <small className="mt-[3px] block text-[10px] font-normal text-brand-teal">{trend.change}</small>
                      </strong>
                      <strong className="text-[12px] text-brand-navy">{trend.fit}</strong>
                      <AdviceTag advice={trend.advice} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWatch(trend.name)}
                      aria-label={`Watch ${trend.name}`}
                      aria-pressed={watched}
                      title={watched ? "Remove from watchlist" : "Add to watchlist"}
                      className={`grid place-items-center ${watched ? "text-[#e9b622]" : "text-[#c9cdca] hover:text-[#b9a25a]"}`}
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                        <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.8Z" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
            {visible.length === 0 && (
              <div className="mt-3 grid justify-items-center gap-1.5 rounded-[9px] border border-dashed border-[#cdd6d5] px-5 py-10 text-center text-[#85888d]">
                <LineIcon name="search" size={22} />
                <strong className="text-[13px] text-brand-navy">No trends match these filters</strong>
                <p className="text-[11px]">Try another audience or source.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby={`${ids}-direction`} className={`${panelClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-5 min-[621px]:flex-nowrap">
          <div className="flex flex-wrap items-center gap-[7px]">
            <p className={`${eyebrowClass} w-full`}>Turn it into campaign direction</p>
            <AdviceTag advice={active.advice} />
            <h2 id={`${ids}-direction`} className="mt-[3px] w-full text-[20px] font-semibold tracking-[-0.03em] text-brand-navy">
              {directionTitle}
            </h2>
          </div>
          <Link
            href="/campaigns"
            className="flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-teal px-[15px] text-[12px] font-semibold text-brand-cream shadow-[0_5px_12px_rgba(0,84,95,0.14)] hover:bg-[#00545f] min-[621px]:w-auto"
          >
            <LineIcon name="campaign" size={15} /> Use in Campaigns
          </Link>
        </div>
        <div className="mt-[18px] grid gap-5 border-t border-brand-teal/12 pt-[18px] min-[901px]:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
          <div className="flex min-h-[230px] flex-col justify-end rounded-xl bg-[radial-gradient(circle_at_80%_15%,rgba(221,254,86,0.22),transparent_34%),var(--brand-navy)] p-[22px] text-brand-cream">
            <span className="mb-auto flex items-center gap-1.5 text-[10px] font-bold text-brand-lime-bright uppercase">
              <LineIcon name="sparkles" size={16} /> AI content angle
            </span>
            <strong className="text-[19px] leading-[1.3]">{active.hook}</strong>
            <p className="mt-2.5 text-[12px] leading-[1.55] text-[#c6d0d1]">{active.angle}</p>
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#8d9293] uppercase">Recommended approach</span>
            <h3 className="my-2 text-[19px] font-semibold text-brand-navy">{active.hook}</h3>
            <p className="text-[12px] leading-[1.6] text-[#657173]">{active.angle}</p>
            <div className="my-4 grid gap-2 min-[621px]:grid-cols-2">
              <p className="border-l-2 border-brand-lime-bright bg-[#f7f8f4] p-[11px] text-[11px] leading-normal text-[#626d6f]">
                <strong className="mb-[3px] block text-[10px] text-brand-navy uppercase">Do</strong>
                Use a real voice, specific evidence, and the audience&apos;s own language.
              </p>
              <p className="border-l-2 border-brand-coral bg-[#f7f8f4] p-[11px] text-[11px] leading-normal text-[#626d6f]">
                <strong className="mb-[3px] block text-[10px] text-brand-navy uppercase">Avoid</strong>
                Forcing the trend into scripted product placement or copying a format without context.
              </p>
            </div>
            <p className="text-[12px] leading-[1.6] text-[#757e80]">
              <strong className="text-brand-navy">Why this advice:</strong> {active.why}
            </p>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-[#6f7377]">Trends are sample data from the design, not live signals. Saved audiences and the watchlist stay in this browser.</p>
      </section>
    </>
  );
}
