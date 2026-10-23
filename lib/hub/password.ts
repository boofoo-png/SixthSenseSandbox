import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Prototype password storage (see docs/DECISIONS.md): passwords are salted and hashed with
// scrypt so the account cookie never holds the password as typed.

const KEY_LENGTH = 32;

/** Hash a password as "scrypt$<salt hex>$<hash hex>". */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** True when `password` matches a value from `hashPassword`; false for anything malformed. */
export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !/^[0-9a-f]+$/.test(saltHex ?? "") || !/^[0-9a-f]{64}$/.test(hashHex ?? "")) {
    return false;
  }
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  return timingSafeEqual(expected, actual);
}
