import type { Metadata } from "next";
import Link from "next/link";
import { authLinkClass, sectionHeadingClass } from "../styles";

export const metadata: Metadata = { title: "Forgot your password?" };

// The site map's "Forgot password?" has no screen yet; there is no email service in the prototype.
export default function ForgotPasswordPage() {
  return (
    <section className="w-full max-w-[552px]">
      <h1 className={`py-4 ${sectionHeadingClass}`}>Forgot your password?</h1>
      <hr className="border-divider" />
      <p className="mt-4 text-[16px] leading-[1.5] tracking-[0.15px] text-ink">
        Resetting a password isn&apos;t available in this prototype yet, because accounts are saved in this browser
        only. You can create a new account with the same email address, which replaces the old one.
      </p>
      <div className="mt-6 flex flex-col items-start gap-2 px-1">
        <Link href="/login" className={authLinkClass}>
          Back to login
        </Link>
        <Link href="/create-account" className={authLinkClass}>
          Create a new account
        </Link>
      </div>
    </section>
  );
}
