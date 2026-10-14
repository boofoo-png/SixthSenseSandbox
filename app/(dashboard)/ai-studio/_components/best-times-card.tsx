import { PLATFORMS, PLATFORM_LABELS } from "@/lib/analytics/types";
import { bestTimes, formatSlot } from "@/lib/ai-studio/best-time";

/** The top three posting times for each platform, from sample engagement by hour. */
export function BestTimesCard() {
  return (
    <section aria-labelledby="best-times" className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="best-times" className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Best times to post</h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">When your audience engages most, by platform (sample data).</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((platform) => (
          <div key={platform}>
            <dt className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{PLATFORM_LABELS[platform]}</dt>
            <dd className="mt-1 flex flex-wrap gap-1 text-xs text-zinc-700 dark:text-zinc-300">
              {bestTimes(platform).map((slot) => (
                <span key={`${slot.weekday}-${slot.hour}`} className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{formatSlot(slot)}</span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
