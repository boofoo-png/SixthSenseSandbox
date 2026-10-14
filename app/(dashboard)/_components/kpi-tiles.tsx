import type { PeriodComparison } from "@/lib/analytics/kpis";
import { formatPercent } from "@/lib/analytics/summary";
import { KpiTile } from "./kpi-tile";

const numberFormat = new Intl.NumberFormat("en-US");

/** The four headline KPIs for the selected period, each with its change vs the comparison period. */
export function KpiTiles({ comparison, compareLabel }: { comparison: PeriodComparison; compareLabel?: string }) {
  const { current, change } = comparison;
  const tiles = [
    { label: "Impressions", value: numberFormat.format(current.impressions), change: change.impressions },
    { label: "Engagements", value: numberFormat.format(current.engagements), change: change.engagements },
    { label: "Engagement rate", value: formatPercent(current.engagementRate, 1), change: change.engagementRate },
    { label: "Followers", value: numberFormat.format(current.followers), change: change.followers },
  ];

  return (
    <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <KpiTile key={tile.label} {...tile} compareLabel={compareLabel} />
      ))}
    </section>
  );
}
