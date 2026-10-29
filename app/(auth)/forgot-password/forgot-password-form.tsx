"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/alert";
import { Button, buttonClassName } from "@/components/button";
import { TextField } from "@/components/text-field";
import { requestPasswordReset } from "../actions";
import { authLinkClass } from "../styles";

/** Forgot Password: ask for the email, then show the reset link (the prototype cannot email it). */
export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, { email: "" });

  return (
    <>
      {state.error && (
        <Alert severity="error" className="mt-4">
          {state.error}
        </Alert>
      )}
      {state.link ? (
        <Alert severity="info" className="mt-4">
          <p>In a real app this link would be emailed to you. In the prototype, use it here. It works for 15 minutes.</p>
          <Link href={state.link} className={buttonClassName({ variant: "contained", className: "mt-3" })}>
            Reset your password
          </Link>
        </Alert>
      ) : (
        <form action={formAction} noValidate className="mt-4 flex flex-col gap-4">
          <p className="text-[16px] leading-[1.5] tracking-[0.15px] text-ink">
            Enter the email you use to log in and we&apos;ll give you a link to choose a new password.
          </p>
          <TextField label="Email address" name="email" type="email" autoComplete="email" defaultValue={state.email} />
          <Button type="submit" variant="contained" size="large" loading={pending} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
      <div className="mt-4 px-1">
        <Link href="/login" className={authLinkClass}>
          Back to login
        </Link>
      </div>
    </>
  );
}
