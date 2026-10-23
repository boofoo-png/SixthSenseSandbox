"use client";

import { Button } from "@/components/button";

/** Opens the browser's print dialog, where "Save as PDF" is available (see docs/DECISIONS.md). */
export function PrintButton() {
  return (
    <div className="print:hidden">
      <Button variant="contained" onClick={() => window.print()}>
        Print / Save as PDF
      </Button>
      <p className="mt-1 text-xs text-ink-muted">To get a PDF, choose Save as PDF as the printer.</p>
    </div>
  );
}
