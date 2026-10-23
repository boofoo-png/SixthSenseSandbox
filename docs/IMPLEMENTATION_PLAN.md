# Implementation Plan: Sixth Sense (Mid-fi Build)

_Last updated: 2026-10-23_

Replaces the "Marketing Hub Pivot" plan written earlier on 2026-10-22 (none of its steps were started). Screens follow the team's mid-fi in the SIXTH SENSE Figma file (page MID-FI/HIGH-FI, node 9656-4371); flows and screens the mid-fi does not cover yet follow the Sixth Sense Master Site Map (FigJam). Both are frameworks and may change.

## Goal
The app becomes "Sixth Sense": a signed-in business lands on a dashboard ("What would you like to do?") and reaches seven areas - Insight Report, Revisit Findings, Research Competitors, Explore Audience and Trend, AI Management, Content Creation, and Campaigns - after logging in or creating an account and completing onboarding. Everything uses sample data for a fictional hospitality supplier, AI output is tested templates labelled "Suggestions", and the UI uses the blue SIXTH SENSE (MUI) kit in light mode.

## Out of scope
- Real accounts, password reset emails, or a database (sign-in is simulated; see DECISIONS.md 2026-10-22)
- Real social account connections, uploading files to a server, or sending team invites (onboarding shows these steps but only records them in the prototype)
- Publishing posts to social platforms; Auto Publishing is shown as "coming later" (see DECISIONS.md 2026-10-14)
- Real AI (Claude API), real ad-platform data (spend, ROAS, conversions), or real competitor data
- Video, Blog, Ad Copy, Improve Copy, Repurpose, and Upload tools in Content Creation (cards show "Coming soon"; Social Post is built first)
- A world map for Performance by Country (shown as a ranked table or bar chart)
- Building the teammates' assigned components (Tabs, Dropdown, Checkbox, Badge, Carousel); native elements styled with the kit until theirs land

## Phase 1 - Shell, name, and navigation (test-first)
- [x] 1.1 Rename the product to "Sixth Sense" (APP_NAME, root metadata) (lib/navigation.ts, app/layout.tsx, layout.test.ts)
- [x] 1.2 Navigation config for the seven areas in dashboard tile order, with routes: /insights, /findings, /competitors, /explore, /ai-management, /content, /campaigns, plus /settings and /profile; unbuilt areas marked "Coming soon" (lib/navigation.ts, navigation.test.ts)
- [x] 1.3 Replace the sidebar with the mid-fi top bar: menu button opening a navigation drawer (all areas, current one marked), logo linking to the dashboard, profile and settings icon buttons; works on phones and desktop; hidden when printing (app/(dashboard)/_components/app-bar.tsx, nav-drawer.tsx, layout.tsx; remove sidebar.tsx)
- [x] 1.4 Bring back a `ComingSoon` page listing each unbuilt area's planned features from the mid-fi, and placeholder routes for every area (app/(dashboard)/_components/coming-soon.tsx, app/(dashboard)/<area>/page.tsx)
- [ ] 1.5 Keep old addresses working: /analytics and /reports redirect to /insights and /insights/report, /ai-studio to /content (next.config.ts redirects, per the Next.js 16 redirecting guide)
- [ ] 1.6 Sample business profile: a fictional hospitality supplier in Richmond, BC (products and services, regions, audiences such as small hotels, senior living, care homes) and the `BusinessProfile` type with validation (lib/hub/business.ts, business.test.ts)

## Phase 2 - Account: Login, Create an Account, Onboarding (prototype sign-in, test-first)
- [x] 2.1 Credential check against one demo account shown on the login page; anything else shows "We couldn't sign you in. Check your details and try again." (lib/hub/session.ts, session.test.ts)
- [x] 2.2 Create-account validation: name, role, company, address 1, city, province, country, postal code, email ("Will be used for login"), phone, password and re-typed password ("Passwords don't match") (lib/hub/account.ts, account.test.ts)
- [x] 2.3 Onboarding model and validation: industries and sub-industry, target regions (country, province, region, subdivision; add another), general audience (Residential / Commercial / Industrial / Institutional), goals (the mid-fi's 12 checkboxes, with a target percentage for "Increase conversions by X%"), website and social handles per platform with the read-only analytics consent, competitors (name, website; add another), report links and file names, and team invite emails (lib/hub/onboarding.ts, onboarding.test.ts)
- [x] 2.4 Route rule: signed-out visitors go to /login (remembering the page they wanted); signed-in users skip /login and /create-account (lib/hub/routing.ts, routing.test.ts). Sending users without a finished profile to /onboarding moves to 2.9
- [x] 2.5 Server actions for sign in, create account, and sign out (the save-onboarding action comes with 2.9); they set or clear the session and profile cookies (app/(auth)/actions.ts)
- [x] 2.6 `proxy.ts` applying the route rule using only cookies (optimistic check, per the Next.js 16 authentication guide) (proxy.ts)
- [x] 2.7 /login screen: logo, email, password, Remember Me, Sign In (kit Button), Forgot your password? and Create an account links; /forgot-password explains reset is not available in the prototype (app/(auth)/login/, forgot-password/)
- [x] 2.8 /create-account screen: Create an Account, Company Information, and Password sections with inline errors, Continue and Back (app/(auth)/create-account/)
- [x] 2.9 /onboarding screen, "Tell us about your industry": the sections from 2.3 in the mid-fi order; Connect, Upload, and Invite only record the entry and say so; Continue goes to the dashboard; Create an Account and the route rule then send new users to /onboarding before the dashboard (app/(auth)/onboarding/, lib/hub/routing.ts)
- [ ] 2.10 /settings edits the onboarding answers and /profile shows the account details, each with Save Changes and a confirmation; Sign out in the profile page and the drawer (app/(dashboard)/settings/, profile/)
- [x] 2.11 Back on step 2: the account is created only when step 2 is finished (step 1 is held in a sign-up cookie); Back keeps the step 2 answers and returns to step 1 filled in, where blank passwords keep the one already chosen; Back also shows for accounts signed in before finishing step 2 (app/(auth)/actions.ts, create-account/, onboarding/, lib/hub/routing.ts, proxy.ts)

## Phase 3 - Dashboard (test-first)
- [x] 3.1 Dashboard at / from the mid-fi's two versions: "New account" (right after sign-up: What would you like to do?, Ask anything, and Research Competitors, Explore Audience and Trend, AI Management, Content Creation) and "Have account before" (after signing in: Welcome Back! plus Insight Report and Revisit Findings on top); each tile has an icon, a title with an arrow that shows a short description, and Select; Ask anything opens /ask, which repeats the question and says answers are coming. The old overview moved to /insights as the start of Insight Report (app/(dashboard)/page.tsx, _components/dashboard-tiles.tsx, ask/, insights/)
- [x] 3.2 Icons for the tiles and top bar (menu, person, settings, search) as small inline SVG components with accessible labels (components/icons.tsx)

## Phase 4 - Research data and saved findings (test-first)
- [ ] 4.1 Types for trends, audiences, competitor posts (brand, date, title, summary, finding tags), saved findings, and campaign briefs (lib/hub/types.ts)
- [ ] 4.2 Deterministic hospitality sample data: trends, audiences, and fictional supplier competitors with recent posts and engagement, all labelled as sample (lib/hub/sample-data.ts, sample-data.test.ts)
- [ ] 4.3 Browser storage for saved findings, user audiences, saved social posts, and campaign briefs under versioned keys, following lib/ai-studio/storage.ts, read through `useSyncExternalStore` hooks (lib/hub/storage.ts, app/(dashboard)/_components/use-hub-store.ts, tests)

## Phase 5 - Research Competitors (test-first)
- [ ] 5.1 Rework /competitors to the mid-fi: "Review your competitors.", filter chips (Most viewed post, Most liked post, Most popular item, Most popular trends, Common reused layouts, Most used by users), and post cards with brand, date, title, summary, and tags; reuse the existing competitor activity and chart code where it fits (app/(dashboard)/competitors/, lib/competitors/)
- [ ] 5.2 "Comparison on trends between you and your competitors": your posts vs competitor posts side by side (engagement, views, likes, shares this week) (lib/hub/compare.ts, competitors page)
- [ ] 5.3 "Updates and suggestions": rule-based recommendations from the comparison, plus Save to findings (lib/hub/recommendations.ts, competitors page)

## Phase 6 - Explore Audience and Trend, Ask anything, Revisit Findings (site map flows, test-first)
- [ ] 6.1 /explore: trends (search, Industry / Location / Time Period filters, empty state with Clear Filters, trend details) and audiences (search, audience profiles with needs, challenges, interests, related trends), each with Save and Create Campaign (app/(dashboard)/explore/)
- [ ] 6.2 /ask: answer template that asks which audience to focus on when unclear, otherwise "Here's what I found" with supporting sources, Save Findings, and Create Campaign (lib/hub/ask.ts, app/(dashboard)/ask/)
- [ ] 6.3 /findings (Revisit Findings): saved items filtered by All / Trends / Audiences / Competitors, with View, Create Campaign, Remove, and an empty state (app/(dashboard)/findings/)

## Phase 7 - Content Creation (test-first)
- [ ] 7.1 /content hub: "Create AI-powered content" (Social Post, Video, Blog, Ad Copy) and "Edit and enhance content" (Edit Posts, Improve Copy, Repurpose content, Upload your file) cards; only Social Post is active (app/(dashboard)/content/)
- [ ] 7.2 /content/social-post: Post Details (platform, saved audience, content goal, tone of voice, idea) and AI Content Suggestions (caption with Copy, visual guidelines, keywords and hashtags) with Generate, Regenerate, and Save Content, reusing the AI Studio caption, hashtag, and content-brief modules (app/(dashboard)/content/social-post/, lib/ai-studio/)

## Phase 8 - AI Management (test-first)
- [ ] 8.1 AI Posting Plan: recommended frequency, best days, best times, and content mix from sample engagement, reusing lib/ai-studio/best-time.ts (lib/hub/posting-plan.ts, posting-plan.test.ts)
- [ ] 8.2 /ai-management: the posting plan, the content calendar (reuse the AI Studio calendar with platform filters), upcoming posts, connected accounts from onboarding, and Auto Publishing shown as a disabled "coming later" switch with a note that the business posts itself (app/(dashboard)/ai-management/)

## Phase 9 - Campaigns (test-first)
- [ ] 9.1 Campaign brief template: Objective, Audience, Key Message, Channels, Next Steps from the products, goal (Awareness / Lead / Sales), audience, and saved findings (lib/hub/brief.ts, brief.test.ts)
- [ ] 9.2 /campaigns: Create New Opportunities and a list of saved campaigns (app/(dashboard)/campaigns/)
- [ ] 9.3 /campaigns/new, "Let's Build Your Campaign!": products or services, goal, choose a saved audience or build one, Generate draft, then edit or save, and print / Save as PDF (reusing the Reports print approach) (app/(dashboard)/campaigns/new/)
- [ ] 9.4 Audience builder: audience name, description, audience type (B2B / B2C / Both), customer segment, "Suggest an audience for me" (template from the business profile and competitor data), location from the profile with Change, age range, interests, needs; Save Audience and Cancel (app/(dashboard)/campaigns/audiences/new/, lib/hub/audience-suggest.ts)

## Phase 10 - Insight Report (test-first)
- [ ] 10.1 Sample ad results per platform (spend, revenue, conversions, clicks, impressions) and derived ROAS, generated per day like the analytics data (lib/analytics/ads-sample-data.ts, ads-kpis.ts, tests)
- [ ] 10.2 /insights: KPI tiles (Total Spend, Revenue, ROAS, Impressions, Conversions, Clicks) vs the comparison period, reusing the date bar, KPI tiles, and summary from Analytics (app/(dashboard)/insights/)
- [ ] 10.3 AI Insights Summary: Google vs Meta line chart (reuse the SVG chart approach) and rule-based insights (top performer, underperforming, suggestion) (lib/analytics/ad-insights.ts, insights page)
- [ ] 10.4 Performance by region and Top Campaigns sections, as tables or bar charts with text alternatives (insights page)
- [ ] 10.5 /insights/report: the existing executive report and print / Save as PDF, moved from /reports (app/(dashboard)/insights/report/)

## Phase 11 - Polish
- [ ] 11.1 Sample data and "Suggestions" labels on every research, AI, and insight view
- [ ] 11.2 Keyboard and screen reader pass: drawer, onboarding form, filters, chips, and the campaign steps
- [ ] 11.3 Check by eye at phone, tablet, and desktop widths against the mid-fi screens

## Open questions
- What fictional name should the sample business use? The mid-fi says "Hotel Depot"; a clearly made-up name avoids confusion with any real company (same reason as the fictional competitors).
- The mid-fi's palette frame (#1E1E1E, #FFFFFF, #E1DED9, #FFBF65) is not used by any screen; is it for the logo or marketing pages?
- Explore Audience and Trend, Revisit Findings, and Ask anything have no mid-fi screens yet; build from the site map or wait for designs?
- Which Content Creation tool comes after Social Post?
- What should Compare do, and what file should a campaign brief export to beyond print / Save as PDF?
- The session cookie holds the email unsigned, so anyone can set it by hand and appear signed in (code review 2026-10-23, finding 6; accepted for the prototype). Sign it (HMAC with a secret in .env.local) or replace it with real auth before any real use.

---

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
