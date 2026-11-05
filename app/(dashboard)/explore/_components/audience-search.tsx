"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { LineIcon } from "@/components/line-icons";
import { AUDIENCE_SEGMENTS, matchesQuery } from "@/lib/hub/audience";

// The Make's audience search: typing shows matching audiences right away; choosing one selects
// it. Enter or Apply filters runs the search on the page itself.

export function AudienceSearch({ initial, baseQuery }: { initial: string; baseQuery: string }) {
  const [query, setQuery] = useState(initial);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const text = query.trim();
  const matches = AUDIENCE_SEGMENTS.filter((segment) => matchesQuery(segment, text)).slice(0, 5);

  const hrefFor = (name: string, slug: string) => {
    const params = new URLSearchParams(baseQuery);
    params.set("q", name);
    params.set("audience", slug);
    return `/explore?${params.toString()}`;
  };

  return (
    <div
      className="relative z-[12] w-full min-[1101px]:w-[min(285px,26vw)] min-[1101px]:shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <label className="flex h-[38px] items-center gap-2 rounded-lg border border-brand-teal/20 bg-white/60 px-3 text-[#6f7377] focus-within:border-brand-teal">
        <LineIcon name="search" size={17} />
        <input
          type="search"
          name="q"
          value={query}
          maxLength={80}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label="Search audience categories"
          aria-describedby={open && text ? listId : undefined}
          placeholder="Search audiences, categories, or interests"
          className="h-9 w-full bg-transparent text-[12px] text-brand-navy outline-none placeholder:text-[#8a8c90]"
        />
      </label>
      {open && text && (
        <div
          id={listId}
          className="absolute top-[calc(100%+7px)] left-0 w-[min(430px,calc(100vw-36px))] overflow-hidden rounded-[10px] border border-brand-teal/15 bg-brand-cream p-2 shadow-[0_18px_42px_rgba(0,31,63,0.16)]"
        >
          <p className="px-[7px] pt-[5px] pb-[9px] text-[11px] font-semibold text-[#6f7377]">Suggested audiences for “{text}”</p>
          {matches.length > 0 ? (
            <ul>
              {matches.map((segment) => (
                <li key={segment.slug}>
                  <Link
                    href={hrefFor(segment.name, segment.slug)}
                    onClick={() => setOpen(false)}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[9px] rounded-lg p-2 text-left hover:bg-[#dbe8c2]/60 focus-visible:bg-[#dbe8c2]/60 focus-visible:outline-none"
                  >
                    <span className="grid size-[29px] place-items-center rounded-[7px] bg-[#dbe8e8] text-brand-teal">
                      <LineIcon name="audience" size={15} />
                    </span>
                    <span className="grid min-w-0 gap-[3px]">
                      <strong className="truncate text-[12px] text-brand-navy">{segment.name}</strong>
                      <small className="truncate text-[11px] text-[#6f7377]">{segment.detail}</small>
                    </span>
                    <em className="rounded-[20px] bg-brand-lime px-1.5 py-[3px] text-[10px] font-semibold text-brand-teal not-italic">
                      {segment.category}
                    </em>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-[13px] text-[12px] leading-normal text-[#697779]">
              No exact audience yet. Try a category such as hotel, care, sustainability, travel, or procurement.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
