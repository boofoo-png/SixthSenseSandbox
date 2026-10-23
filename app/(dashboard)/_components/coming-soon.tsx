import Link from "next/link";
import { ACCOUNT_ITEMS, NAV_ITEMS, type NavItem } from "@/lib/navigation";
import { cardClass, cardHeadingClass, linkClass, pageClass, subtitleClass, titleClass } from "./styles";

type ComingSoonItem = Extract<NavItem, { status: "coming-soon" }>;

/** The navigation entry for an unbuilt page; throws if `href` is built or unknown. */
export function comingSoonItem(href: string): ComingSoonItem {
  const item = [...NAV_ITEMS, ...ACCOUNT_ITEMS].find((entry) => entry.href === href);
  if (!item || item.status !== "coming-soon") {
    throw new Error(`No coming-soon page for ${href}`);
  }
  return item;
}

/** Placeholder for a page that is planned but not built yet, listing what the mid-fi plans for it. */
export function ComingSoon({ item }: { item: ComingSoonItem }) {
  return (
    <main className={pageClass}>
      <p className="text-[12px] leading-[2.66] tracking-[1px] uppercase text-ink-muted">Coming soon</p>
      <h1 className={titleClass}>{item.label}</h1>
      <p className={subtitleClass}>{item.summary}</p>
      <section className={`mt-6 max-w-3xl ${cardClass}`}>
        <h2 className={cardHeadingClass}>What is planned</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink">
          {item.planned.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
      <Link href="/" className={`mt-6 inline-block ${linkClass}`}>
        Back to dashboard
      </Link>
    </main>
  );
}
