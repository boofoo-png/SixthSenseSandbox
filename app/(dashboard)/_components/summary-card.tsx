/** The rule-based "what worked" summary for the selected period (see docs/DECISIONS.md). */
export function SummaryCard({ lines }: { lines: readonly string[] }) {
  return (
    <section className="rounded bg-paper shadow-elevation-1 p-5">
      <h2 className="text-lg font-medium text-ink">
        In plain English
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
