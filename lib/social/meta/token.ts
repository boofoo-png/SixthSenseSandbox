import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

// A business's Meta connection, sealed for its cookie (DECISIONS.md 2026-11-06): AES-256-GCM with a
// key derived from SOCIAL_TOKEN_SECRET, bound to the account email and business id, so the cookie
// cannot be read, changed, or moved to another account or business. Server only.

export type MetaConnection = {
  /** Meta's long-lived user access token. Never send it to the browser. */
  token: string;
  /** When Meta says the token stops working, ms since epoch. */
  expiresAt: number;
  igUserId: string;
  igUsername: string;
  pageId: string;
  pageName: string;
  connectedAt: number;
};

export type ConnectionOwner = { email: string; businessId: string };

const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function keyFrom(secret: string): Buffer {
  return Buffer.from(hkdfSync("sha256", secret, "sixthsense-meta-token", VERSION, 32));
}

function ownerData(owner: ConnectionOwner): Buffer {
  return Buffer.from(`${owner.email.trim().toLowerCase()}\n${owner.businessId}`, "utf8");
}

export function sealConnection(connection: MetaConnection, owner: ConnectionOwner, secret: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(secret), iv);
  cipher.setAAD(ownerData(owner));
  const body = Buffer.concat([cipher.update(JSON.stringify(connection), "utf8"), cipher.final()]);
  return `${VERSION}.${Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url")}`;
}

const isText = (value: unknown, max = 2048): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
const isTime = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

function isConnection(value: unknown): value is MetaConnection {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isText(v.token) &&
    isTime(v.expiresAt) &&
    isText(v.igUserId, 40) &&
    isText(v.igUsername, 60) &&
    isText(v.pageId, 40) &&
    isText(v.pageName, 200) &&
    isTime(v.connectedAt)
  );
}

/** The connection, or null when the value is missing, changed, for someone else, sealed with another secret, or expired. */
export function openConnection(sealed: string | undefined, owner: ConnectionOwner, secret: string, now = Date.now()): MetaConnection | null {
  if (!sealed?.startsWith(`${VERSION}.`)) return null;
  const raw = sealed.slice(VERSION.length + 1);
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) return null;
  const bytes = Buffer.from(raw, "base64url");
  if (bytes.length <= IV_BYTES + TAG_BYTES) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", keyFrom(secret), bytes.subarray(0, IV_BYTES));
    decipher.setAAD(ownerData(owner));
    decipher.setAuthTag(bytes.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
    const text = Buffer.concat([decipher.update(bytes.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString("utf8");
    const value: unknown = JSON.parse(text);
    return isConnection(value) && value.expiresAt > now ? value : null;
  } catch {
    return null;
  }
}
