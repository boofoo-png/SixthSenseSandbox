"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LineIcon } from "@/components/line-icons";
import {
  LIBRARY_CAMPAIGNS,
  LIBRARY_FILTERS,
  LIBRARY_SAMPLES,
  filterCounts,
  fromSaved,
  libraryText,
  showLibrary,
  type LibraryCampaign,
  type LibraryFilter,
  type LibraryItem,
  type LibrarySort,
} from "@/lib/hub/content/library";
import { useSavedContent } from "./use-saved-content";

// My Content from the team's Figma Make: content saved in this browser, then the Make's samples.
// Back steps out of a campaign, then out of Campaigns, then returns to where My Content was opened.

const pillButtonClass =
  "inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-[22px] bg-brand-lime-bright px-[18px] text-[11px] font-extrabold text-brand-navy uppercase shadow-[0_5px_0_rgba(0,31,62,0.17)] transition hover:translate-y-0.5 hover:shadow-[0_3px_0_rgba(0,31,62,0.2)]";
const backClass = "mb-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-cream/88 hover:text-brand-lime-bright";
const toolbarBoxClass = "min-h-[44px] rounded-xl border border-brand-cream/50 bg-brand-cream/94 text-brand-navy";

const COPY_CARD_CLASS: Record<string, string> = {
  "Blog post": "bg-[linear-gradient(145deg,#f8f8f1,#e9efdf)] text-brand-navy",
  "Social post": "bg-[linear-gradient(145deg,var(--brand-teal),#167181)] text-brand-cream",
};

function FolderShape() {
  const face =
    "M15 97C15 82 27 70 42 70H90C109 70 122 62 133 47L153 20C162 7 177 0 193 0H213C228 0 240 12 240 27V181C240 197 227 210 211 210H19C8 210 0 199 0 185V114C0 105 6 99 15 97Z";
  return (
    <svg aria-hidden="true" viewBox="0 0 240 220" width="184" height="169" className="block overflow-visible">
      <path d={face} transform="translate(0 9)" fill="#96b74e" />
      <path d="M10 62C10 43 25 28 44 28H196C215 28 230 43 230 62V177C230 194 216 208 199 208H41C24 208 10 194 10 177V62Z" fill="#a0c04f" />
      <path d={face} className="fill-brand-lime-bright stroke-transparent stroke-[4] transition-[stroke] group-aria-pressed:stroke-brand-cream" />
    </svg>
  );
}

function Card({ item, list }: { item: LibraryItem; list: boolean }) {
  const reuse = libraryText(item) !== null;
  const media = `relative ${list ? "h-[92px] min-h-[92px]" : "min-h-[118px]"}`;
  return (
    <article
      className={`min-w-0 overflow-hidden rounded-[18px] border border-brand-cream/72 bg-brand-cream/96 text-brand-navy shadow-[0_5px_0_rgba(0,31,62,0.16),0_15px_25px_rgba(0,31,62,0.1)] transition hover:-translate-y-0.5 ${
        list ? "grid grid-cols-[105px_minmax(0,1fr)] min-[621px]:grid-cols-[150px_minmax(0,1fr)]" : ""
      }`}
    >
      {item.image ? (
        <div className={`${media} ${list ? "" : "h-[118px]"}`}>
          <Image src={item.image.src} alt={item.image.alt} fill sizes="(min-width: 1150px) 25vw, (min-width: 621px) 50vw, 100vw" className="object-cover" />
          {item.type === "Video" && (
            <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-brand-cream/75 bg-brand-teal/78 text-brand-cream">
              <LineIcon name="video" size={16} />
              <span className="sr-only">Video</span>
            </span>
          )}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className={`${media} flex flex-col items-start justify-center ${list ? "p-[13px]" : "p-[17px]"} ${
            COPY_CARD_CLASS[item.type] ?? "bg-[linear-gradient(145deg,var(--brand-lime-bright),#efffae)] text-brand-navy"
          }`}
        >
          <span className="mb-[9px] text-[10px] font-extrabold tracking-[0.08em] uppercase">{item.type}</span>
          <strong className="line-clamp-2 text-[14px] leading-[1.25]">{item.title}</strong>
          {!list && item.summary && <p className="mt-[7px] line-clamp-3 text-[11px] leading-[1.45]">{item.summary}</p>}
        </div>
      )}
      <div className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 px-3.5 pt-3 pb-3.5 ${list ? "content-center" : ""}`}>
        <span className="text-[10px] font-extrabold text-brand-teal uppercase">{item.type}</span>
        <h2 className="col-start-1 mt-[7px] truncate text-[12px] font-bold text-brand-navy">{item.title}</h2>
        <small className="col-start-1 mt-1 truncate text-[11px] text-[#708083]">
          {item.type} &middot; {item.detail}
        </small>
        {item.campaign && <small className="col-start-1 truncate text-[10px] font-bold text-brand-teal">Campaign &middot; {item.campaign}</small>}
        {reuse && (
          <Link
            href={`/content/repurpose?from=${encodeURIComponent(item.id)}`}
            aria-label={`Reuse ${item.title}`}
            title="Reuse in Repurpose content"
            className="col-start-2 row-span-4 row-start-1 inline-flex items-center gap-1 self-center rounded-md px-1.5 py-1 text-[11px] font-bold text-brand-teal hover:bg-brand-teal/8"
          >
            <LineIcon name="repeat" size={15} /> Reuse
          </Link>
        )}
      </div>
    </article>
  );
}

export function MyContent({ back }: { back: string }) {
  const { items: saved } = useSavedContent();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("All content");
  const [campaign, setCampaign] = useState<LibraryCampaign | null>(null);
  const [sort, setSort] = useState<LibrarySort>("newest");
  const [list, setList] = useState(false);

  const library = [...fromSaved(saved), ...LIBRARY_SAMPLES];
  const counts = filterCounts(library);
  const shown = showLibrary(library, { query, filter, campaign, sort });
  const choosingCampaign = filter === "Campaigns" && campaign === null;

  const backLabel = (
    <>
      <LineIcon name="chevron" size={16} className="rotate-180" /> Back
    </>
  );

  return (
    <>
      <header className="mb-[22px] flex flex-col items-stretch gap-6 min-[621px]:flex-row min-[621px]:items-end min-[621px]:justify-between">
        <div className="min-w-0 text-brand-cream">
          {filter === "Campaigns" ? (
            <button type="button" className={backClass} onClick={() => (campaign ? setCampaign(null) : setFilter("All content"))}>
              {backLabel}
            </button>
          ) : (
            <Link href={back} className={backClass}>
              {backLabel}
            </Link>
          )}
          <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.035em]">My Content</h1>
          <p className="mt-2 max-w-[700px] text-[13px] leading-[1.6] text-brand-cream/86">Browse, search and reuse everything you&apos;ve uploaded or saved.</p>
        </div>
        <Link href="/content/upload" className={pillButtonClass}>
          <LineIcon name="upload" size={15} /> Upload content
        </Link>
      </header>

      <div className="mb-2.5 grid grid-cols-2 gap-2.5 min-[621px]:grid-cols-[minmax(240px,1fr)_auto_auto]">
        <label className={`${toolbarBoxClass} col-span-full flex items-center gap-2 px-3 text-[#96989c] focus-within:border-brand-lime-bright min-[621px]:col-span-1`}>
          <LineIcon name="search" size={16} />
          <input
            type="search"
            aria-label="Search your content"
            value={query}
            maxLength={80}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your content..."
            className="h-10 w-full bg-transparent text-[12px] text-brand-navy outline-none placeholder:text-[#8a8c90]"
          />
        </label>
        <button
          type="button"
          onClick={() => setSort(sort === "newest" ? "a-z" : "newest")}
          className={`${toolbarBoxClass} flex min-w-[130px] items-center justify-between gap-3 px-3.5 text-[12px] font-bold`}
        >
          {sort === "newest" ? "Newest first" : "A to Z"}
          <LineIcon name="chevron" size={13} className="rotate-90" />
        </button>
        <div role="group" aria-label="Content view" className={`${toolbarBoxClass} flex p-1`}>
          {(["Grid", "List"] as const).map((mode) => {
            const pressed = (mode === "List") === list;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={pressed}
                onClick={() => setList(mode === "List")}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-[12px] font-bold min-[621px]:min-w-[68px] ${pressed ? "bg-brand-teal text-brand-cream" : ""}`}
              >
                <LineIcon name={mode === "Grid" ? "dashboard" : "content"} size={15} /> {mode}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3.5 flex flex-col items-start justify-between gap-4 min-[621px]:flex-row min-[621px]:items-center">
        <div role="group" aria-label="Content type" className="flex flex-wrap gap-[7px]">
          {LIBRARY_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={filter === item}
              onClick={() => {
                setFilter(item);
                setCampaign(null);
              }}
              className={`min-h-7 rounded-2xl border px-3.5 text-[11px] font-bold ${
                filter === item ? "border-brand-teal bg-brand-teal text-brand-cream" : "border-brand-cream/50 bg-brand-cream/90 text-brand-navy hover:bg-brand-cream"
              }`}
            >
              {item} ({counts[item]})
            </button>
          ))}
        </div>
        <span role="status" className="text-[12px] whitespace-nowrap text-brand-cream/84">
          {choosingCampaign ? `${LIBRARY_CAMPAIGNS.length} campaigns` : `${shown.length} item${shown.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="mt-2 mb-6 flex flex-wrap items-start gap-[30px]">
        {filter !== "Campaigns" ? (
          <button
            type="button"
            title="Open Campaigns"
            aria-label="Open Campaigns"
            onClick={() => {
              setFilter("Campaigns");
              setCampaign(null);
            }}
            className="group grid w-[194px] place-items-center gap-2 rounded-[10px] p-1.5 text-center text-brand-cream transition hover:-translate-y-[3px]"
          >
            <FolderShape />
            <strong className="text-[12px]">Campaigns</strong>
          </button>
        ) : (
          LIBRARY_CAMPAIGNS.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={campaign === name}
              onClick={() => setCampaign(name)}
              className="group grid w-[194px] place-items-center gap-2 rounded-[10px] p-1.5 text-center text-brand-cream transition hover:-translate-y-[3px] aria-pressed:text-brand-lime-bright"
            >
              <FolderShape />
              <strong className="text-[12px]">{name}</strong>
              <small className="text-[11px] text-brand-cream/70">{library.filter((item) => item.campaign === name).length} items</small>
            </button>
          ))
        )}
      </div>

      {choosingCampaign ? (
        <div className="grid min-h-[220px] place-items-center content-center gap-2.5 border-t border-brand-cream/18 text-center text-brand-cream/70">
          <LineIcon name="content" size={24} />
          <p className="text-[12px]">Select Black Friday or BOGO to view its classified content.</p>
        </div>
      ) : shown.length ? (
        <div className={list ? "grid gap-[9px]" : "grid gap-3.5 min-[621px]:grid-cols-2 min-[901px]:grid-cols-3 min-[1151px]:grid-cols-4"}>
          {shown.map((item) => (
            <Card key={item.id} item={item} list={list} />
          ))}
        </div>
      ) : (
        <div className="grid min-h-[340px] place-items-center content-center gap-2 rounded-[18px] border border-dashed border-brand-cream/55 bg-brand-cream/9 text-center text-brand-cream">
          <LineIcon name="search" size={24} />
          <strong className="text-[14px]">No content found</strong>
          <p className="text-[12px] text-brand-cream/78">Try another search or content type.</p>
        </div>
      )}

      <footer className="flex flex-col justify-between gap-4 pt-5 text-[11px] text-brand-cream/75 min-[621px]:flex-row">
        <span>{choosingCampaign ? "Choose a campaign folder" : `Showing all ${shown.length} items`}</span>
        <span>Use Reuse to open an item in Repurpose content. Sample items come from the design.</span>
      </footer>
    </>
  );
}
