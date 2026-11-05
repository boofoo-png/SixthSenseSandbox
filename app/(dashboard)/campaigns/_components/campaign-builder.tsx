"use client";

import { useRef, useState, type ReactNode } from "react";
import { LineIcon } from "@/components/line-icons";
import { formatShortDate } from "@/lib/analytics/dates";
import {
  AUDIENCE_TYPES,
  CAMPAIGN_GOALS,
  CHANNELS,
  FOCUS_OPTIONS,
  MAX_DAYS,
  MIN_DAYS,
  SEGMENTS,
  campaignDraft,
  checkBrief,
  exampleBrief,
  type BriefErrors,
  type BriefField,
  type CampaignBrief,
} from "@/lib/hub/campaign";

// The Figma Make's Campaigns page: an eight-part brief, then Generate Campaign shows an editable
// draft plan. Drafts are templates built from the brief; nothing is published or paid for.

const cardClass =
  "rounded-[25px] border border-brand-cream/65 bg-brand-cream/94 p-[clamp(20px,2.6vw,34px)] text-brand-navy shadow-[0_8px_0_rgba(0,31,62,0.16),0_24px_48px_rgba(0,31,62,0.15)] backdrop-blur-[22px]";
const sectionClass = "border-t border-brand-teal/12 py-5";
const sectionTitleClass = "mb-[13px] text-[15px] font-extrabold text-brand-teal";
const smallLabelClass = "text-[11px] font-semibold text-[#5d6c6e]";
const choiceClass = (selected: boolean) =>
  `flex min-h-[67px] flex-col items-start justify-center gap-[5px] rounded-[13px] border px-[15px] py-[13px] text-left transition ${
    selected
      ? "border-brand-teal bg-white/90 shadow-[inset_0_0_0_1px_rgba(3,82,94,0.12),0_5px_12px_rgba(0,31,62,0.07)]"
      : "border-brand-teal/11 bg-white/66 shadow-[0_3px_8px_rgba(0,31,62,0.04)] hover:-translate-y-px hover:bg-brand-cream"
  }`;
const chipClass = (selected: boolean) =>
  `min-h-[29px] rounded-[15px] border px-2.5 text-[11px] font-semibold ${selected ? "border-[rgba(161,191,51,0.62)] bg-brand-lime-bright/55 text-brand-teal" : "border-brand-teal/14 bg-brand-cream/72 text-[#5b6a6d] hover:border-brand-teal/40"}`;
const pillButtonClass = "inline-flex min-h-[38px] items-center justify-center gap-2 rounded-[20px] px-4 text-[11px] font-extrabold uppercase";

function Section({ title, children, nested = false }: { title: string; children: ReactNode; nested?: boolean }) {
  return (
    <section aria-label={title.replace(/^\d+\.\s*/, "")} className={nested ? "my-1 rounded-[15px] border border-brand-teal/10 bg-white/60 p-[15px] shadow-[0_5px_14px_rgba(0,31,62,0.05)] min-[621px]:p-5" : sectionClass}>
      <h3 className={sectionTitleClass}>{title}</h3>
      {children}
    </section>
  );
}

export function CampaignBuilder({ today, launchDate, defaultAudience }: { today: string; launchDate: string; defaultAudience: string }) {
  const [brief, setBrief] = useState<CampaignBrief>(() => exampleBrief(launchDate));
  const [errors, setErrors] = useState<BriefErrors>({});
  const [status, setStatus] = useState<"Draft" | "Published">("Draft");
  const [showDraft, setShowDraft] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const set = <K extends BriefField>(field: K, value: CampaignBrief[K]) => {
    setBrief((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const toggle = (field: "segments" | "channels", value: string) => {
    const list = brief[field] as string[];
    set(field, (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]) as CampaignBrief[typeof field]);
  };

  function field(name: BriefField, label: string, placeholder: string, wide = false) {
    const id = `campaign-${name}`;
    const error = errors[name];
    return (
      <div className={`grid min-w-0 gap-[3px] ${wide ? "min-[621px]:col-span-2" : ""}`}>
        <label htmlFor={id} className={smallLabelClass}>
          {label}
        </label>
        <input
          id={id}
          name={name}
          value={String(brief[name])}
          placeholder={placeholder}
          maxLength={400}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => set(name, event.target.value as never)}
          className="h-9 w-full border-0 border-b border-brand-teal/27 bg-transparent py-1.5 text-[13px] text-brand-navy outline-none placeholder:text-[#617173] focus:border-brand-blue focus:shadow-[0_1px_0_var(--brand-blue)] aria-invalid:border-[#9b2c2c]"
        />
        {error && (
          <p id={`${id}-error`} className="text-[11px] font-semibold text-[#9b2c2c]">
            {error}
          </p>
        )}
      </div>
    );
  }

  function generate() {
    const found = checkBrief(brief, today);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"], [data-field="${first}"]`)?.focus();
      return;
    }
    setShowDraft(true);
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  }

  if (showDraft) {
    const draft = campaignDraft(brief);
    return (
      <div>
        <header className="mb-[18px] flex flex-col items-stretch gap-6 text-brand-cream min-[621px]:flex-row min-[621px]:items-center min-[621px]:justify-between">
          <div>
            <p className="mb-[7px] text-[10px] font-bold tracking-[0.11em] text-brand-lime-bright uppercase">Campaign draft generated</p>
            <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.035em]">{draft.title}</h1>
            <p className="mt-2 max-w-[760px] text-[13px] leading-[1.55] text-brand-cream/82">
              Review this proposed campaign for {brief.audienceName}. Nothing will be published until you approve it.
            </p>
          </div>
          <button type="button" onClick={() => setShowDraft(false)} className={`${pillButtonClass} shrink-0 border border-brand-cream/56 bg-brand-lime-bright text-brand-navy shadow-[0_5px_0_rgba(0,31,62,0.18)] hover:bg-brand-cream`}>
            <LineIcon name="edit" size={15} /> Edit campaign
          </button>
        </header>

        <article aria-label="Campaign draft" className="overflow-hidden rounded-[25px] border border-brand-cream/70 bg-brand-cream/95 text-brand-navy shadow-[0_8px_0_rgba(0,31,62,0.16),0_24px_48px_rgba(0,31,62,0.15)]">
          <div className="grid items-center gap-[30px] bg-[radial-gradient(circle_at_88%_0%,rgba(221,254,86,0.46),transparent_33%),linear-gradient(135deg,rgba(3,82,94,0.08),rgba(246,248,237,0.2))] p-[clamp(24px,3.4vw,44px)] min-[901px]:grid-cols-[minmax(0,1.6fr)_minmax(220px,0.65fr)]">
            <div>
              <span className="inline-flex rounded-[20px] bg-brand-lime-bright/70 px-2.5 py-1.5 text-[10px] font-extrabold tracking-[0.05em] text-brand-teal uppercase">
                {status} · Ready to review
              </span>
              <h2 className="mt-4 mb-2 max-w-[760px] text-[clamp(22px,3vw,36px)] leading-[1.14] font-semibold tracking-[-0.035em] text-brand-teal">{brief.coreMessage}</h2>
              <p className="max-w-[720px] text-[13px] leading-[1.65] text-[#52686a]">{brief.summary}</p>
            </div>
            <div className="grid gap-[7px] rounded-[17px] border border-brand-teal/12 bg-white/72 p-5 shadow-[0_6px_0_rgba(0,31,62,0.1)]">
              <span className="text-[10px] font-bold text-[#5f6f71] uppercase">Primary success target</span>
              <strong className="text-[18px] leading-tight text-brand-teal">{brief.targetValue}</strong>
              <small className="text-[11px] text-[#667678]">{brief.targetMetric}</small>
            </div>
          </div>
          <dl className="grid border-y border-brand-teal/12 min-[621px]:grid-cols-2 min-[901px]:grid-cols-3">
            {draft.stats.map(([label, value]) => (
              <div key={label} className="grid min-w-0 content-start gap-1.5 border-b border-brand-teal/10 px-5 py-[17px] min-[621px]:border-r">
                <dt className="text-[10px] font-bold text-[#5f6f71] uppercase">{label}</dt>
                <dd className="text-[12px] leading-[1.45] font-semibold text-brand-teal">{value}</dd>
              </div>
            ))}
          </dl>
          {(
            [
            { n: "01", title: "Campaign strategy", note: "Proposed positioning and message direction", items: draft.strategy.map((item) => ({ key: item.label, top: item.label, body: item.text })) },
            { n: "02", title: "Channel plan", note: brief.contentFormats, items: draft.channelPlan.map((item) => ({ key: item.channel, top: item.channel, tag: item.cadence, body: item.purpose })) },
            { n: "03", title: "Starter content", note: "Three editable ideas for the first campaign week", items: draft.starters.map((item) => ({ key: item.type, top: item.type, heading: item.title, body: item.text })) },
            ] as { n: string; title: string; note: string; items: { key: string; top: string; tag?: string; heading?: string; body: string }[] }[]
          ).map((block) => (
            <section key={block.n} aria-label={block.title} className="border-b border-brand-teal/12 px-[clamp(20px,3.4vw,44px)] py-[26px]">
              <div className="mb-4 flex flex-col gap-3 min-[621px]:flex-row min-[621px]:items-end min-[621px]:justify-between">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="grid size-[29px] place-items-center rounded-full bg-brand-lime-bright text-[10px] font-extrabold text-brand-navy">
                    {block.n}
                  </span>
                  <h3 className="text-[16px] font-semibold text-brand-teal">{block.title}</h3>
                </div>
                <p className="text-[11px] text-[#667678] min-[621px]:max-w-[55%] min-[621px]:text-right">{block.note}</p>
              </div>
              <ul className="grid gap-3 min-[621px]:grid-cols-2 min-[901px]:grid-cols-3">
                {block.items.map((item) => (
                  <li key={item.key} className="grid min-w-0 content-start gap-1.5 rounded-[14px] border border-brand-teal/10 bg-white/58 p-4">
                    <span className={block.n === "02" ? "text-[14px] font-semibold text-brand-teal" : "text-[10px] font-bold text-[#5f6f71] uppercase"}>{item.top}</span>
                    {item.tag && <span className="w-max rounded-[10px] bg-brand-lime-bright/58 px-[7px] py-[3px] text-[10px] font-bold text-brand-teal">{item.tag}</span>}
                    {item.heading && <strong className="text-[13px] leading-[1.4] text-brand-teal">{item.heading}</strong>}
                    <p className="text-[12px] leading-[1.6] text-[#52686a]">{item.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="flex flex-col items-stretch gap-5 px-[clamp(20px,3.4vw,44px)] pt-[18px] pb-6 min-[621px]:flex-row min-[621px]:items-center min-[621px]:justify-between">
            <p className="flex items-center gap-2 text-[11px] text-[#5a6c6e]">
              <LineIcon name="help" size={16} /> This is a mock proposal built from templates. Edit the brief to generate a different direction.
            </p>
            <button type="button" onClick={() => setShowDraft(false)} className={`${pillButtonClass} bg-brand-teal text-brand-cream shadow-[0_5px_0_rgba(0,31,62,0.18)] hover:bg-brand-navy`}>
              <LineIcon name="edit" size={15} /> Edit campaign
            </button>
          </div>
        </article>
      </div>
    );
  }

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div>
      <header className="mb-[18px] flex flex-col items-start gap-6 text-brand-cream min-[621px]:flex-row min-[621px]:justify-between">
        <div>
          <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.035em]">Create Campaign</h1>
          <p className="mt-2 max-w-[760px] text-[13px] leading-[1.55] text-brand-cream/82">
            Example brief. Set your goals, offer and audience. Generate Campaign prepares an editable draft — not a live campaign.
          </p>
        </div>
        <div role="group" aria-label="Campaign status" className="flex shrink-0 rounded-[22px] border border-brand-cream/32 bg-brand-cream/16 p-[3px] backdrop-blur-[16px]">
          {(["Draft", "Published"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={status === item}
              onClick={() => setStatus(item)}
              className={`min-h-[30px] rounded-[17px] px-[13px] text-[11px] font-bold ${status === item ? "bg-brand-teal text-brand-cream shadow-[0_3px_10px_rgba(0,31,62,0.2)]" : "text-brand-cream/80"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <form
        ref={form}
        noValidate
        aria-labelledby="setup-title"
        onSubmit={(event) => {
          event.preventDefault();
          generate();
        }}
        className={cardClass}
      >
        <header className="mb-[22px]">
          <h2 id="setup-title" className="text-[21px] font-bold text-brand-teal">
            Set up your campaign
          </h2>
          <p className="mt-2 max-w-[1080px] text-[13px] leading-[1.55] text-[#5a6c6e]">
            Complete the fields below to define your campaign goals, audience, offer, channels, and timing. Recommendations are generated after you click Generate Campaign.
          </p>
        </header>

        <Section title="1. Business goal">
          <div role="group" aria-label="Business goal" className="grid gap-3 min-[621px]:grid-cols-2 min-[901px]:grid-cols-3">
            {CAMPAIGN_GOALS.map((goal) => (
              <button key={goal.id} type="button" aria-pressed={brief.goal === goal.id} onClick={() => set("goal", goal.id)} className={choiceClass(brief.goal === goal.id)}>
                <strong className="text-[13px] text-brand-teal">{goal.id}</strong>
                <span className="text-[11px] leading-[1.45] text-[#5f6d6f]">{goal.description}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="2. Success target">
          <div className="grid gap-x-5 gap-y-3.5 min-[621px]:grid-cols-2">
            {field("targetMetric", "Target metric", "e.g. new orders, consultations, leads")}
            {field("targetValue", "Target value", "e.g. 12 new orders in 30 days")}
            {field("targetReason", "Why this matters", "Explain why this target is important for the campaign.", true)}
          </div>
        </Section>

        <Section title="3. Focus / product / offer">
          <div role="group" aria-label="Focus" className="grid gap-3 min-[621px]:grid-cols-2">
            {FOCUS_OPTIONS.map((option) => (
              <button key={option.id} type="button" aria-pressed={brief.focus === option.id} onClick={() => set("focus", option.id)} className={choiceClass(brief.focus === option.id)}>
                <strong className="text-[13px] text-brand-teal">{option.id}</strong>
                <span className="text-[11px] leading-[1.45] text-[#5f6d6f]">{option.description}</span>
              </button>
            ))}
          </div>
          <div className="mt-[15px] grid gap-x-5 gap-y-3.5 min-[621px]:grid-cols-2">
            {field("offer", "Offer summary", "Describe the product or service this campaign will promote.", true)}
            {field("cta", "Conversion CTA", "e.g. Book a consultation, Request a quote, Shop now", true)}
          </div>
        </Section>

        <Section title="4. Target audience and niche" nested>
          <div className="grid gap-x-5 gap-y-3.5 min-[621px]:grid-cols-2">
            {field("audienceName", "Audience name", "e.g. Small business owners, Parents, Travelers", true)}
          </div>
          {defaultAudience && brief.audienceName !== defaultAudience && (
            <button type="button" onClick={() => set("audienceName", defaultAudience)} className="mt-1.5 text-[11px] font-semibold text-brand-teal underline-offset-2 hover:underline">
              Use my default audience ({defaultAudience})
            </button>
          )}
          <div className="mt-3.5 grid gap-x-5 gap-y-3.5 min-[621px]:grid-cols-2">{field("audienceDescription", "Description", "Describe the audience, industry, or buying behavior.", true)}</div>
          <div className="mt-4 grid gap-[18px] min-[901px]:grid-cols-[0.9fr_1.1fr]">
            <div role="group" aria-label="Audience type">
              <span className={smallLabelClass}>Audience type</span>
              <div className="mt-2 flex flex-wrap gap-[7px]">
                {AUDIENCE_TYPES.map((type) => (
                  <button key={type} type="button" aria-pressed={brief.audienceType === type} onClick={() => set("audienceType", type)} className={chipClass(brief.audienceType === type)}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div role="group" aria-label="Customer segment">
              <span className={smallLabelClass}>Customer segment</span>
              <div className="mt-2 flex flex-wrap gap-[7px]">
                {SEGMENTS.map((segment) => (
                  <button key={segment} type="button" aria-pressed={brief.segments.includes(segment)} onClick={() => toggle("segments", segment)} className={chipClass(brief.segments.includes(segment))}>
                    {segment}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-[18px] grid gap-x-5 gap-y-3.5 min-[621px]:grid-cols-2">
            {field("location", "Location", "e.g. City, region, country or online-only")}
            {field("role", "Decision-maker role", "e.g. Owner, GM, procurement lead")}
            {field("interests", "Interests", "e.g. Hospitality, home decor, travel")}
            {field("painPoints", "What do they need or struggle with?", "Describe their pain points or goals.")}
          </div>
        </Section>

        <Section title="5. Messaging">
          <div className="grid gap-x-5 gap-y-3.5 min-[621px]:grid-cols-2">
            {field("valueProposition", "Value proposition", "What makes this offer valuable to the audience?", true)}
            {field("keyPainPoints", "Key pain points", "List the problems or frustrations this campaign should address.", true)}
            {field("coreMessage", "Core message", "Write a short headline or opening sentence for the campaign.", true)}
          </div>
        </Section>

        <Section title="6. Channels and content formats">
          <div role="group" aria-label="Channels" data-field="channels" tabIndex={-1} className="grid gap-3 outline-none min-[621px]:grid-cols-2 min-[901px]:grid-cols-3">
            {CHANNELS.map((channel) => (
              <button key={channel.id} type="button" aria-pressed={brief.channels.includes(channel.id)} onClick={() => toggle("channels", channel.id)} className={choiceClass(brief.channels.includes(channel.id))}>
                <strong className="text-[13px] text-brand-teal">{channel.id}</strong>
                <span className="text-[11px] leading-[1.45] text-[#5f6d6f]">{channel.description}</span>
              </button>
            ))}
          </div>
          {errors.channels && <p className="mt-2 text-[11px] font-semibold text-[#9b2c2c]">{errors.channels}</p>}
          <div className="mt-[15px] grid gap-x-5 gap-y-3.5 min-[621px]:grid-cols-2">
            {field("contentFormats", "Content formats", "e.g. Product showcases, supply tips, owner testimonials, consultation offers", true)}
          </div>
        </Section>

        <Section title="7. Timing and budget">
          <div className="grid gap-x-5 gap-y-3.5 min-[621px]:grid-cols-2">
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-[9px] rounded-[11px] border border-brand-teal/10 bg-white/62 px-3.5 py-3">
              <label htmlFor="campaign-days" className={`${smallLabelClass} col-span-2`}>
                Campaign window
              </label>
              <strong className="text-[14px] text-brand-teal">{brief.days} days</strong>
              <small className="text-[11px] text-[#667678]">Proposed campaign duration.</small>
              <input
                id="campaign-days"
                name="days"
                type="range"
                min={MIN_DAYS}
                max={MAX_DAYS}
                value={brief.days}
                aria-valuetext={`${brief.days} days`}
                onChange={(event) => set("days", Number(event.target.value))}
                className="col-span-2 mt-[9px] w-full accent-[#8dbf55]"
              />
            </div>
            {field("budget", "Budget / resources", "e.g. $4,500 CAD · 30 days · 1 content owner")}
            <div className="grid min-w-0 gap-[3px] min-[621px]:col-span-2">
              <label htmlFor="campaign-launchDate" className={smallLabelClass}>
                Launch date
              </label>
              <input
                id="campaign-launchDate"
                name="launchDate"
                type="date"
                min={today}
                value={brief.launchDate}
                aria-invalid={errors.launchDate ? true : undefined}
                aria-describedby={errors.launchDate ? "campaign-launchDate-error" : undefined}
                onChange={(event) => set("launchDate", event.target.value)}
                className="h-9 w-full max-w-[260px] border-0 border-b border-brand-teal/27 bg-transparent py-1.5 text-[13px] text-brand-navy outline-none focus:border-brand-blue"
              />
              {errors.launchDate && (
                <p id="campaign-launchDate-error" className="text-[11px] font-semibold text-[#9b2c2c]">
                  {errors.launchDate}
                </p>
              )}
            </div>
          </div>
        </Section>

        <Section title="8. Review before generation">
          <div className="grid gap-[15px] rounded-[15px] border border-brand-teal/10 bg-white/60 p-[15px] shadow-[0_5px_14px_rgba(0,31,62,0.05)] min-[621px]:p-5">
            <div className="grid gap-x-5 gap-y-3.5 min-[621px]:grid-cols-2">{field("summary", "Campaign summary", "Summarize the campaign in one sentence.", true)}</div>
            <dl className="grid gap-2.5 min-[621px]:grid-cols-2 min-[901px]:grid-cols-3">
              {[
                ["Objective", brief.goal],
                ["Target", brief.targetValue || `${brief.days} day campaign target`],
                ["Audience", brief.audienceName || "Not set"],
                ["Channels", brief.channels.join(", ") || "Select channels"],
                ["Budget", brief.budget.split(" · ")[0] || "Not set"],
                ["Launch", /^\d{4}-\d{2}-\d{2}$/.test(brief.launchDate) ? formatShortDate(brief.launchDate) : "Not set"],
              ].map(([label, value]) => (
                <div key={label} className="grid min-h-[62px] content-center gap-[5px] rounded-[11px] border border-brand-teal/10 bg-brand-cream/82 px-[13px] py-[11px] shadow-[0_4px_0_rgba(0,31,62,0.1)]">
                  <dt className="text-[10px] text-[#667678]">{label}</dt>
                  <dd className="truncate text-[13px] font-semibold text-brand-teal">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-1">
              <span className={smallLabelClass}>What will be generated</span>
              <p className="border-b border-brand-teal/22 pb-[7px] text-[12px] leading-[1.5] text-[#41575b]">
                An editable campaign strategy, content and post ideas, channel schedule, and proposed measurement plan for review before publishing.
              </p>
            </div>
          </div>
        </Section>

        {errorCount > 0 && (
          <p role="alert" className="mt-2 rounded-[10px] bg-brand-coral/25 px-3 py-2 text-[12px] font-semibold text-[#7a2634]">
            Fix {errorCount} {errorCount === 1 ? "field" : "fields"} above to generate the campaign.
          </p>
        )}
        <div className="grid gap-[9px] pt-3 min-[621px]:flex min-[621px]:justify-end">
          <button
            type="button"
            onClick={() => {
              setBrief(exampleBrief(launchDate));
              setErrors({});
              setStatus("Draft");
            }}
            className="min-h-[35px] rounded-[19px] border border-brand-teal/20 bg-white/50 px-[17px] text-[11px] font-bold text-brand-teal uppercase hover:border-brand-teal"
          >
            Cancel
          </button>
          <button type="submit" className="min-h-[35px] rounded-[19px] bg-brand-teal px-[17px] text-[11px] font-bold text-brand-cream uppercase shadow-[0_4px_0_rgba(0,31,62,0.16)] hover:bg-brand-navy">
            Generate Campaign
          </button>
        </div>
        <div className="mt-[13px] flex w-full items-start gap-2.5 rounded-[14px] bg-brand-teal p-3.5 text-brand-cream min-[621px]:w-[300px]">
          <LineIcon name="help" size={17} />
          <p className="grid gap-1 text-[11px] leading-[1.45]">
            <strong className="text-[12px]">Review before publishing</strong>
            Generate Campaign creates a draft plan. You can edit the strategy, content, channels and budget before launching ads or spending money.
          </p>
        </div>
      </form>
    </div>
  );
}
