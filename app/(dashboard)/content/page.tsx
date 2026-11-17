import type { Metadata } from "next";
import Link from "next/link";
import { LineIcon } from "@/components/line-icons";
import { CONTENT_TOOLS } from "@/lib/hub/content/tools";
import { makePageClass } from "../_components/make-ui";
import { MyContentButton } from "./_components/tool-ui";

export const metadata: Metadata = {
  title: "Content Creation",
  description: "Create, re-purpose and edit content with the help of AI.",
};

// Content Creation from the team's Figma Make (re-checked 2026-11-16): My Content, the Campaign
// card (Campaigns left the sidebar), then four tools to create content and four to edit it.

const GROUPS = [
  { id: "create", title: "Create new AI-guided content" },
  { id: "edit", title: "Edit and enhance existing content" },
] as const;

export default function ContentPage() {
  return (
    <main className={makePageClass}>
      <header className="flex flex-col items-stretch gap-6 text-brand-cream min-[621px]:flex-row min-[621px]:items-start min-[621px]:justify-between">
        <div className="min-w-0">
          <h1 className="text-[clamp(27px,3vw,38px)] font-medium tracking-[-0.035em]">Content Creation</h1>
          <p className="mt-2 max-w-[700px] text-[13px] leading-[1.6] text-brand-cream/86">Create, re-purpose and edit content with the help of AI.</p>
        </div>
        <MyContentButton />
      </header>
      <section aria-label="Campaign" className="mt-6">
        <Link
          href="/campaigns"
          className="grid min-h-[104px] w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 rounded-[23px] border border-brand-navy/18 bg-[radial-gradient(circle_at_88%_20%,rgba(246,248,237,0.55),transparent_24%),var(--brand-lime-bright)] p-[18px] text-left text-brand-navy shadow-[0_7px_0_rgba(0,31,62,0.18),0_18px_32px_rgba(0,31,62,0.12)] transition hover:-translate-y-[3px] hover:shadow-[0_4px_0_rgba(0,31,62,0.2),0_20px_36px_rgba(0,31,62,0.16)] focus-visible:-translate-y-[3px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-cream min-[621px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[621px]:gap-[18px] min-[621px]:px-6 min-[621px]:py-5"
        >
          <span className="grid size-[54px] place-items-center rounded-2xl bg-brand-navy text-brand-cream shadow-[0_5px_0_rgba(0,31,62,0.18)]">
            <LineIcon name="campaign" size={24} />
          </span>
          <span className="grid min-w-0 gap-1.5">
            <strong className="text-[18px] font-extrabold">Campaign</strong>
            <small className="max-w-[690px] text-[12px] leading-[1.55] text-brand-navy/75">
              Build an editable campaign plan by defining your goal, offer, audience, channels, timing, and budget.
            </small>
          </span>
          <span className="col-span-full inline-flex items-center justify-end gap-1.5 text-[11px] font-extrabold whitespace-nowrap uppercase min-[621px]:col-span-1">
            Create campaign <LineIcon name="chevron" size={17} />
          </span>
        </Link>
      </section>
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
