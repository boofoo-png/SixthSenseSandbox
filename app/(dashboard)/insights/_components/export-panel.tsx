"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { LineIcon } from "@/components/line-icons";
import { SCHEDULE_KEY, dueMonth, loadSchedule, saveSchedule, type MonthlySchedule } from "@/lib/reports/insights";
import { eyebrowClass, panelClass, panelTitleClass } from "../../_components/make-ui";

// The Figma Make's "Export and schedule" panel. PDF opens the printable report, CSV downloads the
// numbers, and the monthly export is kept in this browser and offered when Reports is next opened.

type Download = { csv: string; fileName: string };

const listeners = new Set<() => void>();
let cache: MonthlySchedule | null | undefined;

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
function getSnapshot(): MonthlySchedule | null {
  if (cache === undefined) cache = loadSchedule(storage());
  return cache;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SCHEDULE_KEY || event.key === null) {
      cache = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
function setSchedule(next: MonthlySchedule | null): boolean {
  cache = next;
  const saved = saveSchedule(storage(), next);
  for (const listener of listeners) listener();
  return saved;
}

/** Clears the in-memory copy so tests start fresh. */
export function resetScheduleForTests() {
  cache = undefined;
}

function downloadCsv({ csv, fileName }: Download) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const optionClass =
  "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[9px] border border-brand-teal/12 bg-[#fafaf8] p-3 text-left hover:border-brand-teal disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-brand-teal/12";

function Option({ title, detail }: { title: string; detail: string }) {
  return (
    <>
      <span className="grid size-[30px] place-items-center rounded-[7px] bg-[#dbe8e8] text-brand-teal">
        <LineIcon name="download" size={16} />
      </span>
      <span className="grid gap-0.5">
        <strong className="text-[13px] text-brand-navy">{title}</strong>
        <small className="text-[11px] text-[#5f6366]">{detail}</small>
      </span>
      <LineIcon name="chevron" size={15} />
    </>
  );
}

export function ExportPanel({ pdfHref, current, lastMonth, today }: { pdfHref: string; current: Download; lastMonth: Download & { label: string; start: string }; today: string }) {
  const schedule = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const [notice, setNotice] = useState("");
  const due = dueMonth(schedule, today);
  const lastMonthReady = due !== null && due.start === lastMonth.start;

  return (
    <section aria-labelledby="export-title" className={`${panelClass} min-[901px]:min-h-[420px]`}>
      <p className={eyebrowClass}>Export and schedule</p>
      <h2 id="export-title" className={panelTitleClass}>
        Share this report
      </h2>
      {lastMonthReady && (
        <div role="status" className="mt-3 rounded-[10px] border border-[rgba(116,195,101,0.6)] bg-brand-lime/40 p-3 text-[12px] text-brand-navy">
          <strong className="block">Your monthly report for {lastMonth.label} is ready.</strong>
          <button
            type="button"
            onClick={() => {
              downloadCsv(lastMonth);
              setSchedule({ since: schedule?.since ?? today, lastReady: lastMonth.start.slice(0, 7) });
            }}
            className="mt-1.5 font-semibold text-brand-teal underline underline-offset-2"
          >
            Download {lastMonth.label} as CSV
          </button>
        </div>
      )}
      <ul className="mt-3 grid gap-2">
        <li>
          <Link href={pdfHref} className={optionClass}>
            <Option title="PDF report" detail="Opens the printable report: choose Save as PDF" />
          </Link>
        </li>
        <li>
          <button
            type="button"
            className={optionClass}
            onClick={() => {
              downloadCsv(current);
              setNotice(`Downloaded ${current.fileName}.`);
            }}
          >
            <Option title="CSV data" detail="Daily numbers for the chosen dates" />
          </button>
        </li>
        <li>
          <button type="button" disabled className={optionClass}>
            <Option title="Presentation" detail="Not available in the prototype yet" />
          </button>
        </li>
      </ul>
      <button
        type="button"
        aria-pressed={schedule !== null}
        onClick={() => {
          const turningOn = schedule === null;
          const saved = setSchedule(turningOn ? { since: today, lastReady: null } : null);
          setNotice(
            !saved
              ? "This browser blocks saving, so the schedule will be forgotten after a reload."
              : turningOn
                ? "Scheduled. Each month, the last month's report will be ready here the next time you open Reports."
                : "Monthly export turned off.",
          );
        }}
        className={`mt-3 flex min-h-[34px] w-full items-center justify-center gap-[7px] rounded-[7px] border text-[12px] font-semibold ${
          schedule ? "border-[#c8e2d8] bg-[#edf7f2] text-brand-teal" : "border-[#cbdada] bg-[#f0f6f5] text-brand-teal hover:bg-[#e3efed]"
        }`}
      >
        <LineIcon name="calendar" size={16} />
        {schedule ? "Monthly export scheduled" : "Schedule monthly export"}
      </button>
      <p role="status" className="mt-2 min-h-[18px] text-[11px] text-brand-teal">
        {notice}
      </p>
      <p className="text-[11px] text-[#6f7377]">Nothing is emailed: reports stay in this browser, and a browser can&apos;t prepare them while the app is closed.</p>
    </section>
  );
}
