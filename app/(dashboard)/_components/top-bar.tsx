"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { LineIcon } from "@/components/line-icons";
import type { Workspace } from "@/lib/hub/workspace";
import { chooseBusiness } from "../actions";

// Top bar from the Figma Make "Marketing Intelligence Hub": Ask anything, notifications, and the
// company name menu (functionality list): switch business and open Profile and settings.

const pillClass =
  "shell-glass flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-[30px] py-[5px] pr-5 pl-[7px] text-[12px] font-semibold transition-colors hover:bg-brand-cream/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime-bright min-[621px]:min-h-14 min-[621px]:max-w-[260px] min-[621px]:flex-none";

function CompanyMenu({ workspace }: { workspace: Workspace }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const menuId = useId();
  const wrapper = useRef<HTMLDivElement>(null);

  // Close on Escape or a click outside.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onClick = (event: MouseEvent) => !wrapper.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const badge = (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-cream text-brand-teal">
      <LineIcon name="audience" />
    </span>
  );

  return (
    <div ref={wrapper} className="relative min-w-0 flex-1 min-[621px]:flex-none">
      <button type="button" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((value) => !value)} className={`${pillClass} w-full`}>
        {badge}
        <span className="truncate">{workspace.company}</span>
        <LineIcon name="chevron" size={14} className={`ml-auto shrink-0 transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />
        <span className="sr-only">: company menu</span>
      </button>
      {open && (
        <div id={menuId} className="absolute top-full right-0 z-40 mt-2 w-64 rounded-[16px] bg-brand-cream p-2 text-[13px] text-brand-navy shadow-[0_18px_34px_rgba(0,31,63,0.25)]">
          {workspace.businesses.length > 1 && (
            <>
              <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold tracking-[0.1em] text-brand-slate uppercase">Switch business</p>
              <ul>
                {workspace.businesses.map((business) => {
                  const current = business.id === workspace.business.id;
                  return (
                    <li key={business.id}>
                      <button
                        type="button"
                        aria-current={current ? "true" : undefined}
                        disabled={pending}
                        onClick={() => {
                          setOpen(false);
                          if (current) return;
                          startTransition(async () => {
                            await chooseBusiness(business.id);
                            router.refresh();
                          });
                        }}
                        className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left hover:bg-brand-teal/10 ${current ? "font-semibold text-brand-teal" : ""}`}
                      >
                        {business.name}
                        {current && <span aria-hidden="true">✓</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <hr className="my-1.5 border-brand-teal/15" />
            </>
          )}
          <Link href="/settings" onClick={() => setOpen(false)} className="block rounded-[10px] px-3 py-2 hover:bg-brand-teal/10">
            Profile and settings
          </Link>
        </div>
      )}
    </div>
  );
}

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
        <CompanyMenu workspace={workspace} />
      </div>
    </header>
  );
}
