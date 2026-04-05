import { describe, expect, it } from "vitest";
import { detectPreferredCaptureExperience } from "./captureExperience";

describe("detectPreferredCaptureExperience", () => {
  it("prefers native camera input when userAgentData reports mobile", () => {
    expect(
      detectPreferredCaptureExperience({
        userAgentDataMobile: true,
      }),
    ).toBe("native-camera-input");
  });

  it("prefers native camera input when a mobile user agent is touch-capable", () => {
    expect(
      detectPreferredCaptureExperience({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        maxTouchPoints: 5,
      }),
    ).toBe("native-camera-input");
  });

  it("prefers native camera input when a mobile user agent has a coarse pointer", () => {
    expect(
      detectPreferredCaptureExperience({
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/123.0.0.0 Mobile Safari/537.36",
        matchMedia: (query) => ({
          matches: query === "(any-pointer: coarse)",
        }),
      }),
    ).toBe("native-camera-input");
  });

  it("keeps live preview for touch-capable desktop user agents", () => {
    expect(
      detectPreferredCaptureExperience({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
        maxTouchPoints: 10,
        matchMedia: () => ({ matches: true }),
      }),
    ).toBe("live-preview");
  });

  it("falls back to live preview when capability signals indicate non-touch", () => {
    expect(
      detectPreferredCaptureExperience({
        maxTouchPoints: 0,
        matchMedia: () => ({ matches: false }),
        userAgentDataMobile: false,
      }),
    ).toBe("live-preview");
  });

  it("falls back to user agent matching only when capability signals are unavailable", () => {
    expect(
      detectPreferredCaptureExperience({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      }),
    ).toBe("native-camera-input");
  });

  it("treats iPadOS desktop-class user agents as mobile when touch is present", () => {
    expect(
      detectPreferredCaptureExperience({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
        maxTouchPoints: 5,
      }),
    ).toBe("native-camera-input");
  });
});
