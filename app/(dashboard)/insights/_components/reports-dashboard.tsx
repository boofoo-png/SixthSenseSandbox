"use client";

import Link from "next/link";
import { useState } from "react";
import { LineIcon } from "@/components/line-icons";
import type { AdTotals, CampaignResult, CountryResult, DailyRevenue, Kpi } from "@/lib/reports/ads";

// "Insights / Reports" from the team's design file and Figma Make (re-checked 2026-11-16): six KPI
// cards, the AI Insights Summary with a Google vs Meta revenue chart, Performance By Country on the
// Make's world map, and Top Campaigns. All figures are sample data; the insights are templates.

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
  conversionGrowth: number | null;
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

/** A smooth line through the points (Catmull-Rom turned into cubic curves), as in the Make's chart. */
function smoothPath(points: readonly [number, number][]): string {
  if (points.length === 0) return "";
  const f = (value: number) => value.toFixed(1);
  let path = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [points[i - 1] ?? points[i], points[i], points[i + 1], points[i + 2] ?? points[i + 1]];
    path += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return path;
}

/** A round top for the revenue axis: 1, 2, 2.5, or 5 times a power of ten. */
function axisTop(max: number): number {
  const power = 10 ** Math.floor(Math.log10(Math.max(1, max)));
  return ([1, 2, 2.5, 5, 10].find((step) => step * power >= max) ?? 10) * power;
}

/** Daily revenue in the Make's style: Google as a teal line over a lime area, Meta as a green line, peak marked. */
function RevenueChart({ daily, peak }: { daily: DailyRevenue[]; peak: ReportsData["peak"] }) {
  const width = 320;
  const height = 170;
  const top = axisTop(Math.max(1, ...daily.map((day) => Math.max(day.Google, day.Meta))));
  const step = daily.length > 1 ? width / (daily.length - 1) : width;
  const y = (value: number) => height - (value / top) * height;
  const google = smoothPath(daily.map((day, index) => [index * step, y(day.Google)]));
  const meta = smoothPath(daily.map((day, index) => [index * step, y(day.Meta)]));
  const peakIndex = peak ? daily.findIndex((day) => day.date === peak.date) : -1;
  const every = daily.length > 10 ? Math.ceil(daily.length / 6) : 1;
  const ticks = [1, 0.8, 0.6, 0.4, 0.2, 0].map((share) => top * share);
  const axisLabel = (value: number) => (value >= 1000 ? `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : `$${value}`);
  return (
    <figure className="min-w-0">
      <figcaption className="sr-only">
        Daily revenue from Google and Meta ads.{" "}
        {peak ? `Peak: ${money(peak.revenue)} on ${short(peak.date)}.` : ""}
      </figcaption>
      {peak && (
        <div className="mb-2 w-fit rounded-[7px] border border-brand-teal/13 bg-brand-cream/94 px-[9px] py-[7px] text-[11px] text-brand-teal shadow-[0_5px_12px_rgba(0,31,62,0.08)]">
          <span className="block">Peak Revenue &middot; {short(peak.date)}</span>
          <strong className="text-[14px]">{money(peak.revenue)}</strong>
          <span className="ml-1 text-[11px]">{peak.change === null ? "" : `${pct(peak.change)} vs last period's daily average`}</span>
        </div>
      )}
      <div className="grid grid-cols-[34px_minmax(0,1fr)]">
        <div aria-hidden="true" className="flex h-[170px] flex-col justify-between text-[10px] leading-none text-brand-teal">
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {axisLabel(tick)}
            </span>
          ))}
        </div>
        <div className="min-w-0">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-[170px] w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="report-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#ddfe56" stopOpacity="0.8" />
                <stop offset="1" stopColor="#ddfe56" stopOpacity="0.18" />
              </linearGradient>
            </defs>
            {ticks.map((tick) => (
              <line key={tick} x1="0" x2={width} y1={y(tick)} y2={y(tick)} stroke="rgba(3,82,94,0.1)" vectorEffect="non-scaling-stroke" />
            ))}
            {google && <path d={`${google} L${width} ${height} L0 ${height} Z`} fill="url(#report-area)" />}
            <path d={google} fill="none" stroke="#03525e" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            <path d={meta} fill="none" stroke="#83ae72" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            {peakIndex >= 0 && <line x1={peakIndex * step} x2={peakIndex * step} y1="0" y2={height} stroke="#03525e" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
          </svg>
          <div aria-hidden="true" className="mt-1 flex justify-between text-[11px] text-brand-teal">
            {daily
              .filter((_, index) => index % every === 0 || index === daily.length - 1)
              .map((day) => (
                <span key={day.date}>{daily.length <= 7 ? weekday(day.date) : short(day.date)}</span>
              ))}
          </div>
        </div>
      </div>
      <ul className="mt-2 flex justify-center gap-5 text-[12px] text-[#647477]">
        <li className="flex items-center gap-1.5">
          <i aria-hidden="true" className="size-2 rounded-full bg-brand-teal" /> Google
        </li>
        <li className="flex items-center gap-1.5">
          <i aria-hidden="true" className="size-2 rounded-full bg-[#83ae72]" /> Meta
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

/** Where each country's pin sits on the Make's world map (public/reports/world-map.png). */
const MAP_PINS: Record<string, { top: string; left: string }> = {
  CA: { top: "33%", left: "20%" },
  US: { top: "56%", left: "20%" },
  GB: { top: "37%", left: "47%" },
  // Lower and further right than the Make, so its label clears the United Kingdom's at this text size.
  DE: { top: "52%", left: "55%" },
  AU: { top: "88%", left: "87%" },
};

type CountryMetric = "revenue" | "conversions";

/** Performance By Country: the Make's world map with metric and number-of-countries filters. */
function CountryPanel({ countries, growth, days }: { countries: CountryResult[]; growth: Record<CountryMetric, number | null>; days: 7 | 30 }) {
  const [metric, setMetric] = useState<CountryMetric>("revenue");
  const [limit, setLimit] = useState(5);
  const ranked = countries.toSorted((a, b) => b[metric] - a[metric]).slice(0, limit);
  const top = ranked[0];
  const show = (country: CountryResult) => (metric === "revenue" ? money(country.revenue) : count(country.conversions));
  const selectClass = "min-h-[30px] cursor-pointer rounded-[15px] border border-brand-teal/15 bg-white/70 px-2.5 text-[12px] text-brand-teal";
  return (
    <section aria-labelledby="country-title" className={card}>
      <div className="flex flex-col items-stretch justify-between gap-3 min-[621px]:flex-row min-[621px]:items-start">
        <h2 id="country-title" className="text-[20px] font-bold text-brand-teal">
          Performance By Country
        </h2>
        <div className="flex gap-1.5 print:hidden">
          <select aria-label="Metric" value={metric} onChange={(event) => setMetric(event.target.value as CountryMetric)} className={selectClass}>
            <option value="revenue">Revenue</option>
            <option value="conversions">Conversions</option>
          </select>
          <select aria-label="Countries" value={limit} onChange={(event) => setLimit(Number(event.target.value))} className={selectClass}>
            <option value={5}>Top 5 countries</option>
            <option value={3}>Top 3 countries</option>
          </select>
        </div>
      </div>
      <div className="mt-4 grid gap-5 min-[621px]:grid-cols-[minmax(120px,0.45fr)_minmax(0,1.55fr)]">
        <dl className="grid content-start gap-4 max-[620px]:grid-cols-2">
          <div className="max-[620px]:col-span-2">
            <dt className="text-[14px] text-brand-navy">Top Performing</dt>
            <dd className="text-[28px] font-medium text-brand-navy">
              {top ? (metric === "revenue" ? money(top.revenue) : `${count(top.conversions)} conversions`) : "\u2014"}
              {top && <span className="block text-[13px] text-brand-teal">{top.name}</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[14px] text-brand-navy">{metric === "revenue" ? "Revenue Growth" : "Conversion Growth"}</dt>
            <dd className="text-[18px] font-bold text-brand-teal">{pct(growth[metric])}</dd>
          </div>
          <div>
            <dt className="text-[14px] text-brand-navy">Period</dt>
            <dd className="text-[18px] font-bold text-brand-teal">{days === 7 ? "1 Week" : "30 Days"}</dd>
          </div>
        </dl>
        <div className="relative min-h-[240px] overflow-hidden rounded-xl bg-[linear-gradient(145deg,#f7f8f2,#e9eee4)]">
          {/* A static map from the Figma Make; plain img so it prints and keeps its shape. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/reports/world-map.png" alt="" width={960} height={491} className="absolute inset-2 h-[calc(100%-16px)] w-[calc(100%-16px)] object-contain opacity-72" />
          <ol aria-label={`Countries on the map, by ${metric}`}>
            {ranked.map((country, index) => (
              <li
                key={country.code}
                style={MAP_PINS[country.code] ?? { top: "50%", left: "50%" }}
                className="absolute z-[2] grid min-w-[56px] -translate-x-1/2 -translate-y-full rounded-[4px] border-l-[3px] border-brand-lime-bright bg-brand-cream/92 px-1.5 pt-1 pb-[3px] text-[10px] leading-[1.2] font-bold text-brand-teal shadow-[0_3px_8px_rgba(0,31,62,0.08)] after:absolute after:-bottom-[7px] after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:border-2 after:border-brand-cream after:bg-brand-teal after:content-['']"
              >
                <span>
                  <span className="sr-only">{index + 1}. </span>
                  {country.name}
                </span>
                <small className="mt-px text-[9px] font-semibold text-[#5f6f72]">{show(country)}</small>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
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

        <CountryPanel countries={data.countries} growth={{ revenue: data.countryGrowth, conversions: data.conversionGrowth }} days={data.days} />

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
