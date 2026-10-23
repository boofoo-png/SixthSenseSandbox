import type { ReactNode } from "react";
import { ErrorOutlineIcon, InfoOutlinedIcon } from "./icons";

// Standard Alert from the SIXTH SENSE design system (MUI Alert, variant "standard").

type Severity = "error" | "info";

const STYLES: Record<Severity, { box: string; icon: string; Icon: typeof InfoOutlinedIcon }> = {
  error: { box: "bg-error-bg text-error-fg", icon: "text-error", Icon: ErrorOutlineIcon },
  info: { box: "bg-info-bg text-info-fg", icon: "text-info", Icon: InfoOutlinedIcon },
};

/** A message box. Errors are announced to screen readers as soon as they appear. */
export function Alert({ severity, children, className = "" }: { severity: Severity; children: ReactNode; className?: string }) {
  const { box, icon, Icon } = STYLES[severity];
  return (
    <div
      role={severity === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded px-4 py-[6px] text-[14px] leading-[1.43] tracking-[0.17px] ${box} ${className}`}
    >
      <Icon size={22} className={`mt-[7px] shrink-0 ${icon}`} />
      <div className="py-2">{children}</div>
    </div>
  );
}
