"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { dateQuery, withQuery } from "@/lib/date-range";
import { ACCOUNT_ITEMS, APP_NAME, NAV_ITEMS, isActivePath } from "@/lib/navigation";
import { CloseIcon, MenuIcon, NotificationsIcon, PersonIcon, SearchIcon, SettingsIcon } from "@/components/icons";
import { buttonClassName } from "@/components/button";
import { signOut } from "@/app/(auth)/actions";

// Top bar and navigation drawer from the SIXTH SENSE mid-fi (MUI AppBar and temporary Drawer).

const iconButtonClass =
  "inline-flex size-12 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30";

const ACCOUNT_ICONS = { "/profile": PersonIcon, "/settings": SettingsIcon } as const;

/** Top bar that keeps the date bar's selection in its links. Wrap in Suspense (it reads the address). */
export function AppBarWithDates() {
  const searchParams = useSearchParams();
  return <AppBar query={dateQuery(new URLSearchParams(searchParams.toString()))} />;
}

/** The app's top bar. `query` is the date selection to keep when switching pages. */
export function AppBar({ query = "" }: { query?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const drawerId = useId();
  const notificationsId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // Move focus into the drawer when it opens and back to the menu button when it closes.
  useEffect(() => {
    if (open) {
      closeButton.current?.focus();
    } else if (wasOpen.current) {
      menuButton.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  // Escape closes the drawer, and the page behind it does not scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Keep Tab inside the open drawer.
  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !panel.current) return;
    const focusable = panel.current.querySelectorAll<HTMLElement>("a[href], button");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-paper shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] print:hidden">
      <div className="flex h-16 items-center gap-2 px-2 sm:px-4">
        <button
          ref={menuButton}
          type="button"
          className={iconButtonClass}
          aria-label="Menu"
          aria-expanded={open}
          aria-controls={drawerId}
          onClick={() => setOpen(true)}
        >
          <MenuIcon size={28} />
        </button>
        <Link href="/ask" aria-label="Search" className={iconButtonClass}>
          <SearchIcon size={28} />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <div className="relative">
            <button
              type="button"
              className={iconButtonClass}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              aria-controls={notificationsId}
              onClick={() => setNotificationsOpen((value) => !value)}
            >
              <NotificationsIcon size={28} />
            </button>
            {notificationsOpen && (
              <div
                id={notificationsId}
                role="status"
                className="absolute top-full right-0 z-40 mt-2 w-64 rounded bg-paper px-4 py-3 text-[14px] leading-[1.43] tracking-[0.17px] text-ink-muted shadow-elevation-8"
              >
                No notifications yet.
              </div>
            )}
          </div>
          {ACCOUNT_ITEMS.map((item) => {
            const ItemIcon = ACCOUNT_ICONS[item.href as keyof typeof ACCOUNT_ICONS];
            const active = isActivePath(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={withQuery(item.href, query)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`${iconButtonClass} ${active ? "text-primary" : ""}`}
              >
                <ItemIcon size={28} />
              </Link>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40">
          <div data-testid="drawer-scrim" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div
            ref={panel}
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onKeyDown={trapFocus}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-paper shadow-elevation-16"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <span className="text-[20px] leading-[1.6] tracking-[0.15px] font-medium text-primary">{APP_NAME}</span>
              <button
                ref={closeButton}
                type="button"
                className={iconButtonClass}
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <nav aria-label="Main" className="border-t border-divider px-2 py-2">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = isActivePath(item.href, pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={withQuery(item.href, query)}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between gap-2 rounded px-4 py-3 text-[16px] leading-[1.5] tracking-[0.15px] ${
                          active
                            ? "bg-primary/8 font-medium text-primary hover:bg-primary/12"
                            : "text-ink hover:bg-hover"
                        }`}
                      >
                        {item.label}
                        {item.status === "coming-soon" && (
                          <span className="shrink-0 text-[12px] leading-[1.66] tracking-[0.4px] text-ink-muted">
                            Coming soon
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <form action={signOut} className="mt-auto border-t border-divider p-4">
              <button type="submit" className={buttonClassName({ variant: "outlined", className: "w-full" })}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
