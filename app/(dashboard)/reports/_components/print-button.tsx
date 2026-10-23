"use client";

/** Opens the browser's print dialog, where "Save as PDF" is available (see docs/DECISIONS.md). */
export function PrintButton() {
  return (
    <div className="print:hidden">
      <button
        type="button"
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        onClick={() => window.print()}
      >
        Print / Save as PDF
      </button>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">To get a PDF, choose Save as PDF as the printer.</p>
    </div>
  );
}
