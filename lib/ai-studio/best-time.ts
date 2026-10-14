import type { Platform } from "@/lib/analytics/types";
import { sampleEngagementByHour } from "./sample-timing";
import type { TimeSlot } from "./types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The best weekday-and-hour slots for a platform, best first, each on a different day. */
export function bestTimes(platform: Platform, count = 3): TimeSlot[] {
  const sorted = [...sampleEngagementByHour(platform)].sort((a, b) => b.rate - a.rate);
  const picked: TimeSlot[] = [];
  for (const slot of sorted) {
    if (!picked.some((p) => p.weekday === slot.weekday)) {
      picked.push(slot);
    }
    if (picked.length === count) {
      break;
    }
  }
  return picked;
}

/** "Tue 7 PM". */
export function formatSlot({ weekday, hour }: Pick<TimeSlot, "weekday" | "hour">): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${DAYS[weekday]} ${twelveHour} ${suffix}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * The next upcoming occurrence of one of the platform's best slots, as a
 * local date (YYYY-MM-DD) and time (HH:00). Never in the past.
 */
export function nextBestTime(platform: Platform, now: Date): { date: string; time: string } {
  const top = bestTimes(platform);
  for (let offset = 0; offset <= 7; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const slots = top
      .filter((slot) => slot.weekday === day.getDay())
      .sort((a, b) => a.hour - b.hour);
    for (const slot of slots) {
      const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.hour);
      if (when.getTime() > now.getTime()) {
        return {
          date: `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`,
          time: `${pad(slot.hour)}:00`,
        };
      }
    }
  }
  // Unreachable: a weekly slot always occurs within 7 days.
  throw new Error("No upcoming time slot found");
}

/** "19:00" -> "7:00 PM". */
export function formatTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour < 12 ? "AM" : "PM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour}:${pad(minute)} ${suffix}`;
}
