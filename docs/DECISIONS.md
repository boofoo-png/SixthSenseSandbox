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

## 2026-10-13 - App shell as a (dashboard) route group with a sidebar

Context: The app is growing from one page to several sections (Overview, Analytics, Competitors, AI Studio, Reports), and DISCOVERY.md requires users to navigate easily between them on desktop and mobile. A public marketing page may be added later and should not inherit the app's navigation.

Decision: Put all app pages in an `app/(dashboard)/` route group whose layout renders a sidebar navigation (collapsing behind a menu button on phones). URLs are unchanged because route groups are left out of the path. The sidebar is a small client component (it needs `usePathname` for the active link and state for the mobile menu); pages stay server components. Sections are listed in one config file (lib/navigation.ts), and unbuilt sections show a "Coming soon" page.

Alternatives considered: Putting the sidebar in the root layout was rejected because a future marketing or sign-in page would get the app navigation too. A top navigation bar was rejected because it runs out of room as sections grow and is harder to use on phones. Showing only built sections was rejected because placeholders let us test the navigation and show the product's direction early.

Supersedes: the temporary redirect from `/` to `/analytics` (app/page.tsx, 2026-10-13), which was a stopgap rather than a recorded decision.

## 2026-10-13 - Fictional sample competitors with statically generated detail pages

Context: The Competitors section needs data before any ad library or social API is connected. The page also needs one view per competitor, and Next.js 16 passes dynamic route params as a Promise, which makes those pages async; Vitest cannot unit test async components.

Decision: Use deterministic sample data for four fictional local cafes, labelled as sample data, in lib/competitors/. Serve each competitor at `/competitors/[slug]`, prerendered with `generateStaticParams` and `dynamicParams = false` so unknown slugs return 404. Keep each async page a thin wrapper that awaits params and renders a synchronous `CompetitorDetail` component, which is what the tests cover.

Alternatives considered: Real competitor names with made-up numbers were rejected because invented statistics next to real businesses could mislead viewers and misrepresent those companies; real names come with real data later. Putting every competitor on one long page was rejected as hard to scan and hard to link to. A dropdown to pick a competitor was not used because shared UI components are assigned to teammates.

## 2026-10-13 - Charts as hand-written SVG components, no chart library

Context: The Competitors page needs an engagement-over-time chart, and more charts will follow (analytics, reports). We had to choose between a charting library and drawing charts ourselves.

Decision: Draw charts as small React components that render SVG on the server, with scales computed in plain TypeScript functions that are unit tested. Each chart includes a text alternative (a visually hidden table) so the data is readable without seeing the chart.

Alternatives considered: Recharts was rejected for now: it adds a dependency, must run as a client component, and its interactive features (tooltips, zooming) are not needed for a prototype with a few lines. Chart.js was rejected for the same reasons plus canvas output, which is harder to test and less accessible. This can be revisited if charts need rich interaction.

## 2026-10-13 - Sample data ends on today's date; dashboard pages refresh hourly

Context: Pages now show the exact dates "this week" covers. With sample data fixed to end on 2026-10-09, the dashboard showed old dates in demos (e.g. "Oct 3 - 9" on Oct 13), which looks broken to viewers.

Decision: Pages generate sample data ending on today's date (server local time) via `todayIsoDate()`. The `(dashboard)` layout exports `revalidate = 3600`, so the prerendered pages are rebuilt at most once an hour (this option is still supported in Next.js 16 because the project does not enable Cache Components). Tests stay deterministic: a Vitest setup file fixes the clock to 2026-10-09, and sample-data functions still accept an explicit end date.

Alternatives considered: Keeping the fixed end date was rejected because demos looked stale. Rendering every request dynamically was rejected as unnecessary work for data that changes once a day. Once real data is connected, dates follow the newest data, so this only affects sample data.

## 2026-10-13 - Calendar weeks (Sunday to Saturday), unfinished week vs the same days last week

Context: The dashboard compared the last 7 days with the 7 before, so "this week" was a rolling window (e.g. Oct 7 - 13). Users expect calendar weeks that start on Sunday. But mid-week, the current week has only a few days of data, so comparing it with a full previous week would make totals (impressions, engagements, posts) look far lower than they are.

Decision: "This week" is the Sunday-to-Saturday week containing the newest data. Until Saturday, it is compared with the same days of last week (e.g. Sun - Tue Oct 11 - 13 vs Sun - Tue Oct 4 - 6), and pages say so: "This week (Oct 11 - 17, so far Sun - Tue) compared with the same days last week (Oct 4 - 6)." Once the week is complete, it is compared with all of last week. The competitor chart groups by calendar week, labelled "Week of <Sunday>". All of this lives in `periodRanges` so every page and calculation uses the same weeks.

Alternatives considered: Comparing the full current week with the full previous week was rejected because totals look misleadingly low until Saturday. Showing only the last complete week was rejected because it hides the current week's activity for up to six days. Weeks starting on Monday were rejected because the user expects Sunday starts.

Supersedes: the rolling 7-day comparison used since 2026-10-09 (not previously recorded as a decision).

## 2026-10-13 - Date range selection lives in the page address; dashboard pages render per request

Context: Users want to choose both the period shown and the period it is compared with (quick options or custom dates), on every dashboard page, instead of a fixed "this week vs the same days last week". The selection should carry across pages and be shareable.

Decision: Store the selection in URL search parameters (`period`, `from`, `to`, `compare`, `compareFrom`, `compareTo`), parsed and validated in one tested module (lib/date-range.ts). No parameters keeps the current default (this calendar week vs the same days last week). Pages read `searchParams` in thin async wrappers and render synchronous, unit-tested content components; using `searchParams` makes these pages render on each request, so the hourly `revalidate` is removed. The date bar is a client component built from native `<select>` and `<input type="date">` elements that updates the URL; client parts that read the URL are wrapped in `Suspense` per the Next.js 16 docs. Sample data is generated deterministically per day so any past range has data.

Alternatives considered: Keeping the selection in React state or browser storage was rejected because it would not carry across server-rendered pages or be shareable. A date-picker library was rejected to avoid a dependency and because native date inputs are accessible and work on phones. The team's Dropdown component was not used because shared UI components are assigned to teammates.

Supersedes: "Sample data ends on today's date; dashboard pages refresh hourly" (2026-10-13) - pages now render per request and sample data covers any past date.

## 2026-10-13 - AI Studio: template-based suggestions; planned posts saved in browser storage

Context: AI Studio needs content ideas, captions, hashtags, best posting times, and a calendar of planned posts. There is no database or user accounts yet, and the earlier decision to keep plain-language text rule-based (2026-10-09) still applies.

Decision: Generate ideas, captions, and hashtags with deterministic templates in tested TypeScript modules (lib/ai-studio/), labelled "Suggestions" in the UI. Store planned posts in the browser's localStorage under a versioned key, validated on load so corrupted or old data is ignored. Read them through a `usePlannedPosts` hook built on React's `useSyncExternalStore`, which returns an empty list during server rendering (browser storage is not available there, per the Next.js 16 server and client components guide) so pages render without hydration errors, and keeps open tabs in sync.

Alternatives considered: Real AI via the Claude API was rejected for now (API key, server route, per-use cost, and output that is hard to test); the template output can later be passed to a model as a starting point. A database was rejected because there are no accounts yet; browser storage is enough for a single-user prototype and will be replaced when accounts exist. Reading localStorage in a `useEffect` was rejected because it causes a render-then-update flash and duplicated state across components; an inline pre-paint script (from the Next.js "preventing flash" guide) was rejected as unnecessary for a list that is not visible above the fold.

## 2026-10-14 - No auto-posting: the site plans content; the business creates and posts it

Context: DISCOVERY.md originally described a "schedule auto post calendar". A caption alone is not a post: the photos and videos have to be made by the business, and publishing captions without content (or posting automatically) would not work for them.

Decision: The dashboard is a planning assistant. It suggests ideas, trends, captions, hashtags, and best times to post, gives a content brief (shot list, length, tips) for each idea, and keeps a content plan (the calendar). The business creates its own photos and videos and posts them itself. No feature publishes to social platforms.

Alternatives considered: Auto-posting captions on a schedule was rejected because posts need photos or videos the business makes. AI-generated images or videos were rejected for now: they would not show the real cafe, products, or people, and add cost and review effort. Publishing user-uploaded media through platform APIs was deferred; it needs account connections and approval from each platform, and can be revisited once accounts exist.

Supersedes: the "schedule auto post calendar" idea in DISCOVERY.md (2026-10-13), which was a product note rather than a recorded decision.

## 2026-10-14 - Report PDFs come from the browser's print dialog

Context: Reports need a PDF version to share with stakeholders. The app has no PDF tooling, and the report is a normal web page built from existing components.

Decision: Provide a "Print / Save as PDF" button that calls the browser's print dialog, where every major browser offers "Save as PDF". Use Tailwind's built-in `print:` variant to hide the sidebar, date bar controls, and buttons, and to stop cards splitting across pages. The printed report states the period covered, the comparison period, and the date it was prepared.

Alternatives considered: A PDF library (for example react-pdf or a headless browser on the server) was rejected for now: it adds a dependency, a separate layout to maintain, and server work, for no real gain over the browser's own PDF output for a one-page report. It can be revisited if reports need to be generated or emailed automatically.
