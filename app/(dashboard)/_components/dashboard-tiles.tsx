"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { buttonClassName } from "@/components/button";
import {
  AssessmentIcon,
  AutoAwesomeIcon,
  BookmarkIcon,
  EditIcon,
  ExpandMoreIcon,
  GroupsIcon,
  TrendingUpIcon,
} from "@/components/icons";

// The dashboard tiles from the mid-fi ("DASHBOARD - New account" and "- Have account before").
// The mid-fi still has "icon" placeholders; these use matching Material icons in the same grey circle.

type Tile = {
  href: string;
  label: string;
  description: string;
  Icon: typeof EditIcon;
};

const INSIGHT_REPORT: Tile = {
  href: "/insights",
  label: "Insight Report",
  description: "See how your marketing is performing, with plain-language takeaways.",
  Icon: AssessmentIcon,
};

const REVISIT_FINDINGS: Tile = {
  href: "/findings",
  label: "Revisit Findings",
  description: "Come back to the research you saved.",
  Icon: BookmarkIcon,
};

const START_TILES: readonly Tile[] = [
  {
    href: "/competitors",
    label: "Research Competitors",
    description: "Review public messaging and recent campaign examples from your competitors.",
    Icon: GroupsIcon,
  },
  {
    href: "/explore",
    label: "Explore Audience and Trend",
    description: "Find out what your customers care about and what is changing in your market.",
    Icon: TrendingUpIcon,
  },
  {
    href: "/ai-management",
    label: "AI Management",
    description: "Plan when and how often to post, with an AI posting plan and a content calendar.",
    Icon: AutoAwesomeIcon,
  },
  {
    href: "/content",
    label: "Content Creation",
    description: "Create, re-purpose, and edit content with the help of AI.",
    Icon: EditIcon,
  },
];

type Layout = "standard" | "wide" | "compact";

function TileCard({ tile, layout = "standard" }: { tile: Tile; layout?: Layout }) {
  const [open, setOpen] = useState(false);
  const descriptionId = useId();
  const { Icon } = tile;

  const iconCircle = (size: string, iconSize: number) => (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-ink/15 text-ink-muted ${size}`}>
      <Icon size={iconSize} />
    </span>
  );

  const body = (
    <div className={`flex flex-col gap-4 ${layout === "wide" ? "items-start" : "items-center"}`}>
      <div className="flex items-center gap-1">
        <h2 className="text-[20px] leading-[1.6] tracking-[0.15px] font-medium text-ink">{tile.label}</h2>
        <button
          type="button"
          aria-label={`More about ${tile.label}`}
          aria-expanded={open}
          aria-controls={descriptionId}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          <ExpandMoreIcon className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <p
        id={descriptionId}
        hidden={!open}
        className={`max-w-[320px] text-[14px] leading-[1.43] tracking-[0.17px] text-ink-muted ${layout === "wide" ? "" : "text-center"}`}
      >
        {tile.description}
      </p>
      <Link href={tile.href} aria-label={`Select ${tile.label}`} className={buttonClassName({ variant: "contained", size: "large" })}>
        Select
      </Link>
    </div>
  );

  return (
    <article
      className={`flex rounded bg-hover p-6 ${
        layout === "wide" ? "min-h-[282px] flex-col items-center justify-center gap-8 sm:flex-row" : "min-h-[282px] flex-col items-center justify-center gap-6"
      }`}
    >
      {layout === "wide" && iconCircle("size-[162px]", 64)}
      {layout === "standard" && iconCircle("size-[115px]", 48)}
      {body}
    </article>
  );
}

/** The tiles: a returning account also gets Insight Report and Revisit Findings on top. */
export function DashboardTiles({ returning }: { returning: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {returning && (
        <div className="grid gap-6 lg:grid-cols-[1.75fr_1fr]">
          <TileCard tile={INSIGHT_REPORT} layout="wide" />
          <TileCard tile={REVISIT_FINDINGS} layout="compact" />
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        {START_TILES.map((tile) => (
          <TileCard key={tile.href} tile={tile} />
        ))}
      </div>
    </div>
  );
}
