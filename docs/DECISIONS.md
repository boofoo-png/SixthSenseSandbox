# Decisions

## 2026-10-09 - Responsive web app only, no native mobile app

Context: DISCOVERY.md requires the dashboard to work on desktop and mobile browsers. The project template also mentions Expo, so we had to choose whether mobile support means a native app or a responsive website.

Decision: Build a single responsive web app in Next.js. Mobile support comes from responsive layouts in mobile browsers, not from a separate native app.

Alternatives considered: An Expo (React Native) app alongside the web app was rejected. It would mean a second codebase and UI layer to build and test, and the KPIs only ask for the dashboard to work in mobile browsers. Desktop-only was rejected because it fails the mobile-browser KPI.

## 2026-10-09 - Rule-based plain-language analytics summary

Context: DISCOVERY.md gap 2 says competitors show analytics as charts and reports, and users find marketing data overwhelming. The analytics dashboard will show a short plain-language summary ("what worked this week"), so we had to choose how to generate it.

Decision: Generate the summary with deterministic rules and sentence templates in a pure TypeScript module (lib/analytics/summary.ts), computed from the same KPI functions as the tiles.

Alternatives considered: AI-generated summaries via the Claude API were rejected for now. They need an API key, a server route, and per-request cost, and their output is hard to test under our TDD workflow. They can be layered on later, using the rule output as input. Showing no summary (tiles only) was rejected because it does not address gap 2.

## 2026-10-09 - Vitest for unit and component tests

Context: CLAUDE.md requires TDD, but the project had no test runner.

Decision: Use Vitest with React Testing Library and jsdom, configured as described in the Next.js 16 testing guide (node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md).

Alternatives considered: Jest was rejected because it needs extra transform setup for TypeScript and ESM, while Vitest works with them out of the box and is faster. Playwright (end-to-end only) was rejected for now as too heavy for testing pure calculation functions; it may be added later for full-page checks.
