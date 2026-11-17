"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { LineIcon } from "@/components/line-icons";
import { dateQuery, withQuery } from "@/lib/date-range";
import { APP_NAME, SIDEBAR_ITEMS, isActivePath } from "@/lib/navigation";

// Sidebar from the Figma Make "Marketing Intelligence Hub" (updated by the team on 2026-11-05):
// the logo, the Make's seven destinations, and Settings and Help (which opens Sense AI) at the
// bottom. Sign out lives on the Settings page, as in the Make.

const SENSE_PROMPTS = [
  "What is gaining momentum this week?",
  "How are competitors reaching hotels?",
  "What content should we create next?",
] as const;

const utilityButtonClass =
  "grid size-[38px] place-items-center rounded-full text-brand-navy transition-colors hover:bg-brand-navy/22 hover:text-brand-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime-bright";

/** Sidebar that keeps the date bar's selection in its links. Wrap in Suspense (it reads the address). */
export function SidebarWithDates() {
  const searchParams = useSearchParams();
  return <Sidebar query={dateQuery(new URLSearchParams(searchParams.toString()))} />;
}

/** The signed-in sidebar. `query` is the date selection to keep when switching pages. */
export function Sidebar({ query = "" }: { query?: string }) {
  const pathname = usePathname();
  const [senseOpen, setSenseOpen] = useState(false);
  const closeSense = useCallback(() => setSenseOpen(false), []);
  const settingsActive = isActivePath("/settings", pathname);

  // The drawer sits beside the sidebar, not inside it: the sidebar's blur would trap a fixed panel.
  return (
    <>
      <aside
        data-tour="navigation"
        className="shell-sidebar relative z-10 flex flex-col rounded-b-[26px] px-4 pt-5 pb-3.5 text-brand-cream print:hidden min-[621px]:sticky min-[621px]:top-0 min-[621px]:h-svh min-[621px]:rounded-none min-[621px]:rounded-r-[34px] min-[621px]:pt-7 min-[621px]:pr-0 min-[621px]:pb-6 min-[621px]:pl-[27px]"
      >
        <Link
          href={withQuery("/", query)}
          className="flex items-center gap-2.5 rounded-lg pb-[18px] text-[18px] font-bold min-[621px]:pr-[18px] min-[621px]:pb-[54px] min-[621px]:pl-[3px]"
        >
          <Image src="/brand/sixth-sense-mark.svg" alt="" width={40} height={42} className="h-[42px] w-10" />
          <span>SixthSense</span>
          <span className="sr-only">{APP_NAME} dashboard</span>
        </Link>

        <nav aria-label="Main" className="min-h-0 min-[621px]:overflow-y-auto">
          <ul className="flex gap-2 overflow-x-auto pb-1.5 min-[621px]:flex-col min-[621px]:gap-[7px] min-[621px]:overflow-visible min-[621px]:pb-0">
            {SIDEBAR_ITEMS.map((item) => {
              const active = [item.href, ...(item.also ?? [])].some((href) => isActivePath(href, pathname));
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={withQuery(item.href, query)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 min-w-[145px] items-center gap-[9px] rounded-3xl px-3.5 text-[16px] leading-tight font-medium tracking-[-0.015em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime-bright min-[621px]:min-h-[52px] min-[621px]:min-w-0 min-[621px]:rounded-l-[18px] min-[621px]:rounded-r-none ${
                      active ? "shell-nav-active" : "hover:bg-brand-navy/10"
                    }`}
                  >
                    <LineIcon name={item.icon} size={20} />
                    <span className="min-w-0 flex-1">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden flex-1 min-[621px]:block" />

        <div className="flex items-center justify-end gap-2.5 pt-2 min-[621px]:justify-start min-[621px]:pt-0 min-[621px]:pl-[9px]">
          <Link
            href={withQuery("/settings", query)}
            aria-label="Settings"
            aria-current={settingsActive ? "page" : undefined}
            className={`${utilityButtonClass} ${settingsActive ? "bg-brand-navy/22 text-brand-cream" : ""}`}
          >
            <LineIcon name="settings" size={25} />
          </Link>
          <button
            type="button"
            onClick={() => setSenseOpen(true)}
            aria-haspopup="dialog"
            aria-label="Help and Sense AI"
            className={utilityButtonClass}
          >
            <LineIcon name="help" size={25} />
          </button>
        </div>
      </aside>
      {senseOpen && <SenseDrawer onClose={closeSense} />}
    </>
  );
}

/** Sense AI from the Make: suggested questions and a sample answer. Nothing is sent anywhere. */
export function SenseDrawer({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [answered, setAnswered] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // Focus the drawer when it opens and give focus back when it closes; Escape closes it.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [onClose]);

  // Keep Tab inside the open drawer.
  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !panel.current) return;
    const focusable = panel.current.querySelectorAll<HTMLElement>("a[href], button, input");
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

  const ask = (text: string) => {
    setQuestion(text);
    setAnswered(text.trim().length > 0);
  };

  return (
    <div className="fixed inset-0 z-30 text-brand-navy">
      <div data-testid="sense-scrim" className="absolute inset-0 bg-[rgba(0,31,63,0.25)] backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sense-title"
        onKeyDown={trapFocus}
        className="shell-navy-glass absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-brand-cream/38 shadow-[-18px_0_50px_rgba(0,31,63,0.16)]"
      >
        <header className="flex items-center gap-[11px] border-b border-brand-cream/34 p-[18px] text-brand-cream">
          <span className="grid size-[38px] shrink-0 -rotate-5 place-items-center rounded-[14px] bg-brand-lime text-brand-navy shadow-[0_0_36px_rgba(236,255,182,0.38)]">
            <LineIcon name="sparkles" size={20} />
          </span>
          <div className="flex-1">
            <p id="sense-title" className="text-[12px] font-bold">
              Sense AI
            </p>
            <p className="text-[10px] text-brand-cream/80">Your marketing research assistant</p>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close Sense AI"
            className="grid size-[38px] place-items-center rounded-lg border border-brand-cream/34 text-[20px] font-light hover:bg-brand-cream/12"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#fafaf8] px-[18px] py-6">
          <div className="rounded-[11px] bg-[radial-gradient(circle_at_90%_15%,rgba(236,255,182,0.3),transparent_31%)] bg-brand-navy p-5 text-brand-cream">
            <p className="mb-1 text-[10px] font-bold tracking-[0.11em] text-brand-coral uppercase">Ask about your market</p>
            <h2 className="text-[18px] font-semibold tracking-[-0.03em]">What would you like to understand?</h2>
            <p className="mt-2 text-[11px] leading-[1.55] text-[#c9d1dc]">
              I can connect audience, competitor, content, and performance signals from your workspace.
            </p>
          </div>
          <div className="mt-3.5 grid gap-[7px]">
            {SENSE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => ask(prompt)}
                className="flex min-h-[45px] items-center justify-between gap-3 rounded-lg border border-brand-teal/20 bg-brand-cream px-[13px] text-left text-[11px] text-[#565a5f] hover:border-brand-lime hover:text-brand-teal"
              >
                {prompt}
                <LineIcon name="chevron" size={14} />
              </button>
            ))}
          </div>
          {answered && (
            <div role="status" className="mt-3.5 rounded-[9px] border border-[rgba(116,195,101,0.65)] bg-[#edf4f3] p-[15px]">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-brand-teal uppercase">
                <LineIcon name="sparkles" size={14} /> Sense AI · Suggestion
              </p>
              <p className="mt-1 text-[10px] text-brand-slate">You asked: {question}</p>
              <p className="mt-2.5 mb-3 text-[11px] leading-[1.6] text-[#566466]">
                Sustainability-led guest experience content is your strongest current opportunity. Interest is up 32%,
                while practical buyer-focused posts are outperforming brand-led content across Instagram and search.
              </p>
              <p className="mb-3 text-[10px] text-brand-slate">A sample answer: Sense AI does not read live data yet.</p>
              <Link
                href="/content"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-teal hover:underline"
              >
                Create from this insight <LineIcon name="chevron" size={14} />
              </Link>
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            ask(question);
          }}
          className="flex gap-2 border-t border-brand-cream/34 bg-brand-cream p-3.5"
        >
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-brand-teal/25 bg-white px-3 text-[#96989c] focus-within:border-brand-teal">
            <LineIcon name="search" size={17} />
            <input
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                setAnswered(false);
              }}
              aria-label="Ask a question about your market"
              placeholder="Ask a question about your market"
              className="h-[38px] w-full bg-transparent text-[12px] text-brand-navy outline-none placeholder:text-[#8a8c90]"
            />
          </label>
          <button
            type="submit"
            className="h-10 rounded-lg bg-brand-teal px-[15px] text-[12px] font-semibold text-brand-cream shadow-[0_5px_12px_rgba(0,84,95,0.14)] hover:bg-[#00545f]"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
