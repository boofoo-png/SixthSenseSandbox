import type { Metadata } from "next";
import { formatChange } from "@/lib/analytics/change";
import { shiftDate, todayIsoDate } from "@/lib/analytics/dates";
import { comparePeriods } from "@/lib/analytics/kpis";
import { sampleDataBetween } from "@/lib/analytics/sample-data";
import { buildSummary, formatPercent } from "@/lib/analytics/summary";
import { pageDates, withQuery } from "@/lib/date-range";
import { clickBars, reportCsv, reportFileName } from "@/lib/reports/insights";
import { LineIcon } from "@/components/line-icons";
import { DateRangeBar } from "../_components/date-range-bar";
import { MakePageHeader, PanelHeading, StatCard, makePageClass, panelClass } from "../_components/make-ui";
import { ExportPanel } from "./_components/export-panel";

export const metadata: Metadata = {
  title: "Reports",
  description: "Bring clicks, impressions, followers, and engagement together, then export or schedule recurring reports.",
};

// Reports from the team's updated Figma Make (2026-11-05), filled with the app's sample analytics.
// The Make's website traffic and conversions are not in the sample data, so impressions and
// followers take their place (docs/DECISIONS.md 2026-11-05).

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function compact(value: number): string {
  return value >= 1000 ? `${Number((value / 1000).toFixed(1))}K` : String(value);
}

function fromLast(change: number | null): string {
  return change === null ? "No earlier data to compare" : `${formatChange(change)} from last period`;
}

export default async function ReportsPage({ searchParams }: PageProps<"/insights">) {
  const today = todayIsoDate();
  const dates = pageDates(await searchParams, today);
  // Sample data until real social accounts are connected (see docs/DISCOVERY.md).
  const rows = sampleDataBetween(dates.dataRange);
  const { current, change } = comparePeriods(rows, dates.ranges);
  const bars = clickBars(rows, dates.ranges.current);
  const summary = buildSummary(rows, {
    ranges: dates.ranges,
    currentPhrase: `during ${dates.currentLabel}`,
    comparisonPhrase: dates.comparisonLabel,
  });

  // Last calendar month, for the monthly export.
  const lastMonthEnd = shiftDate(`${today.slice(0, 7)}-01`, -1);
  const lastMonth = { start: `${lastMonthEnd.slice(0, 7)}-01`, end: lastMonthEnd };
  const lastMonthRows = sampleDataBetween(lastMonth);

  return (
    <main className={makePageClass}>
      <MakePageHeader
        eyebrow="Performance and reporting"
        title="Make every result easy to understand"
        description="Bring clicks, impressions, followers, and engagement together, then export or schedule recurring reports."
        question="What drove our results this month?"
      />

      <div className={`${panelClass} mb-3 grid gap-3`}>
        <p className="text-[12px] text-[#4f5d5f]">
          <strong className="text-brand-navy">Sample data:</strong> these numbers show how reporting will work once your accounts are connected.
        </p>
        <DateRangeBar key={dates.query} resolved={dates.resolved} today={today} />
      </div>

      <div className="mb-3 grid gap-3 min-[621px]:grid-cols-2 min-[1101px]:grid-cols-4">
        <StatCard icon="activity" label="Total clicks" value={compact(current.clicks)} detail={fromLast(change.clicks)} />
        <StatCard icon="audience" label="Impressions" value={compact(current.impressions)} detail={fromLast(change.impressions)} warm />
        <StatCard icon="target" label="Followers" value={compact(current.followers)} detail={fromLast(change.followers)} warm />
        <StatCard icon="message" label="Engagement" value={formatPercent(current.engagementRate, 1)} detail={fromLast(change.engagementRate)} />
      </div>

      <div className="grid gap-3 min-[901px]:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <section aria-labelledby="overview-title" className={`${panelClass} min-[901px]:min-h-[420px]`}>
          <PanelHeading id="overview-title" eyebrow="Executive overview" title={`Marketing performance, ${dates.currentLabel}`}>
            <span className="text-[11px] text-[#6f7377]">Compared with {dates.comparisonLabel}</span>
          </PanelHeading>
          <figure className="mt-5">
            <figcaption className="sr-only">Clicks for each {bars.length > 0 && bars[0].label.startsWith("W") ? "week" : "day"} of the chosen dates</figcaption>
            <ol className="flex h-[190px] items-end gap-2 border-b border-brand-teal/15 pb-1">
              {bars.map((bar) => (
                <li key={bar.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-semibold text-brand-teal">{bar.value}</span>
                  <i aria-hidden="true" className="block w-full max-w-[34px] rounded-t-[6px] rounded-b-[2px] bg-linear-to-t from-brand-teal to-[#5a9c88]" style={{ height: `${bar.height}%` }} />
                  <span className="sr-only">
                    {bar.label}: {bar.value} clicks
                  </span>
                </li>
              ))}
            </ol>
            <div aria-hidden="true" className="mt-1 flex gap-2">
              {bars.map((bar, index) => (
                <span key={bar.label} className="min-w-0 flex-1 truncate text-center text-[10px] text-[#6f7377]">
                  {bars.length > 10 && index % 2 === 1 ? "" : bar.label}
                </span>
              ))}
            </div>
          </figure>
          <div className="mt-5 flex items-start gap-3 rounded-[10px] border border-[rgba(116,195,101,0.52)] bg-brand-lime/35 p-3.5">
            <span className="grid size-[30px] shrink-0 place-items-center rounded-[8px] bg-brand-lime-bright text-brand-navy">
              <LineIcon name="sparkles" size={16} />
            </span>
            <div className="grid gap-1 text-[12px] leading-[1.55] text-[#3f4b4d]">
              <strong className="text-[13px] text-brand-navy">Sense AI summary</strong>
              {summary.slice(0, 3).map((line) => (
                <p key={line}>{line}</p>
              ))}
              <small className="text-[11px] text-[#5f6b6d]">Written from your numbers with templates, not live AI.</small>
            </div>
          </div>
        </section>

        <ExportPanel
          pdfHref={withQuery("/reports", dates.query)}
          today={today}
          current={{ csv: reportCsv(rows, dates.ranges.current), fileName: reportFileName(dates.ranges.current) }}
          lastMonth={{
            csv: reportCsv(lastMonthRows, lastMonth),
            fileName: reportFileName(lastMonth),
            label: `${MONTHS[Number(lastMonth.start.slice(5, 7)) - 1]} ${lastMonth.start.slice(0, 4)}`,
            start: lastMonth.start,
          }}
        />
      </div>
    </main>
  );
}

