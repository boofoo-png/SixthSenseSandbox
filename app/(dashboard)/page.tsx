import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { LineIcon, type LineIconName } from "@/components/line-icons";
import { formatShortDate, todayIsoDate } from "@/lib/analytics/dates";
import { NEW_ACCOUNT_COOKIE } from "@/lib/hub/constants";
import {
  OVERVIEW_PERIODS,
  formatSignedPercent,
  overviewCompetitors,
  overviewFor,
  parsePeriod,
  type ChannelMomentum,
} from "@/lib/hub/overview";
import { workspaceFor } from "@/lib/hub/workspace";
import { OverviewTour } from "./_components/overview-tour";

export const metadata: Metadata = {
  title: "Marketing Overview",
  description: "Competitor activity, market interest, audience growth, engagement, and what to do next.",
};

// The dashboard: the Marketing Overview from the team's Figma Make "Marketing Intelligence Hub"
// (2026-11-04). Right after sign-up it opens with a welcome and a short tour. Figures are samples.

const CHANNEL_ICONS: Record<ChannelMomentum["channel"], LineIconName> = {
  Instagram: "instagram",
  Facebook: "message",
  Web: "search",
  Email: "email",
};

const cardClass = "overview-card relative min-w-0 rounded-3xl p-5 text-brand-navy min-[621px]:min-h-[250px] min-[621px]:px-6 min-[621px]:py-[22px]";
const eyebrowClass = "mb-1 text-[10px] font-bold tracking-[0.11em] text-brand-slate uppercase";
const cardTitleClass = "text-[17px] font-bold text-brand-teal";
const cardLinkClass =
  "inline-flex items-center gap-[3px] text-[11px] font-bold whitespace-nowrap text-brand-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal";
const bodyClass = "mt-2 text-[12px] leading-normal text-brand-slate";
const bigNumberClass = "text-[34px] leading-tight font-normal text-brand-navy";

function ChangePill({ value }: { value: number | null }) {
  const negative = value !== null && value < 0;
  return (
    <span
      className={`rounded-[18px] px-2.5 py-[5px] text-[11px] font-bold whitespace-nowrap text-brand-navy ${
        negative ? "bg-brand-coral" : "bg-brand-lime-bright"
      }`}
    >
      {value === null ? "Stable" : formatSignedPercent(value)}
    </span>
  );
}

function CardHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3.5">
      <div>
        <p className={eyebrowClass}>{eyebrow}</p>
        <h2 className={cardTitleClass}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const { period: rawPeriod } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const periodLabel = OVERVIEW_PERIODS.find((option) => option.id === period)?.label ?? "";
  const jar = await cookies();
  const isNewAccount = Boolean(jar.get(NEW_ACCOUNT_COOKIE)?.value);
  const workspace = workspaceFor(jar);
  const overview = overviewFor(period, overviewCompetitors(workspace.competitors), todayIsoDate());
  const { marketInterest, audienceGrowth, engagement } = overview;

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-[18px] pt-5 pb-12 min-[621px]:px-[clamp(24px,3vw,46px)] min-[621px]:pt-7">
      <div className="mb-[18px] flex flex-col gap-5 min-[621px]:flex-row min-[621px]:items-end min-[621px]:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-[0.11em] text-brand-cream uppercase">Your workspace today</p>
          <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.04em] text-brand-cream">Marketing Overview</h1>
        </div>
        <nav aria-label="Period" className="flex w-fit rounded-3xl bg-brand-cream/82 p-[3px]">
          {OVERVIEW_PERIODS.map((option) => {
            const selected = option.id === period;
            return (
              <Link
                key={option.id}
                href={`/?period=${option.param}`}
                scroll={false}
                aria-current={selected ? "page" : undefined}
                className={`min-w-16 rounded-[19px] px-3.5 py-2 text-center text-[11px] ${
                  selected ? "bg-brand-teal font-semibold text-brand-cream" : "text-[#5c5f63] hover:text-brand-navy"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div data-tour="metrics" className="relative grid grid-cols-12 gap-3.5 rounded-3xl min-[901px]:gap-[18px]">
        <article data-tour="community" className={`${cardClass} col-span-12 min-[1221px]:col-span-6`}>
          <CardHeading eyebrow="Live watchlist" title="Competitor Activities">
            <Link href="/competitors" className={cardLinkClass}>
              View details <LineIcon name="chevron" size={14} />
            </Link>
          </CardHeading>
          <div className="overflow-x-auto">
          <table className="mt-7 w-full min-w-[300px] table-fixed border-collapse text-center">
            <caption className="sr-only">Competitor activity over the last {periodLabel}</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Measure</th>
                {overview.competitors.map((row) => (
                  <th key={row.name} scope="col">
                    {row.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-brand-teal/14">
                <th scope="row" className="h-[58px] w-[70px] text-left text-[11px] font-normal text-[#697779] min-[621px]:w-[90px]">
                  Change
                </th>
                {overview.competitors.map((row) => (
                  <td
                    key={row.name}
                    className={`text-[clamp(20px,2.2vw,29px)] ${row.change < 0 ? "text-brand-blue" : "text-brand-teal"}`}
                  >
                    {formatSignedPercent(row.change)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-brand-teal/14">
                <th scope="row" className="h-[58px] text-left text-[11px] font-normal text-[#697779]">
                  Posts
                </th>
                {overview.competitors.map((row) => (
                  <td key={row.name} className="text-[clamp(20px,2.2vw,29px)] text-brand-navy">
                    {row.posts}
                  </td>
                ))}
              </tr>
              <tr aria-hidden="true">
                <td />
                {overview.competitors.map((row) => (
                  <td key={row.name} className="pt-3 align-bottom text-[11px] text-brand-blue">
                    {row.name}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          </div>
        </article>

        <article data-tour="trends" className={`${cardClass} col-span-12 min-[621px]:col-span-6 min-[1221px]:col-span-3`}>
          <CardHeading eyebrow="Market signal" title="Market Interest">
            <ChangePill value={marketInterest.change} />
          </CardHeading>
          <p className={bodyClass}>
            {marketInterest.change < 0 ? "Slight decrease" : marketInterest.change > 0 ? "Slight increase" : "No change"}
          </p>
          <div
            role="img"
            aria-label={`Market interest ${marketInterest.score} percent`}
            style={{ "--score": marketInterest.score } as CSSProperties}
            className="overview-gauge relative mx-auto mt-[34px] h-[106px] w-full max-w-[210px] overflow-hidden"
          >
            <div className="absolute inset-x-0 bottom-1 z-[2] grid justify-items-center">
              <strong className="text-[27px] font-medium text-brand-navy">{marketInterest.score}%</strong>
              <span className="text-[10px] text-[#697779]">interest score</span>
            </div>
          </div>
        </article>

        <article data-tour="audience" className={`${cardClass} col-span-12 min-[621px]:col-span-6 min-[1221px]:col-span-3`}>
          <CardHeading eyebrow={`Across ${audienceGrowth.channels} channels`} title="Audience Growth">
            <ChangePill value={audienceGrowth.change} />
          </CardHeading>
          <div className="mt-[50px] mb-6 flex items-center gap-3.5">
            <span className="text-brand-blue">
              <LineIcon name="audience" size={32} />
            </span>
            <strong className="text-[36px] font-semibold text-brand-navy">+{audienceGrowth.newMembers}</strong>
          </div>
          <p className={bodyClass}>New audience members in the last {periodLabel}</p>
          <Link href="/explore" className={`${cardLinkClass} mt-5`}>
            Explore audience <LineIcon name="chevron" size={14} />
          </Link>
        </article>

        <article className={`${cardClass} col-span-12 min-[621px]:col-span-6 min-[1221px]:col-span-3`}>
          <CardHeading eyebrow="Content response" title="Engagement">
            <ChangePill value={engagement.change} />
          </CardHeading>
          <strong className={`${bigNumberClass} mt-6 block`}>{engagement.rate}%</strong>
          <p className={bodyClass}>Engagement rate over the selected period</p>
          <div aria-hidden="true" className="mt-6 flex h-[92px] items-end gap-[9px]">
            {engagement.bars.map((height, index) => (
              <i key={index} className="block min-h-3 w-6 rounded-t-[5px] rounded-b-[2px] bg-brand-blue" style={{ height: `${height}%` }} />
            ))}
          </div>
        </article>

        <article data-tour="opportunity" className={`${cardClass} col-span-12 min-[621px]:col-span-6 min-[1221px]:col-span-3`}>
          <CardHeading eyebrow="Your next move" title="Planning" />
          <div className="mt-12 flex items-center gap-3.5">
            <span className="text-brand-blue">
              <LineIcon name="calendar" size={29} />
            </span>
            <strong className="text-[31px] font-normal text-brand-navy">
              <time dateTime={overview.nextWindow}>{formatShortDate(overview.nextWindow)}</time>
            </strong>
          </div>
          <p className={bodyClass}>Next recommended publishing window</p>
          <Link href="/ai-studio" className={`${cardLinkClass} mt-5`}>
            Open calendar <LineIcon name="chevron" size={14} />
          </Link>
        </article>

        <article className={`${cardClass} col-span-12 min-[1221px]:col-span-6`}>
          <CardHeading eyebrow="Channel comparison" title="Cross-Channel Momentum">
            <Link href="/insights" className={cardLinkClass}>
              Open report <LineIcon name="chevron" size={14} />
            </Link>
          </CardHeading>
          <ul className="mt-[26px] grid grid-cols-2 gap-2.5 min-[621px]:grid-cols-4">
            {overview.channels.map((row) => (
              <li key={row.channel} className="grid justify-items-center gap-3 text-center">
                <ChangePill value={row.change} />
                <strong className="text-[26px] font-normal text-brand-navy">
                  {row.momentum === null ? "—" : formatSignedPercent(row.momentum)}
                  {row.momentum === null && <span className="sr-only">no reach figure</span>}
                </strong>
                <span className="grid size-[54px] place-items-center rounded-full bg-brand-teal text-brand-cream">
                  <LineIcon name={CHANNEL_ICONS[row.channel]} size={20} />
                </span>
                <small className="text-[11px] font-bold text-brand-teal">{row.channel}</small>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <p className="mt-6 text-[11px] text-brand-cream/85">Sample figures for a fictional hospitality supplier.</p>

      <OverviewTour showWelcome={isNewAccount} workspace={workspace} />
    </main>
  );
}
