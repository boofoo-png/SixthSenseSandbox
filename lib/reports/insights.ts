
// CSV helpers for report downloads (formula-safe cells). Used by Reports (lib/reports/ads.ts).

/** A spreadsheet cell: quoted when needed, and never run as a formula (=, +, -, @ at the start). */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
