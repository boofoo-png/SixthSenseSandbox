import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { defaultAudienceSlug, findAudience } from "@/lib/hub/audience";
import { SESSION_COOKIE } from "@/lib/hub/constants";
import { findTool, type ToolSlug } from "@/lib/hub/content/tools";
import { profileForSession } from "@/lib/hub/demo-profile";
import { makePageClass } from "../../_components/make-ui";
import { AdCopyTool, BlogTool, SocialPostTool, VideoTool } from "../_components/create-tools";
import { EditPostsTool, ImproveCopyTool, RepurposeTool, UploadTool } from "../_components/edit-tools";
import { ToolHeader } from "../_components/tool-ui";

export async function generateMetadata({ params }: PageProps<"/content/[tool]">): Promise<Metadata> {
  const tool = findTool((await params).tool);
  return tool ? { title: tool.pageTitle, description: tool.pageDescription } : { title: "Content Creation" };
}

const TOOLS: Record<ToolSlug, (props: { audience: string }) => ReactNode> = {
  "social-post": SocialPostTool,
  video: VideoTool,
  blog: BlogTool,
  "ad-copy": AdCopyTool,
  "edit-posts": EditPostsTool,
  "improve-copy": ImproveCopyTool,
  repurpose: RepurposeTool,
  upload: UploadTool,
};

// One Content Creation tool (Figma Make, 2026-11-05). Create tools write for the default
// audience saved on the Audience page.
export default async function ContentToolPage({ params }: PageProps<"/content/[tool]">) {
  const tool = findTool((await params).tool);
  if (!tool) notFound();
  const jar = await cookies();
  const email = jar.get(SESSION_COOKIE)?.value ?? "";
  const profile = email ? profileForSession(jar, email) : null;
  const audience = findAudience(defaultAudienceSlug(profile))?.name ?? "Hospitality Procurement Teams";
  const Tool = TOOLS[tool.slug];

  return (
    <main className={makePageClass}>
      <ToolHeader title={tool.pageTitle} description={tool.pageDescription} />
      <Tool audience={audience} />
    </main>
  );
}
