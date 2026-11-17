import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/navigation";
import { montserrat } from "../fonts";

// Sign-in pages (create account, onboarding, forgot and reset password) in the Figma Make's glass
// style: the green gradient (`auth-glass` in globals.css), the logo and "SixthSense" on top, and
// each page on a frosted card (authCardClass).
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`auth-glass ${montserrat.className} flex min-h-svh flex-1 flex-col items-center px-4 py-8 sm:px-8 sm:py-12`}>
      <Link
        href="/login"
        aria-label={APP_NAME}
        className="mb-6 flex items-center gap-[18px] rounded-lg text-[31px] font-bold text-brand-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-lime-bright"
      >
        <Image src="/brand/sixth-sense-mark.svg" alt="" width={110} height={113} priority className="h-auto w-12" />
        SixthSense
      </Link>
      {children}
    </div>
  );
}
