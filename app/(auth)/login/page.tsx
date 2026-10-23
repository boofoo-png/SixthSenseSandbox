import type { Metadata } from "next";
import { safeNextPath } from "@/lib/hub/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Login", description: "Sign in to Sixth Sense." };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return <LoginForm next={safeNextPath(typeof next === "string" ? next : null)} />;
}
