"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { LineIcon } from "@/components/line-icons";
import {
  COMPARISON_PERIOD,
  COMPETITOR_CAMPAIGNS,
  FINDINGS,
  engagementGap,
  matchesFinding,
  nextMoves,
  type Finding,
} from "@/lib/hub/competitor-performance";

// The Make's Competitor performance: choose a finding, select a campaign card, and the
// comparison and Your next move follow the selected campaign. Sample figures.

const glassCardClass =
  "rounded-[21px] border border-brand-cream/76 bg-brand-cream/96 text-brand-navy shadow-[0_6px_0_rgba(0,31,62,0.17),0_18px_30px_rgba(0,31,62,0.11)]";
const limeChipClass = "rounded-[14px] bg-brand-lime-bright px-2 py-[5px] text-[10px] font-bold text-brand-navy";

export function CompetitorPerformance() {
  const ids = useId();
  const [finding, setFinding] = useState<Finding>("All findings");
  const [activeId, setActiveId] = useState(COMPETITOR_CAMPAIGNS[0].id);
  const active = COMPETITOR_CAMPAIGNS.find((campaign) => campaign.id === activeId) ?? COMPETITOR_CAMPAIGNS[0];
  const gap = engagementGap(active);
  const leads = gap <= 0;

  return (
    <>
      <section aria-labelledby={`${ids}-findings`} className="mb-[18px] flex flex-col items-start gap-[13px] min-[621px]:flex-row min-[621px]:items-center">
        <span id={`${ids}-findings`} className="text-[12px] whitespace-nowrap text-brand-cream/80">
          Filter by findings
        </span>
        <div role="group" aria-labelledby={`${ids}-findings`} className="flex flex-wrap gap-[7px]">
          {FINDINGS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={finding === item}
              onClick={() => setFinding(item)}
              className={`min-h-[30px] rounded-2xl border px-[13px] text-[11px] font-bold text-brand-navy transition hover:-translate-y-px hover:border-brand-lime-bright hover:bg-brand-lime-bright ${
                finding === item ? "-translate-y-px border-brand-lime-bright bg-brand-lime-bright" : "border-brand-cream/40 bg-brand-cream/90"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <div className="mb-5 grid gap-[18px] min-[621px]:grid-cols-2 min-[1021px]:grid-cols-3">
        {COMPETITOR_CAMPAIGNS.map((campaign, index) => {
          const selected = campaign.id === active.id;
          const matches = matchesFinding(campaign, finding);
          return (
            <button
              key={campaign.id}
              type="button"
              aria-pressed={selected}
              aria-label={`Select ${campaign.title} by ${campaign.brand}`}
              onClick={() => setActiveId(campaign.id)}
              className={`group min-w-0 overflow-hidden text-left transition hover:-translate-y-[3px] ${glassCardClass} ${
                selected ? "-translate-y-[3px] outline-2 -outline-offset-2 outline-brand-lime-bright" : ""
              } ${matches ? "" : "opacity-46"} ${index === COMPETITOR_CAMPAIGNS.length - 1 ? "min-[621px]:max-[1020px]:col-span-2" : ""}`}
            >
              <div className="relative h-[118px] overflow-hidden bg-brand-teal after:absolute after:inset-0 after:bg-[linear-gradient(180deg,rgba(0,31,62,0.04),rgba(0,31,62,0.62))] after:content-['']">
                <Image
                  src={campaign.image.src}
                  alt={campaign.image.alt}
                  fill
                  sizes="(min-width: 1021px) 33vw, (min-width: 621px) 50vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.04]"
                />
                <span className="absolute bottom-[13px] left-4 z-[1] text-[12px] font-bold text-brand-cream">{campaign.brand}</span>
                {selected && (
                  <em className="absolute right-3.5 bottom-[13px] z-[1] rounded-[13px] bg-brand-lime-bright px-2 py-1 text-[9px] font-bold text-brand-navy uppercase not-italic">
                    Selected
                  </em>
                )}
              </div>
              <div className="grid gap-[7px] px-[17px] pt-[15px] pb-[17px]">
                <small className="text-[11px] text-[#718083]">{campaign.date}</small>
                <strong className="text-[15px] tracking-[-0.01em] text-brand-teal">{campaign.title}</strong>
                <p className="min-h-9 text-[12px] leading-[1.55] text-[#5d6e71]">{campaign.description}</p>
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  <span className={limeChipClass}>{campaign.tags[0]}</span>
                  <span className="rounded-[14px] bg-[#e2eadf] px-2 py-[5px] text-[10px] font-bold text-brand-teal">{campaign.channel}</span>
                </div>
                {!matches && <span className="sr-only">Not in this finding</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-[18px] min-[1021px]:grid-cols-[minmax(340px,0.78fr)_minmax(0,1.22fr)]">
        <section aria-labelledby={`${ids}-comparison`} className={`${glassCardClass} p-5`}>
          <header className="mb-3.5 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-[0.11em] text-brand-coral uppercase">Active benchmark</p>
              <h2 id={`${ids}-comparison`} className="text-[17px] font-bold text-brand-teal">
                Competitor comparison
              </h2>
              <span className="mt-1 block text-[11px] text-[#758285]">
                {active.brand} &middot; {COMPARISON_PERIOD}
              </span>
            </div>
            <span className="rounded-[14px] bg-brand-lime-bright px-[9px] py-[5px] text-[10px] font-extrabold whitespace-nowrap text-brand-navy">
              {leads ? `${Math.abs(gap)} pts ahead` : `${gap} pts gap`}
            </span>
          </header>
          <dl className="grid gap-[9px] min-[621px]:grid-cols-2">
            {[
              ["Your business", `${active.business.count} ${active.unit.many}`, `${active.business.engagement}% avg engagement`, false],
              [active.brand, `${active.competitor.count} ${active.unit.many}`, `${active.competitor.engagement}% avg engagement`, true],
              ["Engagement gap", `${Math.abs(gap)} pts`, leads ? "your lead" : "competitor lead", false],
              ["Period", COMPARISON_PERIOD, "unweighted average", false],
            ].map(([label, value, detail, competitor]) => (
              <div
                key={String(label)}
                className={`grid gap-[5px] rounded-[11px] border border-brand-teal/9 p-[13px] ${
                  competitor ? "bg-[linear-gradient(145deg,rgba(221,254,86,0.35),rgba(255,255,255,0.75))]" : "bg-white/70"
                }`}
              >
                <dt className="text-[10px] text-[#708083]">{label}</dt>
                <dd className="grid gap-[5px]">
                  <strong className="text-[21px] font-medium text-brand-teal">{value}</strong>
                  <small className="text-[10px] text-[#4f7a5e]">{detail}</small>
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-2.5 flex items-start gap-[9px] rounded-[10px] bg-[#e3eadd] p-3 text-brand-teal">
            <LineIcon name="activity" size={16} />
            <p className="grid gap-1 text-[10px] leading-normal text-[#5e6d70]">
              <strong className="text-[11px] text-brand-teal">Evidence note</strong>
              Post rate = engagements &divide; reach &times; 100; averages are unweighted. A test opportunity, not a guarantee.
            </p>
          </div>
        </section>

        <section aria-labelledby={`${ids}-next`} className={`${glassCardClass} p-5`}>
          <header className="mb-3.5 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-[0.11em] text-brand-coral uppercase">Action plan</p>
              <h2 id={`${ids}-next`} className="text-[17px] font-bold text-brand-teal">
                Your next move
              </h2>
              <span className="mt-1 block text-[11px] text-[#758285]">Turn the benchmark into your next post.</span>
            </div>
            <span aria-hidden="true" className="grid size-[38px] shrink-0 place-items-center rounded-[9px] bg-brand-lime-bright text-brand-navy">
              <LineIcon name="sparkles" size={17} />
            </span>
          </header>
          <ol className="grid gap-[9px]">
            {nextMoves(active).map((move, index) => (
              <li
                key={move.title}
                className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-[11px] rounded-[11px] border border-brand-teal/10 bg-white/72 p-3"
              >
                <span aria-hidden="true" className="grid size-7 place-items-center rounded-[9px] bg-brand-lime-bright text-[12px] font-extrabold text-brand-navy">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <strong className="text-[12px] text-brand-teal">{move.title}</strong>
                  <p className="mt-1 text-[11px] leading-normal text-[#5d6d70]">{move.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <footer className="mt-3.5 flex flex-col items-start justify-between gap-[15px] min-[621px]:flex-row min-[621px]:items-center">
            <p className="flex items-center gap-1.5 text-[10px] text-[#6c7a7d]">
              <LineIcon name="sparkles" size={14} /> Recommendations are templates from sample competitor data, not live AI.
            </p>
            <Link
              href="/content"
              className="flex min-h-[35px] w-full items-center justify-center gap-[7px] rounded-[18px] bg-brand-lime-bright px-[15px] text-[11px] font-extrabold whitespace-nowrap text-brand-navy shadow-[0_4px_0_rgba(0,31,62,0.14)] hover:translate-y-px min-[621px]:w-auto"
            >
              Create from this insight <LineIcon name="chevron" size={14} />
            </Link>
          </footer>
        </section>
      </div>
    </>
  );
}
