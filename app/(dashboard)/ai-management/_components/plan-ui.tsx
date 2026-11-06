"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LineIcon } from "@/components/line-icons";
import {
  CHANNELS,
  FORMATS,
  SUGGESTED_FORMAT,
  WEEKDAYS,
  checkPost,
  dayLabel,
  monthGrid,
  monthLabel,
  shiftMonth,
  timeLabel,
  type Channel,
  type ScheduledPost,
} from "@/lib/hub/posting-plan";

// Shared pieces of the AI Management screens from the team's design file: channel badges, the
// monthly content calendar, a scheduled post row, and the post editor.

export const cardClass =
  "min-w-0 rounded-[22px] border border-brand-cream/70 bg-brand-cream/94 p-[18px] text-brand-navy shadow-[0_7px_0_rgba(0,31,62,0.16),0_18px_35px_rgba(0,31,62,0.12)] backdrop-blur-[18px] min-[621px]:p-[22px]";
export const headingClass = "text-[19px] font-bold text-brand-teal";
export const pillClass = (selected: boolean) =>
  `inline-flex min-h-9 items-center gap-1.5 rounded-[20px] border px-3.5 text-[12px] font-semibold shadow-[0_2px_0_rgba(0,31,62,0.08)] ${
    selected ? "border-brand-teal bg-brand-teal text-brand-cream" : "border-brand-teal/14 bg-white/80 text-brand-navy hover:border-brand-teal"
  }`;
export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[22px] bg-brand-lime-bright px-6 text-[13px] font-bold text-brand-navy shadow-[0_5px_0_rgba(0,31,62,0.17)] hover:bg-brand-lime disabled:opacity-60";
export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[22px] border border-brand-teal/15 bg-brand-cream px-6 text-[13px] font-bold text-brand-navy shadow-[0_5px_0_rgba(0,31,62,0.12)] hover:border-brand-teal";

const CHANNEL_STYLE: Record<Channel, { bg: string; letter: string }> = {
  Instagram: { bg: "bg-[#e1306c]", letter: "IG" },
  TikTok: { bg: "bg-black", letter: "TT" },
  LinkedIn: { bg: "bg-[#0a66c2]", letter: "in" },
  YouTube: { bg: "bg-[#ff0000]", letter: "▶" },
  "X (Twitter)": { bg: "bg-black", letter: "X" },
};

/** A small square in the channel's colour; the channel name is read out separately. */
export function ChannelBadge({ channel, size = "size-4 text-[7px]" }: { channel: Channel; size?: string }) {
  const style = CHANNEL_STYLE[channel];
  return (
    <span aria-hidden="true" className={`inline-grid shrink-0 place-items-center rounded-[4px] font-bold text-white ${style.bg} ${size}`}>
      {style.letter}
    </span>
  );
}

/** Channel filter chips: All and each channel that has posts, with counts. */
export function ChannelFilter({
  posts,
  value,
  onChange,
  children,
}: {
  posts: readonly ScheduledPost[];
  value: Channel | "All";
  onChange: (value: Channel | "All") => void;
  children?: ReactNode;
}) {
  return (
    <div role="group" aria-label="Filter by channel" className="flex flex-wrap gap-2">
      <button type="button" aria-pressed={value === "All"} onClick={() => onChange("All")} className={pillClass(value === "All")}>
        All ({posts.length})
      </button>
      {CHANNELS.filter((channel) => posts.some((post) => post.channel === channel)).map((channel) => (
        <button key={channel} type="button" aria-pressed={value === channel} onClick={() => onChange(channel)} className={pillClass(value === channel)}>
          <ChannelBadge channel={channel} />
          {channel} ({posts.filter((post) => post.channel === channel).length})
        </button>
      ))}
      {children}
    </div>
  );
}

/** The monthly content calendar. `highlight` marks newly added posts. */
export function ContentCalendar({
  posts,
  month,
  onMonth,
  today,
  highlight,
  onOpen,
}: {
  posts: readonly ScheduledPost[];
  month: string;
  onMonth: (month: string) => void;
  today: string;
  highlight?: ReadonlySet<string>;
  onOpen: (post: ScheduledPost) => void;
}) {
  const byDay = new Map<string, ScheduledPost[]>();
  for (const post of posts.toSorted((a, b) => a.time.localeCompare(b.time))) byDay.set(post.date, [...(byDay.get(post.date) ?? []), post]);
  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-2">
        <button type="button" aria-label="Previous month" onClick={() => onMonth(shiftMonth(month, -1))} className="grid size-8 place-items-center rounded-full border border-brand-teal/15 bg-white/80 hover:border-brand-teal">
          <LineIcon name="chevron" size={14} className="rotate-180" />
        </button>
        <h3 aria-live="polite" className="min-w-[120px] text-center text-[14px] font-bold text-brand-navy">
          {monthLabel(month)}
        </h3>
        <button type="button" aria-label="Next month" onClick={() => onMonth(shiftMonth(month, 1))} className="grid size-8 place-items-center rounded-full border border-brand-teal/15 bg-white/80 hover:border-brand-teal">
          <LineIcon name="chevron" size={14} />
        </button>
      </div>
      {/* relative: hidden labels inside the table are positioned here, so the scroll box clips them on phones. */}
      <div className="relative overflow-x-auto rounded-[12px] border border-brand-teal/12 bg-white/70">
        <table className="w-full min-w-[640px] table-fixed border-collapse">
          <caption className="sr-only">Scheduled posts in {monthLabel(month)}, Pacific Time</caption>
          <thead>
            <tr>
              {WEEKDAYS.map((day) => (
                <th key={day} scope="col" className="py-2 text-[11px] font-semibold text-[#4f5d5f]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthGrid(month).map((week) => (
              <tr key={week[0].date}>
                {week.map(({ date, inMonth }) => (
                  <td key={date} className={`h-[92px] border-t border-l border-brand-teal/10 p-1 align-top first:border-l-0 ${date === today ? "bg-brand-lime/30" : ""}`}>
                    <span className={`block px-1 text-[11px] ${inMonth ? "text-brand-navy" : "text-[#9aa3a4]"}`}>
                      {Number(date.slice(8))}
                      {date === today && <span className="sr-only"> (today)</span>}
                    </span>
                    <ul className="mt-0.5 grid gap-1">
                      {(byDay.get(date) ?? []).map((post) => (
                        <li key={post.id}>
                          <button
                            type="button"
                            onClick={() => onOpen(post)}
                            className={`grid w-full gap-0.5 rounded-[6px] px-1.5 py-1 text-left text-[10px] leading-tight hover:ring-2 hover:ring-brand-teal/40 ${
                              highlight?.has(post.id) ? "bg-brand-lime-bright text-brand-navy" : "bg-[#dfe9e2] text-brand-navy"
                            }`}
                          >
                            <span className="flex items-center gap-1 font-semibold">
                              <ChannelBadge channel={post.channel} size="size-3 text-[6px]" />
                              {timeLabel(post.time)}
                              <span className="sr-only">{post.channel}</span>
                            </span>
                            <span className="line-clamp-2">{post.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A post with its thumbnail, channel, format, and time. */
export function PostRow({ post, children }: { post: ScheduledPost; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative size-12 shrink-0 overflow-hidden rounded-[8px]">
        <Image src={post.image} alt="" fill sizes="48px" className="object-cover" />
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <strong className="truncate text-[13px] font-semibold text-brand-navy">{post.title}</strong>
        <span className="flex items-center gap-1.5 text-[11px] text-[#4f5d5f]">
          <ChannelBadge channel={post.channel} /> {post.channel} · {post.format}
        </span>
        <span className="text-[11px] text-[#5f6b6d]">
          {dayLabel(post.date)} · {timeLabel(post.time)} PST
        </span>
      </div>
      {children}
    </div>
  );
}

/** Edit or add a post; per-platform format with a suggestion (functionality list). */
export function PostEditor({
  post,
  today,
  title,
  onSave,
  onClose,
  onRemove,
}: {
  post: ScheduledPost;
  today: string;
  title: string;
  onSave: (post: ScheduledPost) => void;
  onClose: () => void;
  onRemove?: () => void;
}) {
  const [draft, setDraft] = useState(post);
  const [errors, setErrors] = useState<ReturnType<typeof checkPost>>({});
  const first = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    first.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  const set = <K extends keyof ScheduledPost>(key: K, value: ScheduledPost[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const input = "w-full rounded-[9px] border border-brand-teal/18 bg-white px-3 py-2 text-[13px] text-brand-navy outline-none focus:border-brand-teal";
  const label = "text-[11px] font-semibold text-[#4f5d5f]";
  const suggested = SUGGESTED_FORMAT[draft.channel];

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[rgba(0,31,62,0.45)] p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onSubmit={(event) => {
          event.preventDefault();
          const found = checkPost(draft, today);
          setErrors(found);
          if (Object.keys(found).length === 0) onSave({ ...draft, title: draft.title.trim() });
        }}
        className="grid max-h-[calc(100dvh-32px)] w-full max-w-[520px] gap-3 overflow-y-auto rounded-[20px] bg-brand-cream p-5 text-brand-navy shadow-[0_24px_48px_rgba(0,31,62,0.3)]"
      >
        <h2 id={`${id}-title`} className="text-[18px] font-bold text-brand-teal">
          {title}
        </h2>
        <div className="grid gap-1">
          <label htmlFor={`${id}-name`} className={label}>
            Title
          </label>
          <input ref={first} id={`${id}-name`} value={draft.title} maxLength={140} onChange={(event) => set("title", event.target.value)} className={input} aria-invalid={errors.title ? true : undefined} />
          {errors.title && <p className="text-[11px] font-semibold text-[#9b2c2c]">{errors.title}</p>}
        </div>
        <div className="grid gap-1">
          <label htmlFor={`${id}-caption`} className={label}>
            Caption
          </label>
          <textarea id={`${id}-caption`} rows={4} value={draft.caption} maxLength={2300} onChange={(event) => set("caption", event.target.value)} className={input} />
          {errors.caption && <p className="text-[11px] font-semibold text-[#9b2c2c]">{errors.caption}</p>}
        </div>
        <div className="grid gap-3 min-[481px]:grid-cols-2">
          <div className="grid gap-1">
            <label htmlFor={`${id}-date`} className={label}>
              Date
            </label>
            <input id={`${id}-date`} type="date" min={today} value={draft.date} onChange={(event) => set("date", event.target.value)} className={input} aria-invalid={errors.date ? true : undefined} />
            {errors.date && <p className="text-[11px] font-semibold text-[#9b2c2c]">{errors.date}</p>}
          </div>
          <div className="grid gap-1">
            <label htmlFor={`${id}-time`} className={label}>
              Time (PST)
            </label>
            <input id={`${id}-time`} type="time" value={draft.time} onChange={(event) => set("time", event.target.value)} className={input} aria-invalid={errors.time ? true : undefined} />
            {errors.time && <p className="text-[11px] font-semibold text-[#9b2c2c]">{errors.time}</p>}
          </div>
          <div className="grid gap-1">
            <label htmlFor={`${id}-channel`} className={label}>
              Channel
            </label>
            <select id={`${id}-channel`} value={draft.channel} onChange={(event) => set("channel", event.target.value as Channel)} className={input}>
              {CHANNELS.map((channel) => (
                <option key={channel}>{channel}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label htmlFor={`${id}-format`} className={label}>
              Post type
            </label>
            <select id={`${id}-format`} value={draft.format} onChange={(event) => set("format", event.target.value as ScheduledPost["format"])} className={input}>
              {FORMATS.map((format) => (
                <option key={format}>{format}</option>
              ))}
            </select>
            {draft.format !== suggested && (
              <button type="button" onClick={() => set("format", suggested)} className="w-max text-[11px] font-semibold text-brand-teal underline-offset-2 hover:underline">
                Suggested for {draft.channel}: {suggested}
              </button>
            )}
          </div>
        </div>
        <div className="mt-1 flex flex-wrap justify-end gap-2">
          {onRemove && (
            <button type="button" onClick={onRemove} className="mr-auto text-[12px] font-semibold text-[#9b2c2c] hover:underline">
              Remove post
            </button>
          )}
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass}>
            Save post
          </button>
        </div>
      </form>
    </div>
  );
}
