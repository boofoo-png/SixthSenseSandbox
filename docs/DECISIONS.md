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
