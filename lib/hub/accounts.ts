import { decodeStoredAccount, type StoredAccount } from "./account";
import { accountKey, emailFromKey } from "./account-key";
import { ACCOUNT_COOKIE } from "./constants";
import { profileCookieName } from "./profile";

// Every account made in this browser is remembered, each in its own cookie (with its business
// profile in another), so older accounts can still log in and reset their passwords.
// Browsers and servers limit how many cookie bytes a request may carry (Node's default header
// limit is 16 KB), so at most MAX_ACCOUNTS are kept within COOKIE_BUDGET, oldest dropped first.

export const ACCOUNT_PREFIX = "ss_account_";
export const MAX_ACCOUNTS = 5;
export const COOKIE_BUDGET = 12_000;

export function accountCookieName(email: string): string {
  return `${ACCOUNT_PREFIX}${accountKey(email)}`;
}

type CookieReader = { get(name: string): { value: string } | undefined };

/** The account saved in this browser for `email`, including one saved the old way; null if none. */
export function findAccount(jar: CookieReader, email: string): StoredAccount | null {
  const normalized = email.trim().toLowerCase();
  for (const name of [accountCookieName(normalized), ACCOUNT_COOKIE]) {
    const stored = decodeStoredAccount(jar.get(name)?.value);
    if (stored && stored.account.email === normalized) return stored;
  }
  return null;
}

/**
 * Emails of saved accounts to drop (with their profiles) so that at most MAX_ACCOUNTS remain and
 * all cookies fit COOKIE_BUDGET. Oldest first; `keepEmail` (the account being saved) is never dropped.
 */
export function accountsToEvict(cookies: readonly { name: string; value: string }[], keepEmail: string): string[] {
  const keep = keepEmail.trim().toLowerCase();
  const sizeOf = (name: string) => cookies.filter((cookie) => cookie.name === name).reduce((sum, c) => sum + c.name.length + c.value.length, 0);
  const saved = cookies
    .filter((cookie) => cookie.name.startsWith(ACCOUNT_PREFIX))
    .map((cookie) => {
      const email = emailFromKey(cookie.name.slice(ACCOUNT_PREFIX.length));
      return {
        email,
        savedAt: decodeStoredAccount(cookie.value)?.savedAt ?? 0,
        size: sizeOf(cookie.name) + sizeOf(profileCookieName(email)),
      };
    })
    .filter((entry) => entry.email !== keep)
    .sort((a, b) => a.savedAt - b.savedAt);

  let count = saved.length + 1;
  let total = cookies.reduce((sum, cookie) => sum + cookie.name.length + cookie.value.length, 0);
  const evict: string[] = [];
  for (const entry of saved) {
    if (count <= MAX_ACCOUNTS && total <= COOKIE_BUDGET) break;
    evict.push(entry.email);
    count -= 1;
    total -= entry.size;
  }
  return evict;
}

