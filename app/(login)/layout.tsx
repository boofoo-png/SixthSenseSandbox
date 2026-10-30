import Image from "next/image";
import { Montserrat } from "next/font/google";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/navigation";

// Typeface of the high-fi styleguide. Only this screen uses it so far; the rest of the app stays on Roboto.
const montserrat = Montserrat({ subsets: ["latin"] });

// The high-fi "Log In" frame: the logo, welcome, and tagline on the left, the page on a glass card on the right.
// Sizes follow the screen height (the frame is 1117px tall) so the page fits without scrolling.
export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${montserrat.className} flex min-h-svh flex-1 flex-col justify-center bg-[linear-gradient(90deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15)),url(/brand/login-gradient.svg)] bg-size-[100%_100%] px-4 py-4 text-brand-cream sm:px-8 lg:px-16`}
    >
      <div className="mx-auto flex w-full max-w-[1355px] flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <div className="flex flex-col justify-between gap-2 lg:min-h-[clamp(480px,67.8svh,757px)] lg:min-w-0 lg:flex-1">
          <div className="flex items-center gap-3 lg:block">
            <Image
              src="/brand/sixth-sense-mark.svg"
              alt={APP_NAME}
              width={110}
              height={113}
              priority
              className="h-auto w-12 lg:ml-[15px] lg:w-[clamp(64px,10svh,110px)]"
            />
            <div className="text-[20px] leading-[1.3] tracking-[0.15px] lg:mt-[clamp(12px,3svh,33px)] lg:text-[clamp(28px,4.3svh,48px)] lg:leading-[1.6]">
              <p>WELCOME TO</p>
              <p>SixthSense</p>
            </div>
          </div>
          <div className="text-[18px] leading-[1.3] font-bold tracking-[0.15px] lg:text-[clamp(24px,3.6svh,40px)] lg:leading-[1.6]">
            <p>Everything Marketing,</p>
            <p>All in ONE PLACE</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
