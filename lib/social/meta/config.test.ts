import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GRAPH_VERSION, META_CALLBACK_PATH, metaConfig, metaConfigured } from "./config";

const SECRET = "a".repeat(43);

function setAll() {
  vi.stubEnv("META_APP_ID", "1234567890");
  vi.stubEnv("META_APP_SECRET", "app-secret");
  vi.stubEnv("SOCIAL_TOKEN_SECRET", SECRET);
}

afterEach(() => vi.unstubAllEnvs());

describe("metaConfig", () => {
  it("is not configured when the keys are missing, so the app still runs", () => {
    vi.stubEnv("META_APP_ID", "");
    vi.stubEnv("META_APP_SECRET", "");
    vi.stubEnv("SOCIAL_TOKEN_SECRET", "");
    expect(metaConfig()).toBeNull();
    expect(metaConfigured()).toBe(false);
  });

  it("reads the keys and defaults to Graph API v26.0", () => {
    setAll();
    vi.stubEnv("META_GRAPH_VERSION", "");
    expect(metaConfig()).toEqual({ appId: "1234567890", appSecret: "app-secret", tokenSecret: SECRET, graphVersion: DEFAULT_GRAPH_VERSION });
    expect(DEFAULT_GRAPH_VERSION).toBe("v26.0");
    expect(metaConfigured()).toBe(true);
  });

  it("accepts another Graph API version but ignores a malformed one", () => {
    setAll();
    vi.stubEnv("META_GRAPH_VERSION", "v27.0");
    expect(metaConfig()?.graphVersion).toBe("v27.0");
    vi.stubEnv("META_GRAPH_VERSION", "../evil");
    expect(metaConfig()?.graphVersion).toBe(DEFAULT_GRAPH_VERSION);
  });

  it("refuses a token secret that is too short to be safe", () => {
    setAll();
    vi.stubEnv("SOCIAL_TOKEN_SECRET", "short");
    expect(metaConfig()).toBeNull();
  });

  it("rejects an App ID that is not a number", () => {
    setAll();
    vi.stubEnv("META_APP_ID", "abc");
    expect(metaConfig()).toBeNull();
  });

  it("uses the callback registered in the Meta app", () => {
    expect(META_CALLBACK_PATH).toBe("/api/meta/callback");
  });
});
