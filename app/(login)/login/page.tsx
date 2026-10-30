import type { Metadata } from "next";
import { safeNextPath } from "@/lib/hub/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Login", description: "Sign in to Sixth Sense." };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, reset } = await searchParams;
  return (
    <LoginForm
      next={safeNextPath(typeof next === "string" ? next : null)}
      notice={reset === "1" ? "Your password was changed. Log in with your new password." : undefined}
    />
  );
}
