import Image from "next/image";
import type { ComponentProps } from "react";

// Button from the SIXTH SENSE design system (MUI for Figma kit, <Button>).
// Props follow the MUI Button API so designs map one to one.

export type ButtonVariant = "text" | "outlined" | "contained";
export type ButtonSize = "small" | "medium" | "large";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Replaces the label with a spinner and blocks presses. The label stays as the accessible name. */
  loading?: boolean;
};

const baseClass =
  "relative inline-flex items-center justify-center gap-2 rounded font-roboto font-medium uppercase whitespace-nowrap transition-[background-color,border-color,box-shadow] duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:cursor-default";

// typography/buttonSmall, buttonMedium, buttonLarge
const typeClass: Record<ButtonSize, string> = {
  small: "text-[13px] leading-[22px] tracking-[0.46px]",
  medium: "text-[14px] leading-[24px] tracking-[0.4px]",
  large: "text-[15px] leading-[26px] tracking-[0.46px]",
};

// The outlined border sits inside the box in Figma, so its CSS padding is 1px less.
const paddingClass: Record<ButtonVariant, Record<ButtonSize, string>> = {
  contained: { small: "px-[10px] py-[4px]", medium: "px-[16px] py-[6px]", large: "px-[22px] py-[8px]" },
  outlined: { small: "px-[9px] py-[3px]", medium: "px-[15px] py-[5px]", large: "px-[21px] py-[7px]" },
  text: { small: "px-[5px] py-[4px]", medium: "px-[8px] py-[6px]", large: "px-[11px] py-[8px]" },
};

const variantClass: Record<ButtonVariant, string> = {
  contained:
    "bg-primary text-primary-contrast shadow-elevation-2 hover:bg-primary-dark hover:shadow-elevation-4 active:shadow-elevation-8 disabled:bg-action-disabled-bg disabled:text-action-disabled disabled:shadow-none",
  outlined:
    "border border-primary/50 text-primary hover:border-primary hover:bg-primary/4 disabled:border-action-disabled-bg disabled:text-action-disabled",
  text: "text-primary hover:bg-primary/4 disabled:text-action-disabled",
};

// Keeps the spinner the same height as a line of label text.
const spinnerBoxClass: Record<ButtonSize, string> = {
  small: "h-[22px]",
  medium: "h-[24px]",
  large: "h-[26px]",
};

/** The Button's classes, for links or plain buttons that should look like a Button. */
export function buttonClassName({
  variant = "text",
  size = "medium",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return [baseClass, typeClass[size], paddingClass[variant][size], variantClass[variant], className]
    .filter(Boolean)
    .join(" ");
}

function Spinner({ size }: { size: ButtonSize }) {
  return (
    <span data-testid="button-spinner" aria-hidden="true" className={`flex items-center ${spinnerBoxClass[size]}`}>
      <span className="relative size-4 animate-spin">
        <Image
          src="/components/progress-ring.svg"
          alt=""
          width={16.75}
          height={17.5}
          className="absolute top-[-0.75px] left-0 max-w-none"
        />
      </span>
    </span>
  );
}

export function Button({
  variant = "text",
  size = "medium",
  loading = false,
  disabled = false,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = buttonClassName({ variant, size, className });

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-variant={variant}
      data-size={size}
      className={classes}
    >
      {loading ? (
        <>
          <span className="sr-only">{children}</span>
          <Spinner size={size} />
        </>
      ) : (
        children
      )}
    </button>
  );
}
