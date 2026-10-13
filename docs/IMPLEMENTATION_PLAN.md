# Implementation Plan: Homepage Overview and Navigation

_Last updated: 2026-10-13_

## Goal
Every page sits inside an app shell with a sidebar (a menu button on phones) linking Overview, Analytics, Competitors, AI Studio, and Reports. `/` is a real overview page built from sample data, and sections not built yet show a "Coming soon" page.

## Out of scope
- Building the Competitors, AI Studio, or Reports features (placeholder pages only)
- Sample competitor or trend data (the overview shows "Coming soon" cards for these)
- A public marketing landing page, sign-up, or authentication
- Charts (the platform comparison is a table)
- Real social media data (everything uses `createSampleData()`)

## Phase 1 - Data and navigation config (test-first)
- [x] 1.1 Navigation config: ordered list of sections with href, label, and status (ready / coming soon) (lib/navigation.ts, lib/navigation.test.ts)
- [x] 1.2 Click-through rate (clicks / impressions, 0 when no impressions) for the "market highlights" card (lib/analytics/kpis.ts, kpis.test.ts)
- [x] 1.3 Platform comparison: this week's totals, engagement rate, and change vs last week for each platform, using the same weeks as the rest of the dashboard (lib/analytics/kpis.ts, kpis.test.ts)

## Phase 2 - App shell
- [x] 2.1 Move analytics into a `(dashboard)` route group so it shares the shell; URL stays `/analytics` and existing tests still pass (app/(dashboard)/analytics/)
- [x] 2.2 Test-first: `Sidebar` lists every section, marks the current page with `aria-current="page"`, and labels unbuilt sections "Coming soon" (app/(dashboard)/_components/sidebar.tsx, sidebar.test.tsx)
- [x] 2.3 Test-first: on phones a menu button opens and closes the navigation, and choosing a link closes it (sidebar.tsx, sidebar.test.tsx)
- [x] 2.4 Dashboard layout renders the sidebar beside the page content on desktop and stacked on phones (app/(dashboard)/layout.tsx)

## Phase 3 - Pages
- [x] 3.1 Test-first: `ComingSoon` component; `/competitors`, `/ai-studio`, and `/reports` pages list the features planned in DISCOVERY.md (app/(dashboard)/_components/coming-soon.tsx, app/(dashboard)/competitors/, ai-studio/, reports/)
- [x] 3.2 Test-first: overview page at `/` shows the KPI tiles, the plain-English summary, a market highlights card (clicks and click-through rate), the platform comparison table, and "Coming soon" cards for competitor activity and trends; remove the temporary redirect (app/(dashboard)/page.tsx, page.test.tsx; delete app/page.tsx, app/page.test.tsx)
- [x] 3.3 Share the KPI tile set between the overview and analytics pages instead of duplicating it (app/(dashboard)/_components/)

## Phase 4 - Polish
- [x] 4.1 Replace the "Create Next App" title and description with the product name, and give each page its own title (app/layout.tsx, page metadata)
- [x] 4.2 Check by eye in `npm run dev` at phone, tablet, and desktop widths: sidebar, mobile menu, overview, and analytics tiles (also covers Analytics plan item 4.3 below)
- [x] 4.3 Delete the unused starter images (public/next.svg, vercel.svg, file.svg, globe.svg, window.svg)

## Open questions
- What is the product called? Needed for 4.1; "Marketing Dashboard" is a placeholder.
- After this plan, which section comes next: Competitors (needs sample competitor data), AI Studio, or Reports?

---

# Implementation Plan: Analytics Dashboard (Phase 1)

_Last updated: 2026-10-09_

## Goal
A responsive `/analytics` page shows headline KPI tiles and a short plain-language summary ("what worked this week"), computed from typed sample data by fully tested functions.

## Out of scope
- Charts and graphs
- Connecting real social media accounts or APIs, and authentication
- Date range picker or filters (the page uses the last 7 days of sample data vs the 7 days before)
- AI-generated summaries (rule-based only; see DECISIONS.md)
- App shell / navigation and changes to the home page
- Persisting data (sample data lives in code)

## Phase 1 - Test setup and data layer
- [x] 1.1 Install Vitest per the Next.js 16 guide (vitest, @vitejs/plugin-react, jsdom, @testing-library/react, @testing-library/dom, vite-tsconfig-paths); add `vitest.config.mts`, `"test": "vitest run"` and `"test:watch": "vitest"` scripts; confirm `npm test` runs (package.json, vitest.config.mts)
- [x] 1.2 Define types: `Platform` union and `DailyMetrics` record (platform, date, impressions, engagements, clicks, followers) (lib/analytics/types.ts)
- [x] 1.3 Test-first: deterministic sample data for Instagram, Facebook, TikTok, and LinkedIn over 30 days, with no randomness so tests are stable (lib/analytics/sample-data.ts, lib/analytics/sample-data.test.ts)

## Phase 2 - KPI calculations (test-first)
- [x] 2.1 Totals: impressions, engagements, clicks, and current followers (latest value per platform, summed); empty input returns zeros (lib/analytics/kpis.ts, lib/analytics/kpis.test.ts)
- [x] 2.2 Engagement rate (engagements / impressions), returning 0 when there are no impressions (lib/analytics/kpis.ts, kpis.test.ts)
- [x] 2.3 Per-platform breakdown of totals and engagement rate (lib/analytics/kpis.ts, kpis.test.ts)
- [x] 2.4 Period comparison: last 7 days vs previous 7 days, with percent change per KPI, handling a previous value of 0 (lib/analytics/kpis.ts, kpis.test.ts)

## Phase 3 - Plain-language summary (test-first)
- [x] 3.1 Rule: name the platform with the best engagement rate this week (lib/analytics/summary.ts, lib/analytics/summary.test.ts)
- [x] 3.2 Rule: say whether engagement went up or down vs last week and by how much, with a neutral message for small changes (summary.ts, summary.test.ts)
- [x] 3.3 Rule: flag the platform with the biggest drop as "worth a look"; return a friendly fallback message when there is no data (summary.ts, summary.test.ts)

## Phase 4 - UI
- [x] 4.1 Test-first: `KpiTile` component showing label, value, and week-over-week change (app/analytics/kpi-tile.tsx, app/analytics/kpi-tile.test.tsx)
- [x] 4.2 Test-first: `/analytics` page renders the four KPI tiles and the summary from sample data (app/analytics/page.tsx, app/analytics/page.test.tsx)
- [x] 4.3 Responsive layout: tiles in 1 column on phones, 2 on tablets, 4 on desktop; check in `npm run dev` at phone and desktop widths (app/analytics/page.tsx)

## Open questions
- Should the four sample platforms (Instagram, Facebook, TikTok, LinkedIn) change once user research shows which networks users post to most?
- Which KPI should the next phase chart first (engagement over time is the likely candidate)?
