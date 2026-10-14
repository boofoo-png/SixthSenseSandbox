import { roundPercent } from "@/lib/analytics/change";

type KpiTileProps = {
  label: string;
  value: string;
  /** Change vs the comparison period as a fraction (0.12 means +12%); null when there is nothing to compare. */
  change: number | null;
  /** What the change is measured against, e.g. "Oct 4 - 6". */
  compareLabel?: string;
};

function describeChange(change: number | null, label: string): { text: string; className: string } {
  if (change === null) {
    return { text: `No data for ${label}`, className: "text-zinc-500 dark:text-zinc-400" };
  }
  const percent = roundPercent(change);
  if (percent === 0) {
    return { text: `No change vs ${label}`, className: "text-zinc-500 dark:text-zinc-400" };
  }
  return percent > 0
    ? { text: `+${percent}% vs ${label}`, className: "text-emerald-700 dark:text-emerald-400" }
    : { text: `${percent}% vs ${label}`, className: "text-red-700 dark:text-red-400" };
}

export function KpiTile({ label, value, change, compareLabel = "last week" }: KpiTileProps) {
  const { text, className } = describeChange(change, compareLabel);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
      <p className={`mt-1 text-sm ${className}`}>{text}</p>
    </div>
  );
}
