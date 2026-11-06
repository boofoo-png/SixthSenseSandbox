"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { LineIcon } from "@/components/line-icons";
import {
  CHANNELS,
  DEFAULT_WINDOWS,
  FORMATS,
  GOALS,
  MIX,
  TIME_ZONE,
  WEEKDAYS,
  checkSettings,
  dayLabel,
  defaultSettings,
  findBusiness,
  generateDrafts,
  planPreview,
  recommendationsFor,
  regenerateDraft,
  timeLabel,
  windowLabel,
  type BusinessId,
  type Channel,
  type PlanSettings,
  type PostFormat,
  type ScheduledPost,
  type SettingsErrors,
} from "@/lib/hub/posting-plan";
import { formatShortDate } from "@/lib/analytics/dates";
import { useSavedContent } from "../../content/_components/use-saved-content";
import { ChannelBadge, ChannelFilter, ContentCalendar, PostEditor, PostRow, cardClass, headingClass, pillClass, primaryButtonClass, secondaryButtonClass } from "./plan-ui";
import { useSchedule } from "./use-schedules";

// "Generate a new plan" from the team's design file: 1. Plan settings, 2. Review suggestions,
// 3. Add to calendar. Drafts are templates; the calendar changes only when drafts are added.

const STEPS = ["Plan settings", "Review suggestions", "Add to calendar"] as const;
const MEDIA_ACCEPT = ".jpg,.jpeg,.png,.webp,.mp4,.mov";
const label = "text-[12px] font-semibold text-[#3f4b4d]";
const input = "w-full rounded-[10px] border border-brand-teal/18 bg-white px-3.5 py-2.5 text-[13px] text-brand-navy outline-none focus:border-brand-teal";
const error = "mt-1 text-[11px] font-semibold text-[#9b2c2c]";
const FORMAT_PLURAL: Record<PostFormat, string> = { Image: "Images", Video: "Videos", Carousel: "Carousels", "Text only": "Text posts", Link: "Links" };

function Stepper({ step }: { step: number }) {
  return (
    <ol aria-label="Plan creation steps" className="mb-5 grid gap-2 rounded-[24px] border border-brand-cream/32 bg-brand-cream/16 px-3 py-2 backdrop-blur-[16px] min-[621px]:grid-cols-3">
      {STEPS.map((name, index) => {
        const done = index < step;
        const current = index === step;
        return (
          <li key={name} aria-current={current ? "step" : undefined} className="flex items-center gap-2.5 text-[13px] text-brand-cream">
            <span className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${current ? "bg-brand-lime-bright text-brand-navy" : done ? "bg-brand-teal text-brand-cream" : "bg-brand-cream/30 text-brand-cream"}`}>
              {done ? "✓" : index + 1}
            </span>
            <span className={current ? "font-bold" : ""}>{name}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function PlanWizard({ businessId, businessName, today }: { businessId: BusinessId; businessName: string; today: string }) {
  const business = findBusiness(businessId, businessName);
  const rec = recommendationsFor(business);
  const { schedule, update } = useSchedule(business, today);
  const { items: savedContent } = useSavedContent();
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<PlanSettings>(() => defaultSettings(business, today));
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [media, setMedia] = useState<{ name: string; error?: string } | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [drafts, setDrafts] = useState<ScheduledPost[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<PostFormat | "All">("All");
  const [round, setRound] = useState(0);
  const [editing, setEditing] = useState<ScheduledPost | null>(null);
  const [added, setAdded] = useState<ScheduledPost[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(today.slice(0, 7));
  const [channelFilter, setChannelFilter] = useState<Channel | "All">("All");
  const [newPost, setNewPost] = useState<ScheduledPost | null>(null);
  const id = useId();

  const preview = planPreview(business, settings);
  const set = <K extends keyof PlanSettings>(key: K, value: PlanSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };
  const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const windows = settings.useInsights ? rec.windows : DEFAULT_WINDOWS;

  function generate() {
    const found = checkSettings(settings, today);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(`${id}-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    const next = generateDrafts(business, settings, round);
    setDrafts(next);
    setSelected(new Set(next.map((draft) => draft.id)));
    setPreviewId(next[0]?.id ?? null);
    setFormatFilter("All");
    setStep(1);
    window.scrollTo?.({ top: 0 });
  }

  function addToCalendar() {
    const chosen = drafts.filter((draft) => selected.has(draft.id)).map((draft) => ({ ...draft, id: draft.id.replace(/^draft-/, "plan-") }));
    update((current) => ({ ...current, posts: [...current.posts, ...chosen] }));
    setAdded(chosen);
    setCalendarMonth((chosen[0]?.date ?? today).slice(0, 7));
    setStep(2);
    window.scrollTo?.({ top: 0 });
  }

  // ----- Step 3: Add to calendar -----
  if (step === 2) {
    const addedIds = new Set(added.map((post) => post.id));
    const channels = new Set(added.map((post) => post.channel)).size;
    const shown = schedule.posts.filter((post) => channelFilter === "All" || post.channel === channelFilter);
    return (
      <>
        <button type="button" onClick={() => setStep(1)} className="mb-2 text-[13px] text-brand-cream hover:underline">
          ← Review suggestions
        </button>
        <h1 className="text-[clamp(27px,3vw,38px)] font-medium text-brand-cream">Add to calendar</h1>
        <p className="mt-1 mb-5 text-[14px] text-brand-cream/90">Your approved posts are now in the calendar. This plan is complete.</p>
        <Stepper step={2} />
        <section role="status" className={`${cardClass} mb-4 flex gap-3`}>
          <LineIcon name="sparkles" size={22} className="text-brand-teal" />
          <div>
            <h2 className="text-[20px] font-bold text-brand-teal">
              {added.length} {added.length === 1 ? "post" : "posts"} added to your calendar
            </h2>
            <p className="mt-1 text-[13px] text-brand-teal">
              All {added.length} are scheduled across {channels} {channels === 1 ? "channel" : "channels"} for {business.name}. Auto Publishing is {schedule.autoPublish ? "on (simulated: nothing is posted)" : "off"}.
              <br />
              You can edit their content or timing directly from the calendar.
            </p>
          </div>
        </section>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5 min-[1101px]:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-labelledby={`${id}-calendar`} className={cardClass}>
            <h2 id={`${id}-calendar`} className={headingClass}>
              Content Calendar
            </h2>
            <p className="mt-1 mb-4 text-[13px] text-[#3f4b4d]">{added.length} newly scheduled posts · All times are Pacific Time (PST)</p>
            <div className="mb-4">
              <ChannelFilter posts={added} value={channelFilter} onChange={setChannelFilter}>
                <button
                  type="button"
                  onClick={() =>
                    setNewPost({ ...added[0], id: `${business.id}-manual-${Date.now()}`, title: "", caption: "", date: added[0]?.date ?? today })
                  }
                  className={pillClass(false)}
                >
                  + New post
                </button>
              </ChannelFilter>
            </div>
            <ContentCalendar posts={shown} month={calendarMonth} onMonth={setCalendarMonth} today={today} highlight={addedIds} onOpen={setEditing} />
            <p className="mt-3 flex items-center gap-2 text-[12px] text-[#3f4b4d]">
              <i aria-hidden="true" className="size-2 rounded-full bg-brand-lime-bright" /> Newly scheduled
            </p>
          </section>
          <section aria-labelledby={`${id}-scheduled`} className={cardClass}>
            <div className="flex items-center justify-between gap-2">
              <h2 id={`${id}-scheduled`} className={headingClass}>
                Scheduled posts
              </h2>
              <span className="rounded-[14px] bg-brand-lime-bright px-2.5 py-1 text-[11px] font-semibold text-brand-teal">{added.length} scheduled</span>
            </div>
            <p className="mt-1 mb-3 text-[13px] text-[#3f4b4d]">Your approved posts, ready to publish.</p>
            <ul className="grid max-h-[560px] gap-2 overflow-y-auto pr-1">
              {added.map((post) => (
                <li key={post.id}>
                  <button type="button" onClick={() => setEditing(schedule.posts.find((item) => item.id === post.id) ?? post)} className="w-full rounded-[12px] bg-white/70 p-2.5 text-left hover:ring-2 hover:ring-brand-teal/30">
                    <PostRow post={schedule.posts.find((item) => item.id === post.id) ?? post} />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] font-semibold text-brand-teal">{added.length} scheduled · 0 published</p>
            <p className="text-[12px] text-brand-teal">Auto Publishing: {schedule.autoPublish ? "On (simulated)" : "Off"}</p>
          </section>
        </div>
        <div className="mt-5 flex flex-col gap-3 text-brand-cream min-[621px]:flex-row min-[621px]:items-center min-[621px]:justify-between">
          <p className="text-[13px]">
            {added.length} posts scheduled · 0 published · You can still edit every post.
            <br />
            <small className="text-brand-cream/80">Nothing is actually posted in the prototype.</small>
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setSettings(defaultSettings(business, today));
                setDrafts([]);
                setAdded([]);
                setStep(0);
              }}
              className={secondaryButtonClass}
            >
              Create another plan
            </button>
            <Link href="/ai-management" className={primaryButtonClass}>
              Go to Content Calendar →
            </Link>
          </div>
        </div>
        {(editing || newPost) && (
          <PostEditor
            post={(editing ?? newPost) as ScheduledPost}
            today={today}
            title={newPost ? `New post for ${business.name}` : "Edit post"}
            onClose={() => {
              setEditing(null);
              setNewPost(null);
            }}
            onSave={(post) => {
              update((current) => ({ ...current, posts: [...current.posts.filter((item) => item.id !== post.id), post] }));
              if (newPost) setAdded((current) => [...current, post]);
              setEditing(null);
              setNewPost(null);
            }}
            onRemove={
              editing
                ? () => {
                    update((current) => ({ ...current, posts: current.posts.filter((item) => item.id !== editing.id) }));
                    setAdded((current) => current.filter((item) => item.id !== editing.id));
                    setEditing(null);
                  }
                : undefined
            }
          />
        )}
      </>
    );
  }

  // ----- Step 2: Review suggestions -----
  if (step === 1) {
    const filtered = drafts.filter((draft) => formatFilter === "All" || draft.format === formatFilter);
    const previewPost = drafts.find((draft) => draft.id === previewId) ?? drafts[0];
    const count = selected.size;
    const allSelected = count === drafts.length && drafts.length > 0;
    return (
      <>
        <button type="button" onClick={() => setStep(0)} className="mb-2 text-[13px] text-brand-cream hover:underline">
          ← Edit plan settings
        </button>
        <h1 className="text-[clamp(27px,3vw,38px)] font-medium text-brand-cream">Review your suggestions</h1>
        <p className="mt-1 mb-5 text-[14px] text-brand-cream/90">
          AI turned your brief into {drafts.length} platform-ready drafts. Review the copy, media and timing before adding them.
        </p>
        <Stepper step={1} />
        <dl className="mb-4 grid gap-3.5 min-[621px]:grid-cols-2 min-[1101px]:grid-cols-4">
          {[
            [String(drafts.length), "Draft suggestions"],
            [String(settings.channels.length), "Connected channels"],
            [`${formatShortDate(settings.start)} – ${formatShortDate(settings.end)}`, `${settings.start.slice(0, 4)} · ${TIME_ZONE}`],
            [`${count} selected`, "Ready to add · 0 scheduled"],
          ].map(([value, caption]) => (
            <div key={caption} className={cardClass}>
              <dd className="text-[26px] text-brand-teal">{value}</dd>
              <dt className="mt-1 text-[12px] text-brand-teal">{caption}</dt>
            </div>
          ))}
        </dl>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5 min-[1101px]:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-labelledby={`${id}-suggested`} className={cardClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id={`${id}-suggested`} className={headingClass}>
                  Suggested posts
                </h2>
                <p className="mt-1 text-[13px] text-[#3f4b4d]">{count} drafts selected · Click a post to review its content.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = generateDrafts(business, settings, round + 1);
                  setRound((value) => value + 1);
                  setDrafts(next);
                  setSelected(new Set(next.map((draft) => draft.id)));
                  setPreviewId(next[0]?.id ?? null);
                }}
                className={pillClass(false)}
              >
                Regenerate all
              </button>
            </div>
            <div role="group" aria-label="Filter by format" className="my-4 flex flex-wrap gap-2">
              <button type="button" aria-pressed={formatFilter === "All"} onClick={() => setFormatFilter("All")} className={pillClass(formatFilter === "All")}>
                All ({drafts.length})
              </button>
              {FORMATS.filter((format) => drafts.some((draft) => draft.format === format)).map((format) => (
                <button key={format} type="button" aria-pressed={formatFilter === format} onClick={() => setFormatFilter(format)} className={pillClass(formatFilter === format)}>
                  {FORMAT_PLURAL[format]} ({drafts.filter((draft) => draft.format === format).length})
                </button>
              ))}
            </div>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left">
                <caption className="sr-only">Suggested posts</caption>
                <thead>
                  <tr className="text-[12px] text-brand-teal">
                    <th scope="col" className="w-8 py-2">
                      <input
                        type="checkbox"
                        aria-label="Select all drafts"
                        checked={allSelected}
                        onChange={() => setSelected(allSelected ? new Set() : new Set(drafts.map((draft) => draft.id)))}
                        className="size-4 accent-[#03525e]"
                      />
                    </th>
                    <th scope="col" className="py-2 font-semibold">Date / time</th>
                    <th scope="col" className="py-2 font-semibold">Channel</th>
                    <th scope="col" className="py-2 font-semibold">Content</th>
                    <th scope="col" className="py-2 font-semibold">Format</th>
                    <th scope="col" className="py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((draft) => (
                    <tr key={draft.id} className={`border-t border-brand-teal/10 ${draft.id === previewPost?.id ? "bg-[#dfe9e2]/70" : ""}`}>
                      <td className="py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${draft.title}`}
                          checked={selected.has(draft.id)}
                          onChange={() => setSelected((current) => new Set(toggle([...current], draft.id)))}
                          className="size-4 accent-[#03525e]"
                        />
                      </td>
                      <td className="py-3 text-[12px] text-brand-navy">
                        {dayLabel(draft.date)}
                        <span className="block text-[11px] text-[#5f6b6d]">{timeLabel(draft.time)} PST</span>
                      </td>
                      <td className="py-3 text-[12px] text-brand-navy">
                        <span className="flex items-center gap-1.5">
                          <ChannelBadge channel={draft.channel} /> {draft.channel}
                        </span>
                      </td>
                      <td className="py-3">
                        <button type="button" onClick={() => setPreviewId(draft.id)} className="flex items-center gap-2.5 text-left text-[13px] text-brand-navy hover:underline">
                          <span className="relative size-11 shrink-0 overflow-hidden rounded-[6px]">
                            <Image src={draft.image} alt="" fill sizes="44px" className="object-cover" />
                          </span>
                          {draft.title}
                        </button>
                      </td>
                      <td className="py-3">
                        <span className="rounded-[12px] bg-white px-2.5 py-1 text-[11px] text-brand-teal">{draft.format}</span>
                      </td>
                      <td className="py-3">
                        <button type="button" aria-label={`Edit ${draft.title}`} onClick={() => setEditing(draft)} className="grid size-8 place-items-center rounded-full text-brand-teal hover:bg-brand-teal/10">
                          <LineIcon name="edit" size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] text-brand-teal">
              {count} of {drafts.length} suggestions selected
            </p>
          </section>

          <div className="grid content-start gap-3.5">
            {previewPost && (
              <section aria-labelledby={`${id}-preview`} className={cardClass}>
                <div className="flex items-center justify-between gap-2">
                  <h2 id={`${id}-preview`} className={headingClass}>
                    Post preview
                  </h2>
                  <span className="rounded-[14px] bg-brand-lime-bright px-2.5 py-1 text-[11px] font-semibold text-brand-teal">AI draft</span>
                </div>
                <p className="mt-1 text-[12px] text-brand-teal">
                  {previewPost.format} · {previewPost.category}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-brand-navy">
                  <ChannelBadge channel={previewPost.channel} /> {business.handle} · {previewPost.channel}
                </p>
                <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-[12px]">
                  <Image src={previewPost.image} alt="Suggested photo for this post" fill sizes="380px" className="object-cover" />
                </div>
                <h3 className="mt-3 text-[16px] font-bold text-brand-teal">{previewPost.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#3f4b4d]">{previewPost.caption}</p>
                <p className="mt-2 text-[12px] text-brand-teal">{previewPost.hashtags.join(" ")}</p>
                <p className="mt-3 rounded-[10px] bg-[#dfe9e2] px-3 py-2 text-[12px] text-brand-navy">
                  {dayLabel(previewPost.date)}, {previewPost.date.slice(0, 4)} · {timeLabel(previewPost.time)} PST
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setEditing(previewPost)} className={pillClass(false)}>
                    Edit post
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrafts((current) => current.map((draft) => (draft.id === previewPost.id ? regenerateDraft(draft, settings.direction, round) : draft)))}
                    className={pillClass(false)}
                  >
                    Regenerate
                  </button>
                </div>
              </section>
            )}
            <section aria-labelledby={`${id}-ready`} className={cardClass}>
              <h2 id={`${id}-ready`} className={headingClass}>
                Ready when you are
              </h2>
              <p className="mt-3 text-[14px] text-brand-teal">✓ {count} drafts selected</p>
              <p className="mt-2 text-[14px] text-brand-teal">✓ {settings.channels.length} connected channels</p>
              <p className="mt-3 text-[13px] text-brand-teal">Nothing has been scheduled yet.</p>
              <p className="mt-2 text-[12px] text-[#3f4b4d]">Review and approve these drafts before adding them to your calendar.</p>
            </section>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 text-brand-cream min-[621px]:flex-row min-[621px]:items-center min-[621px]:justify-between">
          <p className="text-[13px]">Nothing is scheduled yet. Add the selected drafts when you&apos;re ready.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(0)} className={secondaryButtonClass}>
              ← Back to settings
            </button>
            <button type="button" disabled={count === 0} onClick={addToCalendar} className={primaryButtonClass}>
              Add {count} {count === 1 ? "post" : "posts"} to calendar →
            </button>
          </div>
        </div>
        {editing && (
          <PostEditor
            post={editing}
            today={today}
            title="Edit draft"
            onClose={() => setEditing(null)}
            onSave={(post) => {
              setDrafts((current) => current.map((draft) => (draft.id === post.id ? post : draft)));
              setEditing(null);
            }}
            onRemove={() => {
              setDrafts((current) => current.filter((draft) => draft.id !== editing.id));
              setSelected((current) => new Set([...current].filter((item) => item !== editing.id)));
              setEditing(null);
            }}
          />
        )}
      </>
    );
  }

  // ----- Step 1: Plan settings -----
  const errorCount = Object.values(errors).filter(Boolean).length;
  return (
    <>
      <Link href="/ai-management" className="mb-2 inline-block text-[13px] text-brand-cream hover:underline">
        ← Content Calendar
      </Link>
      <h1 className="text-[clamp(27px,3vw,38px)] font-medium text-brand-cream">Generate a new plan</h1>
      <p className="mt-1 mb-5 text-[14px] text-brand-cream/90">
        Tell AI what to create and when to publish for {business.name}. Review every suggestion before it reaches your calendar.
      </p>
      <Stepper step={0} />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          generate();
        }}
      >
        <section aria-labelledby={`${id}-content`} className={`${cardClass} mb-3.5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id={`${id}-content`} className={headingClass}>
                Content to include
              </h2>
              <p className="mt-1 text-[13px] text-[#3f4b4d]">Add the media and message you want to turn into scheduled posts.</p>
            </div>
            <button type="button" aria-expanded={showLibrary} onClick={() => setShowLibrary((value) => !value)} className={pillClass(false)}>
              Media library
            </button>
          </div>
          <div role="group" aria-label="Content type" className="my-4 flex flex-wrap gap-2">
            {FORMATS.map((format) => (
              <button key={format} type="button" aria-pressed={settings.contentType === format} onClick={() => set("contentType", format)} className={pillClass(settings.contentType === format)}>
                {format}
              </button>
            ))}
          </div>
          {showLibrary && (
            <div className="mb-4 rounded-[12px] border border-brand-teal/15 bg-white/70 p-3">
              <p className="mb-2 text-[12px] font-semibold text-brand-teal">Your saved content (from Content Creation)</p>
              {savedContent.length === 0 ? (
                <p className="text-[12px] text-[#3f4b4d]">Nothing saved yet. Save a result in Content Creation to use it here.</p>
              ) : (
                <ul className="grid gap-1.5">
                  {savedContent.slice(0, 8).map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          set("brief", item.text.slice(0, 1000));
                          setShowLibrary(false);
                        }}
                        className="w-full truncate rounded-[8px] px-2 py-1.5 text-left text-[12px] text-brand-navy hover:bg-brand-teal/10"
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="grid gap-4 min-[901px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <label htmlFor={`${id}-media`} className="grid min-h-[130px] cursor-pointer place-items-center content-center gap-2 rounded-[12px] border border-dashed border-brand-teal/50 bg-white/50 p-4 text-center text-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/30 hover:bg-brand-lime/20">
                <input
                  id={`${id}-media`}
                  type="file"
                  accept={MEDIA_ACCEPT}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const ok = /\.(jpe?g|png|webp|mp4|mov)$/i.test(file.name);
                    setMedia(ok ? { name: file.name } : { name: file.name, error: "Choose a JPG, PNG, WEBP, MP4, or MOV file." });
                  }}
                />
                <LineIcon name="upload" size={20} />
                <span className="text-[13px]">
                  <u>Upload media</u> or drag and drop
                </span>
                <small className="text-[11px]">JPG, PNG, WEBP, MP4 or MOV</small>
              </label>
              <p className={`mt-1.5 text-[11px] ${media?.error ? "font-semibold text-[#9b2c2c]" : "text-[#3f4b4d]"}`}>
                {media?.error ?? (media ? `${media.name} is attached. It stays in your browser.` : "No media added yet. Choose a file or open your media library.")}
              </p>
            </div>
            <div>
              <label htmlFor={`${id}-brief`} className="text-[13px] font-bold text-brand-teal">
                Caption or content brief
              </label>
              <textarea
                id={`${id}-brief`}
                rows={4}
                maxLength={1000}
                value={settings.brief}
                onChange={(event) => set("brief", event.target.value)}
                placeholder="Write a caption, add a key message, or describe what you want to share."
                aria-invalid={errors.brief ? true : undefined}
                className={`${input} mt-1.5`}
              />
              {errors.brief && <p className={error}>{errors.brief}</p>}
              <p className="mt-1.5 text-[11px] text-[#3f4b4d]">AI can refine your copy and suggest where this content fits in the plan.</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5 min-[1101px]:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-labelledby={`${id}-settings`} className={cardClass}>
            <h2 id={`${id}-settings`} className={headingClass}>
              Plan settings
            </h2>
            <p className="mt-1 mb-4 text-[13px] text-[#3f4b4d]">Choose the scope, channels and schedule for this plan.</p>
            <div className="grid gap-4 min-[621px]:grid-cols-2">
              <fieldset>
                <legend className={label}>Date range</legend>
                <div className="mt-1.5 flex items-center gap-2">
                  <input id={`${id}-dates`} type="date" aria-label="Start date" min={today} value={settings.start} onChange={(event) => set("start", event.target.value)} className={input} aria-invalid={errors.dates ? true : undefined} />
                  <span aria-hidden="true">–</span>
                  <input type="date" aria-label="End date" min={settings.start} value={settings.end} onChange={(event) => set("end", event.target.value)} className={input} />
                </div>
                {errors.dates && <p className={error}>{errors.dates}</p>}
              </fieldset>
              <div>
                <label htmlFor={`${id}-goal`} className={label}>
                  Primary goal
                </label>
                <select id={`${id}-goal`} value={settings.goal} onChange={(event) => set("goal", event.target.value as PlanSettings["goal"])} className={`${input} mt-1.5`}>
                  {GOALS.map((goal) => (
                    <option key={goal}>{goal}</option>
                  ))}
                </select>
              </div>
            </div>

            <h3 className="mt-6 text-[17px] font-bold text-brand-teal">Connected channels</h3>
            <p className="mt-1 mb-3 text-[13px] text-[#3f4b4d]">Select where you want to publish. All {CHANNELS.length} sample accounts are connected.</p>
            <div id={`${id}-channels`} tabIndex={-1} role="group" aria-label="Connected channels" className="flex flex-wrap gap-2 outline-none">
              {CHANNELS.map((channel) => {
                const on = settings.channels.includes(channel);
                return (
                  <button key={channel} type="button" aria-pressed={on} onClick={() => set("channels", toggle(settings.channels, channel))} className={pillClass(on)}>
                    <ChannelBadge channel={channel} /> {on ? "✓ " : ""}
                    {channel}
                  </button>
                );
              })}
            </div>
            {errors.channels && <p className={error}>{errors.channels}</p>}

            <h3 className="mt-6 text-[17px] font-bold text-brand-teal">Publishing schedule</h3>
            <div className="mt-3 grid gap-4 min-[621px]:grid-cols-2">
              <div>
                <label htmlFor={`${id}-postsPerWeek`} className={label}>
                  Posting frequency
                </label>
                <select id={`${id}-postsPerWeek`} value={settings.postsPerWeek} onChange={(event) => set("postsPerWeek", Number(event.target.value))} className={`${input} mt-1.5`}>
                  {Array.from({ length: 14 }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      {value} {value === 1 ? "post" : "posts"} per week
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${id}-zone`} className={label}>
                  Time zone
                </label>
                <select id={`${id}-zone`} value={TIME_ZONE} disabled className={`${input} mt-1.5`}>
                  <option>{TIME_ZONE}</option>
                </select>
              </div>
            </div>
            <fieldset className="mt-4">
              <legend className={label}>Preferred posting days</legend>
              <div id={`${id}-days`} tabIndex={-1} className="mt-1.5 flex flex-wrap gap-2 outline-none">
                {WEEKDAYS.map((day, index) => {
                  const on = settings.days.includes(index);
                  return (
                    <button key={day} type="button" aria-pressed={on} onClick={() => set("days", toggle(settings.days, index))} className={`${pillClass(false)} ${on ? "border-brand-lime-bright bg-brand-lime-bright" : ""}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
              {errors.days && <p className={error}>{errors.days}</p>}
            </fieldset>
            <fieldset className="mt-4">
              <legend className={label}>Best time windows{settings.useInsights ? " · based on your audience activity" : " · default times"}</legend>
              <div id={`${id}-windows`} tabIndex={-1} className="mt-1.5 grid gap-2 outline-none min-[621px]:grid-cols-2">
                {windows.map((window) => {
                  const on = settings.windows.includes(window.label);
                  return (
                    <button key={window.label} type="button" aria-pressed={on} onClick={() => set("windows", toggle(settings.windows, window.label))} className={`${input} text-left ${on ? "border-brand-teal ring-1 ring-brand-teal" : "opacity-70"}`}>
                      {window.label} · {windowLabel(window)}
                    </button>
                  );
                })}
              </div>
              {errors.windows && <p className={error}>{errors.windows}</p>}
            </fieldset>
            {errors.postsPerWeek && <p className={error}>{errors.postsPerWeek}</p>}
          </section>

          <div className="grid content-start gap-3.5">
            <section aria-labelledby={`${id}-preview`} className={cardClass}>
              <h2 id={`${id}-preview`} className={headingClass}>
                Plan preview
              </h2>
              <p className="mt-1 text-[13px] text-[#3f4b4d]">
                {formatShortDate(settings.start)} – {formatShortDate(settings.end)}, {settings.end.slice(0, 4)}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-[12px] bg-[#dfe9e2] p-3">
                  <dd className="text-[26px] text-brand-teal">{preview.estimatedPosts}</dd>
                  <dt className="text-[11px] text-brand-teal">Estimated posts</dt>
                </div>
                <div className="rounded-[12px] bg-[#dfe9e2] p-3">
                  <dd className="text-[26px] text-brand-teal">{preview.channels}</dd>
                  <dt className="text-[11px] text-brand-teal">Connected channels</dt>
                </div>
              </dl>
              <p className="mt-2 text-[11px] text-brand-teal">
                {preview.postsPerWeek} posts/week · {preview.days || "No days chosen"}
              </p>
              <h3 className="mt-3 text-[14px] font-bold text-brand-teal">Recommended content mix</h3>
              <dl className="mt-2 grid gap-1.5">
                {MIX.map((category, index) => (
                  <div key={category} className="grid grid-cols-[1fr_auto_80px] items-center gap-2 text-[12px] text-[#3f4b4d]">
                    <dt>{category}</dt>
                    <dd>{preview.mix[category]}%</dd>
                    <span aria-hidden="true" className="h-1.5 rounded-full bg-[#dfe9e2]">
                      <i className={`block h-full rounded-full ${index % 2 ? "bg-brand-teal" : "bg-brand-lime-bright"}`} style={{ width: `${preview.mix[category] * 2}%` }} />
                    </span>
                  </div>
                ))}
              </dl>
            </section>
            <section aria-labelledby={`${id}-direction-title`} className={cardClass}>
              <h2 id={`${id}-direction-title`} className={headingClass}>
                Content direction
              </h2>
              <label htmlFor={`${id}-direction`} className="mt-3 block text-[13px] text-brand-teal">
                What should this plan focus on?
              </label>
              <textarea id={`${id}-direction`} rows={4} maxLength={1000} value={settings.direction} onChange={(event) => set("direction", event.target.value)} className={`${input} mt-1.5`} />
              <label className="mt-3 flex items-center gap-2 text-[13px] text-brand-teal">
                <input type="checkbox" checked={settings.useInsights} onChange={(event) => set("useInsights", event.target.checked)} className="size-4 accent-[#03525e]" />
                Use audience insights
              </label>
              <p className="mt-1 text-[11px] text-[#3f4b4d]">Optimize timing using your audience activity.</p>
            </section>
          </div>
        </div>

        {errorCount > 0 && (
          <p role="alert" className="mt-4 rounded-[10px] bg-brand-coral/30 px-3 py-2 text-[12px] font-semibold text-brand-navy">
            Fix {errorCount} {errorCount === 1 ? "thing" : "things"} above to generate the plan.
          </p>
        )}
        <div className="mt-5 flex flex-col gap-3 text-brand-cream min-[621px]:flex-row min-[621px]:items-center min-[621px]:justify-between">
          <p className="text-[13px]">
            Your existing calendar won&apos;t change until you approve the new plan.
            <br />
            <small className="text-brand-cream/80">Next: review your AI-generated suggestions.</small>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/ai-management" className={secondaryButtonClass}>
              Cancel
            </Link>
            <button type="submit" className={primaryButtonClass}>
              Generate plan →
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
