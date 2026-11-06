"use client";

import Link from "next/link";
import { useState } from "react";
import { LineIcon } from "@/components/line-icons";
import type { AdTotals, CampaignResult, CountryResult, DailyRevenue, Kpi } from "@/lib/reports/ads";

// "Insights / Reports" from the team's design file: six KPI cards, the AI Insights Summary with a
// Google vs Meta revenue chart, Performance By Country, and Top Campaigns. All figures are sample
// data passed in from the page; the insights are templates.

export type ReportsData = {
  days: 7 | 30;
  kpis: Kpi[];
  platforms: Record<"Google" | "Meta", AdTotals>;
  daily: DailyRevenue[];
  peak: { date: string; revenue: number; change: number | null } | null;
  insights: { lines: string[][]; topPerformer: string; underperformer: string; suggestion: string };
  full: { wentWell: string; compared: string; revenue: string };
  countries: CountryResult[];
  countryGrowth: number | null;
  campaigns: CampaignResult[];
  score: number;
  earned: number;
  earnedChange: number | null;
  csv: string;
  fileName: string;
  business: string;
};

const card =
  "min-w-0 rounded-[22px] border border-brand-cream/70 bg-brand-cream/94 p-5 text-brand-navy shadow-[0_7px_0_rgba(0,31,62,0.16),0_18px_35px_rgba(0,31,62,0.12)] backdrop-blur-[18px] print:border-[#ccc] print:shadow-none";
const money = (value: number, short = false) =>
  short && Math.abs(value) >= 10_000 ? `$${(value / 1000).toFixed(1)}K` : `$${Math.round(value).toLocaleString("en-US")}`;
const count = (value: number) => (value >= 1_000_000 ? `${(value / 1_000_000).toFixed(2)}M` : Math.round(value).toLocaleString("en-US"));
const pct = (value: number | null) => (value === null ? "No earlier data" : `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const short = (date: string) => `${MONTHS[Number(date.slice(5, 7)) - 1]} ${Number(date.slice(8, 10))}`;
const weekday = (date: string) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(`${date}T12:00:00Z`).getUTCDay()];

function format(kpi: Kpi): string {
  if (kpi.key === "roas") return `${kpi.value.toFixed(1)}×`;
  if (kpi.key === "spend" || kpi.key === "revenue") return money(kpi.value);
  return count(kpi.value);
}

function KpiCard({ kpi, platforms, period }: { kpi: Kpi; platforms: ReportsData["platforms"]; period: string }) {
  const [open, setOpen] = useState(false);
  const detail = (totals: AdTotals) => format({ ...kpi, value: totals[kpi.key] });
  const down = kpi.change !== null && kpi.change < 0;
  return (
    <article className={card}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[16px] font-bold text-brand-teal">{kpi.label}</h3>
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} ${kpi.label} by platform`}
          onClick={() => setOpen((value) => !value)}
          className="grid size-7 place-items-center rounded-full text-brand-teal hover:bg-brand-teal/10 print:hidden"
        >
          <span aria-hidden="true" className={`text-[16px] transition-transform ${open ? "rotate-90" : "-rotate-45"}`}>
            →
          </span>
        </button>
      </div>
      <strong className="mt-3 block text-[clamp(24px,2.1vw,34px)] leading-none font-medium break-all text-brand-navy">{format(kpi)}</strong>
      <p className={`mt-3 text-[13px] font-semibold ${down ? "text-[#b3261e]" : "text-brand-teal"}`}>{pct(kpi.change)}</p>
      <p className="text-[13px] text-brand-navy">compared to last {period}</p>
      {open && (
        <dl className="mt-3 grid gap-1 border-t border-brand-teal/15 pt-2 text-[12px]">
          {(["Google", "Meta"] as const).map((platform) => (
            <div key={platform} className="flex justify-between">
              <dt>{platform}</dt>
              <dd className="font-semibold">{detail(platforms[platform])}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

/** Daily revenue, Google as a navy line and Meta as a lime area, with the peak marked. */
function RevenueChart({ daily, peak }: { daily: DailyRevenue[]; peak: ReportsData["peak"] }) {
  const width = 320;
  const height = 170;
  const max = Math.max(1, ...daily.map((day) => Math.max(day.Google, day.Meta)));
  const step = daily.length > 1 ? width / (daily.length - 1) : width;
  const point = (value: number, index: number) => `${(index * step).toFixed(1)},${(height - (value / max) * (height - 10)).toFixed(1)}`;
  const google = daily.map((day, index) => point(day.Google, index)).join(" ");
  const meta = daily.map((day, index) => point(day.Meta, index)).join(" ");
  const peakIndex = peak ? daily.findIndex((day) => day.date === peak.date) : -1;
  const every = daily.length > 10 ? Math.ceil(daily.length / 6) : 1;
  return (
    <figure className="min-w-0">
      <figcaption className="sr-only">
        Daily revenue from Google and Meta ads.{" "}
        {peak ? `Peak: ${money(peak.revenue)} on ${short(peak.date)}.` : ""}
      </figcaption>
      {peak && (
        <div className="mb-2 w-fit rounded-[10px] border border-brand-teal/20 bg-white/80 px-3 py-1.5 text-[12px] text-brand-teal">
          <span className="block">Peak Revenue · {short(peak.date)}</span>
          <strong className="text-[14px]">{money(peak.revenue)}</strong>
          <span className="ml-1 text-[11px]">{peak.change === null ? "" : `${pct(peak.change)} vs last period's daily average`}</span>
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[170px] w-full" preserveAspectRatio="none" aria-hidden="true">
        <polygon points={`0,${height} ${meta} ${width},${height}`} fill="rgba(221,254,86,0.55)" />
        <polyline points={meta} fill="none" stroke="#9ec93a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <polyline points={google} fill="none" stroke="#1d4990" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {peakIndex >= 0 && <line x1={peakIndex * step} x2={peakIndex * step} y1="0" y2={height} stroke="#03525e" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div aria-hidden="true" className="mt-1 flex justify-between text-[11px] text-brand-teal">
        {daily
          .filter((_, index) => index % every === 0 || index === daily.length - 1)
          .map((day) => (
            <span key={day.date}>{daily.length <= 7 ? weekday(day.date) : short(day.date)}</span>
          ))}
      </div>
      <ul className="mt-2 flex justify-center gap-5 text-[12px] text-brand-teal">
        <li className="flex items-center gap-1.5">
          <i aria-hidden="true" className="size-2 rounded-full bg-brand-blue" /> Google
        </li>
        <li className="flex items-center gap-1.5">
          <i aria-hidden="true" className="size-2 rounded-full bg-[#9ec93a]" /> Meta
        </li>
      </ul>
    </figure>
  );
}

function Gauge({ score }: { score: number }) {
  const ticks = 22;
  return (
    <div role="img" aria-label={`Performance score ${score} percent`} className="relative mx-auto h-[120px] w-[220px]">
      <svg viewBox="0 0 220 120" className="absolute inset-0" aria-hidden="true">
        {Array.from({ length: ticks }, (_, index) => {
          const angle = Math.PI - (index / (ticks - 1)) * Math.PI;
          const on = index / (ticks - 1) <= score / 100;
          // Rounded so the server and the browser render the same numbers.
          const x1 = (110 + Math.cos(angle) * 70).toFixed(2);
          const y1 = (110 - Math.sin(angle) * 70).toFixed(2);
          const x2 = (110 + Math.cos(angle) * 100).toFixed(2);
          const y2 = (110 - Math.sin(angle) * 100).toFixed(2);
          return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? "#ddfe56" : "#1d4990"} strokeWidth="7" strokeLinecap="round" />;
        })}
      </svg>
      <strong className="absolute inset-x-0 bottom-2 text-center text-[32px] font-medium text-brand-navy">{score}%</strong>
    </div>
  );
}

function downloadCsv(csv: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ReportsDashboard({ data }: { data: ReportsData }) {
  const [variant, setVariant] = useState(0);
  const [full, setFull] = useState(false);
  const [campaignId, setCampaignId] = useState(data.campaigns[0]?.id);
  const [exportOpen, setExportOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const campaign = data.campaigns.find((item) => item.id === campaignId) ?? data.campaigns[0];
  const period = data.days === 7 ? "week" : "30 days";
  const maxRevenue = Math.max(1, ...data.campaigns.map((item) => item.revenue));
  const top = data.countries[0];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[clamp(28px,3vw,38px)] font-medium text-brand-cream print:text-brand-navy">Insights / Reports</h1>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <div className="relative">
            <button type="button" aria-expanded={exportOpen} onClick={() => setExportOpen((value) => !value)} className="shell-glass inline-flex min-h-10 items-center gap-2 rounded-[22px] px-4 text-[13px] font-semibold text-brand-cream">
              <LineIcon name="download" size={16} /> Export Report
            </button>
            {exportOpen && (
              <ul className="absolute right-0 z-20 mt-2 grid w-56 gap-1 rounded-[14px] bg-brand-cream p-2 text-[13px] text-brand-navy shadow-[0_18px_34px_rgba(0,31,62,0.25)]">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      window.print();
                    }}
                    className="w-full rounded-[8px] px-3 py-2 text-left hover:bg-brand-teal/10"
                  >
                    PDF (print or save as PDF)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      downloadCsv(data.csv, data.fileName);
                      setExportOpen(false);
                      setNotice(`Downloaded ${data.fileName}.`);
                    }}
                    className="w-full rounded-[8px] px-3 py-2 text-left hover:bg-brand-teal/10"
                  >
                    Spreadsheet (CSV)
                  </button>
                </li>
              </ul>
            )}
          </div>
          <nav aria-label="Report period" className="flex rounded-[22px] bg-brand-cream/90 p-1">
            {([7, 30] as const).map((days) => (
              <Link
                key={days}
                href={`/insights?period=last-${days}-days`}
                scroll={false}
                aria-current={data.days === days ? "page" : undefined}
                className={`rounded-[18px] px-4 py-1.5 text-[14px] ${data.days === days ? "bg-brand-teal font-semibold text-brand-cream" : "text-brand-teal"}`}
              >
                {days} days
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <p role="status" className="mb-2 min-h-[18px] text-[12px] text-brand-cream print:hidden">
        {notice}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 min-[1201px]:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section aria-label="Key numbers" className="grid grid-cols-1 gap-4 min-[481px]:grid-cols-2 min-[901px]:grid-cols-3">
          {data.kpis.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} platforms={data.platforms} period={period} />
          ))}
        </section>

        <section aria-labelledby="insights-title" className={card}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="insights-title" className="flex items-center gap-2 text-[20px] font-bold text-brand-teal">
              <LineIcon name="sparkles" size={22} /> AI Insights Summary
            </h2>
            <button type="button" aria-label="Refresh the AI summary" onClick={() => setVariant((value) => value + 1)} className="grid size-8 place-items-center rounded-full text-brand-teal hover:bg-brand-teal/10 print:hidden">
              <LineIcon name="repeat" size={17} />
            </button>
          </div>
          <div className="mt-3 grid gap-4 min-[621px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <RevenueChart daily={data.daily} peak={data.peak} />
            <div className="text-[13px] leading-[1.55] text-brand-navy">
              <h3 className="mb-1 text-[16px] font-bold text-brand-teal">Insights</h3>
              {data.insights.lines[variant % data.insights.lines.length].map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p className="mt-1">
                <strong>Top performer:</strong> {data.insights.topPerformer}
              </p>
              <p>
                <strong>Underperforming:</strong> {data.insights.underperformer}
              </p>
              <p>
                <strong>AI suggestion:</strong> {data.insights.suggestion}
              </p>
            </div>
          </div>
          {full && (
            <dl aria-label="Full insight" className="mt-4 grid gap-3 border-t border-brand-teal/15 pt-3 text-[13px] min-[621px]:grid-cols-3">
              {[
                ["What went well", data.full.wentWell],
                [`Compared with last ${period}`, data.full.compared],
                ["Revenue summary", data.full.revenue],
              ].map(([title, text]) => (
                <div key={title} className="rounded-[12px] bg-white/70 p-3">
                  <dt className="font-bold text-brand-teal">{title}</dt>
                  <dd className="mt-1">{text}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <small className="text-[11px] text-[#4f5d5f]">Sample ad data; insights are written from the numbers with templates, not live AI.</small>
            <button type="button" aria-expanded={full} onClick={() => setFull((value) => !value)} className="shrink-0 rounded-[18px] bg-brand-teal px-5 py-2 text-[13px] font-semibold text-brand-cream hover:bg-brand-navy print:hidden">
              {full ? "Hide Full Insight" : "View Full Insight"}
            </button>
          </div>
        </section>

        <section aria-labelledby="country-title" className={card}>
          <h2 id="country-title" className="text-[20px] font-bold text-brand-teal">
            Performance By Country
          </h2>
          <div className="mt-4 grid gap-5 min-[621px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <dl className="grid content-start gap-4">
              <div>
                <dt className="text-[14px] text-brand-navy">Top Performing</dt>
                <dd className="text-[30px] font-medium text-brand-navy">
                  {top ? money(top.revenue) : "—"}
                  {top && <span className="ml-2 align-middle text-[13px] text-brand-teal">{top.name}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-[14px] text-brand-navy">Revenue Growth</dt>
                <dd className="text-[18px] font-bold text-brand-teal">{pct(data.countryGrowth)}</dd>
              </div>
              <div>
                <dt className="text-[14px] text-brand-navy">Period</dt>
                <dd className="text-[18px] font-bold text-brand-teal">{data.days === 7 ? "1 Week" : "30 Days"}</dd>
              </div>
            </dl>
            <table className="w-full border-collapse text-left text-[13px]">
              <caption className="sr-only">Revenue and conversions by country</caption>
              <thead>
                <tr className="text-[12px] text-brand-teal">
                  <th scope="col" className="pb-2 font-semibold">Country</th>
                  <th scope="col" className="pb-2 pl-3 text-right font-semibold">Revenue</th>
                  <th scope="col" className="pb-2 pl-3 text-right font-semibold">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {data.countries.map((country, index) => (
                  <tr key={country.code} className="border-t border-brand-teal/10">
                    <th scope="row" className="py-2 font-normal">
                      <span aria-hidden="true" className="mr-2 text-[18px]">
                        {country.flag}
                      </span>
                      <span className="text-[11px] text-[#5f6b6d]">{index + 1}.</span> {country.name}
                    </th>
                    <td className="py-2 text-right font-semibold">{money(country.revenue)}</td>
                    <td className="py-2 text-right">{count(country.conversions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="campaigns-title" className={card}>
          <h2 id="campaigns-title" className="text-[20px] font-bold text-brand-teal">
            Top Campaigns
          </h2>
          <div className="mt-4 grid gap-5 min-[621px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <div role="group" aria-label="Campaigns by revenue" className="flex h-[150px] items-end gap-2">
                {data.campaigns.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={item.id === campaign?.id}
                    aria-label={`${item.name} (${item.platform}): ${money(item.revenue)} revenue`}
                    onClick={() => setCampaignId(item.id)}
                    style={{ height: `${Math.max(8, (item.revenue / maxRevenue) * 100)}%` }}
                    className={`min-w-0 flex-1 rounded-t-[6px] ${item.id === campaign?.id ? "bg-brand-blue" : "bg-[#b9c7d4] hover:bg-[#93a8bc]"}`}
                  />
                ))}
              </div>
              {campaign && (
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[13px]">
                  <dt>Campaign:</dt>
                  <dd className="font-semibold text-brand-teal">
                    {campaign.name} ({campaign.platform})
                  </dd>
                  <dt>Spend:</dt>
                  <dd className="text-brand-teal">{money(campaign.spend)}</dd>
                  <dt>Revenue:</dt>
                  <dd className="text-brand-teal">{money(campaign.revenue)}</dd>
                  <dt>Conversions:</dt>
                  <dd className="text-brand-teal">{count(campaign.conversions)}</dd>
                  <dt>ROAS:</dt>
                  <dd className="text-brand-teal">{campaign.roas.toFixed(1)}×</dd>
                </dl>
              )}
            </div>
            <div className="text-center">
              <Gauge score={data.score} />
              <p className="text-[14px] text-brand-navy">Performance Score</p>
              <p className="mt-1 text-[11px] text-[#4f5d5f]">Share of spend in campaigns at a ROAS of 7× or more</p>
              <p className="mt-3 text-[14px] text-brand-navy">
                You earned {money(data.earned)} this {period}
                {data.earnedChange !== null && `, ${data.earnedChange >= 0 ? "outperforming" : "behind"} last ${period} by ${(Math.abs(data.earnedChange) * 100).toFixed(1)}%`}
              </p>
            </div>
          </div>
        </section>
      </div>
      <p className="mt-4 text-[12px] text-brand-cream print:text-brand-navy">Sample data for {data.business}: the prototype has no ad accounts connected, so spend, revenue, and campaigns are made up for illustration.</p>
    </>
  );
}
