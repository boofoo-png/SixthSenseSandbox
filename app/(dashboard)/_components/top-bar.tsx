"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { LineIcon } from "@/components/line-icons";
import type { Workspace } from "@/lib/hub/workspace";

// Top bar from the Figma Make "Marketing Intelligence Hub": Ask anything, notifications, and the
// business you are signed in for. Ask anything opens /ask, as the dashboard's search did before.

export function TopBar({ workspace }: { workspace: Workspace }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsId = useId();

  return (
    <header
      data-tour="topbar"
      className="relative z-20 flex flex-wrap items-center justify-between gap-2.5 px-[18px] pt-4 pb-2 text-brand-cream print:hidden min-[621px]:gap-6 min-[621px]:px-[clamp(24px,3vw,44px)] min-[621px]:pt-6 min-[621px]:pb-2.5 min-[901px]:min-h-24 min-[901px]:flex-nowrap"
    >
      <form action="/ask" method="get" role="search" className="min-w-0 basis-full min-[901px]:flex-1 min-[901px]:basis-auto">
        <label className="shell-glass flex h-12 w-full items-center gap-2 rounded-[32px] px-[22px] focus-within:border-brand-lime min-[621px]:h-14">
          <LineIcon name="search" size={17} />
          <input
            type="search"
            name="q"
            aria-label="Ask anything"
            placeholder="Ask anything"
            className="h-11 w-full bg-transparent text-[14px] text-brand-cream outline-none placeholder:text-brand-cream/80 min-[621px]:h-[52px]"
          />
        </label>
      </form>

      <div className="flex w-full items-center justify-end gap-3 min-[901px]:w-auto min-[901px]:shrink-0">
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-controls={notificationsId}
            onClick={() => setNotificationsOpen((open) => !open)}
            className="shell-glass grid size-12 place-items-center rounded-full transition-colors hover:bg-brand-cream/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime-bright min-[621px]:size-14"
          >
            <LineIcon name="bell" />
          </button>
          {notificationsOpen && (
            <div
              id={notificationsId}
              role="status"
              className="absolute top-full right-0 z-40 mt-2 w-64 rounded-xl bg-brand-cream px-4 py-3 text-[13px] text-brand-slate shadow-[0_18px_34px_rgba(0,31,63,0.18)]"
            >
              No notifications yet.
            </div>
          )}
        </div>
        <Link
          href="/profile"
          className="shell-glass flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-[30px] py-[5px] pr-5 pl-[7px] text-[12px] font-semibold transition-colors hover:bg-brand-cream/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime-bright min-[621px]:min-h-14 min-[621px]:max-w-[260px] min-[621px]:flex-none"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-cream text-brand-teal">
            <LineIcon name="audience" />
          </span>
          <span className="truncate">{workspace.company}</span>
          <span className="sr-only">: your profile</span>
        </Link>
      </div>
    </header>
  );
}
