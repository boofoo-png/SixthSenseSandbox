/** The rule-based "what worked" summary for the selected period (see docs/DECISIONS.md). */
export function SummaryCard({ lines }: { lines: readonly string[] }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        In plain English
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
