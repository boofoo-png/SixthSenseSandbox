"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { dateQuery, withQuery } from "@/lib/date-range";
import { APP_NAME, NAV_ITEMS, isActivePath } from "@/lib/navigation";

/** Sidebar that keeps the date bar's selection in its links. Wrap in Suspense (it reads the address). */
export function SidebarWithDates() {
  const searchParams = useSearchParams();
  return <Sidebar query={dateQuery(new URLSearchParams(searchParams.toString()))} />;
}

/** The app navigation. `query` is the date selection to keep when switching pages. */
export function Sidebar({ query = "" }: { query?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navId = useId();

  return (
    <aside className="border-b border-zinc-200 bg-white print:hidden md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-6">
        <Link href={withQuery("/", query)} className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {APP_NAME}
        </Link>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 md:hidden dark:border-zinc-700 dark:text-zinc-300"
          aria-expanded={open}
          aria-controls={navId}
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
      </div>

      <nav
        id={navId}
        aria-label="Main"
        data-open={open}
        className={`${open ? "block" : "hidden"} px-3 pb-4 md:block`}
      >
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={withQuery(item.href, query)}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                  }`}
                >
                  {item.label}
                  {item.status === "coming-soon" && (
                    <span className="text-xs font-normal text-zinc-500 dark:text-zinc-500">
                      Coming soon
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
