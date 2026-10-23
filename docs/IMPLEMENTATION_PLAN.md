# Implementation Plan: Reports v1 (Executive Overview)

_Last updated: 2026-10-22_

## Goal
/reports shows a one-page executive overview for the dates chosen in the date bar: headline numbers, what changed, the best platform, and the plain-English summary. A "Print / Save as PDF" button prints a clean page (no sidebar or controls) that can be saved as a PDF from the browser's print dialog.

## Out of scope
- Scheduled or emailed reports (need accounts, an email service, and a server job)
- Platform breakdown, competitor, and content plan sections (possible later report sections)
- A PDF-generation library or downloadable file built by the app
- Custom branding or logos (the business name is the placeholder)

## Phase 1 - Report content (test-first)
- [x] 1.1 Executive report model: headline numbers (impressions, engagements, engagement rate, followers, clicks) with their change, the best platform by engagement rate, and the plain-English summary, for the given date ranges (lib/reports/executive.ts, executive.test.ts)
- [x] 1.2 "What changed": the three biggest noticeable moves in plain words, e.g. "Impressions up 12% (48,200 vs 43,000)", using the shared rounding and steady threshold; a "held steady" line when nothing moved noticeably (lib/reports/executive.ts, executive.test.ts)

## Phase 2 - Page and printing (test-first)
- [x] 2.1 `PrintButton` client component that opens the browser's print dialog, with a note that "Save as PDF" is in that dialog (app/(dashboard)/reports/_components/print-button.tsx, print-button.test.tsx)
- [x] 2.2 /reports page replaces "Coming soon": date bar, report header (title, period covered, comparison period, "Prepared on" date), headline tiles, what changed, best platform, and summary; mark Reports as ready in the sidebar (app/(dashboard)/reports/page.tsx, page.test.tsx, lib/navigation.ts)
- [x] 2.3 Print layout: hide the sidebar, date bar controls, and print button when printing; keep cards from splitting across pages; fit tiles to the page width (app/(dashboard)/layout.tsx, reports components)
- [x] 2.4 Remove the `ComingSoon` component and its tests once no page uses it (app/(dashboard)/_components/coming-soon.tsx)

## Phase 3 - Polish
- [ ] 3.1 Check by eye at phone and desktop widths, and in print preview (Save as PDF) that the page is clean and fits

## Open questions
- Which sections should a fuller report add next: platform breakdown, competitors, or the content plan?
- Should reports eventually be emailed on a schedule once accounts exist?

---

# Implementation Plan: AI Studio v1

_Last updated: 2026-10-13_

## Goal
/ai-studio guides a cafe owner through one flow: pick a content idea based on trends, get caption and hashtag suggestions in a chosen tone, see the best time to post, and add the post to a content calendar that is saved in the browser. Each step also works on its own, and all suggestions are smart templates labelled "Suggestions".

## Out of scope
- Real AI (Claude API), API keys, or server routes (see DECISIONS.md: rule-based suggestions)
- Actually publishing posts to social platforms, or reminders and notifications
- Saving across devices or sharing a calendar between people (browser storage only)
- A "Your business" settings box (captions use a placeholder cafe name)
- The team's shared UI components (Tabs, Dropdown, Buttons, Checkbox, Badge, Carousel); plain in-feature markup only
- The date bar on AI Studio (it plans forward; best times use recent sample data)

## Phase 1 - Suggestion logic (test-first)
- [x] 1.1 Types: `ContentIdea` (title, angle, trend, suggested platforms, format), `CaptionTone` (friendly / playful / professional), `CaptionSuggestion`, `PlannedPost` (id, date, time, platform, caption, hashtags, idea title) (lib/ai-studio/types.ts)
- [x] 1.2 Idea generator: ideas built from the sample trends (relevant first) and the user's best platforms by engagement rate; deterministic for the same inputs; a "Show different ideas" option rotates through templates (lib/ai-studio/ideas.ts, ideas.test.ts)
- [x] 1.3 Captions: three caption options per idea in the chosen tone, within each platform's length limit, plain ASCII, no repeated sentences (lib/ai-studio/captions.ts, captions.test.ts)
- [x] 1.4 Hashtags: 5-8 suggested hashtags mixing the trend, the idea, and the cafe's best-performing tags, no duplicates, valid `#word` format (lib/ai-studio/hashtags.ts, hashtags.test.ts)
- [x] 1.5 Sample engagement by weekday and hour for each platform, generated deterministically like the other sample data (lib/ai-studio/sample-timing.ts, sample-timing.test.ts)
- [x] 1.6 Best time to post: top 3 weekday-and-hour slots per platform, and the next upcoming date and time for a chosen platform (never in the past) (lib/ai-studio/best-time.ts, best-time.test.ts)
- [x] 1.7 Test-first: a content brief for every idea ("how to make it"): what to film or photograph as a shot list, ideal length, and practical tips, so the user can create the photo or video themselves (lib/ai-studio/types.ts, ideas.ts, ideas.test.ts)

## Phase 2 - Content calendar storage (test-first)
- [x] 2.1 Planned post validation and helpers: add, update, delete, sort by date and time, group by day; reject invalid dates, times, or platforms (lib/ai-studio/planned-posts.ts, planned-posts.test.ts)
- [x] 2.2 Browser storage: save and load planned posts under a versioned key; corrupted or old data is ignored safely; works when storage is unavailable (private mode) (lib/ai-studio/storage.ts, storage.test.ts)
- [x] 2.3 `usePlannedPosts` hook built on `useSyncExternalStore`, with an empty list on the server so pages render without hydration errors, and updates shared across components and browser tabs (app/(dashboard)/ai-studio/_components/use-planned-posts.ts, use-planned-posts.test.tsx)

## Phase 3 - UI (test-first)
- [x] 3.1 Step 1 "Ideas": idea cards with the trend, platforms, and format; choosing one moves to step 2 (app/(dashboard)/ai-studio/_components/idea-picker.tsx)
- [x] 3.2 Step 2 "Caption": tone choice, three caption options, hashtag list, and Copy buttons with "Copied" feedback (app/(dashboard)/ai-studio/_components/caption-studio.tsx)
- [x] 3.3 Step 3 "Schedule": platform and date/time fields prefilled with the next best time, showing the top times for that platform; "Add to calendar" saves the post (app/(dashboard)/ai-studio/_components/schedule-form.tsx)
- [x] 3.4 Content calendar: month grid on desktop and a date-ordered list on phones, with previous and next month, posts shown on their day, and edit and delete for each post (app/(dashboard)/ai-studio/_components/content-calendar.tsx)
- [x] 3.5 /ai-studio page replaces "Coming soon": step indicator, the three steps, a standalone "Best times to post" card, and the calendar; mark AI Studio as ready in the sidebar (app/(dashboard)/ai-studio/page.tsx, lib/navigation.ts)
- [x] 3.6 Test-first: "How to make it" section in the Caption step showing the idea's shot list, length, and tips (app/(dashboard)/ai-studio/_components/caption-studio.tsx)

## Phase 4 - Polish
- [x] 4.1 Labels and notices: "Suggestions" (not AI), "Sample data", and "Planned posts are saved in this browser only"
- [x] 4.2 Keyboard and screen reader pass: steps, Copy buttons, and calendar days are reachable and announced
- [ ] 4.3 Check by eye at phone, tablet, and desktop widths

## Open questions
- Should planned posts also appear on the Overview page (e.g. "Next 3 posts")?
- When accounts exist, should the calendar move to a real database so it works across devices?
- Should a "Your business" box (name, type, tone) come next, so captions stop using a placeholder?

---

# Implementation Plan: Date Range Selection

_Last updated: 2026-10-13_

## Goal

Every dashboard page (Overview, Analytics, Competitors, competitor detail) has a date bar where users pick the period to show and the period to compare it with, using quick options or custom dates. All numbers, tiles, summaries, and charts follow the selection, the choice carries across pages and can be bookmarked, and future dates cannot be picked.

## Out of scope

- Real data (sample data is generated for any past date)
- Saving date preferences per user (the selection lives in the page address)
- The team's shared UI components (Dropdown, Buttons, Tabs, etc.); the date bar uses plain native `<select>` and `<input type="date">` elements
- Hour-level or time-zone selection (whole days in server local time)
- Monthly or yearly chart grouping (the chart stays weekly, see open questions)

## Phase 1 - Date range model (test-first)

- [x] 1.1 Types and URL parsing: read `period`, `from`, `to`, `compare`, `compareFrom`, `compareTo` into a resolved main range and comparison range; no parameters means "this week vs the same days last week" (today's behaviour); malformed, reversed, or future dates fall back safely with a message; ranges longer than 366 days are capped (lib/date-range.ts, lib/date-range.test.ts)
- [x] 1.2 Quick options for the main period: this week, last 7 days, last 30 days, custom (lib/date-range.ts)
- [x] 1.3 Quick options for the comparison: previous period (same length right before; for an unfinished week, the same days last week), same period last year (Feb 29 -> Feb 28), custom (lib/date-range.ts)
- [x] 1.4 Turn a selection back into URL parameters so links can keep it; parsing then serializing gives the same selection (lib/date-range.ts)
- [x] 1.5 Describe the selection in plain words, adding the year when it is not the current year or the two ranges differ, e.g. "Showing Oct 11 - 13 compared with Oct 12 - 14, 2025." (lib/date-range.ts)

## Phase 2 - Data for any dates (test-first)

- [x] 2.1 Analytics sample data for any date range, generated per day so the same date always gives the same numbers, with values that stay realistic for any past date and the existing platform stories in recent weeks (lib/analytics/sample-data.ts)
- [x] 2.2 Competitor posts and ads for any date range, the same way (lib/competitors/sample-data.ts)
- [x] 2.3 KPI and competitor calculations take an explicit main range and comparison range instead of always deriving "this week" from the newest data (lib/analytics/kpis.ts, lib/competitors/activity.ts)
- [x] 2.4 Wording follows the selection: tiles say "vs Oct 4 - 6" and the summary says "compared with Oct 4 - 6" instead of "last week" (app/(dashboard)/\_components/kpi-tile.tsx, lib/analytics/summary.ts)

## Phase 3 - UI

- [x] 3.1 Test-first: `DateRangeBar` client component with a "Show" quick-option select, a "Compare to" select, and start/end date inputs for custom ranges (latest selectable day is today); changing it updates the page address (app/(dashboard)/\_components/date-range-bar.tsx, date-range-bar.test.tsx)
- [x] 3.2 Test-first: each page becomes a thin async wrapper that reads the address parameters and renders a synchronous, tested content component; the date bar sits at the top of Overview, Analytics, Competitors, and each competitor page (app/(dashboard)/\*\*/page.tsx)
- [x] 3.3 Test-first: sidebar and in-page links keep the current date selection; client parts that read the address are wrapped in `Suspense` as the Next.js 16 docs recommend (app/(dashboard)/\_components/sidebar.tsx)
- [x] 3.4 Competitor chart shows the calendar weeks inside the selected period (at most the latest 12) (lib/competitors/activity.ts, engagement-chart.tsx)
- [x] 3.5 Remove the hourly `revalidate` from the dashboard layout, since pages now render on each request (app/(dashboard)/layout.tsx)

## Phase 4 - Polish

- [x] 4.1 Friendly notices when the address had invalid dates, e.g. "Future dates aren't available yet, so this shows up to today."
- [x] 4.2 Check by eye at phone, tablet, and desktop widths: date bar wraps neatly, custom date inputs are usable on phones, and switching pages keeps the selection

## Open questions

- Should long selections (over 12 weeks) chart by month instead of by week?
- Should "Compare to" also offer "No comparison" (hide all changes)?
- Is 366 days the right maximum range?

---

# Implementation Plan: Competitors Section (Sample Data)

_Last updated: 2026-10-13_

## Goal

`/competitors` compares four fictional local cafes (posting frequency, engagement rate, change vs last week, active ads), each links to a detail page with their top and bottom posts, top hashtags, and active ads, and the overview's "Coming soon" cards are replaced by real Competitor activity and Trends cards. All from deterministic, tested sample data.

## Out of scope

- Real competitor data, ad library APIs (Meta, TikTok, Google), or search trend APIs
- Real company names (sample competitors are fictional; see DECISIONS.md)
- Adding, removing, or choosing which competitors to follow
- Comparing your own posts against competitors (needs post-level data for your account)
- Charts other than the engagement-over-time chart on /competitors (added 2026-10-13), and AI-written insights about trends
- Using the team's shared UI components (Tabs, Dropdown, Badge, etc.)

## Phase 1 - Data layer (test-first)

- [x] 1.1 Types: `Competitor` (slug, name, handle), `CompetitorPost` (competitor, platform, date, caption, hashtags, impressions, engagements), `CompetitorAd` (competitor, library: Meta / TikTok / Google, start and end date, format, headline), `Trend` (label, kind: topic / hashtag, source: social / search / industry, growth, relevant) (lib/competitors/types.ts)
- [x] 1.2 Deterministic sample data: four fictional cafes over 30 days ending 2026-10-09, with distinct stories (one posts often but engages poorly, one posts rarely but engages well, one running several ads), plus sample trends (lib/competitors/sample-data.ts, sample-data.test.ts)
- [x] 1.3 Make the week-splitting helper work for any dated rows, not only `DailyMetrics`, so competitor stats use the same weeks as the rest of the dashboard; existing analytics tests still pass (lib/analytics/kpis.ts)
- [x] 1.4 Activity summary per competitor: posts this week, engagement rate this week, change vs last week, and number of active ads; ignores malformed dates (lib/competitors/activity.ts, activity.test.ts)
- [x] 1.5 Competitor details: top 3 and bottom 3 posts this week by engagement rate, top 5 hashtags by use, and ads active on the latest date (lib/competitors/activity.ts, activity.test.ts)
- [x] 1.6 Trends: relevant trends first, then by growth, limited to the top N (lib/competitors/trends.ts, trends.test.ts)

## Phase 2 - Pages and cards (test-first)

- [x] 2.1 `/competitors` comparison table replacing the "Coming soon" page; each name links to its detail page; mark Competitors as ready in the sidebar (app/(dashboard)/competitors/page.tsx, page.test.tsx, lib/navigation.ts)
- [x] 2.2 `CompetitorDetail` component: top posts, bottom posts, top hashtags, and active ads, each with an empty state (app/(dashboard)/competitors/\_components/competitor-detail.tsx, competitor-detail.test.tsx)
- [x] 2.3 `/competitors/[slug]` page: thin async wrapper using `generateStaticParams`, `dynamicParams = false`, `notFound()` for unknown slugs, and a per-competitor page title (app/(dashboard)/competitors/[slug]/page.tsx)
- [x] 2.4 Overview: replace the "Coming soon" cards with a Competitor activity card (most active competitor, best engagement, active ads) and a Trends card (top trending topics and hashtags, with relevant ones marked) (app/(dashboard)/page.tsx, page.test.tsx)

## Phase 3 - Polish

- [x] 3.1 Every competitor and trend view says it is sample data with fictional businesses
- [x] 3.3 Test-first: weekly engagement rate per competitor for the last 4 weeks, using the same week boundaries as the dashboard (lib/competitors/activity.ts, activity.test.ts)
- [x] 3.4 Test-first: posts and engagement rate per platform for one competitor this week, in platform order (lib/competitors/activity.ts, activity.test.ts)
- [x] 3.5 Test-first: "By platform" section on each competitor page (app/(dashboard)/competitors/\_components/competitor-detail.tsx, competitor-detail.test.tsx)
- [x] 3.6 Test-first: engagement-over-time line chart on /competitors as server-rendered SVG with an accessible text alternative (app/(dashboard)/competitors/\_components/engagement-chart.tsx, engagement-chart.test.tsx)
- [x] 3.7 Test-first: show the actual date ranges for "this week" and "last week" on the competitors page (lib/analytics/dates.ts, lib/analytics/kpis.ts, app/(dashboard)/competitors/page.tsx)
- [x] 3.8 Test-first: sample data ends on today's date so the dashboard looks current; pages refresh hourly via `revalidate` (lib/analytics/dates.ts, app/(dashboard)/layout.tsx, vitest.setup.ts)
- [x] 3.9 Test-first: use Sunday-to-Saturday calendar weeks; an unfinished week is compared with the same days of last week, and the chart groups by calendar week (lib/analytics/dates.ts, lib/analytics/kpis.ts, lib/competitors/activity.ts, engagement-chart.tsx)
- [ ] 3.2 Check by eye at phone, tablet, and desktop widths: comparison table scrolls sideways on phones, detail pages read well, overview cards fit

## Open questions

- Should the comparison table eventually include a "You" row once post-level data for the user's own account exists?
- Next section after this: AI Studio (template-based suggestions, as chosen 2026-10-13; record as a decision when planned) or Reports?

---

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
- [x] 2.2 Test-first: `Sidebar` lists every section, marks the current page with `aria-current="page"`, and labels unbuilt sections "Coming soon" (app/(dashboard)/\_components/sidebar.tsx, sidebar.test.tsx)
- [x] 2.3 Test-first: on phones a menu button opens and closes the navigation, and choosing a link closes it (sidebar.tsx, sidebar.test.tsx)
- [x] 2.4 Dashboard layout renders the sidebar beside the page content on desktop and stacked on phones (app/(dashboard)/layout.tsx)

## Phase 3 - Pages

- [x] 3.1 Test-first: `ComingSoon` component; `/competitors`, `/ai-studio`, and `/reports` pages list the features planned in DISCOVERY.md (app/(dashboard)/\_components/coming-soon.tsx, app/(dashboard)/competitors/, ai-studio/, reports/)
- [x] 3.2 Test-first: overview page at `/` shows the KPI tiles, the plain-English summary, a market highlights card (clicks and click-through rate), the platform comparison table, and "Coming soon" cards for competitor activity and trends; remove the temporary redirect (app/(dashboard)/page.tsx, page.test.tsx; delete app/page.tsx, app/page.test.tsx)
- [x] 3.3 Share the KPI tile set between the overview and analytics pages instead of duplicating it (app/(dashboard)/\_components/)

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
