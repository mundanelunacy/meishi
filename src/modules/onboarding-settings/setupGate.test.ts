import { describe, expect, it } from "vitest";
import {
  getProtectedRouteSetupRedirect,
  getRootRouteRedirect,
  getSetupRouteRedirect,
} from "./setupGate";

describe("setupGate", () => {
  it("redirects protected routes to setup when no API key is configured", () => {
    expect(getProtectedRouteSetupRedirect(false)).toBe("/setup");
    expect(getProtectedRouteSetupRedirect(true)).toBeNull();
  });

  it("redirects setup to settings when an API key is configured", () => {
    expect(getSetupRouteRedirect(false)).toBeNull();
    expect(getSetupRouteRedirect(true)).toBe("/settings");
  });

  it("sends the root route to capture only after LLM setup is valid", () => {
    expect(getRootRouteRedirect(false)).toBe("/landing");
    expect(getRootRouteRedirect(true)).toBe("/capture");
  });
});
