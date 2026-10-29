import { MAX_TEXT } from "./text";

// Invite team (docs/FUNCTIONALITY.md): an invite link that names the company that sent it.
// In the prototype, opening it shows who invited you on Create an Account; there is no shared
// team account to join yet. Works in the browser and on the server (no Buffer).

export type Invite = { company: string };

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  const binary = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/** The link to send teammates, e.g. https://example.com/create-account?invite=... */
export function inviteLinkFor(origin: string, company: string): string {
  return `${origin}/create-account?invite=${toBase64Url(JSON.stringify({ company }))}`;
}

/** Who sent an invite code; null when it is missing or not an invite. */
export function decodeInvite(code: string | undefined): Invite | null {
  if (!code) return null;
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(code));
    const company = (parsed as { company?: unknown } | null)?.company;
    return typeof company === "string" && company.trim() !== "" && company.length <= MAX_TEXT ? { company } : null;
  } catch {
    return null;
  }
}
