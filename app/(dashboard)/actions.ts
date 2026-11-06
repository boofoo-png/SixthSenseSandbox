"use server";

import { cookies } from "next/headers";
import { BUSINESS_COOKIE } from "@/lib/hub/businesses";
import { NEW_ACCOUNT_COOKIE } from "@/lib/hub/constants";
import { ONE_YEAR, cookieOptions } from "@/lib/hub/cookie-options";
import { workspaceFor } from "@/lib/hub/workspace";

/** The new-account welcome was seen: show it only once, even if the dashboard is reloaded. */
export async function dismissWelcome(): Promise<void> {
  (await cookies()).delete(NEW_ACCOUNT_COOKIE);
}

/** Switch the business shown across the app (the top bar's company menu). Unknown ids are ignored. */
export async function chooseBusiness(id: string): Promise<void> {
  const store = await cookies();
  const { businesses } = workspaceFor(store);
  if (!businesses.some((business) => business.id === id)) return;
  store.set(BUSINESS_COOKIE, id, cookieOptions(ONE_YEAR));
}
