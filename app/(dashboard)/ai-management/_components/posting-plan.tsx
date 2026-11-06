"use client";

import Link from "next/link";
import { useState } from "react";
import { LineIcon } from "@/components/line-icons";
import {
  CHANNELS,
  MIX,
  SUGGESTED_FORMAT,
  WEEKDAYS,
  findBusiness,
  upcomingPosts,
  windowLabel,
  type BusinessId,
  type Channel,
  type Recommendations,
  type ScheduledPost,
} from "@/lib/hub/posting-plan";
import { ChannelBadge, ChannelFilter, ContentCalendar, PostEditor, PostRow, cardClass, headingClass, pillClass, primaryButtonClass } from "./plan-ui";
import { useSchedule } from "./use-schedules";

// AI Management's first screen from the team's design file ("AI Posting Plan"): recommendations,
// the content calendar, upcoming posts, and Auto Publishing, for one business at a time.

const MIX_DOTS = ["bg-brand-teal", "bg-brand-navy", "bg-brand-lime-bright", "bg-[#5a9c88]"];

export function PostingPlan({ businessId, today, rec }: { businessId: BusinessId; today: string; rec: Recommendations }) {
  const business = findBusiness(businessId);
  const { schedule, update } = useSchedule(business, today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [channel, setChannel] = useState<Channel | "All">("All");
  const [editing, setEditing] = useState<{ post: ScheduledPost; isNew: boolean } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [notice, setNotice] = useState("");

  const visible = schedule.posts.filter((post) => channel === "All" || post.channel === channel);
  const upcoming = upcomingPosts(schedule.posts, today, showAll ? 200 : 5);

  const save = (post: ScheduledPost, message: string) => {
    const ok = update((current) => ({ ...current, posts: [...current.posts.filter((item) => item.id !== post.id), post] }));
    setNotice(ok ? message : `${message} This browser blocks saving, so it will be gone after a reload.`);
    setEditing(null);
  };

  const newPost = (): ScheduledPost => ({
    id: `${business.id}-manual-${Date.now()}`,
    date: today,
    time: `${String(rec.windows[1].start).padStart(2, "0")}:00`,
    channel: "Instagram",
    format: SUGGESTED_FORMAT.Instagram,
    title: "",
    caption: "",
    hashtags: [],
    category: "Educational",
    image: "/content/bottles.jpg",
  });

  return (
    <>
      <div className="mb-6 flex flex-col items-start gap-5 text-brand-cream min-[621px]:flex-row min-[621px]:items-end min-[621px]:justify-between">
        <div>
          <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.035em]">AI Posting Plan</h1>
          <p className="mt-1 text-[14px] text-brand-cream/90">Get AI-powered recommendations for posting frequency, dates and times based on your audience.</p>
        </div>
        <Link href={`/ai-management/plan?business=${business.id}`} className={`${primaryButtonClass} shrink-0`}>
          Generate New Plan
        </Link>
      </div>

      <nav aria-label="Business" className="mb-4 flex w-fit flex-wrap gap-1 rounded-[22px] border border-brand-cream/32 bg-brand-cream/16 p-1 backdrop-blur-[16px]">
        {(["hotel-depot", "hospitality-emporium"] as const).map((id) => (
          <Link
            key={id}
            href={`/ai-management?business=${id}`}
            aria-current={id === business.id ? "page" : undefined}
            className={`rounded-[18px] px-4 py-2 text-[12px] font-bold ${id === business.id ? "bg-brand-teal text-brand-cream" : "text-brand-cream/85 hover:text-brand-cream"}`}
          >
            {findBusiness(id).name}
          </Link>
        ))}
      </nav>

      <ul aria-label="Recommendations" className="mb-4 grid grid-cols-[minmax(0,1fr)] gap-3.5 min-[621px]:grid-cols-2 min-[1201px]:grid-cols-4">
        <li className={cardClass}>
          <p className="flex items-center gap-2 text-[13px] text-brand-teal">
            <LineIcon name="calendar" size={20} /> Recommended frequency
          </p>
          <strong className="mt-4 block text-[19px] font-bold text-brand-teal">
            {rec.postsPerWeek[0]}–{rec.postsPerWeek[1]} posts per week
          </strong>
          <p className="mt-3 text-[12px] text-[#4f5d5f]">Based on your audience activity</p>
        </li>
        <li className={cardClass}>
          <p className="flex items-center gap-2 text-[13px] text-brand-teal">
            <LineIcon name="overview" size={20} /> Best days to post
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {rec.bestDays.map((day) => (
              <li key={day} className="rounded-[14px] bg-brand-lime-bright px-3 py-1 text-[12px] font-semibold text-brand-teal">
                {WEEKDAYS[day]}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-[#4f5d5f]">Highest engagement rate</p>
        </li>
        <li className={cardClass}>
          <p className="flex items-center gap-2 text-[13px] text-brand-teal">
            <LineIcon name="activity" size={20} /> Best time to post (PST)
          </p>
          <strong className="mt-3 block text-[16px] leading-snug font-bold text-brand-teal">
            {windowLabel(rec.windows[0])}
            <span className="block font-semibold">and {windowLabel(rec.windows[1])}</span>
          </strong>
          <p className="mt-2 text-[12px] text-[#4f5d5f]">Based on audience online activity</p>
        </li>
        <li className={cardClass}>
          <p className="flex items-center gap-2 text-[13px] text-brand-teal">
            <LineIcon name="target" size={20} /> Recommended content mix
          </p>
          <dl className="mt-3 grid gap-1">
            {MIX.map((category, index) => (
              <div key={category} className="flex items-center gap-2 text-[12px] text-[#3f4b4d]">
                <i aria-hidden="true" className={`size-2 rounded-full ${MIX_DOTS[index]}`} />
                <dt className="flex-1">{category}</dt>
                <dd className="font-semibold">{rec.mix[category]}%</dd>
              </div>
            ))}
          </dl>
        </li>
      </ul>
      <p className="mb-4 text-[11px] text-brand-cream/85">Recommendations come from sample audience activity for {business.name}.</p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5 min-[1101px]:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="calendar-title" className={cardClass}>
          <h2 id="calendar-title" className={headingClass}>
            Content Calendar
          </h2>
          <p className="mt-1 mb-4 text-[13px] text-[#3f4b4d]">View and organize all your social media content in one place. All times are Pacific Time (PST).</p>
          <div className="mb-4">
            <ChannelFilter posts={schedule.posts} value={channel} onChange={setChannel}>
              <button type="button" onClick={() => setEditing({ post: newPost(), isNew: true })} className={pillClass(false)}>
                + New post
              </button>
            </ChannelFilter>
          </div>
          <ContentCalendar posts={visible} month={month} onMonth={setMonth} today={today} onOpen={(post) => setEditing({ post, isNew: false })} />
          <p role="status" className="mt-2 min-h-[18px] text-[12px] text-brand-teal">
            {notice}
          </p>
        </section>

        <div className="grid content-start gap-3.5">
          <section aria-labelledby="upcoming-title" className={cardClass}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="upcoming-title" className={headingClass}>
                Upcoming Posts
              </h2>
              <button type="button" onClick={() => setShowAll((value) => !value)} className="text-[12px] font-semibold text-brand-teal hover:underline">
                {showAll ? "Show fewer" : "View All"}
              </button>
            </div>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-[12px] text-[#4f5d5f]">Nothing scheduled yet. Generate a plan or add a post.</p>
            ) : (
              <ul className={`mt-3 grid gap-3 ${showAll ? "max-h-[420px] overflow-y-auto pr-1" : ""}`}>
                {upcoming.map((post) => (
                  <li key={post.id} className="border-b border-brand-teal/10 pb-3 last:border-b-0">
                    <PostRow post={post}>
                      <button type="button" aria-label={`Edit ${post.title}`} onClick={() => setEditing({ post, isNew: false })} className="grid size-8 place-items-center rounded-full text-brand-teal hover:bg-brand-teal/10">
                        <LineIcon name="edit" size={15} />
                      </button>
                    </PostRow>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="auto-title" className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 id="auto-title" className={headingClass}>
                Auto Publishing
              </h2>
              <button
                type="button"
                role="switch"
                aria-checked={schedule.autoPublish}
                aria-labelledby="auto-title"
                onClick={() => {
                  const turnOn = !schedule.autoPublish;
                  update((current) => ({ ...current, autoPublish: turnOn }));
                  setNotice(turnOn ? "Auto Publishing is on (simulated): nothing will be posted." : "Auto Publishing is off.");
                }}
                className={`relative h-6 w-11 rounded-full transition-colors ${schedule.autoPublish ? "bg-brand-lime-bright" : "bg-[#c9d3cf]"}`}
              >
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] ${schedule.autoPublish ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            <p className="mt-2 text-[12px] text-[#3f4b4d]">Automatically publish your scheduled posts across connected accounts.</p>
            <p className="mt-2 rounded-[8px] bg-brand-lime/40 px-2.5 py-1.5 text-[11px] font-semibold text-[#4f5d1f]">
              Simulated: nothing is posted, because no real accounts are connected. Posts stay Scheduled.
            </p>
            <ul aria-label="Connected accounts" className="mt-3 grid gap-2">
              {CHANNELS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-[12px] text-brand-navy">
                  <ChannelBadge channel={item} />
                  <span className="flex-1">
                    {item === "LinkedIn" || item === "YouTube" ? business.name : business.handle}
                    <span className="sr-only"> on {item}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-brand-teal">
                    <i aria-hidden="true" className="size-1.5 rounded-full bg-brand-teal" /> Connected (sample)
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/settings" className="mt-3 flex min-h-9 items-center justify-center gap-2 rounded-[18px] border border-brand-teal/15 bg-white/80 text-[12px] font-semibold text-brand-teal hover:border-brand-teal">
              <LineIcon name="settings" size={15} /> Manage Accounts
            </Link>
          </section>
        </div>
      </div>

      {editing && (
        <PostEditor
          post={editing.post}
          today={today}
          title={editing.isNew ? `New post for ${business.name}` : "Edit post"}
          onClose={() => setEditing(null)}
          onSave={(post) => save(post, editing.isNew ? "Post added to the calendar." : "Post updated.")}
          onRemove={
            editing.isNew
              ? undefined
              : () => {
                  update((current) => ({ ...current, posts: current.posts.filter((item) => item.id !== editing.post.id) }));
                  setNotice("Post removed.");
                  setEditing(null);
                }
          }
        />
      )}
    </>
  );
}
