import type { Metadata } from "next";
import { findTool } from "@/lib/hub/content/tools";
import { makePageClass } from "../../_components/make-ui";
import { MyContent } from "../_components/my-content";

export const metadata: Metadata = {
  title: "My Content",
  description: "Browse, search and reuse everything you've uploaded or saved.",
};

// My Content from the team's Figma Make. ?from=<tool> is the tool that opened it, for Back.
export default async function MyContentPage({ searchParams }: PageProps<"/content/my-content">) {
  const from = (await searchParams).from;
  const tool = typeof from === "string" ? findTool(from) : null;
  return (
    <main className={makePageClass}>
      <MyContent back={tool ? `/content/${tool.slug}` : "/content"} />
    </main>
  );
}
