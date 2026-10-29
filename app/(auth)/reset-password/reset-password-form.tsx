"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { resetPassword } from "../actions";
import { authLinkClass } from "../styles";

/** Choose a new password from a reset link. */
export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, { errors: {} });
  const { errors } = state;

  return (
    <>
      {errors.form && (
        <Alert severity="error" className="mt-4">
          {errors.form}{" "}
          <Link href="/forgot-password" className="font-medium underline">
            Ask for a new link
          </Link>
        </Alert>
      )}
      <form action={formAction} noValidate className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <TextField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          revealable
          helperText="At least 8 characters"
          error={errors.password}
        />
        <TextField
          label="Re-type password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          revealable
          error={errors.confirmPassword}
        />
        <Button type="submit" variant="contained" size="large" loading={pending} className="w-full">
          Change password
        </Button>
      </form>
      <div className="mt-4 px-1">
        <Link href="/login" className={authLinkClass}>
          Back to login
        </Link>
      </div>
    </>
  );
}
