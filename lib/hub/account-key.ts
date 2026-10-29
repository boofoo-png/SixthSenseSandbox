// Each account saved in this browser gets its own cookies, named after its email
// (base64url, so the name only uses letters, digits, "-" and "_").

export function accountKey(email: string): string {
  return Buffer.from(email.trim().toLowerCase()).toString("base64url");
}

/** The email an account key was made from. */
export function emailFromKey(key: string): string {
  return Buffer.from(key, "base64url").toString("utf8");
}
