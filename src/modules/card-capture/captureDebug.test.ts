// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendCaptureDebugEvent,
  clearCaptureDebugLog,
  getCaptureDebugPanelQueryKey,
  getCaptureDebugMaxEdgeStorageKey,
  isCaptureDebugPanelEnabled,
  readCaptureDebugLog,
  readCaptureDebugMaxEdge,
} from "./captureDebug";

describe("captureDebug", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://example.test/capture"),
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("stores capture debug events in order", () => {
    appendCaptureDebugEvent("handleFiles:start", { fileCount: 1 });
    appendCaptureDebugEvent("saveCapturedImages:end");

    expect(readCaptureDebugLog()).toEqual([
      expect.objectContaining({
        event: "handleFiles:start",
        details: JSON.stringify({ fileCount: 1 }),
      }),
      expect.objectContaining({
        event: "saveCapturedImages:end",
      }),
    ]);
  });

  it("clears capture debug events", () => {
    appendCaptureDebugEvent("handleOpenCamera");
    clearCaptureDebugLog();

    expect(readCaptureDebugLog()).toEqual([]);
  });

  it("prefers the query string downscale override", () => {
    window.localStorage.setItem(getCaptureDebugMaxEdgeStorageKey(), "1600");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://example.test/capture?captureDebugMaxEdge=900"),
    });

    expect(readCaptureDebugMaxEdge()).toBe(900);
  });

  it("falls back to the localStorage downscale override", () => {
    window.localStorage.setItem(getCaptureDebugMaxEdgeStorageKey(), "1600");

    expect(readCaptureDebugMaxEdge()).toBe(1600);
  });

  it("enables the debug panel only when the URL parameter is present", () => {
    expect(isCaptureDebugPanelEnabled()).toBe(false);

    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL(
        `https://example.test/capture?${getCaptureDebugPanelQueryKey()}=1`,
      ),
    });

    expect(isCaptureDebugPanelEnabled()).toBe(true);
  });
});
