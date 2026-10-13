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

### Removed
- Unused Next.js starter images in public/.

### Changed
- Ignore the editor's local history folder (.history/).
- Bump @types/node from 20 to 22 to match the Node 22 runtime and Vitest 5 requirements.
- The home page (/) now redirects to /analytics instead of showing the Next.js starter page (temporary until the overview page exists); replaced by the overview page.
- Site title is now "Marketing Dashboard" (placeholder name) with per-page titles, replacing "Create Next App".
- The analytics summary now describes the engagement rate, matching the Engagement rate tile.
- Restore the `@AGENTS.md` import in CLAUDE.md so agents load the Next.js 16 rules.

### Fixed
- Followers change no longer counts platforms that only have data in one of the two weeks.
- The "worth a look" drop line uses the same weeks as the rest of the dashboard and skips platforms with no data this week.
- KPI tiles and the summary now round percentages the same way and agree on what counts as steady.
- Clearer summary messages when last week had no views or no engagement.
- Rows with malformed dates are ignored instead of crashing the page.
