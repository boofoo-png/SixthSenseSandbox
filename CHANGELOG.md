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
- AI Studio at /ai-studio: a step-by-step flow from trend-based content ideas to captions (friendly, playful, or professional) and hashtags with copy buttons, to scheduling at the platform's next best time; a content calendar (month grid and list with edit and delete) saved in the browser; and best times to post per platform. Suggestions are template-based and labelled as such.
- A "How to make it" content brief for every idea: shot list, ideal length, and tips, since the business creates its own photos and videos.
- Decisions: template-based AI Studio suggestions with planned posts in browser storage, and no auto-posting (the site plans content; the business creates and posts it).
- Reports at /reports: a one-page executive overview for the dates chosen in the date bar, with headline numbers, the three biggest changes, the best platform, and the plain-English summary. A "Print / Save as PDF" button opens the browser's print dialog; the printed page hides the sidebar and controls, keeps cards whole, and always prints dark text on white.
- Decision: report PDFs come from the browser's print dialog rather than a PDF library.
- SIXTH SENSE design system in the app: MUI kit colors, shadows, and type as tokens in app/globals.css, Roboto, and Button, TextField, Select, Alert, and Material icon components (components/).
- Sign-up flow from the mid-fi: Login (with a demo account), Create an Account (step 1, first and last name), and "Tell us about your industry" (step 2: industries, target regions, audience, goals with a conversion target, linked accounts, competitors, documents, team invites) with Back; the account is created when step 2 is finished. Signed-out visitors are sent to Login and unfinished sign-ups to step 2 (proxy.ts). Prototype accounts are saved in browser cookies with hashed passwords.
- "Fill with sample data" buttons on both sign-up steps, shown only when running locally.
- Dashboard at / from the mid-fi, in two versions: "New account" right after sign-up and "Have account before" (Welcome Back!, Insight Report, Revisit Findings) after signing in; plus an Ask anything page at /ask.
- Top bar with a navigation drawer (menu, search, notifications, profile, settings) and Coming soon pages for the areas not built yet.
- Team functionality list as the feature reference (docs/FUNCTIONALITY.md), with what is built so far.
- Forgot Password: a reset link for an account saved in this browser, shown on screen in the prototype; it expires after 15 minutes and works once (/forgot-password, /reset-password).
- Connect on each linked social account (simulated verification, labelled as such), Generate a link for team invites (Create an Account shows who invited you), and Add later / Add now on the optional parts of sign-up step 2.

### Removed
- The fixed "This week (..., so far ...) compared with the same days last week" sentence, replaced by the date bar.
- Unused Next.js starter images in public/.
- The Reports coming soon page and the unused ComingSoon component.
- Sidebar navigation (replaced by the mid-fi top bar and drawer).

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
- Product renamed to Sixth Sense and rebuilt around the team's mid-fi: seven areas (Insight Report, Revisit Findings, Research Competitors, Explore Audience and Trend, AI Management, Content Creation, Campaigns).
- Existing pages restyled with the SIXTH SENSE kit; light mode only (dark mode removed).
- The old overview moved from / to /insights as the start of Insight Report.
- Sign-up step 2 lets you choose several general audiences instead of one.
- Every account made in a browser is remembered (up to 5, oldest dropped first), each with its own step 2 answers, instead of each new account replacing the last.

### Fixed
- Followers change no longer counts platforms that only have data in one of the two weeks.
- The "worth a look" drop line uses the same weeks as the rest of the dashboard and skips platforms with no data this week.
- KPI tiles and the summary now round percentages the same way and agree on what counts as steady.
- Clearer summary messages when last week had no views or no engagement.
- Rows with malformed dates are ignored instead of crashing the page.
- Login could redirect to another site after signing in through a crafted `next` link (tab, line-break, or backslash tricks); it now only returns to pages inside the app.
- Very long sign-up answers could overflow the browser's cookie limit and send the person back to step 2 forever; links and text are now limited and an over-size answer shows a clear message.
- Removing and adding rows on step 2 after an error no longer brings back answers from removed rows.
- Leftover sign-up details are cleared on sign-in and sign-out, so they cannot take over another account or be seen by the next person; step 1 offers Cancel sign-up instead of a Back that signed people out without saying so.
- Continue and Back on the sign-up steps lock while one is running, so the two cannot conflict.
- AI Studio and the printable report can be reached again (links on Content Creation, AI Management, and Insight Report); the unused Geist fonts are no longer downloaded.
- Older accounts made in the same browser could not log in or reset their passwords ("No account with that email was created in this browser"); the message now explains where accounts are saved.
