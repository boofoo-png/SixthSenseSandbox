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
- [ ] 4.3 Responsive layout: tiles in 1 column on phones, 2 on tablets, 4 on desktop; check in `npm run dev` at phone and desktop widths (app/analytics/page.tsx)

## Open questions
- Should the four sample platforms (Instagram, Facebook, TikTok, LinkedIn) change once user research shows which networks users post to most?
- Which KPI should the next phase chart first (engagement over time is the likely candidate)?
