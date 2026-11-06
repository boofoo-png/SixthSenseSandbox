import type { Overview } from "@/lib/hub/overview";
import type { FacebookPost, InstagramPost, MetaSnapshot } from "./graph";

// Turns a live Meta snapshot into what Overview and Reports show (plan 1.5). Anything Meta did not
// return keeps its sample value, and each card records whether its numbers are live.

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Percent change from `before` to `now`; null when there is nothing to compare with. */
export function percentChange(now: number | null, before: number | null): number | null {
  if (now === null || before === null || before <= 0) return null;
  return round1(((now - before) / before) * 100);
}

/** Interactions as a share of accounts reached, in percent. */
export function engagementRate(interactions: number | null, reach: number | null): number | null {
  if (interactions === null || reach === null || reach <= 0) return null;
  return round1((interactions / reach) * 100);
}

export type AudienceFigure = { kind: "new"; value: number; change: number | null } | { kind: "total"; value: number };

export type LiveOverview = {
  overview: Overview;
  /** Set when Audience Growth shows live Instagram numbers. */
  audience: AudienceFigure | null;
  engagementLive: boolean;
  instagramLive: boolean;
  facebookLive: boolean;
};

export function liveOverview(sample: Overview, snapshot: MetaSnapshot | null): LiveOverview {
  if (!snapshot) return { overview: sample, audience: null, engagementLive: false, instagramLive: false, facebookLive: false };
  const overview: Overview = { ...sample, channels: sample.channels.map((row) => ({ ...row })) };

  let audience: AudienceFigure | null = null;
  if (snapshot.newFollowers !== null) {
    const before = snapshot.followers !== null ? snapshot.followers - snapshot.newFollowers : null;
    audience = { kind: "new", value: snapshot.newFollowers, change: percentChange(snapshot.followers, before) };
  } else if (snapshot.followers !== null) {
    audience = { kind: "total", value: snapshot.followers };
  }

  const rate = engagementRate(snapshot.interactions, snapshot.reach);
  const engagementLive = rate !== null;
  if (rate !== null) {
    const previousRate = engagementRate(snapshot.previous.interactions, snapshot.previous.reach);
    const recent = snapshot.posts.slice(0, 5).map((post) => post.likes + post.comments);
    const top = Math.max(1, ...recent);
    overview.engagement = {
      rate,
      change: previousRate === null ? 0 : round1(rate - previousRate),
      bars: recent.length > 0 ? recent.map((value) => Math.max(12, Math.round((value / top) * 100))) : sample.engagement.bars,
    };
  }

  const instagram = overview.channels.find((row) => row.channel === "Instagram");
  const reachChange = percentChange(snapshot.reach, snapshot.previous.reach);
  const instagramLive = Boolean(instagram) && reachChange !== null;
  if (instagram && reachChange !== null) {
    instagram.momentum = reachChange;
    instagram.change = percentChange(snapshot.interactions, snapshot.previous.interactions);
  }

  // Facebook: change in accounts that saw the Page's content, and in post engagement.
  const facebook = overview.channels.find((row) => row.channel === "Facebook");
  const page = snapshot.facebook;
  const viewersChange = page ? percentChange(page.viewers, page.previous.viewers) : null;
  const facebookLive = Boolean(facebook) && viewersChange !== null;
  if (facebook && page && viewersChange !== null) {
    facebook.momentum = viewersChange;
    facebook.change = percentChange(page.engagements, page.previous.engagements);
  }

  return { overview, audience, engagementLive, instagramLive, facebookLive };
}

export type SocialReport = {
  username: string;
  followers: number | null;
  pageFollowers: number | null;
  reach: number | null;
  views: number | null;
  engagementRate: number | null;
  reachChange: number | null;
  topPosts: InstagramPost[];
  /** Null when the Page could not be read. */
  facebook: {
    views: number | null;
    viewers: number | null;
    engagements: number | null;
    viewersChange: number | null;
    topPosts: FacebookPost[];
  } | null;
};

/** Reports' "Instagram and Facebook" section. Top posts are the three with the most likes and comments. */
export function socialReport(snapshot: MetaSnapshot): SocialReport {
  return {
    username: snapshot.username,
    followers: snapshot.followers,
    pageFollowers: snapshot.pageFollowers,
    reach: snapshot.reach,
    views: snapshot.views,
    engagementRate: engagementRate(snapshot.interactions, snapshot.reach),
    reachChange: percentChange(snapshot.reach, snapshot.previous.reach),
    topPosts: [...snapshot.posts].sort((a, b) => b.likes + b.comments - (a.likes + a.comments)).slice(0, 3),
    facebook: snapshot.facebook && {
      views: snapshot.facebook.views,
      viewers: snapshot.facebook.viewers,
      engagements: snapshot.facebook.engagements,
      viewersChange: percentChange(snapshot.facebook.viewers, snapshot.facebook.previous.viewers),
      topPosts: [...snapshot.facebook.posts].sort((a, b) => b.reactions + b.comments + b.shares - (a.reactions + a.comments + a.shares)).slice(0, 3),
    },
  };
}
