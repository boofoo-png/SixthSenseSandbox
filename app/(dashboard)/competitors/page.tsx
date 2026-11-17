import type { Metadata } from "next";
import { makePageClass } from "../_components/make-ui";
import { CompetitorPerformance } from "./_components/competitor-performance";

export const metadata: Metadata = {
  title: "Competitor performance",
  description: "See how your business compares with competitors, and explore the campaigns driving their performance.",
};

// Competitors from the team's Figma Make (re-checked 2026-11-16), which now matches the
// functionality list's Competitor Performance. Campaigns and figures are sample data.

export default function CompetitorsPage() {
  return (
    <main className={makePageClass}>
      <header className="mb-[22px] flex flex-col items-start gap-6 min-[621px]:flex-row min-[621px]:items-end min-[621px]:justify-between">
        <div className="max-w-[760px] text-brand-cream">
          <p className="mb-1 text-[10px] font-bold tracking-[0.11em] uppercase">Competitive intelligence</p>
          <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.04em]">Competitor performance</h1>
          <p className="mt-2 text-[13px] leading-[1.55] text-brand-cream/84">
            See how your business compares with competitors, and explore the campaigns driving their performance.
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-[7px] rounded-[17px] border border-brand-cream/32 bg-brand-cream/12 px-[13px] text-[11px] whitespace-nowrap text-brand-cream/90">
          <i aria-hidden="true" className="size-[7px] rounded-full bg-brand-lime-bright shadow-[0_0_0_4px_rgba(221,254,86,0.16)]" />
          Sample data &middot; updated 12 minutes ago
        </span>
      </header>
      <CompetitorPerformance />
    </main>
  );
}
