"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Pages redesigned from the Figma Make (and every /content tool): they sit straight on the shell's gradient. */
export const MAKE_PAGES = ["/", "/explore", "/competitors", "/content", "/ai-management", "/campaigns", "/insights"] as const;

// Pages not redesigned yet keep their light background and Roboto type on a rounded panel so
// their text stays readable.
export function PageSurface({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if ((MAKE_PAGES as readonly string[]).includes(pathname) || pathname.startsWith("/content/") || pathname.startsWith("/ai-management/")) {
    return <div className="flex min-w-0 flex-1 flex-col">{children}</div>;
  }
  return (
    <div className="mx-[18px] mb-6 flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl bg-canvas font-sans text-ink shadow-[0_18px_34px_rgba(0,31,63,0.1)] print:m-0 print:rounded-none print:bg-white print:shadow-none min-[621px]:mx-[clamp(24px,3vw,46px)]">
      {children}
    </div>
  );
}
