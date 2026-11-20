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

## 2026-10-22 - Pivot to Marketing Hub, a market-research tool; old sections hidden, not deleted

Context: The team's Sixth Sense Master Site Map (FigJam) sets a new direction: "Marketing Hub", which helps a business research trends, audiences, and competitors and turn that research into campaign briefs. Its sections (Welcome and sign-in, onboarding, Dashboard, Ask the Hub, Trend Explorer, Audiences, Competitors, Opportunities, Saved Research, Settings) replace the social media dashboard scope in DISCOVERY.md. The site map is a framework that may change again.

Decision: Rename the product to Marketing Hub and rebuild the sidebar around the site map's eight app sections. Analytics, AI Studio, and Reports leave the sidebar but keep their code, tests, and URLs so parts (charts, date bar, print to PDF, templates) can be reused or brought back. Where the site map has gaps (password reset, a list of saved briefs, sign out), fill them with the simplest sensible screen rather than waiting for a final design. Sample data switches from local cafes to a fictional hospitality supplier whose customers are hotels, senior living facilities, and care homes, matching the site map's examples; competitors stay fictional for the same reason as before. Ask the Hub answers and campaign brief drafts are deterministic templates built from the sample research and labelled "Suggestions", continuing the rule-based approach (2026-10-09, 2026-10-13) so they can be tested and later replaced by the Claude API.

Alternatives considered: Deleting the old sections was rejected because the direction may change again and much of their code is reusable. Keeping them in the sidebar was rejected because they do not belong to the new product and would confuse users. Keeping the cafe business was rejected because the site map's audiences and trends are about hospitality buyers. A real AI model now was rejected for the same reasons as before (API key, cost, hard-to-test output).

Supersedes: the section list in "App shell as a (dashboard) route group with a sidebar" (2026-10-13; the route group and sidebar approach stay), the cafe businesses in "Fictional sample competitors with statically generated detail pages" (2026-10-13), and the scope in DISCOVERY.md.

## 2026-10-22 - Prototype sign-in with cookies and a proxy redirect; research items saved in the browser

Context: The site map starts with Welcome, Log In, and Get Started screens, and later screens use the business profile (industry, regions, customers). There are no accounts or database yet, and the user wants a prototype rather than real authentication.

Decision: Sign-in is simulated. One demo account (shown on the login page) signs in; anything else shows the site map's error message. Server actions set a session cookie and a business profile cookie (a small, validated JSON value), so server-rendered pages can tailor results to the profile. A `proxy.ts` file sends signed-out visitors to /welcome and signed-in users without a profile to /get-started, reading only cookies (the optimistic check described in the Next.js 16 authentication guide). The sign-in screens live in an `(auth)` route group without the sidebar. Saved research, user-added audiences, watchlist additions, and campaign briefs are stored in browser storage under versioned keys and read through `useSyncExternalStore` hooks, the same pattern as AI Studio's planned posts (2026-10-13). None of this is security: the cookies are not secret and anyone can sign in with the demo account.

Alternatives considered: A real auth provider and database were rejected for now as more setup (dependencies, secrets, hosting) than a prototype needs; the session and storage modules are the seams where they would plug in. Keeping the profile only in browser storage was rejected because server-rendered pages could not read it and the redirect rules could not run before the page loads. Skipping sign-in entirely was rejected because the site map's first screens and the onboarding profile shape the rest of the product.

## 2026-10-22 - SIXTH SENSE design system as Tailwind tokens, no MUI dependency

Context: The team's design system is the MUI for Figma kit (Material UI v9 defaults) in the SIXTH SENSE Design System Figma file. The app is built with Tailwind CSS v4, not Material UI.

Decision: Copy the kit's values (palette, disabled and state colors, elevations, radius, Roboto, type scale) into CSS variables and the Tailwind `@theme` block in app/globals.css, and build components in components/ with the MUI prop names (for example `variant`, `size`, `loading` on Button) so designs map one to one. Roboto is loaded with `next/font` and is the app's main font. The app is light mode only: the dark color overrides and the `dark:` variant are removed and the page declares `color-scheme: light`, so it looks the same whatever the visitor's system setting, and printed pages are dark text on white as before.

Alternatives considered: Installing Material UI was rejected because it would add a second styling system (Emotion) alongside Tailwind, more client-side JavaScript, and a rewrite of every existing page. Ignoring the design system and keeping the zinc styling was rejected because the team designs in the kit.

## 2026-10-22 - Follow the mid-fi: "Sixth Sense" with seven areas, a top bar, and the old sections reused

Context: Later on 2026-10-22 the team shared mid-fi screens (SIXTH SENSE Figma file, page MID-FI/HIGH-FI). They name the product Sixth Sense and organise it into seven areas reached from a dashboard ("What would you like to do?"): Insight Report, Revisit Findings, Research Competitors, Explore Audience and Trend, AI Management, Content Creation, and Campaigns, after login, account creation, and a longer onboarding. Several areas match code that the earlier pivot planned to hide: Content Creation and AI Management build on AI Studio, and Insight Report builds on Analytics and Reports. The mid-fi also shows Auto Publishing to connected accounts.

Decision: The mid-fi is the source of truth for screens and the site map for flows the mid-fi does not cover yet. The product is named Sixth Sense. Navigation follows the mid-fi: a top bar with a menu button that opens a navigation drawer, the logo linking to the dashboard, and profile and settings buttons; the dashboard tiles are the main way into each area. Analytics, Reports, and AI Studio are reused inside Insight Report, Content Creation, and AI Management rather than hidden, and their old addresses redirect to the new ones. Onboarding's account linking, document upload, and team invites are shown but only recorded in the prototype. Auto Publishing is shown as a disabled "coming later" switch: the no-auto-posting decision (2026-10-14) stands. The blue SIXTH SENSE (MUI) kit and light mode stay as decided earlier today.

Alternatives considered: Keeping the site map's eight sections and sidebar was rejected because the mid-fi is newer and more detailed. Hiding the old sections was rejected because the mid-fi brings their features back. Simulating auto-publishing was rejected to keep the product honest about what it does; real publishing needs platform approval and real account connections.

Supersedes: in "Pivot to Marketing Hub, a market-research tool; old sections hidden, not deleted" (2026-10-22), the name Marketing Hub, the eight-section sidebar, and hiding Analytics, AI Studio, and Reports (the hospitality sample business, template-based AI, and filling gaps sensibly still apply); in "App shell as a (dashboard) route group with a sidebar" (2026-10-13), the sidebar (the (dashboard) route group stays).

## 2026-10-22 - Prototype accounts are saved in a browser cookie with a hashed password

Context: Users have to create an account before using Sixth Sense, and an account they create should still sign in later. The prototype sign-in decision (2026-10-22) allowed only one demo account, and there is still no database.

Decision: Create an Account validates the mid-fi form on the server and saves the account in an httpOnly `ss_account` cookie (base64url JSON, one year) with the password salted and hashed with scrypt from node:crypto; the password as typed is never stored. Signing in accepts the demo account or the account saved in that browser, and sets an httpOnly `ss_session` cookie holding the email address (30 days with Remember Me, otherwise until the browser closes). Signing out deletes only the session, so the account can sign in again. Forms use server actions with `useActionState`, so they also work without JavaScript. Forgot password explains that reset is not available in the prototype.

Alternatives considered: Keeping accounts in server memory or a JSON file was rejected because it is lost on restart and shared by everyone using the server. Storing the password unhashed was rejected even for a prototype. Adding a database and an auth library now was rejected for the reasons in the earlier prototype sign-in entry; `lib/hub/session.ts` and `lib/hub/account.ts` are where they would plug in. This is not real security: anyone can set the session cookie by hand, and an account exists only in the browser that created it.

## 2026-10-23 - Onboarding answers saved as a business profile cookie; unfinished accounts are sent back to it

Context: The mid-fi's Create an Account flow has a second page, "Tell us about your industry" (industry, target regions, audience, goals, linked accounts, competitors, documents, team invites). New accounts were going straight to the dashboard, and later areas (research, content, campaigns) need these answers. There is still no database, file storage, email service, or platform connection.

Decision: Create an Account now continues to /onboarding. The answers are validated on the server and saved in an httpOnly `ss_profile` cookie (base64url JSON, one year, kept under 4 KB by limiting each list) that records the account's email. `proxy.ts` sends a signed-in person whose saved profile does not match their email to /onboarding until they finish; the demo account counts as finished. Social handles, document file names, and invite addresses are recorded only, and the page says so: nothing is connected, uploaded, or sent. The analytics consent checkbox is required only when handles are entered. The mid-fi's Connect, Generate a link, and Back buttons are left out because they would do nothing, and Sign out is offered instead of Back.

Alternatives considered: Letting people skip onboarding was rejected because later features depend on the profile; Settings will let them change answers. Uploading files through the server action was rejected because there is nowhere to keep them, and server actions limit request bodies to 1 MB by default. Keeping the profile in browser storage was rejected because the proxy and server-rendered pages could not read it.

## 2026-10-23 - The account is created at the end of step 2, so Back can return to step 1

Context: Step 2 of Create an Account ("Tell us about your industry") needs a Back button, as in the mid-fi. Until now, Continue on step 1 created the account and signed the person in, so there was no unfinished step 1 to go back to, and a signed-in person opening Create an Account was sent away.

Decision: Continue on step 1 validates the details and holds them, with the password hashed, in an httpOnly `ss_signup` cookie (one day); the person is not signed in yet. `proxy.ts` lets someone holding that cookie move between /create-account and /onboarding, and sends anyone else who opens /onboarding without an account to /create-account. Back on step 2 is a second submit button (`formAction`) that saves the step 2 answers in an `ss_onboarding_draft` cookie (skipped if too large) and opens step 1 filled in; there, leaving both password fields blank keeps the password already chosen. Continue on step 2 creates the account (`ss_account`), signs in (`ss_session`), saves the profile (`ss_profile`), and clears the sign-up and draft cookies. Continue is the first submit button so pressing Enter never goes back. A signed-in account that never finished step 2 (created before this change) sees Sign out instead of Back.

Alternatives considered: Keeping account creation at step 1 and turning step 1 into an "edit your details" page was rejected as more complicated for the person and the code, since they expect one sign-up that finishes at the end. A Back link that discards step 2 answers was rejected because step 2 is long. The trade-off is that someone who leaves during step 2 has no account yet; their step 1 details are kept for a day in that browser.

Supersedes: in "Prototype accounts are saved in a browser cookie with a hashed password" (2026-10-22), creating the account and signing in on step 1; in "Onboarding answers saved as a business profile cookie" (2026-10-23), Sign out being offered instead of Back during sign-up.

## 2026-10-23 - Step 2 always shows Back

Context: Step 2 showed Sign out instead of Back to accounts that were signed in before finishing it (created before the account moved to the end of step 2). People testing the prototype with such an account saw Back on step 1 but not on step 2, which looked like a bug.

Decision: Step 2 always shows Back next to Continue. For a signed-in account that never finished step 2, Back turns it back into a sign-up: its saved details (with the existing password hash) go into the `ss_signup` cookie, the session ends, and step 1 opens filled in. Finishing step 2 signs it in again. Sign out is no longer shown on step 2.

Supersedes: in "The account is created at the end of step 2, so Back can return to step 1" (2026-10-23), showing Sign out instead of Back to such accounts.

## 2026-10-23 - Two dashboard versions; the old overview becomes the start of Insight Report

Context: The team's mid-fi now has two dashboards: "DASHBOARD - New account" (four tiles) and "DASHBOARD - Have account before" (Welcome Back!, plus Insight Report and Revisit Findings tiles). The app's dashboard was still the old social media overview, and the mid-fi top bar has menu and search on the left and notifications, profile, and settings on the right, without the product name.

Decision: Finishing sign-up sets a session-length `ss_new` cookie, and the dashboard shows the "New account" version while it is present; signing in clears it, so returning people (and the demo account) see the "Have account before" version. The tiles use matching Material icons inside the mid-fi's grey circles (the mid-fi still has "icon" placeholders), and the arrow beside each title reveals a one-sentence description. The old overview page (KPI tiles, summary, competitor activity, trends) moves to /insights as the first version of Insight Report, so that tile leads somewhere real; Insight Report keeps growing as planned in Phase 10. The top bar follows the mid-fi; the search icon and Ask anything both open /ask, which repeats the question and states that answers come later, and the notifications bell says there are none yet. The stray vertical slider in the "Have account before" frame is treated as a work-in-progress element and left out.

Alternatives considered: Choosing the version by whether the account has saved findings or reports was rejected because nothing can be saved yet, so everyone would see the "New account" version. Keeping the old overview at / was rejected because it no longer matches the product.

## 2026-10-29 - Team functionality list as the feature reference; simulated reset, verification, and invites

Context: The team updated its functionality list (saved as docs/FUNCTIONALITY.md). For Account it adds a working Forgot Password reset link, verifying linked social media accounts, an invite link, and Add Later on optional sign-up steps. The prototype still has no email service, no platform connections, and no shared team accounts.

Decision: docs/FUNCTIONALITY.md is the reference for what each area must do; the mid-fi still decides how it looks, and the plan follows both. Forgot Password makes a reset link for the account saved in this browser and shows it on screen instead of emailing it; the `ss_reset` cookie keeps only a SHA-256 hash of the token, the link expires after 15 minutes, works once, and the demo account cannot be reset. Connect on each social account checks the handle and marks it verified, stored as `verified` in the profile; the page says verification is simulated. Generate a link makes /create-account?invite=<code>, where the code names the inviting company, and Create an Account shows "You were invited to join ...". Add later hides an optional part of step 2 (social accounts, competitors, documents, team invites) so nothing from it is submitted; Add now brings it back.

Alternatives considered: Leaving these as "not available" notes was rejected because the team listed them as functions to demonstrate. Sending real reset emails or connecting real platform accounts was rejected for the prototype (needs an email service, platform approval, and real accounts). Showing a fake platform sign-in window for Connect was rejected because it would imitate another company's login page.

## 2026-10-29 - Every account made in a browser is remembered, each in its own cookies

Context: Accounts and business profiles were kept in one `ss_account` and one `ss_profile` cookie, so each new account replaced the previous one. Testers who made several accounts (for example with Fill with sample data) found that older accounts could not log in or reset their passwords ("No account with that email was created in this browser"), and their step 2 answers were overwritten.

Decision: Each account is saved in its own `ss_account_<key>` cookie and its business profile in `ss_profile_<key>`, where the key is the base64url form of the email (lib/hub/account-key.ts). Sign-in, Forgot Password, reset, Back from step 2, and the proxy's onboarding check look up the account by email (lib/hub/accounts.ts, profileValueFor in lib/hub/profile.ts), still reading the old single cookies so earlier accounts keep working; saving an account or profile again moves it to its own cookie. Accounts record when they were saved, and at most 5 are kept within a 12 KB cookie budget, dropping the oldest account and its profile first, because browsers and Node's default 16 KB request header limit cap how many cookie bytes a request may carry. The Forgot Password error now explains that accounts exist only in the browser where they were created, once both sign-up steps are finished.

Alternatives considered: One cookie holding a list of all accounts was rejected because a single cookie is limited to about 4 KB, which a few accounts with profiles would exceed. Keeping accounts in browser storage (localStorage) was rejected because the proxy and server actions cannot read it. A database remains the real answer once accounts are real.

Supersedes: in "Prototype accounts are saved in a browser cookie with a hashed password" (2026-10-22) and "Onboarding answers saved as a business profile cookie" (2026-10-23), the single `ss_account` and `ss_profile` cookies.

## 2026-10-30 - Login follows the high-fi look in its own route group, with darker text than the frame

Context: The team's newer "Log In" frame (node 9914:13059) replaces the mid-fi login with a logo, Montserrat, a full-page lime-to-blue gradient, and a glass card. The other sign-in pages have no high-fi versions in this work yet. The frame's near-white heading and field text and its black links are hard to read on the gradient, and it leaves out Remember Me, which docs/FUNCTIONALITY.md requires.

Decision: /login moves to an `app/(login)/` route group with its own layout, so its look and font do not change Create Account or Forgot Password. The styleguide colors become `brand-*` tokens in app/globals.css, and Montserrat is loaded only in that layout. Text on the card uses the styleguide's navy (#001F3E) and the card is 40% cream rather than 20%, so text stays readable wherever the card lands on the gradient. Create Account and Forgot Your Password sit inside the card. Remember Me, show password, the sign-in error, and the demo account note stay.

Alternatives considered: Copying the frame's colors exactly was rejected because the text fails readable contrast. Restyling the shared (auth) layout was rejected because the other pages would change with no design to follow.

Supersedes: for /login only, the mid-fi login screen and the Roboto font in "SIXTH SENSE design system as Tailwind tokens, no MUI dependency" (2026-10-22).

## 2026-10-30 - Auto-post stays disabled although it is on the team's functionality list

Context: The team's updated list (docs/FUNCTIONALITY.md) adds an Auto-post function under AI Community Management: schedule content releases and post automatically. The 2026-10-14 decision says no feature publishes to social platforms, and social connections in the prototype are simulated.

Decision: Keep the 2026-10-14 decision. Users can schedule content onto the calendar, but nothing posts automatically, and Auto Publishing is a disabled "coming later" switch with a note that the business posts itself. The function is marked as not built in docs/FUNCTIONALITY.md.

Alternatives considered: A simulated auto-post that marks posts as Posted when their time passes was rejected, because the original reasoning still applies and a post that looks published could mislead testers. Real publishing was rejected for the prototype (needs real accounts, a server, stored tokens, and each platform's approval).

## 2026-10-30 - Report exports are PDF or CSV; scheduled reports catch up in the browser

Context: The list adds Report Exports (the user selects a format) and Schedule reports (export automatically at the selected time). Reports can only be printed today, and the app has no server job, database, or email service, so nothing can run while it is closed.

Decision: Exports offer PDF, through the existing print dialog (2026-10-14 decision), and CSV, built in the browser with no new dependency. Cells that spreadsheets would run as formulas are escaped. Schedules (frequency, time, format) are saved in the browser's localStorage under a versioned key, like planned posts. Reports that came due are listed as ready the next time the app is opened, each covering its own period; CSV downloads from the list, and PDF opens the report ready to print because a browser cannot save a PDF unprompted. The page states this limit.

Alternatives considered: Adding XLSX was rejected because it needs a spreadsheet library for little gain over CSV, which Excel opens. A real server job was rejected because it needs a database, a scheduler, and an email service. Saving the schedule without ever producing a report was rejected because nothing would actually be exported.

## 2026-10-30 - All Content Creation tools are templates; uploaded files stay in the browser

Context: The list adds Video, Blog, Ad Copy, Edit Posts, Improve Copy, Repurpose Content, and Upload Your File, described as AI-powered, beside Social Post. The plan had left them as "Coming soon". The prototype's suggestions are templates (2026-10-13 decision) and it has no server storage for files.

Decision: Build all eight tools with deterministic templates in tested modules under lib/hub/content/, labelled "Suggestions". Upload Your File reads TXT, MD, and CSV in the browser; PDF, DOCX, XLSX, PNG, and JPG show the file name and ask for pasted text. No file leaves the browser.

Alternatives considered: Real AI through the Claude API was not reopened here; it still needs an API key, a server route, and per-use cost, and the template modules can feed a model later. Parsing PDF, DOCX, and XLSX was rejected for now because it needs several libraries for one prototype screen.

Supersedes: the plan's out-of-scope line leaving these tools as "Coming soon" (a plan note, not a recorded decision).

## 2026-10-30 - Login uses the updated frame's colors, including its cream text

Context: The team updated the "Log In" frame (node 9914:13059): a green radial gradient, a cream logo with a welcome and tagline, a "Let's start" card, and cream text. The user asked for /login to match it. Measured on the rendered page, cream text on the card reaches about 2.1:1 to 2.8:1 contrast, below the 4.5:1 WCAG AA minimum for normal text, and the blue Forgot Your Password link about 4:1.

Decision: Follow the frame's colors and layout. The gradient is saved as public/brand/login-gradient.svg because CSS radial gradients cannot rotate. Remember me, show password, the sign-in error, and the demo account note stay, although the frame does not show show password or the note. The low contrast is raised with the team as an open question in the plan rather than changed in code.

Alternatives considered: Keeping the navy text from the earlier version was rejected because it would no longer match the frame the user asked to follow.

Supersedes: "Login follows the high-fi look in its own route group, with darker text than the frame" (2026-10-30), for its text and card colors and the frame contents. The route group and tokens stay.

## 2026-11-04 - Dashboard and signed-in shell follow the Figma Make

Context: The team shared a Figma Make prototype, "Marketing Intelligence Hub" (figma.com/make/ZKaGiBF0XpdUruvGEjvrTa). Its dashboard is a "Marketing Overview" of six metric cards inside a sidebar layout on a green gradient, with a Sense AI drawer and a first-visit welcome and tour. The user asked to replace the dashboard with it, including everything on that page.

Decision: / becomes the Make's Marketing Overview, and every signed-in page gets the Make's sidebar and top bar in place of the mid-fi top bar and menu drawer. The sidebar uses the Make's menu and wording (updated 2026-11-05 at the user's request): Overview, Audience (/explore), Competitors, Content studio (/content), Community (/ai-management), Calendar (the AI Studio calendar), Reports (/insights), and Integrations (/settings). Revisit Findings and Campaigns are no longer in the sidebar until the Make or the team places them. The figures are tested sample data (the 30-day ones match the Make). The 7 days / 30 days switch writes the date bar's `period` so the choice carries to other pages. Sense AI gives a labelled sample answer. The welcome and tour show once, after sign-up, by clearing the `ss_new` cookie. Pages not redesigned yet keep their light look and Roboto type on a rounded panel inside the shell.

Alternatives considered: Keeping the tiles and adding the cards below was offered and not chosen. Keeping this app's seven area names in the sidebar was tried first and replaced on 2026-11-05 because it did not match the Make.

Supersedes: the top bar and navigation drawer in "Follow the mid-fi" (2026-10-22), and the tile dashboard decided with the `ss_new` cookie, for the dashboard's content. The cookie itself stays.

## 2026-11-05 - Target Audience follows the Figma Make's Audience page

Context: The user asked to build the Audience page from the team's Figma Make "Marketing Intelligence Hub". It covers all four Target Audience functions (FUNCTIONALITY.md): search by category, filters with list or chart, a default audience, and suggested audiences.

Decision: /explore becomes the Make's Audience page with its six sample audiences for a hospitality supplier. Search, filters, view, and the selected audience live in the page address (like the date range); filters are native selects until the team's Dropdown lands, applied with Apply filters, while typing shows matching audiences right away. The default audience is saved as `defaultAudience` in the business profile cookie, the same way tracked competitors are; until one is saved it comes from the first sign-up audience type (Commercial and Industrial to procurement teams, Institutional to senior living, Residential to property managers). Suggestions are templates naming the tracked competitors and say they are not live AI.

Alternatives considered: The Make's filter buttons cycle through values on each click; rejected because a select shows every choice at once and works with the keyboard. Keeping filters only in component state was rejected because the plan asks for the view to be remembered while browsing.

## 2026-11-05 - Research Competitors follows the Figma Make's Competitors page

Context: The user asked to update /competitors to the Make's Competitors page. The Make shows fixed numbers for three named companies; the app already generates sample posts and ads for the competitors each business tracks.

Decision: Use the Make's layout and wording, filled from the existing sample posts and ads for the tracked competitors and the date bar's period, so the numbers change with the competitors and dates chosen. Track / Tracking buttons save through the existing tracked-competitors action, one competitor at a time; sign-up competitors stay first. Audience match is a stable sample score. The Make's "Campaign alerts" toggle and "Live" badge are left out because nothing would send an alert; the channel panel is labelled Sample and links to the competitor's full profile instead. The mid-fi's findings chips (Most viewed post, and so on) and the weekly engagement chart are not on the Make page and are removed from it; their modules stay in lib/ for reuse.

Alternatives considered: Copying the Make's fixed figures was rejected because they would not match the competitors a business tracks. Keeping the mid-fi sections below the Make layout was rejected to keep the page the Make's.

Supersedes: the mid-fi layout of /competitors (plan 5.1) for this page.

## 2026-11-05 - Content Creation follows the Figma Make's Content studio

Context: The user asked to build the Content Creation page from the Make. The Make's "Content studio" is one composer with four formats (Social post, Campaign, Email, Article), today's ideas, and a campaign board; FUNCTIONALITY.md lists eight separate tools.

Decision: /content becomes the Make's Content studio. Drafts are deterministic templates (lib/hub/content/studio.ts) chosen by the idea's theme and shaped by format, written for the default audience from the Audience page, and labelled as suggestions, not live AI (2026-10-30 decision). "Add to campaign" saves the draft in this browser's localStorage under a versioned key, since there are no campaigns yet; the board counts saved drafts and AI Studio's planned posts and links to the calendar. Copy is added so a draft can be used straight away. The other tools from FUNCTIONALITY.md stay open in the plan.

Alternatives considered: Building the eight separate tool pages first was not chosen because the user asked to follow the Make. Real AI was not reopened (needs an API key, a server route, and per-use cost).

## 2026-11-05 - Sidebar follows the team's updated Figma Make

Context: The team updated the Make. Its sidebar now lists seven destinations (Overview, Audience, Competitors, Content Creation, Campaigns, AI Management, Reports) with no "Workspace" label, and has only Settings and Help icon buttons at the bottom; the Sense AI card and the profile block are gone. Community, Calendar, and Integrations were removed.

Decision: Match it. Help opens the Sense AI drawer, as in the Make. Sign out moves to the Settings page, where the Make has it. Reports opens Insight Report. The Next.js development badge moves to the bottom-right (next.config.ts) because it covered the sidebar; it only shows during development.

Supersedes: the sidebar menu and profile block in "Dashboard and signed-in shell follow the Figma Make" (2026-11-04).

## 2026-11-05 - Content Creation, AI Management, and Campaigns follow the updated Figma Make

Context: The team updated the Make the same day. Content Creation became a hub of eight tools (four to create, four to edit), matching FUNCTIONALITY.md; AI Management became a community inbox; and Campaigns became a campaign brief with a generated draft. The user asked for the app to match the current Make.

Decision: Build all three. Content tools live at /content/<tool>, write from shared tested templates (lib/hub/content/), and save in the browser under a versioned key so Repurpose can reuse them. The Make's sample photos are stored in public/content rather than loaded from Unsplash. The inbox uses sample messages; approving a reply only records it in the browser, because no real accounts are connected. Campaign drafts are templates built from the brief and are labelled as mock proposals. Where the Make leaves something unclear, the smallest working choice is made: Edit Posts gets a caption box (an image has no text to edit), Upload allows 10 MB as the Make says but still only reads TXT, MD, and CSV (2026-10-30 decision), and the launch date is a date picker.

Alternatives considered: Keeping the single Content studio composer was rejected because the Make replaced it. Building AI Management as the planned posting plan and calendar was not chosen because the Make shows an inbox; those plan items stay open.

Supersedes: "Content Creation follows the Figma Make's Content studio" (2026-11-05, earlier the same day).

## 2026-11-05 - Reports follows the Figma Make with the app's own numbers

Context: The Make's Reports page shows total clicks, website traffic, conversions, and engagement, with PDF, CSV, and Presentation exports and a monthly schedule. The app's sample analytics have clicks, impressions, followers, and engagement, but no website traffic or conversions.

Decision: Rebuild /insights (the sidebar's Reports) in the Make's layout with the app's sample analytics, so every number follows the chosen dates (the user chose this over copying the Make's fixed figures). Impressions and followers take the places of website traffic and conversions until real web or sales data is connected. PDF opens the existing printable report, CSV downloads the daily numbers with formula-safe cells, and the monthly export is saved in the browser and offers last month's report when Reports is next opened (2026-10-30 decision). Presentation is shown as not available. The old Insight Report sections (cafe competitor highlights, trends, platform table) are dropped from this page.

Alternatives considered: Copying the Make's fixed numbers was rejected because they would never change and would suggest website traffic and conversions are tracked.

## 2026-11-05 - AI Management follows the functionality list: posting plan, calendar, and plan generator

Context: The team's updated functionality list describes AI Management as an "AI Content Manager" (posting plan, content calendar, upcoming posts, Auto Publishing, a three-step plan generator, and separate schedules for Hotel Depot and Hospitality Emporium); the design file has matching screens. The Figma Make shows a community inbox instead, which had been built earlier the same day. The user chose the functionality list (and asked to be asked about each list-vs-Make conflict rather than following a fixed rule).

Decision: Replace the inbox with the posting plan, calendar, and generator from the design file. Recommendations come from sample engagement (lib/ai-studio/sample-timing) weighted per business; drafts are templates; everything is saved in the browser. On the user's choices: Auto Publishing is a working switch that is clearly labelled as simulated, so posts stay Scheduled and nothing is published; sample posts are written for a hospitality supplier rather than the design's travel examples; Hotel Depot and Hospitality Emporium are added as two businesses with separate schedules; Campaigns stays in the sidebar although the list and design leave it out.

Alternatives considered: Keeping the inbox, alone or as a second tab, was offered and not chosen. Marking posts as published when their time passes was rejected because nothing is really posted.

Supersedes: the no-auto-posting decision (2026-10-14, reaffirmed 2026-10-30) for the switch itself: it can now be turned on, but it still posts nothing. Also supersedes the inbox part of "Content Creation, AI Management, and Campaigns follow the updated Figma Make" (2026-11-05).

## 2026-11-05 - Reports follows the design file with sample ad data; Competitors keeps its current layout

Context: The updated functionality list and the team's design file ("INSIGHTS / Reports") describe Reports around ad spend, revenue, ROAS, and conversions from Google and Meta, with performance by country and top campaigns. The prototype has no ad accounts. The list also adds findings filters, campaign cards, a comparison with your own content, an evidence note, and "Your next move" to Competitors.

Decision: Rebuild Reports from the design file on generated sample ad data for six Google and Meta campaigns (lib/reports/ads.ts), labelled as sample on the page. Every number follows the 7 / 30 day switch; insights are templates written from the numbers. Performance by Country is a ranked list with flags rather than a map, so no map library is added. Export Report offers PDF (the browser's print) and CSV; the monthly export schedule is removed. The performance score is the share of spend in campaigns at a ROAS of 7x or more. Competitors is left as it is: the list's additions are not built (user's decision).

Alternatives considered: Keeping Reports on the social analytics, and copying the design's fixed numbers, were offered and not chosen. A world map was offered and not chosen.

Supersedes: "Reports follows the Figma Make with the app's own numbers" (2026-11-05), and the plan's out-of-scope line about ad-platform data for Reports (sample ad data is now shown).

## 2026-11-06 - Settings follows the Figma Make and saves for real

Context: The Make has one "Profile and settings" page (Profile, Workspace, Notifications, Security) that its company-name button opens; the app had "Coming soon" pages for Settings and Profile. The functionality list asks for the company name to open the account and company profile, and the Settings icon to open account settings.

Decision: Build the Make's page and make it work: answers are saved per account in their own cookie (kept within the cookie budget and removed with old accounts), and the saved name and company replace the sign-up ones across the app. Email is shown but not editable, because it is the login and changing it would mean moving every per-account cookie. Change password works for accounts created in this browser (checking the current password); the demo account's password stays fixed so the shared login keeps working. Sessions shows only this browser, since sign-in is kept in the browser. Two notification types are renamed to features that exist (scheduled post reminders instead of the removed community inbox, report reminders instead of the removed report schedule). /profile redirects to Settings.

Alternatives considered: A separate Profile page, as the old plan had, was dropped because the Make combines them. Letting people change their email was rejected for the prototype.

## 2026-11-06 - Revisit Findings is dropped

Context: Revisit Findings came from the original mid-fi. It is in neither the Figma Make nor the updated functionality list, and its "Coming soon" page had no links left.

Decision: Remove /findings, its navigation entry, and the shared "Coming soon" page (no unbuilt pages are left). Features that appear in neither the Make nor the functionality list are treated as potentially scrapped (user, 2026-11-06).

## 2026-11-06 - One sample business everywhere, chosen from the company menu

Context: The sample data did not agree from page to page: the sign-up business showed on most pages, AI Management had its own switcher for Hotel Depot and Hospitality Emporium, and Reports ignored both. The functionality list asks for separate schedules for Hotel Depot and Hospitality Emporium and for Performance by Country to cover both.

Decision: The demo account owns both businesses (Hotel Depot is its company). The company name button in the top bar becomes a menu that switches business (saved in a cookie, checked on the server) and links to Profile and settings. The dashboard, Reports, AI Management, and Content Creation use the chosen business, each with its own sample figures. Accounts created in the browser have one business, their own, so the switch does not show for them. AI Management's own switcher is removed.

Alternatives considered: Renaming the demo business to one name and dropping the second business was not chosen (user's choice).

Supersedes: the switcher part of "AI Management becomes the posting plan" (2026-11-05): the switch moved to the top bar.

## 2026-11-06 - Old pages are removed, not kept behind links

Context: The old AI Studio, Analytics, Reports, competitor detail, and Findings pages were no longer linked but still built and tested, and AI Studio kept a second calendar next to AI Management's.

Decision: Delete them with their code and tests, and redirect their addresses (temporary redirects, so they can change later): /ai-studio to /ai-management, /analytics and /reports to /insights, /competitors/<name> to /competitors, /findings to the dashboard. AI Management's calendar is the only calendar. Content Creation reaches it through Add to calendar, which reuses the calendar's post editor so a post made either way is the same.

Alternatives considered: Keeping the competitor detail pages was offered and not chosen (user's decision).

## 2026-11-06 - Connect Instagram and Facebook first, read-only, through Meta in development mode

Context: The team wants a real social media connection. Of the app's channels, YouTube was the quickest to set up and Meta the most useful for a hospitality supplier; Bluesky was even easier but is not one of the app's channels or in the Figma Make.

Decision: Connect Instagram professional accounts and Facebook Pages through Facebook Login for Business on Graph API v26.0, with the Meta app kept in development mode so teammates added as testers can connect without app review. Read only: followers, reach, views, engagement and top posts. Each business chosen in the top bar has its own connection. Live numbers replace the sample ones on Overview and in a new Reports section, labelled as live, and everything falls back to labelled sample data when there is no connection or Meta fails.

Alternatives considered: YouTube first (easier, less relevant) and Bluesky (easiest, but new to the app) were offered and not chosen. Posting was left out to avoid test posts going to real accounts. One connection per sign-in was not chosen because the business switcher would stop meaning anything for these numbers.

Supersedes: the plan's "Real social account connections" out-of-scope line, for Instagram and Facebook read access only. Onboarding's social step stays simulated.

## 2026-11-06 - Meta tokens are kept in an encrypted httpOnly cookie

Context: A connection needs Meta's long-lived access token (about 60 days) on the server, and the app has no database; accounts and settings already live in cookies.

Decision: Seal the token with AES-256-GCM (node:crypto, no new dependency) using SOCIAL_TOKEN_SECRET from .env.local, bound to the account email and business id, and store it in an httpOnly, SameSite=Lax cookie (Secure in production) per account and business. Browser JavaScript never sees it, and it is never sent to client components or put in URLs. Meta is called only from the server, with results cached in memory for 15 minutes.

Alternatives considered: A Postgres database (Supabase or Neon) was offered and not chosen for the prototype; it would allow background sync and refresh but adds a service and setup for the team. A JWT library such as jose (suggested by the Next.js guide) was not needed for one encrypted value.

## 2026-11-06 - Sixth Sense joins the demo account's businesses

Context: Hotel Depot and Hospitality Emporium are businesses owned by the team's clients. The team's own Instagram (@sixthsenseapp) was connected under Hotel Depot to test the Meta connection, which made a client's slot show the team's numbers.

Decision: Add "Sixth Sense" (id sixth-sense) as a third business in the demo account's company menu, for the team's own accounts. Hotel Depot stays first and is still the default; Sixth Sense uses the same sample patterns as Hotel Depot until its Instagram is connected.

Alternatives considered: Renaming Hotel Depot, or dropping Hospitality Emporium, was not chosen because both belong to real clients.

## 2026-11-06 - The demo account works on Sixth Sense only, for now

Context: The team is testing with its own accounts (@sixthsenseapp on Instagram and the Sixth Sense Facebook Page) and does not want the clients' Hotel Depot and Hospitality Emporium in the way while it does.

Decision: The demo account's only business is Sixth Sense (id sixth-sense, handle @sixthsenseapp, website sixthsense.example), so the company menu has no switch and every page shows Sixth Sense. Its sample figures are the ones Hotel Depot had. The clients' businesses and their sample data stay in the code (lib/hub/businesses.ts, posting-plan.ts, overview.ts, reports/ads.ts) and come back by adding them to the demo list in lib/hub/workspace.ts.

Supersedes: "Sixth Sense joins the demo account's businesses" (2026-11-06) and the demo-account part of "One sample business everywhere, chosen from the company menu" (2026-11-06). The switcher itself still works whenever an account has more than one business.

## 2026-11-16 - Audience becomes the Make's Audience Trends tracker

Context: The team's Figma Make replaced the Audience page with a "Live audience trend tracker": audiences saved to the profile (broad or niche), audience depth and source filters, a momentum-versus-fit radar, a watchlist, a ranked trend list, and campaign direction for the chosen trend. docs/FUNCTIONALITY.md no longer describes this page, so the Make is the source.

Decision: /explore follows the Make and the sidebar says "Audience Trends". Trends and suggested audiences are the Make's sample data (lib/hub/audience-trends.ts). Saved audiences, which ones are selected, and the watchlist are kept in this browser under "sixthsense.audience-trends" (version 1); a first visit starts with the Make's Hospitality buyers and Conscious travellers selected and Direct booking value watched. The old filters (industry, age, region, interest), Set as default audience, and competitor-based suggestions are gone from the page. Content Creation and Campaigns still read a saved default audience (lib/hub/audience.ts), which now falls back to the sign-up audience because the page can no longer set one.

Alternatives considered: Saving the audiences in the business profile cookie was not chosen: that cookie is capped at about 3.8 KB and already holds the sign-up answers, so descriptions of up to 240 characters would not fit. A real profile store comes with the real backend.

## 2026-11-16 - My Content library, and Campaigns opens from Content Creation

Context: The team's Figma Make added a My Content library (search, type filters, Campaigns folders, sort, grid or list) and a Campaign card at the top of Content Creation, and dropped Campaigns from the sidebar.

Decision: My Content lives at /content/my-content and lists content saved in this browser (newest first) before the Make's twelve sample items, whose photos reuse the five images in public/content. Saved results are sorted into the Make's five types by the tool that made them. Any item with text has a Reuse link that opens Repurpose content with that text (?from=<item id>); photos and videos have none, since nothing can be done with a sample photo yet. The sidebar no longer lists Campaigns; the hub's Campaign card and Audience Trends' Use in Campaigns open it, and Content Creation stays highlighted there. The Make's per-card "more options" button does nothing in the Make, so it is not copied.

Alternatives considered: Keeping Campaigns in the sidebar as well was not chosen, to match the Make. Showing only the samples, as the Make does, was not chosen: the functionality list says My Content opens the content library, and saved results already exist.

## 2026-11-16 - Competitors becomes the Make's Competitor performance

Context: On 2026-11-05 the user chose not to add the functionality list's Competitor Performance features (findings filter, campaign cards, comparison, evidence note, Your next move), because the Figma Make did not have them. The team's Make now does, and it dropped competitor tracking, audience-based selection, and recurring themes.

Decision: The user chose to follow the new Make. /competitors shows the findings filter (non-matching cards are dimmed), three competitor campaign cards, the comparison for the selected card, the evidence note, and Your next move with Create from this insight (to Content Creation). Tracking, audience-based selection, recurring themes, and their code (lib/hub/tracking.ts, the save action) are removed; the profile's old trackedCompetitors value is simply no longer read. The engagement gap and the first target are worked out per card (the Make shows 1.8 pts for every card). The Make names real suppliers with invented figures; the cards use the app's fictional sample suppliers (Coastline Linen Co., Northbay Hospitality Supply, Evergreen Amenities) instead, which also match the Overview.

Supersedes: "Not adding Competitor Performance" (2026-11-05) and the competitor tracking parts of the Research Competitors decisions (2026-10-29).

## 2026-11-16 - Reports: Performance by Country on the Make's world map

Context: Performance by Country was a ranked list with flags (user's choice, 2026-11-05), since the design file had no usable map. The team's Figma Make now ships a world map image (reports-world-map.png) with labels for Canada, the United States, the United Kingdom, Germany, and Australia, and Conversions / Top Countries buttons; the functionality list asks for a map with metric and country filters.

Decision: The panel shows the Make's map (public/reports/world-map.png) with a labelled pin per country at the Make's positions (Germany moved slightly so its label clears the United Kingdom's at this text size), a Metric filter (Revenue or Conversions; the summary and growth follow it), and a Countries filter (top 5 or top 3). The pins are an ordered list, so the ranking still reads without the picture. The revenue chart takes the Make's look (smooth curves, teal Google line over a lime area, green Meta line, gridlines with dollar labels). The Make's single Download PDF button is not copied; Export Report (PDF or spreadsheet) stays, as the functionality list asks.

Supersedes: the "ranked list with flags instead of a map" part of the 2026-11-05 Reports decision.

## 2026-11-16 - Onboarding step 2 follows the Make's drop-down lists

Context: The team's Figma Make changed "Tell us about your industry": one Industry drop-down (23 industries) with a Sub-industry list that follows it, a target region in four levels (17 countries, then province or state, region, and subdivision), and one general audience ("Choose a category"). The functionality list asks for "industry and sub-industry, target regions, audience types, using drop-down lists". The page had industry chips (several), a fixed sub-industry list, Canada and the US only with an optional area, and several audiences (the user's choice, 2026-10-29).

Decision: The user chose to follow the Make: one industry with a required sub-industry from its list, one audience, and target regions chosen level by level (lib/hub/target-regions.ts; changing a level picks the first choice of the levels under it, as in the Make). Pinterest is added to the social platforms. The business profile keeps its list fields (industries and audiences now hold one item), so the rest of the app reads it as before; regions saved in the old shape are dropped when read. The demo business is Wholesale, Hospitality and restaurant supplies, targeting Canada, British Columbia, Lower Mainland, Richmond. Forgot Password takes the Make's "Account recovery" wording but still shows the reset link on screen, since the prototype sends no email. The Make's glass styling of these pages is a separate, later step.

Supersedes: the "several general audiences" part of the 2026-10-29 onboarding decision.

## 2026-11-16 - Account pages in the Make's glass style

Context: The team's Figma Make shows Create Account, Onboarding, and Forgot Password on its green gradient with frosted glass cards and cream pill fields, like the Login page. Ours still had the October mid-fi look (white page, MUI outlined fields).

Decision: The (auth) layout uses the gradient, Montserrat, and the Make's logo and "SixthSense" lockup; each page sits on a frosted card (authCardClass). Instead of a second set of form components, the design-system colour tokens are re-pointed inside `.auth-glass` (globals.css): text and outlines turn cream, primary turns lime with navy text, and errors and notices get colours that read on the dark background; fields and buttons become pills. The re-pointed tokens only apply inside `.auth-glass`, so the same components elsewhere (Button in the date bar, Alert on Ask, the login form) keep their look.

## 2026-11-16 - Audience Trends without the depth bar or LinkedIn

Context: The user asked to remove the Audience depth bar (All, Broad, Niche) and LinkedIn from Audience Trends, because the team is not using LinkedIn.

Decision: The page filters by source only (All platforms, Instagram, TikTok). The Make's two LinkedIn trends (Proof over promises, Direct booking value) are kept as Instagram trends, since their formats (a data-led carousel and a talking-head video) suit Instagram and they are the page's opening trend and watchlist item. Saved audiences keep their broad or niche type, which still decides which trends match them. LinkedIn elsewhere in the app (Campaigns channels, AI Management) is unchanged.
