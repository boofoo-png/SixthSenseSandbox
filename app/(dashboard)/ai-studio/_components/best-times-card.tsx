import { PLATFORMS, PLATFORM_LABELS } from "@/lib/analytics/types";
import { bestTimes, formatSlot } from "@/lib/ai-studio/best-time";

/** The top three posting times for each platform, from sample engagement by hour. */
export function BestTimesCard() {
  return (
    <section aria-labelledby="best-times" className="rounded bg-paper shadow-elevation-1 p-5">
      <h2 id="best-times" className="text-lg font-medium text-ink">Best times to post</h2>
      <p className="mt-1 text-xs text-ink-muted">When your audience engages most, by platform (sample data).</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((platform) => (
          <div key={platform}>
            <dt className="text-sm font-medium text-ink">{PLATFORM_LABELS[platform]}</dt>
            <dd className="mt-1 flex flex-wrap gap-1 text-xs text-ink-muted">
              {bestTimes(platform).map((slot) => (
                <span key={`${slot.weekday}-${slot.hour}`} className="rounded bg-selected px-2 py-0.5">{formatSlot(slot)}</span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
