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
