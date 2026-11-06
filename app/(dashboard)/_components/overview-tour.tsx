"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { LineIcon } from "@/components/line-icons";
import type { Workspace } from "@/lib/hub/workspace";
import { dismissWelcome } from "../actions";

// The Figma Make's first-visit welcome and seven-step dashboard tour. The welcome shows once, right
// after sign-up; "Explore my dashboard" starts the tour, which points at each part of the page.

export const TOUR_STEPS = [
  {
    target: "navigation",
    eyebrow: "Step 1 · Navigate",
    title: "Your workspace navigation",
    description:
      "Move between overview, audience, competitors, content creation, campaigns, AI management, and reports from here.",
  },
  {
    target: "topbar",
    eyebrow: "Step 2 · Find answers",
    title: "Search or ask Sense AI",
    description:
      "Ask anything about your market, review notifications, or open Sense AI with Help in the sidebar for a direct question.",
  },
  {
    target: "metrics",
    eyebrow: "Step 3 · Monitor",
    title: "Your overview at a glance",
    description:
      "These cards summarize competitor activity, market interest, audience growth, engagement, planning, and channel momentum.",
  },
  {
    target: "trends",
    eyebrow: "Step 4 · Discover",
    title: "Monitor market interest",
    description:
      "See whether interest in your market is increasing or decreasing and compare the score across time periods.",
  },
  {
    target: "audience",
    eyebrow: "Step 5 · Focus",
    title: "Track audience growth",
    description: "Monitor how quickly your connected channels are attracting new audience members.",
  },
  {
    target: "opportunity",
    eyebrow: "Step 6 · Plan",
    title: "Know your next move",
    description: "See the next post on your content calendar, or ask Sense AI what to plan next.",
  },
  {
    target: "community",
    eyebrow: "Step 7 · Compare",
    title: "Watch competitor activity",
    description: "Compare posting volume and performance changes across the competitors on your watchlist.",
  },
] as const;

const POPOVER_WIDTH = 350;
const POPOVER_HEIGHT = 245;

export function OverviewTour({ showWelcome, workspace }: { showWelcome: boolean; workspace: Workspace }) {
  const [welcomeOpen, setWelcomeOpen] = useState(showWelcome);
  const [step, setStep] = useState(-1);
  const [, startTransition] = useTransition();

  function startTour() {
    setWelcomeOpen(false);
    setStep(0);
    startTransition(() => dismissWelcome());
  }

  return (
    <>
      {welcomeOpen && <Welcome workspace={workspace} onContinue={startTour} />}
      {step >= 0 && <TourPopover step={step} onStep={setStep} onClose={() => setStep(-1)} />}
    </>
  );
}

function Welcome({ workspace, onContinue }: { workspace: Workspace; onContinue: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => button.current?.focus(), []);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[rgba(0,31,62,0.58)] p-[22px] backdrop-blur-[7px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onKeyDown={(event) => {
          // Only one control, so Tab stays on it.
          if (event.key === "Tab") event.preventDefault();
        }}
        className="max-h-[calc(100dvh-44px)] w-full max-w-[620px] overflow-y-auto rounded-[18px] border border-brand-cream/38 bg-linear-145 from-brand-cream/16 to-brand-cream/8 p-[clamp(25px,5vw,42px)] text-center text-brand-cream shadow-[inset_0_1px_0_rgba(246,248,237,0.28),0_18px_45px_rgba(0,31,62,0.2)] backdrop-blur-[22px]"
      >
        <span className="mx-auto mb-[18px] grid size-[68px] -rotate-4 place-items-center rounded-[19px] bg-brand-lime-bright text-brand-navy">
          <LineIcon name="sparkles" size={30} />
        </span>
        <p className="mb-1 text-[10px] font-bold tracking-[0.11em] text-brand-coral uppercase">Setup complete</p>
        <h1 id="welcome-title" className="text-[clamp(27px,4vw,38px)] leading-[1.15] font-normal tracking-[-0.025em]">
          Welcome to SixthSense, {workspace.firstName}
        </h1>
        <p className="mx-auto mt-[13px] mb-[22px] max-w-[500px] text-[14px] leading-[1.6]">
          Your {workspace.company} workspace is ready and personalized with the information you provided. You can now
          explore your market intelligence dashboard.
        </p>
        <dl className="mb-5 grid gap-[9px] text-left min-[481px]:grid-cols-2">
          {[
            { icon: "email" as const, label: "Account email", value: workspace.email },
            { icon: "dashboard" as const, label: "Workspace", value: workspace.company },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 rounded-[9px] border border-brand-cream/38 bg-brand-cream/12 p-[13px]">
              <LineIcon name={item.icon} />
              <div className="grid min-w-0 gap-[3px]">
                <dt className="text-[10px]">{item.label}</dt>
                <dd className="truncate text-[12px] font-semibold">{item.value}</dd>
              </div>
            </div>
          ))}
        </dl>
        <button
          ref={button}
          type="button"
          onClick={onContinue}
          className="h-12 w-full rounded-lg bg-brand-lime-bright text-[14px] font-semibold text-brand-navy transition-colors hover:bg-brand-lime focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-cream/60"
        >
          Explore my dashboard
        </button>
      </section>
    </div>
  );
}

function TourPopover({ step, onStep, onClose }: { step: number; onStep: (step: number) => void; onClose: () => void }) {
  const [position, setPosition] = useState({ left: 24, top: 140 });
  const heading = useRef<HTMLHeadingElement>(null);
  const current = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;

  // Highlight the step's part of the page, scroll it into view, and place the popover beside it.
  useLayoutEffect(() => {
    const target = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    if (!target) return;
    target.setAttribute("data-tour-active", "");
    target.scrollIntoView?.({ behavior: "smooth", block: step === 0 ? "nearest" : "center" });

    const place = () => {
      const rect = target.getBoundingClientRect();
      const width = Math.min(POPOVER_WIDTH, window.innerWidth - 32);
      const left = Math.min(window.innerWidth - width - 16, Math.max(16, rect.left + Math.min(42, rect.width / 3)));
      const below = rect.bottom + 14;
      const top = below + POPOVER_HEIGHT < window.innerHeight ? below : Math.max(16, rect.top - POPOVER_HEIGHT - 14);
      setPosition({ left, top });
    };
    const timer = window.setTimeout(place, 240);
    window.addEventListener("resize", place);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", place);
      target.removeAttribute("data-tour-active");
    };
  }, [current.target, step]);

  useEffect(() => heading.current?.focus(), [step]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Keep Tab inside the popover while the tour runs.
  function trapFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const buttons = event.currentTarget.querySelectorAll<HTMLElement>("button");
    const first = buttons[0];
    const lastButton = buttons[buttons.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
      event.preventDefault();
      lastButton.focus();
    } else if (!event.shiftKey && document.activeElement === lastButton) {
      event.preventDefault();
      first.focus();
    }
  }

  const softButton =
    "inline-flex min-h-[29px] items-center rounded-md border border-brand-cream/24 bg-brand-cream/8 px-2.5 text-[11px] font-medium text-brand-cream hover:bg-brand-cream/15";

  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-[34] bg-[rgba(0,31,63,0.68)] backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-description"
        onKeyDown={trapFocus}
        style={position}
        className="shell-navy-glass fixed z-[36] w-[min(350px,calc(100vw-32px))] rounded-[14px] border border-[rgba(214,251,0,0.45)] p-5 text-brand-cream shadow-[0_22px_60px_rgba(0,31,63,0.34)]"
      >
        <div aria-hidden="true" className="mb-[17px] grid grid-cols-7 gap-1">
          {TOUR_STEPS.map((item, index) => (
            <span
              key={item.target}
              className={`h-[3px] rounded ${index <= step ? "bg-brand-lime-bright" : "bg-brand-cream/18"}`}
            />
          ))}
        </div>
        <p className="mb-1 text-[10px] font-bold tracking-[0.11em] text-brand-lime-bright uppercase">{current.eyebrow}</p>
        <h2 id="tour-title" ref={heading} tabIndex={-1} className="text-[18px] font-semibold tracking-[-0.025em] outline-none">
          {current.title}
        </h2>
        <p id="tour-description" className="mt-[9px] mb-[18px] text-[12px] leading-[1.6] text-[#c9d1dc]">
          {current.description}
        </p>
        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {TOUR_STEPS.length}
        </p>
        <div className="flex items-center gap-[7px]">
          <button type="button" onClick={onClose} className="text-[11px] font-semibold text-[#aeb6c5] hover:text-brand-cream">
            Skip tour
          </button>
          <span className="flex-1" />
          {step > 0 && (
            <button type="button" onClick={() => onStep(step - 1)} className={softButton}>
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? onClose() : onStep(step + 1))}
            className="inline-flex h-10 items-center rounded-lg bg-brand-lime-bright px-[15px] text-[12px] font-semibold text-brand-navy hover:bg-brand-lime"
          >
            {last ? "Finish" : "Next"}
          </button>
        </div>
      </section>
    </>
  );
}
