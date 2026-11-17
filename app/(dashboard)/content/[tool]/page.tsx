import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { todayIsoDate } from "@/lib/analytics/dates";
import { defaultAudienceSlug, findAudience } from "@/lib/hub/audience";
import { SESSION_COOKIE } from "@/lib/hub/constants";
import { findTool, type ToolSlug } from "@/lib/hub/content/tools";
import { profileForSession } from "@/lib/hub/demo-profile";
import { workspaceFor } from "@/lib/hub/workspace";
import { makePageClass } from "../../_components/make-ui";
import { AdCopyTool, BlogTool, SocialPostTool, VideoTool } from "../_components/create-tools";
import { EditPostsTool, ImproveCopyTool, RepurposeTool, UploadTool } from "../_components/edit-tools";
import { CalendarTargetProvider } from "../_components/calendar-target";
import { ToolHeader } from "../_components/tool-ui";

export async function generateMetadata({ params }: PageProps<"/content/[tool]">): Promise<Metadata> {
  const tool = findTool((await params).tool);
  return tool ? { title: tool.pageTitle, description: tool.pageDescription } : { title: "Content Creation" };
}

const TOOLS: Record<ToolSlug, (props: { audience: string; from?: string }) => ReactNode> = {
  "social-post": SocialPostTool,
  video: VideoTool,
  blog: BlogTool,
  "ad-copy": AdCopyTool,
  "edit-posts": EditPostsTool,
  "improve-copy": ImproveCopyTool,
  repurpose: RepurposeTool,
  upload: UploadTool,
};

// One Content Creation tool (Figma Make, re-checked 2026-11-16). Create tools write for the default
// audience (from the sign-up answers).
export default async function ContentToolPage({ params, searchParams }: PageProps<"/content/[tool]">) {
  const tool = findTool((await params).tool);
  // Reuse in My Content opens Repurpose content with ?from=<item id>.
  const from = (await searchParams).from;
  if (!tool) notFound();
  const jar = await cookies();
  const email = jar.get(SESSION_COOKIE)?.value ?? "";
  const profile = email ? profileForSession(jar, email) : null;
  const audience = findAudience(defaultAudienceSlug(profile))?.name ?? "Hospitality Procurement Teams";
  const Tool = TOOLS[tool.slug];
  // "Add to calendar" uses the business chosen in the top bar's company menu.
  const { business } = workspaceFor(jar);

  return (
    <main className={makePageClass}>
      <ToolHeader slug={tool.slug} title={tool.pageTitle} description={tool.pageDescription} />
      <CalendarTargetProvider value={{ business, today: todayIsoDate() }}>
        <Tool audience={audience} from={typeof from === "string" ? from : undefined} />
      </CalendarTargetProvider>
    </main>
  );
}
