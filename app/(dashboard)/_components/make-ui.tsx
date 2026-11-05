import Link from "next/link";
import type { ReactNode } from "react";
import { LineIcon, type LineIconName } from "@/components/line-icons";

// Building blocks shared by the pages redesigned from the Figma Make "Marketing Intelligence Hub"
// (cream panels on the shell's green gradient).

export const makePageClass =
  "mx-auto w-full max-w-[1440px] flex-1 px-[18px] pt-[22px] pb-12 min-[621px]:px-[clamp(24px,3vw,46px)] min-[621px]:pt-[30px] min-[621px]:pb-[54px]";
export const panelClass = "rounded-[11px] border border-brand-teal/12 bg-brand-cream p-[18px] text-brand-navy";
export const eyebrowClass = "mb-1 text-[10px] font-bold tracking-[0.11em] text-brand-coral uppercase";
export const panelTitleClass = "text-[16px] font-semibold tracking-[-0.025em] text-brand-navy";
export const chipClass = "w-max rounded-[20px] bg-brand-lime px-1.5 py-[3px] text-[10px] font-semibold text-brand-teal not-italic";
export const softLinkClass =
  "inline-flex min-h-[29px] items-center justify-center gap-1 rounded-md border border-brand-teal/15 bg-[#fafaf9] px-2.5 text-[11px] font-medium text-[#4f5357] hover:border-brand-teal hover:text-brand-teal";

/** The Make's page header: eyebrow, title, and description in cream, with Ask Sense AI on the right. */
export function MakePageHeader({ eyebrow, title, description, question }: { eyebrow: string; title: string; description: string; question: string }) {
  return (
    <header className="mb-6 flex flex-col items-start gap-5 min-[621px]:flex-row min-[621px]:items-end min-[621px]:justify-between min-[621px]:gap-7">
      <div className="max-w-[680px] text-brand-cream">
        <p className="mb-1 text-[10px] font-bold tracking-[0.11em] uppercase">{eyebrow}</p>
        <h1 className="text-[clamp(25px,2.7vw,38px)] leading-[1.08] font-semibold tracking-[-0.045em]">{title}</h1>
        <p className="mt-2.5 max-w-[630px] text-[13px] leading-[1.6] text-brand-cream/90">{description}</p>
      </div>
      <Link
        href={`/ask?q=${encodeURIComponent(question)}`}
        className="shell-glass inline-flex min-h-9 w-full shrink-0 items-center justify-center gap-[5px] rounded-md px-[13px] text-[11px] font-medium text-brand-cream hover:bg-brand-cream/25 min-[621px]:w-auto"
      >
        <LineIcon name="sparkles" size={15} /> Ask Sense AI about this page
      </Link>
    </header>
  );
}

export function StatCard({
  icon,
  label,
  value,
  detail,
  warm = false,
}: {
  icon: LineIconName;
  label: string;
  value: string;
  detail: string;
  warm?: boolean;
}) {
  return (
    <article className="flex min-h-[112px] items-center gap-3.5 rounded-[11px] border border-brand-teal/12 bg-brand-cream p-[18px]">
      <span className={`grid size-[42px] shrink-0 place-items-center rounded-[11px] ${warm ? "bg-[#ecffb6] text-[#00804c]" : "bg-[#dbe8e8] text-brand-teal"}`}>
        <LineIcon name={icon} />
      </span>
      <div className="grid min-w-0">
        <p className="mb-[3px] text-[11px] text-[#6d7074]">{label}</p>
        <strong className="text-[24px] font-semibold tracking-[-0.04em] text-brand-navy">{value}</strong>
        <span className="mt-[3px] truncate text-[11px] text-[#7d8084]">{detail}</span>
      </div>
    </article>
  );
}

/** A heading row inside a panel: eyebrow and title on the left, anything on the right. */
export function PanelHeading({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className={eyebrowClass}>{eyebrow}</p>
        <h2 id={id} className={panelTitleClass}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
