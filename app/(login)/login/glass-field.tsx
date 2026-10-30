"use client";

import { useId, useState, type ComponentProps } from "react";
import { VisibilityIcon, VisibilityOffIcon } from "@/components/icons";

type GlassFieldProps = Omit<ComponentProps<"input">, "className" | "id"> & {
  /** Read by screen readers; `placeholder` is the name shown on screen. */
  label: string;
  /** Adds a show/hide button for passwords. */
  revealable?: boolean;
};

/** The pill-shaped see-through field from the high-fi "Log In" frame. */
export function GlassField({ label, revealable = false, type = "text", ...rest }: GlassFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        type={revealable && revealed ? "text" : type}
        className={`h-[clamp(48px,6.2svh,69px)] w-full rounded-[30px] border border-brand-cream/40 bg-brand-cream/15 pl-[30px] text-[16px] text-brand-cream shadow-[inset_0_4px_4px_0_rgba(0,0,0,0.25)] outline-none placeholder:text-brand-cream focus:border-2 focus:border-brand-cream lg:text-[clamp(16px,1.8svh,20px)] ${revealable ? "pr-14" : "pr-[30px]"}`}
      />
      {revealable && (
        <button
          type="button"
          aria-label="Show password"
          aria-pressed={revealed}
          onClick={() => setRevealed((value) => !value)}
          className="absolute top-1/2 right-3 inline-flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-brand-cream hover:bg-brand-cream/20 focus-visible:outline-2 focus-visible:outline-brand-cream"
        >
          {revealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </button>
      )}
    </div>
  );
}
