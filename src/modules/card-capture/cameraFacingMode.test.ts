import { describe, expect, it, vi } from "vitest";
import {
  detectPreferredCameraFacingMode,
  openPreferredCameraStream,
} from "./cameraFacingMode";

function createVideoInput(label: string): MediaDeviceInfo {
  return {
    deviceId: `${label || "camera"}-id`,
    groupId: "group-1",
    kind: "videoinput",
    label,
    toJSON: () => ({}),
  };
}

describe("detectPreferredCameraFacingMode", () => {
  it("keeps the rear camera when a rear-facing device is present", async () => {
    await expect(
      detectPreferredCameraFacingMode({
        enumerateDevices: async () => [
          createVideoInput("Front Camera"),
          createVideoInput("Rear Camera"),
        ],
      }),
    ).resolves.toBe("environment");
  });

  it("falls back to the front camera when there is no rear-facing device", async () => {
    await expect(
      detectPreferredCameraFacingMode({
        enumerateDevices: async () => [createVideoInput("Front Camera")],
      }),
    ).resolves.toBe("user");
  });

  it("treats an unlabeled single camera as front-facing fallback", async () => {
    await expect(
      detectPreferredCameraFacingMode({
        enumerateDevices: async () => [createVideoInput("")],
      }),
    ).resolves.toBe("user");
  });

  it("defaults to rear when device inspection is unavailable", async () => {
    await expect(detectPreferredCameraFacingMode(undefined)).resolves.toBe(
      "environment",
    );
  });
});

describe("openPreferredCameraStream", () => {
  it("prefers the rear camera when one is present", async () => {
    const stream = {
      getTracks: () => [],
    } as MediaStream;
    const getUserMedia = vi.fn(async () => stream);

    await expect(
      openPreferredCameraStream({
        enumerateDevices: async () => [createVideoInput("Rear Camera")],
        getUserMedia,
      }),
    ).resolves.toBe(stream);

    expect(getUserMedia).toHaveBeenCalledWith({
      audio: false,
      video: {
        facingMode: {
          exact: "environment",
        },
      },
    });
  });

  it("falls back to front-facing constraints when no rear camera is detected", async () => {
    const stream = {
      getTracks: () => [],
    } as MediaStream;
    const getUserMedia = vi.fn(async () => stream);

    await expect(
      openPreferredCameraStream({
        enumerateDevices: async () => [createVideoInput("Front Camera")],
        getUserMedia,
      }),
    ).resolves.toBe(stream);

    expect(getUserMedia).toHaveBeenCalledWith({
      audio: false,
      video: {
        facingMode: {
          exact: "user",
        },
      },
    });
  });

  it("falls back to a generic video request when facing constraints fail", async () => {
    const stream = {
      getTracks: () => [],
    } as MediaStream;
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("No rear camera"), {
        name: "OverconstrainedError",
      }))
      .mockRejectedValueOnce(Object.assign(new Error("No front metadata"), {
        name: "OverconstrainedError",
      }))
      .mockRejectedValueOnce(Object.assign(new Error("Ideal user failed"), {
        name: "OverconstrainedError",
      }))
      .mockResolvedValueOnce(stream);

    await expect(
      openPreferredCameraStream({
        enumerateDevices: async () => [createVideoInput("Front Camera")],
        getUserMedia,
      }),
    ).resolves.toBe(stream);

    expect(getUserMedia).toHaveBeenLastCalledWith({
      audio: false,
      video: true,
    });
  });

  it("returns a clear permission error", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(
      Object.assign(new Error("Permission denied"), {
        name: "NotAllowedError",
      }),
    );

    await expect(
      openPreferredCameraStream({
        enumerateDevices: async () => [createVideoInput("Front Camera")],
        getUserMedia,
      }),
    ).rejects.toThrow(
      "Camera access was blocked. Allow camera permission or upload photos instead.",
    );
  });
});
