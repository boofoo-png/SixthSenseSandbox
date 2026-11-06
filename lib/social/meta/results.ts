// What happened after Connect or Disconnect, shown on Settings (?meta=...). Safe for the browser.

export const META_RESULTS = ["connected", "disconnected", "cancelled", "no-instagram", "permission", "not-configured", "expired-login", "error"] as const;
export type MetaResult = (typeof META_RESULTS)[number];

export function parseMetaResult(value: string | string[] | undefined): MetaResult | null {
  return typeof value === "string" && (META_RESULTS as readonly string[]).includes(value) ? (value as MetaResult) : null;
}

export const settingsWith = (result: MetaResult): string => `/settings?section=workspace&meta=${result}`;
