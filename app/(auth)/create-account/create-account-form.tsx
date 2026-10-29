"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { flushSync, useFormStatus } from "react-dom";
import { Alert } from "@/components/alert";
import { Button, buttonClassName } from "@/components/button";
import { SelectField, TextField } from "@/components/text-field";
import { COUNTRIES, REGIONS, isCountryCode } from "@/lib/hub/regions";
import { cancelSignUp, createAccount, type CreateAccountState } from "../actions";
import { sectionHeadingClass } from "../styles";

const INITIAL: CreateAccountState = { errors: {}, values: {} };
const COUNTRY_OPTIONS = COUNTRIES.map((country) => ({ value: country.code, label: country.name }));

/**
 * Continue, plus Back (to Login) on a first visit. Once step 1 was done, leaving means throwing the
 * sign-up away, so that button says Cancel sign-up instead of a quiet Back. Locked while busy.
 */
function StepButtons({ signUpInProgress }: { signUpInProgress: boolean }) {
  const { pending, action } = useFormStatus();
  const cancelling = pending && action === cancelSignUp;
  return (
    <div className="flex gap-4 pt-2">
      <Button type="submit" variant="contained" loading={pending && !cancelling} disabled={pending}>
        Continue
      </Button>
      {signUpInProgress ? (
        <button type="submit" formAction={cancelSignUp} disabled={pending} className={buttonClassName({ variant: "outlined" })}>
          Cancel sign-up
        </button>
      ) : (
        <Link href="/login" className={buttonClassName({ variant: "outlined" })}>
          Back
        </Link>
      )}
    </div>
  );
}

type CreateAccountFormProps = {
  /** Details from an earlier visit to step 1 (coming back from step 2). */
  initialValues?: CreateAccountState["values"];
  /** A password was already chosen, so both password fields may be left blank. */
  keepingPassword?: boolean;
  /** Show the "Fill with sample data" button (local development only). */
  showDevTools?: boolean;
  /** Company named in an invite link, if the person arrived through one. */
  invitedBy?: string;
};

/** Valid made-up details for testing; the email is new each time. */
function sampleAccount(): Record<string, string> {
  return {
    firstName: "Sample",
    lastName: "Tester",
    role: "Marketing manager",
    company: "Harbourline Supply Co.",
    address1: "123 Example Road",
    city: "Richmond",
    province: "BC",
    postalCode: "V6X 1A1",
    email: `sample+${Date.now()}@example.com`,
    phone: "604 555 0100",
    password: "sample-pass1",
    confirmPassword: "sample-pass1",
  };
}

/** The mid-fi "Create an Account" form (step 1). Problems are checked on the server and shown per field. */
export function CreateAccountForm({
  initialValues = {},
  keepingPassword = false,
  showDevTools = false,
  invitedBy,
}: CreateAccountFormProps) {
  const [state, formAction] = useActionState(createAccount, INITIAL);
  const { errors } = state;
  const values = state === INITIAL ? initialValues : state.values;
  const [country, setCountry] = useState(values.country && isCountryCode(values.country) ? values.country : "CA");
  const regionLabel = COUNTRIES.find((entry) => entry.code === country)?.regionLabel ?? "Province";
  const hasErrors = Object.keys(errors).length > 0;
  const formRef = useRef<HTMLFormElement>(null);

  function fillWithSample() {
    flushSync(() => setCountry("CA"));
    for (const [name, value] of Object.entries(sampleAccount())) {
      const field = formRef.current?.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) field.value = value;
    }
  }

  return (
    <section className="w-full max-w-[624px]">
      <p className="text-[12px] leading-[2.66] tracking-[1px] uppercase text-ink-muted">Step 1 of 2</p>
      <h1 className="text-[34px] leading-[1.235] tracking-[0.25px] font-normal text-ink">Create an Account</h1>

      {invitedBy && (
        <Alert severity="info" className="mt-6">
          {`You were invited to join ${invitedBy} on Sixth Sense.`}
        </Alert>
      )}

      {hasErrors && (
        <Alert severity="error" className="mt-6">
          Check the highlighted fields and try again. For your security, passwords need to be typed again.
        </Alert>
      )}

      {showDevTools && (
        <button type="button" onClick={fillWithSample} className={buttonClassName({ variant: "outlined", size: "small", className: "mt-4" })}>
          Fill with sample data (local testing only)
        </button>
      )}

      <form ref={formRef} action={formAction} noValidate className="mt-6 flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First name" name="firstName" autoComplete="given-name" required defaultValue={values.firstName} error={errors.firstName} />
          <TextField label="Last name" name="lastName" autoComplete="family-name" required defaultValue={values.lastName} error={errors.lastName} />
          <TextField
            className="sm:col-span-2"
            label="Role at company"
            name="role"
            autoComplete="organization-title"
            required
            defaultValue={values.role}
            error={errors.role}
          />
        </div>

        <h2 className={sectionHeadingClass}>Company Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            className="sm:col-span-2"
            label="Company name"
            name="company"
            autoComplete="organization"
            required
            defaultValue={values.company}
            error={errors.company}
          />
          <TextField label="Address 1" name="address1" autoComplete="address-line1" required defaultValue={values.address1} error={errors.address1} />
          <TextField label="Address 2" name="address2" autoComplete="address-line2" placeholder="Optional" defaultValue={values.address2} />
          <TextField label="City" name="city" autoComplete="address-level2" required defaultValue={values.city} error={errors.city} />
          <SelectField
            key={country}
            label={regionLabel}
            name="province"
            autoComplete="address-level1"
            required
            placeholder={`Choose a ${regionLabel.toLowerCase()}`}
            options={REGIONS[country].map((region) => ({ value: region.code, label: region.name }))}
            defaultValue={values.country === country ? values.province : undefined}
            error={errors.province}
          />
          <SelectField
            label="Country"
            name="country"
            autoComplete="country"
            required
            options={COUNTRY_OPTIONS}
            value={country}
            onChange={(event) => setCountry(isCountryCode(event.target.value) ? event.target.value : "CA")}
            error={errors.country}
          />
          <TextField label="Postal code" name="postalCode" autoComplete="postal-code" required defaultValue={values.postalCode} error={errors.postalCode} />
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            helperText="Will be used for login"
            defaultValue={values.email}
            error={errors.email}
          />
          <TextField label="Phone number" name="phone" type="tel" autoComplete="tel" required defaultValue={values.phone} error={errors.phone} />
        </div>

        <h2 className={sectionHeadingClass}>Password</h2>
        <div className="flex flex-col gap-4">
          <TextField
            label="Create a password"
            name="password"
            type="password"
            autoComplete="new-password"
            required={!keepingPassword}
            revealable
            helperText={keepingPassword ? "Leave blank to keep the password you chose" : "At least 8 characters"}
            error={errors.password}
          />
          <TextField
            label="Re-type password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required={!keepingPassword}
            revealable
            error={errors.confirmPassword}
          />
        </div>

        <StepButtons signUpInProgress={keepingPassword} />
      </form>
    </section>
  );
}
