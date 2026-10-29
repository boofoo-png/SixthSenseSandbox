import type { Metadata } from "next";
import { sectionHeadingClass } from "../styles";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot your password?" };

export default function ForgotPasswordPage() {
  return (
    <section className="w-full max-w-[552px]">
      <h1 className={`py-4 ${sectionHeadingClass}`}>Forgot your password?</h1>
      <hr className="border-divider" />
      <ForgotPasswordForm />
    </section>
  );
}
