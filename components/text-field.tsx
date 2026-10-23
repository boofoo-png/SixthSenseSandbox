"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { ArrowDropDownIcon, VisibilityIcon, VisibilityOffIcon } from "./icons";

// Outlined TextField and Select from the SIXTH SENSE design system (MUI TextField, outlined,
// medium). The label sits in a gap in the outline (a <fieldset> notch, as MUI does it).
// The select is a native <select> styled to match; it is not the team's Dropdown component.

type FieldChrome = {
  label: string;
  /** Shown under the field. Replaced by `error` when there is one. */
  helperText?: string;
  /** Error message; turns the field red and marks it invalid. */
  error?: string;
  required?: boolean;
  className?: string;
};

function Frame({
  id,
  label,
  required,
  invalid,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  invalid: boolean;
  children: ReactNode;
}) {
  const tone = invalid
    ? "border-error peer-focus:border-error"
    : "border-outline group-hover:border-ink peer-focus:border-primary";
  return (
    <div className="group relative">
      {children}
      <fieldset
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 -top-[6px] bottom-0 rounded border px-[9px] peer-focus:border-2 ${tone}`}
      >
        <legend className="invisible h-3 max-w-full whitespace-nowrap px-[4px] text-[12px] leading-3 tracking-[0.15px]">
          {label}
          {required && " *"}
        </legend>
      </fieldset>
      <label
        htmlFor={id}
        className={`pointer-events-none absolute top-0 left-[10px] max-w-[calc(100%-20px)] -translate-y-1/2 truncate px-[4px] text-[12px] leading-3 tracking-[0.15px] ${
          invalid ? "text-error" : "text-ink-muted peer-focus:text-primary"
        }`}
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
    </div>
  );
}

function Helper({ id, text, invalid }: { id: string; text?: string; invalid: boolean }) {
  if (!text) return null;
  return (
    <p id={id} className={`mx-[14px] mt-[3px] text-[12px] leading-[1.66] tracking-[0.4px] ${invalid ? "text-error" : "text-ink-muted"}`}>
      {text}
    </p>
  );
}

const controlClass =
  "peer block w-full rounded bg-transparent px-[14px] py-4 text-[16px] leading-6 tracking-[0.15px] text-ink outline-none placeholder:text-ink-muted";

type TextFieldProps = FieldChrome &
  Omit<ComponentProps<"input">, "className" | "required"> & {
    /** Adds a show/hide button for passwords. */
    revealable?: boolean;
  };

export function TextField({
  label,
  helperText,
  error,
  required,
  className,
  revealable = false,
  type = "text",
  id: givenId,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const id = givenId ?? autoId;
  const helperId = `${id}-helper`;
  const message = error ?? helperText;
  const [revealed, setRevealed] = useState(false);
  const inputType = revealable && revealed ? "text" : type;

  return (
    <div className={className}>
      <Frame id={id} label={label} required={required} invalid={Boolean(error)}>
        <input
          {...rest}
          id={id}
          type={inputType}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? helperId : undefined}
          className={`${controlClass} ${revealable ? "pr-12" : ""}`}
        />
        {revealable && (
          <button
            type="button"
            aria-label="Show password"
            aria-pressed={revealed}
            onClick={() => setRevealed((value) => !value)}
            className="absolute top-1/2 right-2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            {revealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </button>
        )}
      </Frame>
      <Helper id={helperId} text={message} invalid={Boolean(error)} />
    </div>
  );
}

export type SelectOption = { value: string; label: string };

type SelectFieldProps = FieldChrome &
  Omit<ComponentProps<"select">, "className" | "required" | "children"> & {
    options: readonly SelectOption[];
    /** Text for an empty first choice, e.g. "Choose a province". */
    placeholder?: string;
  };

export function SelectField({
  label,
  helperText,
  error,
  required,
  className,
  options,
  placeholder,
  id: givenId,
  ...rest
}: SelectFieldProps) {
  const autoId = useId();
  const id = givenId ?? autoId;
  const helperId = `${id}-helper`;
  const message = error ?? helperText;

  return (
    <div className={className}>
      <Frame id={id} label={label} required={required} invalid={Boolean(error)}>
        <select
          {...rest}
          id={id}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? helperId : undefined}
          className={`${controlClass} cursor-pointer appearance-none pr-10`}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ArrowDropDownIcon className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ink-muted" />
      </Frame>
      <Helper id={helperId} text={message} invalid={Boolean(error)} />
    </div>
  );
}
