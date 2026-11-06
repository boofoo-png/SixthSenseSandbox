"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { LineIcon } from "@/components/line-icons";
import { dayLabel, findBusiness, timeLabel, upcomingPosts } from "@/lib/hub/posting-plan";
import { useSchedule } from "../ai-management/_components/use-schedules";
import { SenseDrawer } from "./sidebar";

// The Overview's Planning card (functionality list): the next planned activity on the AI
// Management calendar, with Ask More opening Sense AI, for the business chosen in the top bar.

export function PlanningContent({ today, linkClass, bodyClass, businessId, businessName }: { today: string; linkClass: string; bodyClass: string; businessId: string; businessName: string }) {
  const business = findBusiness(businessId, businessName);
  const { schedule } = useSchedule(business, today);
  const [senseOpen, setSenseOpen] = useState(false);
  const closeSense = useCallback(() => setSenseOpen(false), []);
  const next = upcomingPosts(schedule.posts, today, 1)[0];

  return (
    <>
      {next ? (
        <>
          <div className="mt-8 flex items-center gap-3.5">
            <span className="text-brand-blue">
              <LineIcon name="calendar" size={29} />
            </span>
            <strong className="text-[28px] font-normal text-brand-navy">
              <time dateTime={next.date}>{dayLabel(next.date).split(", ")[1]}</time>
            </strong>
          </div>
          <p className="mt-2 text-[13px] font-semibold text-brand-navy">{next.title}</p>
          <p className={bodyClass}>
            {timeLabel(next.time)} PST · {next.channel} · {business.name}
          </p>
        </>
      ) : (
        <p className={`${bodyClass} mt-8`}>Nothing planned yet. Generate a posting plan to fill your calendar.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/ai-management" className={linkClass}>
          Open calendar <LineIcon name="chevron" size={14} />
        </Link>
        <button type="button" aria-haspopup="dialog" onClick={() => setSenseOpen(true)} className={linkClass}>
          Ask More <LineIcon name="sparkles" size={14} />
        </button>
      </div>
      {senseOpen && <SenseDrawer onClose={closeSense} />}
    </>
  );
}
