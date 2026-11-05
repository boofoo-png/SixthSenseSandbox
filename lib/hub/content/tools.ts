import type { LineIconName } from "@/components/line-icons";

// The eight Content Creation tools from the team's Figma Make (2026-11-05) and docs/FUNCTIONALITY.md.

export type ToolSlug =
  | "social-post"
  | "video"
  | "blog"
  | "ad-copy"
  | "edit-posts"
  | "improve-copy"
  | "repurpose"
  | "upload";

export type ContentTool = {
  slug: ToolSlug;
  group: "create" | "edit";
  icon: LineIconName;
  /** Card title on the Content Creation page. */
  title: string;
  description: string;
  /** Heading and introduction on the tool's own page. */
  pageTitle: string;
  pageDescription: string;
};

export const CONTENT_TOOLS: readonly ContentTool[] = [
  {
    slug: "social-post",
    group: "create",
    icon: "message",
    title: "Social Post",
    description: "Generate social media posts with AI-driven captions and visual recommendations.",
    pageTitle: "Create a Social Post",
    pageDescription: "Get AI-powered content ideas, captions, and creative guidelines for your next social media post.",
  },
  {
    slug: "video",
    group: "create",
    icon: "video",
    title: "Video",
    description: "Short-form scripts and storyboards for engaging video content.",
    pageTitle: "Create a Video",
    pageDescription: "Get AI-powered video concepts, scripts, storyboards, and creative guidelines for your next video.",
  },
  {
    slug: "blog",
    group: "create",
    icon: "content",
    title: "Blog",
    description: "Articles and SEO-optimized content for your website and blog.",
    pageTitle: "Create a Blog Post",
    pageDescription: "Get AI-powered titles, article outlines, and SEO guidance for your next blog post.",
  },
  {
    slug: "ad-copy",
    group: "create",
    icon: "target",
    title: "Ad Copy",
    description: "Campaign copy and ad creative optimized for conversion.",
    pageTitle: "Create Ad Copy",
    pageDescription: "Get AI-powered headlines, persuasive ad copy, and creative guidelines for your next campaign.",
  },
  {
    slug: "edit-posts",
    group: "edit",
    icon: "edit",
    title: "Edit Posts",
    description: "Refine existing posts with AI suggestions for clarity and engagement.",
    pageTitle: "Edit Posts",
    pageDescription: "Paste a post and refine it for clarity, structure, and engagement.",
  },
  {
    slug: "improve-copy",
    group: "edit",
    icon: "sparkles",
    title: "Improve Copy",
    description: "Refine your writing, tone, and messaging with AI-driven suggestions.",
    pageTitle: "Improve Copy",
    pageDescription: "Strengthen tone, messaging, and readability with focused AI suggestions.",
  },
  {
    slug: "repurpose",
    group: "edit",
    icon: "repeat",
    title: "Repurpose content",
    description: "Transform your content into different formats and platforms.",
    pageTitle: "Repurpose content",
    pageDescription: "Turn one piece of content into channel-ready variations.",
  },
  {
    slug: "upload",
    group: "edit",
    icon: "upload",
    title: "Upload your file",
    description: "Upload existing content drafts to edit or enhance with AI tools.",
    pageTitle: "Upload your file",
    pageDescription: "Bring in an existing draft to edit and enhance with AI.",
  },
];

export function findTool(slug: string): ContentTool | null {
  return CONTENT_TOOLS.find((tool) => tool.slug === slug) ?? null;
}
