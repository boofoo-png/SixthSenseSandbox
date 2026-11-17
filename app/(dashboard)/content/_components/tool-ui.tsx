"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { LineIcon } from "@/components/line-icons";
import { postFromContent } from "@/lib/hub/content/calendar";
import type { ToolSlug } from "@/lib/hub/content/tools";
import { findBusiness, type ScheduledPost } from "@/lib/hub/posting-plan";
import { PostEditor } from "../../ai-management/_components/plan-ui";
import { useSchedule } from "../../ai-management/_components/use-schedules";
import { useCalendarTarget, type CalendarTarget } from "./calendar-target";
import { useSavedContent } from "./use-saved-content";

// Building blocks of the Figma Make's content tool screens: the details panel on the left, the
// suggestions panel on the right, and the Regenerate / Save actions.

export const panelClass =
  "flex min-w-0 flex-col rounded-[18px] border border-brand-cream/70 bg-brand-cream/94 p-[18px] text-brand-navy shadow-[0_7px_0_rgba(0,31,62,0.16),0_18px_35px_rgba(0,31,62,0.12)] backdrop-blur-[18px] min-[621px]:rounded-[22px] min-[621px]:p-[22px]";
const panelLabelClass = "mb-[18px] border-b border-brand-teal/18 pb-3 text-[14px] font-bold text-brand-teal";
const controlClass =
  "w-full rounded-[9px] border border-brand-teal/18 bg-white/66 px-3 py-[9px] text-[13px] text-brand-navy outline-none focus:border-brand-teal focus:shadow-[0_0_0_3px_rgba(29,73,144,0.1)]";
const fieldLabelClass = "text-[11px] font-semibold text-[#53676a]";
const boxClass = "rounded-[10px] border border-brand-teal/10 bg-white/68";

/** The Make's lime "My Content" button; `from` is the tool to come back to. */
export function MyContentButton({ from }: { from?: string }) {
  return (
    <Link
      href={from ? `/content/my-content?from=${from}` : "/content/my-content"}
      className="inline-flex min-h-[42px] w-full shrink-0 items-center justify-center gap-2 rounded-[22px] bg-brand-lime-bright px-[18px] text-[11px] font-extrabold text-brand-navy uppercase shadow-[0_5px_0_rgba(0,31,62,0.17)] transition hover:translate-y-0.5 hover:shadow-[0_3px_0_rgba(0,31,62,0.2)] min-[621px]:w-auto"
    >
      <LineIcon name="content" size={16} /> My Content
    </Link>
  );
}

export function ToolHeader({ slug, title, description }: { slug: string; title: string; description: string }) {
  return (
    <header className="mb-[18px] flex flex-col items-stretch gap-6 text-brand-cream min-[621px]:flex-row min-[621px]:items-start min-[621px]:justify-between">
      <div className="min-w-0">
        <Link href="/content" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-cream/88 hover:text-brand-lime-bright">
          <LineIcon name="chevron" size={16} className="rotate-180" /> Back to Content Creation
        </Link>
        <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.035em]">{title}</h1>
        <p className="mt-2 max-w-[700px] text-[13px] leading-[1.6] text-brand-cream/86">{description}</p>
      </div>
      <MyContentButton from={slug} />
    </header>
  );
}

/** Details on the left, suggestions on the right (stacked on narrow screens). */
export function ToolGrid({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`grid gap-3.5 ${wide ? "min-[901px]:grid-cols-[minmax(290px,0.72fr)_minmax(0,1.38fr)]" : "min-[901px]:grid-cols-[minmax(270px,0.72fr)_minmax(0,1.45fr)]"}`}>
      {children}
    </div>
  );
}

export function DetailsPanel({ label, onSubmit, children }: { label: string; onSubmit: () => void; children: ReactNode }) {
  return (
    <form
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className={`${panelClass} min-[901px]:min-h-[540px]`}
    >
      <p className={panelLabelClass}>{label}</p>
      {children}
    </form>
  );
}

export function SuggestionsPanel({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`${panelClass} min-[901px]:min-h-[540px]`}>
      <h2 id={id} className={panelLabelClass}>
        {label}
      </h2>
      {children}
      <p className="mt-3 text-[11px] text-[#6f7377]">Suggestions are written from templates, not live AI. Edit them to fit your voice.</p>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="mb-[13px] grid gap-[7px]">
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      {children(id)}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  labelOf,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  labelOf?: (option: T) => string;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)} className={`${controlClass} min-h-10 cursor-pointer`}>
          {options.map((option) => (
            <option key={option} value={option}>
              {labelOf ? labelOf(option) : option}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function TextField({ label, value, onChange, rows = 4, required = false, error }: { label: string; value: string; onChange: (value: string) => void; rows?: number; required?: boolean; error?: string }) {
  return (
    <Field label={label}>
      {(id) => (
        <>
          <textarea
            id={id}
            value={value}
            rows={rows}
            maxLength={2000}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(event) => onChange(event.target.value)}
            className={`${controlClass} min-h-[88px] resize-y`}
          />
          {error && (
            <p id={`${id}-error`} role="alert" className="text-[12px] font-semibold text-[#9b2c2c]">
              {error}
            </p>
          )}
        </>
      )}
    </Field>
  );
}

export function InputField({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <Field label={label}>
      {(id) => (
        <>
          <input
            id={id}
            value={value}
            maxLength={200}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(event) => onChange(event.target.value)}
            className={`${controlClass} min-h-10`}
          />
          {error && (
            <p id={`${id}-error`} role="alert" className="text-[12px] font-semibold text-[#9b2c2c]">
              {error}
            </p>
          )}
        </>
      )}
    </Field>
  );
}

/** A row of toggle buttons (Repurpose's platforms, Upload's focus). */
export function ChoiceGrid<T extends string>({
  label,
  options,
  isSelected,
  onToggle,
  icon,
}: {
  label: string;
  options: readonly T[];
  isSelected: (option: T) => boolean;
  onToggle: (option: T) => void;
  icon: (option: T) => Parameters<typeof LineIcon>[0]["name"];
}) {
  return (
    <fieldset className="mb-[13px] grid gap-[7px]">
      <legend className={`${fieldLabelClass} mb-[7px]`}>{label}</legend>
      <div className="grid grid-cols-2 gap-[7px] min-[621px]:grid-cols-4">
        {options.map((option) => {
          const selected = isSelected(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(option)}
              className={`grid min-h-[62px] place-items-center content-center gap-1.5 rounded-[9px] border px-1 py-2 text-[11px] font-bold ${
                selected ? "border-brand-blue/34 bg-brand-lime-bright/25 text-brand-teal" : "border-brand-teal/12 bg-white/58 text-[#627477] hover:border-brand-blue/34"
              }`}
            >
              <LineIcon name={icon(option)} size={16} />
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function GenerateButton({ label = "Generate with AI" }: { label?: string }) {
  return (
    <button
      type="submit"
      className="mt-auto flex min-h-[42px] items-center justify-center gap-[7px] rounded-[22px] bg-brand-lime-bright text-[12px] font-extrabold text-brand-navy uppercase shadow-[0_5px_0_rgba(0,31,62,0.17)] hover:bg-brand-teal hover:text-brand-cream max-[900px]:mt-[18px]"
    >
      <LineIcon name="sparkles" size={14} />
      {label}
    </button>
  );
}

export function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-[17px] grid gap-2">
      <h3 className={fieldLabelClass}>{title}</h3>
      {children}
    </div>
  );
}

/** A bold first line and the text below it. */
export function CopyBlock({ lines }: { lines: readonly string[] }) {
  return (
    <div className={`${boxClass} grid gap-2 p-[15px]`}>
      {lines.map((line, index) => (
        <p key={index} className={`text-[13px] leading-[1.55] whitespace-pre-line ${index === 0 ? "font-bold text-brand-navy" : "text-[#41585c]"}`}>
          {line}
        </p>
      ))}
    </div>
  );
}

export function Tags({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-[7px]">
      {items.map((item) => (
        <li key={item} className="rounded-[15px] border border-brand-teal/18 bg-white/58 px-[9px] py-[5px] text-[11px] font-bold text-brand-teal">
          {item}
        </li>
      ))}
    </ul>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      className="grid size-7 place-items-center rounded-md text-brand-teal hover:bg-brand-teal/10"
    >
      <LineIcon name={copied ? "sparkles" : "content"} size={14} />
    </button>
  );
}

/** A numbered list; with `copyable`, each line has a copy button. */
export function NumberedList({ items, copyable = false, aside }: { items: readonly string[]; copyable?: boolean; aside?: readonly string[] }) {
  return (
    <ol className={`${boxClass} px-3 py-[7px]`}>
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-[9px] border-b border-brand-teal/10 py-2 last:border-b-0">
          <b className="grid size-[19px] place-items-center rounded-[5px] bg-brand-teal/8 text-[10px] text-brand-teal">{index + 1}</b>
          <p className="text-[12px] leading-[1.45] text-[#41585c]">{item}</p>
          {copyable ? <CopyButton text={item} label={`line ${index + 1}`} /> : aside ? <small className="text-[11px] text-[#5f6b6d]">{aside[index]}</small> : <span />}
        </li>
      ))}
    </ol>
  );
}

/** The suggested photo beside written guidance. */
export function VisualCard({ src, alt, notes, tall = false }: { src: string; alt: string; notes: readonly string[]; tall?: boolean }) {
  return (
    <div className={`${boxClass} grid items-center gap-4 p-3.5 min-[621px]:grid-cols-[0.6fr_1.4fr] ${tall ? "min-h-[150px]" : "min-h-[110px]"}`}>
      <div className="relative min-h-[110px] self-stretch overflow-hidden rounded-[7px]">
        <Image src={src} alt={alt} fill sizes="(min-width: 900px) 220px, 100vw" className="object-cover" />
      </div>
      <ul className="grid list-disc gap-1.5 pl-4 text-[12px] leading-[1.5] text-[#41585c]">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

/** Three labelled alternatives, each with a copy button. */
export function Alternatives({ items }: { items: readonly { label: string; text: string }[] }) {
  return (
    <ul className="grid gap-2.5 min-[621px]:grid-cols-3">
      {items.map((item) => (
        <li key={item.label} className="relative grid min-w-0 gap-2 rounded-[9px] border border-brand-teal/11 bg-white/65 p-3 pr-9">
          <span className="text-[10px] font-bold tracking-[0.04em] text-brand-teal uppercase">{item.label}</span>
          <p className="text-[12px] leading-[1.45] text-[#41585c]">{item.text}</p>
          <span className="absolute right-1 bottom-1">
            <CopyButton text={item.text} label={item.label} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[300px] place-items-center content-center gap-3 text-center text-brand-teal/60">
      <LineIcon name="sparkles" size={24} />
      <p className="max-w-[260px] text-[12px] leading-[1.55]">{children}</p>
    </div>
  );
}

/** Opens the calendar's post editor filled in from the result; saving puts it on the chosen business's calendar. */
function AddToCalendar({ target, tool, title, text, platform, onAdded }: { target: CalendarTarget; tool: ToolSlug; title: string; text: string; platform?: string; onAdded: (message: string) => void }) {
  const business = findBusiness(target.business.id, target.business.name);
  const { update } = useSchedule(business, target.today);
  const [post, setPost] = useState<ScheduledPost | null>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => setPost(postFromContent(tool, title, text, target.today, `content-${Date.now()}`, platform))}
        className="min-h-[35px] min-w-[90px] flex-1 rounded-[18px] border border-brand-teal/40 bg-white/70 px-4 text-[12px] font-bold text-brand-teal hover:bg-white min-[621px]:flex-none"
      >
        Add to calendar
      </button>
      {post && (
        <PostEditor
          post={post}
          today={target.today}
          title={`Add to the ${business.name} calendar`}
          onClose={() => setPost(null)}
          onSave={(saved) => {
            const ok = update((current) => ({ ...current, posts: [...current.posts, saved] }));
            setPost(null);
            onAdded(ok ? `Added to the ${business.name} calendar in AI Management.` : "Added for now, but this browser blocks storage, so it will be gone after a reload.");
          }}
        />
      )}
    </>
  );
}

/** Regenerate and Save, as in the Make, plus Add to calendar. Save keeps the text in this browser. */
export function ResultActions({ tool, title, text, platform, saveLabel = "Save", onRegenerate }: { tool: ToolSlug; title: string; text: string; platform?: string; saveLabel?: string; onRegenerate: () => void }) {
  const { save } = useSavedContent();
  const target = useCalendarTarget();
  const [savedText, setSavedText] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const saved = savedText === text;
  return (
    <div className="mt-auto pt-3.5">
      <div className="flex justify-stretch gap-[9px] min-[621px]:justify-end">
        <button
          type="button"
          onClick={() => {
            setNotice("");
            onRegenerate();
          }}
          className="min-h-[35px] min-w-[90px] flex-1 rounded-[18px] bg-brand-teal px-4 text-[12px] font-bold text-brand-cream hover:bg-[#00545f] min-[621px]:flex-none"
        >
          Regenerate
        </button>
        <button
          type="button"
          onClick={() => {
            const ok = save({ id: `${tool}-${Date.now()}`, tool, title, text, savedAt: Date.now() });
            setSavedText(text);
            setNotice(ok ? "Saved in this browser. Repurpose content can start from it." : "Saved for now, but this browser blocks storage, so it will be gone after a reload.");
          }}
          disabled={saved}
          className={`min-h-[35px] min-w-[90px] flex-1 rounded-[18px] px-4 text-[12px] font-bold min-[621px]:flex-none ${saved ? "bg-[#4e8067] text-brand-cream" : "bg-brand-lime-bright text-brand-navy hover:bg-brand-lime"}`}
        >
          {saved ? "Saved" : saveLabel}
        </button>
      </div>
      {target && (
        <div className="mt-[9px] flex justify-stretch min-[621px]:justify-end">
          <AddToCalendar target={target} tool={tool} title={title} text={text} platform={platform} onAdded={setNotice} />
        </div>
      )}
      <p role="status" className="mt-2 min-h-[18px] text-right text-[11px] text-brand-teal">
        {notice}
      </p>
    </div>
  );
}

/** The Make's dashed upload box. The file stays in the browser; nothing is uploaded anywhere. */
export function UploadZone({
  label,
  hint,
  accept,
  fileName,
  error,
  onFile,
  large = false,
}: {
  label: string;
  hint: string;
  accept: string;
  fileName?: string;
  error?: string;
  onFile: (file: File) => void;
  large?: boolean;
}) {
  const id = useId();
  return (
    <div className="mb-[18px]">
      <label
        htmlFor={id}
        className={`grid cursor-pointer place-items-center content-center gap-1.5 rounded-[13px] border border-dashed border-brand-teal/34 bg-brand-teal/4 p-[18px] text-center text-brand-teal focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/30 hover:border-brand-teal hover:bg-brand-lime-bright/12 ${large ? "min-h-[128px]" : "min-h-[120px]"}`}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          aria-describedby={`${id}-hint`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
          }}
        />
        <LineIcon name="upload" size={large ? 20 : 18} />
        <span className="text-[13px] font-bold">{fileName ?? label}</span>
        <small id={`${id}-hint`} className="text-[11px] text-[#5d6c6f]">
          {fileName ? "Choose another file to replace it" : hint}
        </small>
      </label>
      {error && (
        <p role="alert" className="mt-1.5 text-[12px] font-semibold text-[#9b2c2c]">
          {error}
        </p>
      )}
    </div>
  );
}
