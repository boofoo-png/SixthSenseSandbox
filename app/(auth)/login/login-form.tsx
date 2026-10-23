"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { DEMO_ACCOUNT } from "@/lib/hub/constants";
import { signIn } from "../actions";
import { authLinkClass, sectionHeadingClass } from "../styles";

/** The mid-fi Login form. `next` is the page to open after signing in. */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, { email: "" });

  return (
    <section aria-labelledby="login-heading" className="w-full max-w-[552px]">
      <div className="py-4">
        <h2 id="login-heading" className={sectionHeadingClass}>
          Login
        </h2>
        <hr className="mt-1 border-divider" />
      </div>

      {state.error && (
        <Alert severity="error" className="mb-4">
          {state.error}
        </Alert>
      )}

      <form action={formAction} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <TextField label="Email address" name="email" type="email" autoComplete="email" defaultValue={state.email} />
        <TextField label="Password" name="password" type="password" autoComplete="current-password" revealable />
        <label className="flex w-fit cursor-pointer items-center text-[16px] leading-[1.5] tracking-[0.15px] text-ink">
          <span className="inline-flex size-[42px] items-center justify-center rounded-full hover:bg-hover">
            <input type="checkbox" name="remember" className="size-[18px] cursor-pointer accent-primary" />
          </span>
          Remember Me
        </label>
        <Button type="submit" variant="contained" size="large" loading={pending} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="mt-3 flex flex-col items-start gap-2 px-1">
        <Link href="/forgot-password" className={authLinkClass}>
          Forgot your password?
        </Link>
        <Link href="/create-account" className={authLinkClass}>
          Create an account
        </Link>
      </div>

      <Alert severity="info" className="mt-8">
        Trying the prototype? Sign in with <strong className="font-medium">{DEMO_ACCOUNT.email}</strong> and the
        password <strong className="font-medium">{DEMO_ACCOUNT.password}</strong>, or create an account. Accounts are
        saved in this browser only.
      </Alert>
    </section>
  );
}
