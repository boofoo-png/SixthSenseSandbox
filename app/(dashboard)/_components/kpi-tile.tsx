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
    return { text: `No data for ${label}`, className: "text-ink-muted" };
  }
  const percent = roundPercent(change);
  if (percent === 0) {
    return { text: `No change vs ${label}`, className: "text-ink-muted" };
  }
  return percent > 0
    ? { text: `+${percent}% vs ${label}`, className: "text-success" }
    : { text: `${percent}% vs ${label}`, className: "text-error" };
}

export function KpiTile({ label, value, change, compareLabel = "last week" }: KpiTileProps) {
  const { text, className } = describeChange(change, compareLabel);
  return (
    <div className="rounded bg-paper shadow-elevation-1 p-5">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-2 text-3xl font-medium text-ink">
        {value}
      </p>
      <p className={`mt-1 text-sm ${className}`}>{text}</p>
    </div>
  );
}
