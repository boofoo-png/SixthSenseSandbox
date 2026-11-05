"use server";

import { cookies } from "next/headers";
import { NEW_ACCOUNT_COOKIE } from "@/lib/hub/constants";

/** The new-account welcome was seen: show it only once, even if the dashboard is reloaded. */
export async function dismissWelcome(): Promise<void> {
  (await cookies()).delete(NEW_ACCOUNT_COOKIE);
}
