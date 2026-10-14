"use client";

import { useId, useState } from "react";
import { PLATFORM_LABELS } from "@/lib/analytics/types";
import { daysInRange, shiftDate } from "@/lib/analytics/dates";
import { formatTime } from "@/lib/ai-studio/best-time";
import { postsByDay } from "@/lib/ai-studio/planned-posts";
import type { PlannedPost } from "@/lib/ai-studio/types";
import { fieldClass, labelClass, secondaryButtonClass, buttonClass } from "./styles";
import { usePlannedPosts } from "./use-planned-posts";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function monthStart(year: number, month: number): string {
  return `${year}-${pad(month + 1)}-01`;
}

/** Calendar weeks (Sunday first) for a month; null marks days outside the month. */
function monthWeeks(year: number, month: number): (string | null)[][] {
  const first = monthStart(year, month);
  const next = month === 11 ? monthStart(year + 1, 0) : monthStart(year, month + 1);
  const days = daysInRange({ start: first, end: shiftDate(next, -1) });
  const lead = new Date(Date.parse(`${first}T00:00:00Z`)).getUTCDay();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => shiftDate(first, i))];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

function dayLabel(date: string): string {
  const d = new Date(Date.parse(`${date}T00:00:00Z`));
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}`;
}

function PostEditor({ post, onSave, onCancel }: { post: PlannedPost; onSave: (changes: Partial<PlannedPost>) => void; onCancel: () => void }) {
  const id = useId();
  const [date, setDate] = useState(post.date);
  const [time, setTime] = useState(post.time);
  const [caption, setCaption] = useState(post.caption);
  return (
    <div className="mt-2 flex flex-wrap items-end gap-3">
      <label className={labelClass} htmlFor={`${id}-date`}>
        Edit date
        <input id={`${id}-date`} type="date" className={fieldClass} value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className={labelClass} htmlFor={`${id}-time`}>
        Edit time
        <input id={`${id}-time`} type="time" className={fieldClass} value={time} onChange={(e) => setTime(e.target.value)} />
      </label>
      <label className={`${labelClass} w-full`} htmlFor={`${id}-caption`}>
        Edit caption
        <textarea id={`${id}-caption`} className={fieldClass} rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} />
      </label>
      <button type="button" className={buttonClass} onClick={() => onSave({ date, time, caption })}>Save changes</button>
      <button type="button" className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
    </div>
  );
}

/**
 * Planned posts by month: a month grid on wider screens and a list (with
 * edit and delete) on every screen. Posts live in this browser only.
 */
export function ContentCalendar({ today }: { today: string }) {
  const { posts, update, remove } = usePlannedPosts();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const [editing, setEditing] = useState<string | null>(null);

  const label = `${MONTHS[month]} ${year}`;
  const prefix = `${year}-${pad(month + 1)}`;
  const byDay = postsByDay(posts.filter((post) => post.date.startsWith(prefix)));

  function moveMonth(delta: number) {
    const total = year * 12 + month + delta;
    setYear(Math.floor(total / 12));
    setMonth(((total % 12) + 12) % 12);
  }

  return (
    <section aria-labelledby="calendar-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="calendar-heading" className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Content calendar</h2>
        <div className="flex items-center gap-2">
          <button type="button" className={secondaryButtonClass} aria-label="Previous month" onClick={() => moveMonth(-1)}>Prev</button>
          <h3 className="min-w-36 text-center text-sm font-semibold text-zinc-800 dark:text-zinc-200" aria-live="polite">{label}</h3>
          <button type="button" className={secondaryButtonClass} aria-label="Next month" onClick={() => moveMonth(1)}>Next</button>
        </div>
      </div>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Planned posts are saved in this browser only. Nothing is posted automatically.</p>

      <section aria-label="Month view" className="mt-4 hidden md:block">
        <table role="grid" className="w-full table-fixed border-collapse text-left text-xs">
          <thead>
            <tr>
              {WEEKDAYS.map((day) => (
                <th key={day} scope="col" className="pb-1 font-medium text-zinc-500 dark:text-zinc-400">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthWeeks(year, month).map((week, w) => (
              <tr key={w}>
                {week.map((date, d) =>
                  date === null ? (
                    <td key={d} role="gridcell" className="h-24 border border-zinc-100 dark:border-zinc-900" />
                  ) : (
                    <td
                      key={date}
                      role="gridcell"
                      aria-label={`${MONTHS[month]} ${Number(date.slice(8))}`}
                      className={`h-24 border border-zinc-200 p-1 align-top dark:border-zinc-800 ${date === today ? "bg-zinc-50 dark:bg-zinc-900" : ""}`}
                    >
                      <span className="text-zinc-500 dark:text-zinc-400">{Number(date.slice(8))}</span>
                      <ul className="mt-1 space-y-1">
                        {(byDay.get(date) ?? []).map((post) => (
                          <li key={post.id} className="truncate rounded bg-zinc-100 px-1 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                            {`${formatTime(post.time)} ${PLATFORM_LABELS[post.platform]}: ${post.caption}`}
                          </li>
                        ))}
                      </ul>
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-label="List view" className="mt-4">
        {byDay.size === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{`No posts planned for ${label}.`}</p>
        ) : (
          <ul className="space-y-4">
            {[...byDay].map(([date, dayPosts]) => (
              <li key={date}>
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{dayLabel(date)}</h4>
                <ul className="mt-1 space-y-2">
                  {dayPosts.map((post) => (
                    <li key={post.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{`${formatTime(post.time)}, ${PLATFORM_LABELS[post.platform]}`}</p>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200">{post.caption}</p>
                      {editing === post.id ? (
                        <PostEditor
                          post={post}
                          onSave={(changes) => {
                            update(post.id, changes);
                            setEditing(null);
                          }}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <div className="mt-2 flex gap-2">
                          <button type="button" className={secondaryButtonClass} aria-label={`Edit post: ${post.caption}`} onClick={() => setEditing(post.id)}>Edit</button>
                          <button type="button" className={secondaryButtonClass} aria-label={`Delete post: ${post.caption}`} onClick={() => remove(post.id)}>Delete</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
