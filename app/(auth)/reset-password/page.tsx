import type { Metadata } from "next";
import { sectionHeadingClass } from "../styles";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  return (
    <section className="w-full max-w-[552px]">
      <h1 className={`py-4 ${sectionHeadingClass}`}>Choose a new password</h1>
      <hr className="border-divider" />
      <ResetPasswordForm token={typeof token === "string" ? token : ""} />
    </section>
  );
}
