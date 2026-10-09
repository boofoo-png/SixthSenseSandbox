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

### Changed
- Ignore the editor's local history folder (.history/).
- Bump @types/node from 20 to 22 to match the Node 22 runtime and Vitest 5 requirements.
