"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPasswordPair, decodeStoredAccount, encodeStored } from "@/lib/hub/account";
import { accountCookieName, findAccount, metaCookieName, settingsCookieName } from "@/lib/hub/accounts";
import { ACCOUNT_COOKIE, DEMO_ACCOUNT, SESSION_COOKIE } from "@/lib/hub/constants";
import { encodeCookieJson } from "@/lib/hub/cookie-json";
import { ONE_YEAR, cookieOptions } from "@/lib/hub/cookie-options";
import { hashPassword, verifyPassword } from "@/lib/hub/password";
import { readSettingsForm, type AccountSettings, type SettingsErrors } from "@/lib/hub/settings";
import { workspaceFor } from "@/lib/hub/workspace";
import { clearSnapshotCache, connectionFor } from "@/lib/social/meta/access";
import { metaConfig } from "@/lib/social/meta/config";
import { revokePermissions } from "@/lib/social/meta/graph";
import { settingsWith } from "@/lib/social/meta/results";

export type SaveSettingsState = { status: "idle" | "saved" | "invalid" | "failed"; errors: SettingsErrors; values?: AccountSettings };

/** Save Changes on the Settings page: profile, workspace, and notification preferences. */
export async function saveSettings(_previous: SaveSettingsState, formData: FormData): Promise<SaveSettingsState> {
  const store = await cookies();
  const email = store.get(SESSION_COOKIE)?.value;
  if (!email) redirect("/login");
  const result = readSettingsForm(formData, email);
  if (!result.ok) return { status: "invalid", errors: result.errors, values: result.values };
  const encoded = encodeCookieJson(result.settings);
  if (!encoded) return { status: "failed", errors: {}, values: result.settings };
  store.set(settingsCookieName(email), encoded, cookieOptions(ONE_YEAR));
  return { status: "saved", errors: {}, values: result.settings };
}

export type PasswordState = { status: "idle" | "changed" | "invalid"; errors: { current?: string; password?: string; confirmPassword?: string; form?: string } };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Change password, for accounts created in this browser. The demo account's password is fixed. */
export async function changePassword(_previous: PasswordState, formData: FormData): Promise<PasswordState> {
  const store = await cookies();
  const email = store.get(SESSION_COOKIE)?.value;
  if (!email) redirect("/login");
  if (email === DEMO_ACCOUNT.email) {
    return { status: "invalid", errors: { form: "The demo account's password can't be changed. Create your own account to try this." } };
  }
  const saved = findAccount(store, email);
  if (!saved) return { status: "invalid", errors: { form: "We couldn't find this account in this browser." } };
  if (!verifyPassword(text(formData, "current"), saved.passwordHash)) {
    return { status: "invalid", errors: { current: "That isn't your current password." } };
  }
  const password = text(formData, "password");
  const errors = checkPasswordPair(password, text(formData, "confirmPassword"));
  if (Object.keys(errors).length > 0) return { status: "invalid", errors: { password: errors.password, confirmPassword: errors.confirmPassword } };
  store.set(accountCookieName(email), encodeStored({ ...saved, passwordHash: hashPassword(password) }), cookieOptions(ONE_YEAR));
  // An account saved the old way (one shared cookie) now lives in its own cookie instead.
  if (decodeStoredAccount(store.get(ACCOUNT_COOKIE)?.value)?.account.email === email) store.delete(ACCOUNT_COOKIE);
  return { status: "changed", errors: {} };
}

/** Disconnect on Settings: forgets the chosen business's Meta connection and asks Meta to remove the app's access. */
export async function disconnectMeta(): Promise<void> {
  const store = await cookies();
  const email = store.get(SESSION_COOKIE)?.value;
  if (!email) redirect("/login");
  const { business } = workspaceFor(store);
  const config = metaConfig();
  const connection = connectionFor(store, email, business.id, config);
  if (connection && config) {
    await revokePermissions(config, connection.token, fetch); // still disconnects if Meta can't be reached
    clearSnapshotCache(connection.igUserId);
  }
  store.delete(metaCookieName(email, business.id));
  redirect(settingsWith("disconnected"));
}
