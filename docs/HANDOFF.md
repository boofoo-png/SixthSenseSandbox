# Handoff Notes

## 2026-10-09 - feat/analytics-dashboard

**Done:** Analytics Dashboard plan items 1.1-1.3 (Vitest setup, types, deterministic sample data), 2.1-2.4 (totals, engagement rate, per-platform breakdown, week-over-week comparison), 3.1-3.3 (rule-based plain-language summary), and 4.1-4.2 (KpiTile component and /analytics page). Commits cd9df18 and 4ac75a7.

**Validation:** `npm run lint` passed; `npx tsc --noEmit` passed; `npm test` 40/40 passed across 5 files; `npm run build` passed (/analytics prerendered as static). The page was served with `next start` and its rendered text checked. No CI configured (no .github/workflows). PR not opened automatically (gh CLI not installed); open from https://github.com/boofoo-png/sandbox/pull/new/feat/analytics-dashboard

**Next:** 4.3 - check the responsive layout by eye in `npm run dev` at phone, tablet, and desktop widths (1 / 2 / 4 tile columns). Then run /plan for the next phase (likely an engagement-over-time chart).

**Notes / risks:**
- This branch is based on docs/competitor-research, which is not merged yet. Merge that PR first so this PR shows only the analytics work.
- @types/node was bumped from 20 to 22 (required by Vitest 5; matches the Node 22.19 runtime).
- `npm audit` reports 5 high-severity issues via eslint-config-next (existing, dev-only). The suggested `npm audit fix --force` would downgrade it to Next 14, so it was not applied.
- Sample data is fixed to end on 2026-10-09 so tests stay deterministic; the page does not use today's date.

## 2026-10-13 - feat/analytics-dashboard

**Done:** Fixed all /code-review findings on the analytics code (followers change across platforms, drop line using shared weeks, shared tile/summary rounding in lib/analytics/change.ts, rate-based summary wording, clearer zero-data messages, malformed dates ignored). Temporary redirect from / to /analytics. Restored @AGENTS.md in CLAUDE.md. Wrote the Homepage Overview and Navigation plan (no items started) and its app-shell decision. Commits ff1bcba, 73415b8, f388fa7.

**Validation:** `npm run lint` passed; `npx tsc --noEmit` passed; `npm test` 58/58 passed across 7 files; `npm run build` passed (/ and /analytics static). No CI configured. PR not opened automatically (gh CLI not installed): https://github.com/boofoo-png/sandbox/pull/new/feat/analytics-dashboard

**Next:** Homepage plan 1.1 (navigation config) on a new branch feat/app-shell; Analytics plan 4.3 (visual layout check) is folded into homepage plan 4.2.

**Notes / risks:**
- A teammate branch `assignment-2` (TEAMWORK.md, component assignments) now exists on origin, based on main. It does not touch this branch, but check its component assignments before starting the app shell.
- docs/USER_RESEARCH.md contains non-ASCII characters (from its original commit), which CLAUDE.md disallows; not changed here.
- docs/competitor-research is still unmerged; merge it before this branch.

## 2026-10-13 - feat/competitors

**Done:** Competitors plan items 1.1-1.6 (types, fictional cafe sample data, generic week splitting, activity, details, trends), 2.1-2.4 (comparison page, detail component and pages, overview cards), 3.1 (sample data notices), 3.3-3.6 (weekly engagement, posts by platform, By platform section, engagement chart), 3.7 (date ranges shown on pages), 3.8 (sample data ends today; hourly refresh), 3.9 (Sunday-Saturday calendar weeks). Commits 54d894f and 0aa7e14.

**Validation:** `npm run lint` passed; `npx tsc --noEmit` passed; `npm test` 183/183 passed across 20 files; `npm run build` passed (all dashboard routes revalidate hourly; four competitor pages prerendered via generateStaticParams). Chart rendered and checked by eye. No CI configured. PR not opened automatically (gh CLI not installed): https://github.com/boofoo-png/SixthSenseSandbox/pull/new/feat/competitors

**Next:** 3.2 - check by eye at phone, tablet, and desktop widths (comparison table scrolls sideways on phones; chart scales; detail pages and overview cards fit). Then /plan for AI Studio or Reports.

**Notes / risks:**
- Branches are stacked: docs/competitor-research -> feat/analytics-dashboard -> feat/app-shell -> feat/competitors. Merge in that order, or base each PR on the previous branch.
- Weeks are Sunday-to-Saturday; mid-week, "this week so far" is compared with the same days last week (see DECISIONS.md). KPI tiles still say "vs last week"; the page subtitle explains the exact days.
- Sample data ends on the server's local date; tests fix the clock to 2026-10-09 in vitest.setup.ts. Tests that change the date must reset it.
- Chart hover uses native SVG titles (plain browser tooltip), not a custom tooltip.
- The GitHub repo was renamed to SixthSenseSandbox; the local remote still uses the old URL (GitHub redirects).

## 2026-10-13 - feat/date-range

**Done:** Date Range Selection plan items 1.1-1.5 (date range model in lib/date-range.ts), 2.1-2.4 (sample data for any past date, explicit ranges in KPI and competitor calculations, wording follows the selection), 3.1-3.5 (DateRangeBar, pages read the address, sidebar and links keep the selection, chart weeks follow the range, hourly revalidate removed), 4.1 (notices for invalid or future dates), 4.2 (checked by the user at phone and desktop widths). Commits 3b330b5 and 8858c28.

**Validation:** `npm run lint` passed; `npx tsc --noEmit` passed; `npm test` 233/233 passed across 22 files; `npm run build` passed (dashboard routes now render per request). Six date selections checked on the dev server. No CI configured. PR not opened automatically (gh CLI not installed): https://github.com/boofoo-png/SixthSenseSandbox/pull/new/feat/date-range

**Next:** Competitors plan 3.2 (visual check of /competitors and a competitor page) is still open. Next feature: AI Studio (idea generator, captions and hashtags, best time to post, content calendar saved in the browser; template-based suggestions).

**Notes / risks:**
- Branches are stacked: docs/competitor-research -> feat/analytics-dashboard -> feat/app-shell -> feat/competitors -> feat/date-range.
- Page tests call the async page functions directly with sample `searchParams` (instead of separate synchronous content components, as the 2026-10-13 decision described); they still cover each page's content.
- Sample competitor ads are generated relative to the end of the selected period, so "active ads" look the same for any period until real ad data exists.
- Date helpers formatDateRange (year option), daysInRange, and shiftYear were written alongside their tests rather than strictly test-first.

## 2026-10-14 - feat/ai-studio

**Done:** AI Studio plan items 1.1-1.7 (types, ideas, captions, hashtags, sample timing, best times, content briefs), 2.1-2.3 (planned post helpers, browser storage, usePlannedPosts hook), 3.1-3.6 (idea, caption, and schedule steps, content calendar, page, How to make it section), 4.1-4.2 (labels and notices; keyboard focus moves to each new step). Commits 861e842 and 4ce8a57.

**Validation:** `npm run lint` passed; `npx tsc --noEmit` passed; `npm test` 320/320 passed across 35 files; `npm run build` passed (/ai-studio renders per request via connection()). No CI configured. PR not opened automatically (gh CLI not installed): https://github.com/boofoo-png/SixthSenseSandbox/pull/new/feat/ai-studio

**Next:** AI Studio 4.3 and Competitors 3.2 (visual checks by the user). Next feature: Reports v1 (executive overview, print or save as PDF, date bar; scheduled emails deferred).

**Notes / risks:**
- Branches are stacked: ... -> feat/date-range -> feat/ai-studio.
- Product decision (DECISIONS.md, 2026-10-14): no auto-posting. The calendar is a content plan; the business creates and posts its own photos and videos.
- Planned posts live in localStorage under "marketing-dashboard.planned-posts" (version 1); they are per browser and not shared. Tests reset the store with resetPlannedPostsForTests().
- Some idea templates read oddly for non-food hashtag trends (e.g. "Fall vibes taste test"); a fix limiting food templates to food topics was offered but not yet chosen.

## 2026-10-22 - feat/reports

**Done:** Reports v1 plan items 1.1-1.2 (executive report model and "what changed" lines in lib/reports/executive.ts), 2.1-2.4 (PrintButton, /reports page with date bar and report header, print layout, ComingSoon removed; Reports marked ready in the sidebar). Commits 69a01ce and 94e2b2b.

**Validation:** `npm run lint` passed; `npx tsc --noEmit` passed; `npm test` 332/332 passed across 38 files; `npm run build` passed (/reports renders per request). No CI configured. PR not opened automatically (gh CLI not installed): https://github.com/boofoo-png/SixthSenseSandbox/pull/new/feat/reports

**Next:** Reports 3.1 (check /reports by eye at phone and desktop widths and in print preview / Save as PDF), plus the earlier visual checks AI Studio 4.3 and Competitors 3.2. Open question: which report section comes next (platform breakdown, competitors, or content plan).

**Notes / risks:**
- Branches are stacked: ... -> feat/ai-studio -> feat/reports.
- The `dark:` variant is now screen-only (custom variant in app/globals.css), so every page prints dark text on white, not just /reports.
- The "Coming soon" nav status type is kept in lib/navigation.ts for future sections, though no section uses it now.

## 2026-10-23 - feat/sixth-sense

**Done:** Sixth Sense (Mid-fi Build) plan items 1.1-1.4 (name, seven-area navigation, mid-fi top bar and drawer, Coming soon pages), 2.1-2.9 and 2.11 (Login, Create an Account, "Tell us about your industry" with Back, prototype cookie accounts, proxy redirects), 3.1-3.2 (mid-fi dashboard in "New account" and "Have account before" versions, Material icons). Also the SIXTH SENSE design system (tokens, Roboto, Button, TextField, Alert), the restyle of existing pages, light mode only, the old overview moved to /insights, and local-only "Fill with sample data" buttons. Commit 01ca401.

**Validation:** `npm run lint` passed; `npx tsc --noEmit` passed; `npm test` 493/493 passed across 55 files; `npm run build` passed (proxy compiled; /login, /, /insights render per request). Sign-up, Back, login, and both dashboard versions were driven on the dev server with curl (forms work without JavaScript); the fill button was confirmed present in dev and absent in a production build. No CI configured (no .github/workflows). PR not opened automatically (gh CLI not installed): https://github.com/boofoo-png/SixthSenseSandbox/pull/new/feat/sixth-sense

**Next:** 2.10 (Settings edits the step 2 answers; Profile shows the account), 1.5 (redirect /analytics, /reports, /ai-studio to their new homes), 1.6 (remaining tokens such as secondary and info), then Phase 4 (research sample data) and Phase 5 (Research Competitors to the mid-fi).

**Notes / risks:**
- Branch is based on feat/reports, which is not merged yet; merge that first or base this PR on it.
- Prototype sign-in is not security: anyone can set the cookies by hand, and accounts live only in the browser that created them (see DECISIONS.md 2026-10-22 and 2026-10-23).
- Demo account: demo@sixthsense.app / sixthsense-demo (counts as onboarded; sees the "Have account before" dashboard).
- The Figma file is being edited: the dashboard frame IDs changed on 2026-10-23 (now 9679:7894 "New account" and 9776:13002 "Have account before"). Check the mid-fi again before building the next area.
- Mid-fi deviations, by choice: no Connect / Generate a link buttons on step 2; simpler region pickers (Dropdown is a teammate assignment); tile icons replace the mid-fi "icon" placeholders; the stray slider in the returning dashboard was left out.
- Teammate-assigned components (TEAMWORK.md on assignment-2): Buttons is assigned to Sam, but the kit Button was built here on request; coordinate before Sam's version lands. Native checkboxes and selects are used in place of the Checkbox and Dropdown assignments.
- Next.js typed routes: after adding a route, run `npx next typegen` (or the dev server) before `tsc`.

## 2026-10-23 - feat/sixth-sense (review fixes)

**Done:** Fixed 9 of 10 /code-review findings on the branch: open redirect through the login `next` value; business profile cookie overflow causing a step 2 loop (field and link limits, an overall size check, and one shared cookie JSON helper in lib/hub/cookie-json.ts); stale rows on step 2 after an error; leftover sign-up cookies surviving sign-in and sign-out; step 1 Back silently signing out (now Cancel sign-up); Continue and Back running at the same time; AI Studio and the printable report unreachable; unused Geist fonts. No plan items were completed by this change. Commit 3c7cbb7.

**Validation:** `npm run lint` passed; `npx tsc --noEmit` passed; `npm test` 511/511 passed across 56 files; `npm run build` passed. Spot-checked on the dev server: crafted `next` falls back to /; a 3000-character report link shows a clear error with no account created and no loop; leftover sign-up cookies are gone after signing in; Cancel sign-up shows on step 1 after step 2; AI Studio and printable report links present; no Geist on the page. The stale-rows test was confirmed to fail against the old code. No CI configured. PR not opened automatically (gh CLI not installed): https://github.com/boofoo-png/SixthSenseSandbox/pull/new/feat/sixth-sense

**Next:** 2.10 (Settings and Profile), 1.5 (redirect old addresses), 1.6 (remaining tokens), then Phases 4 and 5.

**Notes / risks:**
- Finding 6 is still open by choice: the session cookie is the email, unsigned. Recorded under Open questions in the plan.
- React holds later form actions until pending ones finish; tests that leave a server action pending must resolve it, or later tests in the file time out (see the "locks Continue and Back" test).
- `useFormStatus` drives the locked buttons; it reports which action is running, so Continue shows its spinner only for Continue.

## 2026-10-29 - feat/sixth-sense

**Done:** Saved the team's updated functionality list as docs/FUNCTIONALITY.md and re-planned around it (new steps 2.12-2.15, 5.4-5.6, and Phase 6 as Target Audience: 6.1, 6.4-6.6). Built 2.12 (Forgot Password with an on-screen reset link), 2.13 (Connect with simulated verification), 2.14 (invite link and Invite later), 2.15 (Add later / Add now on optional step 2 parts). Also: several general audiences on step 2 (answers the "audience types" open question), and every account in a browser remembered in its own cookies (fixes older accounts failing to log in or reset). Commit 0c62e8e.

**Validation:** `npm run lint` passed; `npx tsc --noEmit` passed; `npm test` 554/554 passed across 59 files; `npm run build` passed. On the dev server: full reset flow (unknown email message, link, new password, link refused on reuse, old password refused, new one works); Connect and invite link saved to the profile; invite link shows "You were invited to join ..."; several audiences saved; two accounts in one browser both log in and the older one can reset. No CI configured. PR not opened automatically (gh CLI not installed): https://github.com/boofoo-png/SixthSenseSandbox/pull/new/feat/sixth-sense

**Next:** Phase 6 Target Audience (6.1 trend search by category with demographics, age, and interests filters; 6.4 charts or lists; 6.5 default audience; 6.6 suggested audience), then 5.4-5.6 (competitor tracking from sign-up competitors, recurring themes, audience-based selection), and 2.10 (Settings and Profile).

**Notes / risks:**
- Account cookies are now `ss_account_<base64url email>` and `ss_profile_<base64url email>`; the old single `ss_account` and `ss_profile` are still read. At most 5 accounts are kept within a 12 KB budget (Node's default request header limit is 16 KB).
- Reset tokens live in `ss_reset` as a SHA-256 hash for 15 minutes; the demo account cannot be reset.
- Test-harness gotcha when driving forms with curl: the page's hidden fields (`socialVerified`, `inviteLink`) are already in the form, so sending them again makes the server read the first, empty value.
- The session cookie is still unsigned (review finding 6, in the plan's open questions).
