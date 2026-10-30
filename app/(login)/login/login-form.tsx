"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/(auth)/actions";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { DEMO_ACCOUNT } from "@/lib/hub/constants";
import { GlassField } from "./glass-field";

const linkClass =
  "rounded-sm text-[14px] leading-[1.167] font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream sm:text-[16px] lg:text-[clamp(16px,1.8svh,20px)]";

/** The high-fi Log In form. `next` is the page to open after signing in; `notice` is a message to show first. */
export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, formAction, pending] = useActionState(signIn, { email: "" });

  return (
    <main className="w-full shrink-0 lg:w-1/2 lg:max-w-[702px]">
      <section
        aria-labelledby="login-heading"
        className="flex flex-col justify-center rounded-[32px] border border-brand-cream/40 bg-brand-cream/10 px-5 py-5 shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] backdrop-blur-md sm:px-12 lg:min-h-[clamp(480px,67.8svh,757px)] lg:rounded-[50px] lg:px-[70px] lg:py-[clamp(24px,5.8svh,65px)]"
      >
        <h1 id="login-heading" className="mb-3 text-center text-[26px] leading-[1.4] font-bold tracking-[0.15px] lg:mb-[clamp(16px,5.2svh,58px)] lg:text-[clamp(28px,3.6svh,40px)] lg:leading-[1.6]">
          Let&apos;s start
        </h1>

        {notice && !state.error && (
          <Alert severity="info" className="mb-4">
            {notice}
          </Alert>
        )}

        {state.error && (
          <Alert severity="error" className="mb-4">
            {state.error}
          </Alert>
        )}

        <form action={formAction} noValidate className="flex flex-col">
          <input type="hidden" name="next" value={next} />
          <div className="flex flex-col gap-3 lg:gap-[clamp(16px,5.3svh,59px)]">
            <GlassField label="Email address" placeholder="Email" name="email" type="email" autoComplete="email" defaultValue={state.email} />
            <GlassField label="Password" placeholder="Password" name="password" type="password" autoComplete="current-password" revealable />
          </div>
          <label className="mt-3 flex w-fit cursor-pointer items-center gap-3 pl-[30px] text-[16px] leading-[1.167] font-medium lg:mt-[clamp(12px,3svh,33px)] lg:text-[clamp(16px,1.8svh,20px)]">
            <span className="relative inline-flex size-[22px] shrink-0">
              <input
                type="checkbox"
                name="remember"
                className="peer size-[22px] cursor-pointer appearance-none rounded-[5px] border-2 border-brand-cream checked:bg-brand-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 22 22"
                className="pointer-events-none absolute inset-0 hidden fill-none stroke-brand-blue stroke-[2.5] peer-checked:block"
              >
                <path d="m6 11 3.5 3.5L16 8" />
              </svg>
            </span>
            Remember me
          </label>
          <Button
            type="submit"
            loading={pending}
            className="mx-auto mt-4 h-[clamp(48px,6.2svh,69px)] w-[223px] rounded-[30px]! bg-brand-lime! text-[clamp(20px,2.15svh,24px)]! leading-[1.167]! font-bold! [font-family:inherit]! tracking-normal! text-brand-blue! normal-case! shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]! hover:bg-brand-cream! focus-visible:ring-brand-cream/60! lg:mt-[clamp(16px,5.5svh,62px)]"
          >
            Log In
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-11 lg:mt-[clamp(16px,6svh,68px)]">
          <Link href="/create-account" className={linkClass}>
            Create Account
          </Link>
          <Link href="/forgot-password" className={`${linkClass} text-brand-blue`}>
            Forgot Your Password
          </Link>
        </div>
      </section>

      <Alert severity="info" className="mt-3 lg:mt-[clamp(12px,2svh,24px)]">
        Trying the prototype? Sign in with <strong className="font-medium">{DEMO_ACCOUNT.email}</strong> and the
        password <strong className="font-medium">{DEMO_ACCOUNT.password}</strong>, or create an account. Accounts are
        saved in this browser only.
      </Alert>
    </main>
  );
}
