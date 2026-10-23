"use client";

import { useId, useState, type FormEvent } from "react";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/analytics/types";
import { bestTimes, formatSlot, nextBestTime } from "@/lib/ai-studio/best-time";
import type { ContentIdea, PlannedPost } from "@/lib/ai-studio/types";
import { buttonClass, fieldClass, labelClass, secondaryButtonClass } from "./styles";

type ScheduleFormProps = {
  idea: ContentIdea;
  caption: string;
  hashtags: readonly string[];
  /** Earliest date that can be picked (YYYY-MM-DD). */
  today: string;
  onAdd: (post: PlannedPost) => void;
  onBack: () => void;
};

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Step 3: pick platform, date, and time (prefilled with the next best time) and add the post to the calendar. */
export function ScheduleForm({ idea, caption, hashtags, today, onAdd, onBack }: ScheduleFormProps) {
  const id = useId();
  const [platform, setPlatform] = useState<Platform>(idea.platforms[0] ?? "instagram");
  // This step only appears after the user chooses an idea, so reading the clock here is client-only.
  const [when, setWhen] = useState(() => nextBestTime(platform, new Date()));
  const [error, setError] = useState("");

  function changePlatform(next: Platform) {
    setPlatform(next);
    setWhen(nextBestTime(next, new Date()));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (when.date === "" || when.time === "") {
      setError("Pick a date and time.");
      return;
    }
    if (when.date < today) {
      setError("Pick today or a later date.");
      return;
    }
    setError("");
    onAdd({ id: newId(), date: when.date, time: when.time, platform, caption, hashtags: [...hashtags], ideaTitle: idea.title });
  }

  return (
    // noValidate: our own check shows a clear message instead of the browser's popup.
    <form onSubmit={submit} noValidate>
      <h3 className="font-medium text-ink">{idea.title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{caption}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className={labelClass} htmlFor={`${id}-platform`}>
          Platform
          <select id={`${id}-platform`} className={fieldClass} value={platform} onChange={(e) => changePlatform(e.target.value as Platform)}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
            ))}
          </select>
        </label>
        <label className={labelClass} htmlFor={`${id}-date`}>
          Date
          <input id={`${id}-date`} type="date" className={fieldClass} min={today} required value={when.date} onChange={(e) => setWhen({ ...when, date: e.target.value })} />
        </label>
        <label className={labelClass} htmlFor={`${id}-time`}>
          Time
          <input id={`${id}-time`} type="time" className={fieldClass} required value={when.time} onChange={(e) => setWhen({ ...when, time: e.target.value })} />
        </label>
      </div>

      <div className="mt-3 text-sm text-ink-muted">
        <p>{`Best times for ${PLATFORM_LABELS[platform]} (sample data):`}</p>
        <ul className="mt-1 flex flex-wrap gap-2">
          {bestTimes(platform).map((slot) => (
            <li key={`${slot.weekday}-${slot.hour}`} className="rounded bg-selected px-2 py-0.5">{formatSlot(slot)}</li>
          ))}
        </ul>
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}

      <div className="mt-4 flex gap-3">
        <button type="button" className={secondaryButtonClass} onClick={onBack}>Back to captions</button>
        <button type="submit" className={buttonClass}>Add to calendar</button>
      </div>
    </form>
  );
}
