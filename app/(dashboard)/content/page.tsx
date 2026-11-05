import type { Metadata } from "next";
import Link from "next/link";
import { LineIcon } from "@/components/line-icons";
import { CONTENT_TOOLS } from "@/lib/hub/content/tools";
import { makePageClass } from "../_components/make-ui";

export const metadata: Metadata = {
  title: "Content Creation",
  description: "Create, re-purpose and edit content with the help of AI.",
};

// Content Creation from the team's updated Figma Make (2026-11-05): four tools to create new
// content and four to edit existing content. Each card opens its tool at /content/<tool>.

const GROUPS = [
  { id: "create", title: "Create new AI-guided content" },
  { id: "edit", title: "Edit and enhance existing content" },
] as const;

export default function ContentPage() {
  return (
    <main className={makePageClass}>
      <header className="text-brand-cream">
        <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.035em]">Content Creation</h1>
        <p className="mt-2 max-w-[700px] text-[13px] leading-[1.6] text-brand-cream/86">Create, re-purpose and edit content with the help of AI.</p>
      </header>
      {GROUPS.map((group, index) => (
        <section key={group.id} aria-labelledby={`${group.id}-title`} className={index === 0 ? "mt-[26px]" : "mt-9 min-[621px]:mt-11 min-[1151px]:mt-[clamp(54px,8vh,88px)]"}>
          <h2 id={`${group.id}-title`} className="mb-4 text-[15px] font-bold text-brand-cream">
            {group.title}
          </h2>
          <ul className="grid gap-[18px] min-[621px]:grid-cols-2 min-[1151px]:grid-cols-4">
            {CONTENT_TOOLS.filter((tool) => tool.group === group.id).map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/content/${tool.slug}`}
                  className="group relative flex h-full min-h-[166px] flex-col items-start gap-3.5 overflow-hidden rounded-[23px] border border-brand-cream/70 bg-brand-cream/94 px-[22px] py-6 text-left text-brand-navy shadow-[0_8px_0_rgba(0,31,62,0.18),0_18px_30px_rgba(0,31,62,0.1)] transition hover:-translate-y-[3px] hover:bg-brand-cream hover:shadow-[0_5px_0_rgba(0,31,62,0.2),0_20px_34px_rgba(0,31,62,0.15)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-lime-bright"
                >
                  <span className="grid size-[39px] place-items-center rounded-xl border border-brand-teal/16 bg-[linear-gradient(145deg,rgba(221,254,86,0.2),rgba(3,82,94,0.08))] bg-white/62 text-brand-teal transition group-hover:-rotate-3 group-hover:scale-[1.04] group-hover:bg-brand-teal group-hover:text-brand-cream">
                    <LineIcon name={tool.icon} size={21} />
                  </span>
                  <strong className="text-[15px] font-bold text-brand-teal">{tool.title}</strong>
                  <span className="max-w-[225px] text-[12px] leading-[1.55] text-[#344c53]">{tool.description}</span>
                  <span aria-hidden="true" className="absolute right-[18px] bottom-[17px] -translate-x-1.5 text-brand-teal opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                    <LineIcon name="chevron" size={17} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
