"use client";

import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  COMPARE_OPTIONS,
  PERIOD_OPTIONS,
  describeSelection,
  toSearchParams,
  withQuery,
  type ComparePreset,
  type DateRangeSelection,
  type PeriodPreset,
  type ResolvedDateRange,
} from "@/lib/date-range";
import { Button } from "@/components/button";
import { fieldClass, labelClass } from "./styles";

type DateRangeBarProps = {
  resolved: ResolvedDateRange;
  /** Latest selectable day (YYYY-MM-DD); future dates have no data. */
  today: string;
};


/**
 * Lets users pick the period to show and the period to compare it with.
 * The choice is stored in the page address (see docs/DECISIONS.md), so
 * quick options apply immediately and custom dates apply with a button.
 */
export function DateRangeBar({ resolved, today }: DateRangeBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();

  const [period, setPeriod] = useState<PeriodPreset>(resolved.selection.period);
  const [compare, setCompare] = useState<ComparePreset>(resolved.selection.compare);
  const [from, setFrom] = useState(resolved.current.start);
  const [to, setTo] = useState(resolved.current.end);
  const [compareFrom, setCompareFrom] = useState(resolved.comparison.start);
  const [compareTo, setCompareTo] = useState(resolved.comparison.end);

  function selection(nextPeriod: PeriodPreset, nextCompare: ComparePreset): DateRangeSelection {
    return {
      period: nextPeriod,
      ...(nextPeriod === "custom" ? { from, to } : {}),
      compare: nextCompare,
      ...(nextCompare === "custom" ? { compareFrom, compareTo } : {}),
    };
  }

  function go(next: DateRangeSelection) {
    router.push(withQuery(pathname, toSearchParams(next)));
  }

  function changePeriod(value: PeriodPreset) {
    setPeriod(value);
    if (value !== "custom") {
      go(selection(value, compare));
    }
  }

  function changeCompare(value: ComparePreset) {
    setCompare(value);
    if (value !== "custom") {
      go(selection(period, value));
    }
  }

  const needsApply = period === "custom" || compare === "custom";

  return (
    <section aria-label="Date range" className="rounded bg-paper shadow-elevation-1 p-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          go(selection(period, compare));
        }}
      >
        <label className={labelClass}>
          Show
          <select className={fieldClass} value={period} onChange={(e) => changePeriod(e.target.value as PeriodPreset)}>
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        {period === "custom" && (
          <>
            <label className={labelClass} htmlFor={`${id}-from`}>
              Start date
              <input id={`${id}-from`} type="date" className={fieldClass} value={from} max={today} required onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className={labelClass} htmlFor={`${id}-to`}>
              End date
              <input id={`${id}-to`} type="date" className={fieldClass} value={to} max={today} required onChange={(e) => setTo(e.target.value)} />
            </label>
          </>
        )}

        <label className={labelClass}>
          Compare to
          <select className={fieldClass} value={compare} onChange={(e) => changeCompare(e.target.value as ComparePreset)}>
            {COMPARE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        {compare === "custom" && (
          <>
            <label className={labelClass} htmlFor={`${id}-compare-from`}>
              Comparison start date
              <input id={`${id}-compare-from`} type="date" className={fieldClass} value={compareFrom} max={today} required onChange={(e) => setCompareFrom(e.target.value)} />
            </label>
            <label className={labelClass} htmlFor={`${id}-compare-to`}>
              Comparison end date
              <input id={`${id}-compare-to`} type="date" className={fieldClass} value={compareTo} max={today} required onChange={(e) => setCompareTo(e.target.value)} />
            </label>
          </>
        )}

        {needsApply && (
          <Button type="submit" variant="contained">
            Apply dates
          </Button>
        )}
      </form>

      <p className="mt-3 text-sm text-ink-muted">{describeSelection(resolved, today)}</p>
      {resolved.notices.length > 0 && (
        <div role="status" className="mt-3 rounded bg-warning-bg px-4 py-2 text-sm text-warning-fg">
          {resolved.notices.map((notice) => (
            <p key={notice}>{notice}</p>
          ))}
        </div>
      )}
    </section>
  );
}
