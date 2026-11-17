import type { Metadata } from "next";
import { sectionHeadingClass } from "../styles";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot your password?" };

export default function ForgotPasswordPage() {
  return (
    <section className="w-full max-w-[552px]">
      <p className="pt-4 text-[12px] leading-[2.66] tracking-[1px] text-ink-muted uppercase">Account recovery</p>
      <h1 className={`pb-4 ${sectionHeadingClass}`}>Forgot your password?</h1>
      <hr className="border-divider" />
      <ForgotPasswordForm />
    </section>
  );
}
