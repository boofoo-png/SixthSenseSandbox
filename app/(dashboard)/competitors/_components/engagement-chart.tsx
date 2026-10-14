import { formatShortDate } from "@/lib/analytics/dates";
import { formatPercent } from "@/lib/analytics/summary";
import { linePath, linearScale, niceAxis, spreadLabels, ticks, type Point } from "@/lib/charts/scale";
import type { WeeklyEngagement } from "@/lib/competitors/activity";
import { cardClass, cardHeadingClass } from "../../_components/styles";

const WIDTH = 640;
const HEIGHT = 260;
const MARGIN = { top: 16, right: 64, bottom: 28, left: 44 };
const LABEL_GAP = 14;
const TITLE = "Engagement rate by week";

/** Categorical slots in fixed order: color follows the competitor, never its rank. */
function seriesColor(index: number): string {
  return `var(--series-${(index % 4) + 1})`;
}

function latestRate(rates: readonly (number | null)[]): number | null {
  for (let i = rates.length - 1; i >= 0; i--) {
    if (rates[i] !== null) {
      return rates[i];
    }
  }
  return null;
}

/**
 * Line chart of each competitor's weekly engagement rate. Server-rendered
 * SVG with native hover labels, a legend, end labels, and a table view.
 */
export function EngagementChart({ data }: { data: WeeklyEngagement }) {
  const { weeks, series } = data;

  if (weeks.length === 0 || series.length === 0) {
    return (
      <section aria-labelledby="engagement-chart" className={cardClass}>
        <h2 id="engagement-chart" className={cardHeadingClass}>{TITLE}</h2>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No competitor posts to chart yet.</p>
      </section>
    );
  }

  const allRates = series.flatMap((s) => s.rates.filter((r): r is number => r !== null));
  const axis = niceAxis(Math.max(0, ...allRates));
  const yMax = axis.max;
  const plotRight = WIDTH - MARGIN.right;
  const plotBottom = HEIGHT - MARGIN.bottom;
  const x = linearScale([0, Math.max(1, weeks.length - 1)], [MARGIN.left, plotRight]);
  const y = linearScale([0, yMax], [plotBottom, MARGIN.top]);

  const lines = series.map((s, index) => {
    const points: (Point | null)[] = s.rates.map((rate, i) => (rate === null ? null : { x: x(i), y: y(rate) }));
    return { ...s, index, points, latest: latestRate(s.rates) };
  });

  // End labels sit at the last week; spread them apart where lines finish close together.
  const ending = lines.filter((line) => line.rates[line.rates.length - 1] !== null);
  const labelYs = spreadLabels(
    ending.map((line) => line.points[line.points.length - 1]!.y),
    LABEL_GAP,
    MARGIN.top,
    plotBottom,
  );

  return (
    <figure aria-labelledby="engagement-chart" className={`viz-root ${cardClass}`}>
      <h2 id="engagement-chart" className={cardHeadingClass}>{TITLE}</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Engagements divided by impressions, last {weeks.length} weeks. Hover a point for details.
      </p>

      <ul aria-label="Legend" className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {lines.map((line) => (
          <li key={line.competitor.slug} className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-0.5 w-4 rounded-full" style={{ background: seriesColor(line.index) }} />
            <span className="text-zinc-700 dark:text-zinc-300">{line.competitor.name}</span>
            <span className="font-medium text-zinc-950 dark:text-zinc-50">
              {line.latest === null ? "" : formatPercent(line.latest, 1)}
            </span>
          </li>
        ))}
      </ul>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-3 h-auto w-full" role="img" aria-label={`${TITLE}. The same data is in the table below.`}>
        {ticks(yMax, Math.round(yMax / axis.step)).map((tick) => (
          <g key={tick}>
            <line x1={MARGIN.left} x2={plotRight} y1={y(tick)} y2={y(tick)} stroke="var(--viz-grid)" strokeWidth={1} />
            <text x={MARGIN.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--viz-axis)">
              {formatPercent(tick, Number.isInteger(Math.round(tick * 1000) / 10) ? 0 : 1)}
            </text>
          </g>
        ))}

        {weeks.map((week, i) => (
          <text key={week.end} x={x(i)} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill="var(--viz-axis)">
            {formatShortDate(week.start)}
          </text>
        ))}

        {lines.map((line) => (
          <path
            key={line.competitor.slug}
            data-series={line.competitor.slug}
            d={linePath(line.points)}
            fill="none"
            stroke={seriesColor(line.index)}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {lines.map((line) =>
          line.points.map((point, i) =>
            point === null ? null : (
              <g key={`${line.competitor.slug}-${i}`}>
                <title>{`${line.competitor.name}, week of ${formatShortDate(weeks[i].start)}: ${formatPercent(line.rates[i]!, 1)}`}</title>
                <circle cx={point.x} cy={point.y} r={10} fill="transparent" />
                <circle cx={point.x} cy={point.y} r={4} fill={seriesColor(line.index)} stroke="var(--viz-surface)" strokeWidth={2} />
              </g>
            ),
          ),
        )}

        {ending.map((line, i) => {
          const end = line.points[line.points.length - 1]!;
          const labelY = labelYs[i];
          return (
            <g key={`label-${line.competitor.slug}`} aria-hidden="true">
              {Math.abs(labelY - end.y) > 2 && (
                <line x1={end.x + 6} y1={end.y} x2={end.x + 14} y2={labelY} stroke="var(--viz-axis)" strokeWidth={1} />
              )}
              <text x={end.x + 16} y={labelY} dy="0.32em" fontSize={11} fill="var(--viz-label)">
                {formatPercent(line.rates[line.rates.length - 1]!, 1)}
              </text>
            </g>
          );
        })}
      </svg>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-zinc-600 dark:text-zinc-400">View as table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">{`${TITLE} (table)`}</caption>
            <thead className="text-zinc-500 dark:text-zinc-400">
              <tr>
                <th scope="col" className="py-1 pr-4 font-medium">Competitor</th>
                {weeks.map((week) => (
                  <th key={week.end} scope="col" className="py-1 pr-4 font-medium">{`Week of ${formatShortDate(week.start)}`}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-zinc-800 dark:text-zinc-200">
              {lines.map((line) => (
                <tr key={line.competitor.slug} className="border-t border-zinc-200 dark:border-zinc-800">
                  <th scope="row" className="py-1 pr-4 font-medium">{line.competitor.name}</th>
                  {line.rates.map((rate, i) => (
                    <td key={weeks[i].end} className="py-1 pr-4">{rate === null ? "No posts" : formatPercent(rate, 1)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
