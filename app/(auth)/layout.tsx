import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/navigation";

// Sign-in pages (login, create account, forgot password): no top bar, the product name on top.
// The mid-fi has a "Sixth Sense Logo" placeholder here; the name stands in until a logo exists.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center bg-paper px-4 py-10 sm:py-16">
      <Link
        href="/login"
        className="mb-8 text-[48px] leading-[1.2] font-light tracking-[-0.5px] text-primary sm:mb-10 sm:text-[60px]"
      >
        {APP_NAME}
      </Link>
      {children}
    </div>
  );
}
