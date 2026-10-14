# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Discovery and user research docs for the marketing dashboard (docs/DISCOVERY.md, docs/USER_RESEARCH.md).
- Competitor research: sourced feature comparison of Hootsuite, Sprout Social, Metricool, Keyhole, and Predis.ai, plus gaps and opportunities (docs/DISCOVERY.md).
- Architecture decision log with the responsive-web-only decision (docs/DECISIONS.md).
- Implementation plan for competitor feature research (docs/IMPLEMENTATION_PLAN.md).
- Project workflow rules (CLAUDE.md) and /sync, /plan, /done, /landed skills (.claude/skills/).
- Analytics dashboard at /analytics: KPI tiles (impressions, engagements, engagement rate, followers) with week-over-week change, and a rule-based plain-language summary, computed from deterministic sample data (app/analytics/, lib/analytics/).
- Vitest and React Testing Library test setup with `npm test` and `npm run test:watch`.
- Decisions: rule-based analytics summary, and Vitest for tests (docs/DECISIONS.md).
- Product ideas for the dashboard, AI features, and automated reporting (docs/DISCOVERY.md).
- Implementation plan and decision for the homepage overview and sidebar navigation (docs/IMPLEMENTATION_PLAN.md, docs/DECISIONS.md).
- App shell: sidebar navigation (Overview, Analytics, Competitors, AI Studio, Reports) with a mobile menu, in an app/(dashboard) route group.
- Overview page at /: KPI tiles, plain-English summary, market highlights (clicks and click-through rate), platform comparison table, and coming soon cards for competitor activity and trends.
- Coming soon pages for Competitors, AI Studio, and Reports listing their planned features.
- Click-through rate and per-platform weekly comparison in the analytics KPIs.
- Competitors section with sample data for four fictional cafes: comparison table, engagement-over-time chart (hand-written SVG with legend, hover labels, and table view), and a page per competitor with posts by platform, top and lowest posts, most used hashtags, and active ads.
- Overview cards for competitor activity and trending topics and hashtags, replacing the coming soon cards.
- Every dashboard page states exactly which dates "this week" and "last week" cover.
- Date bar on Overview, Analytics, Competitors, and competitor pages: choose the period to show (this week, last 7 days, last 30 days, or custom dates) and what to compare it with (previous period, same period last year, or custom dates). The choice is kept in the page address, carries across pages, and can be bookmarked; future dates are blocked and invalid dates show a notice.
- Sample data for any past date, so comparisons with last year work.

### Removed
- The fixed "This week (..., so far ...) compared with the same days last week" sentence, replaced by the date bar.
- Unused Next.js starter images in public/.

### Changed
- Ignore the editor's local history folder (.history/).
- Bump @types/node from 20 to 22 to match the Node 22 runtime and Vitest 5 requirements.
- The home page (/) now redirects to /analytics instead of showing the Next.js starter page (temporary until the overview page exists); replaced by the overview page.
- Site title is now "Marketing Dashboard" (placeholder name) with per-page titles, replacing "Create Next App".
- The analytics summary now describes the engagement rate, matching the Engagement rate tile.
- Restore the `@AGENTS.md` import in CLAUDE.md so agents load the Next.js 16 rules.
- Weeks are now Sunday-to-Saturday calendar weeks; an unfinished week is compared with the same days of last week (previously a rolling 7-day window).
- Sample data now ends on today's date so the dashboard looks current; dashboard pages refresh at most hourly. Tests use a fixed clock (2026-10-09).
- Dashboard pages now render on each request (they read the date selection from the address); the hourly refresh is removed.
- Tiles, summaries, tables, and the competitor chart follow the selected dates; tiles say "vs <dates>" instead of "vs last week", and the summary heading is "In plain English".
- Sample follower counts grow by a realistic yearly percentage instead of a fixed daily amount.

### Fixed
- Followers change no longer counts platforms that only have data in one of the two weeks.
- The "worth a look" drop line uses the same weeks as the rest of the dashboard and skips platforms with no data this week.
- KPI tiles and the summary now round percentages the same way and agree on what counts as steady.
- Clearer summary messages when last week had no views or no engagement.
- Rows with malformed dates are ignored instead of crashing the page.
