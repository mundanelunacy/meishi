export type CameraFacingMode = "environment" | "user";

type CameraMediaDevices = Pick<MediaDevices, "enumerateDevices" | "getUserMedia">;

const REAR_CAMERA_LABEL_PATTERN = /\b(rear|back|environment|world|outward)\b/i;
const FRONT_CAMERA_LABEL_PATTERN =
  /\b(front|user|facetime|selfie|inward)\b/i;

function normalizeDeviceLabel(label: string) {
  return label.trim().toLowerCase();
}

export async function detectPreferredCameraFacingMode(
  mediaDevices: Pick<MediaDevices, "enumerateDevices"> | undefined =
    navigator.mediaDevices,
): Promise<CameraFacingMode> {
  if (!mediaDevices?.enumerateDevices) {
    return "environment";
  }

  const devices = await mediaDevices.enumerateDevices();
  const videoInputs = devices.filter((device) => device.kind === "videoinput");

  if (videoInputs.length === 0) {
    return "environment";
  }

  const labels = videoInputs
    .map((device) => normalizeDeviceLabel(device.label))
    .filter((label) => label.length > 0);

  if (labels.some((label) => REAR_CAMERA_LABEL_PATTERN.test(label))) {
    return "environment";
  }

  if (labels.some((label) => FRONT_CAMERA_LABEL_PATTERN.test(label))) {
    return "user";
  }

  // Treat single-camera devices as front-facing when there is no rear hint.
  if (videoInputs.length === 1) {
    return "user";
  }

  return "environment";
}

function buildCameraConstraintAttempts(
  preferredFacingMode: CameraFacingMode,
): MediaStreamConstraints[] {
  const fallbackFacingMode =
    preferredFacingMode === "environment" ? "user" : "environment";

  return [
    {
      audio: false,
      video: {
        facingMode: {
          exact: preferredFacingMode,
        },
      },
    },
    {
      audio: false,
      video: {
        facingMode: {
          exact: fallbackFacingMode,
        },
      },
    },
    {
      audio: false,
      video: {
        facingMode: preferredFacingMode,
      },
    },
    {
      audio: false,
      video: true,
    },
  ];
}

function shouldTryNextCameraConstraint(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "NotFoundError" ||
    error.name === "OverconstrainedError" ||
    error.name === "ConstraintNotSatisfiedError"
  );
}

function toCameraAccessError(error: unknown) {
  if (!(error instanceof Error)) {
    return new Error("Unable to open the camera.");
  }

  if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
    return new Error(
      "Camera access was blocked. Allow camera permission or upload photos instead.",
    );
  }

  if (error.name === "NotReadableError" || error.name === "TrackStartError") {
    return new Error(
      "The camera is already in use by another app or unavailable right now.",
    );
  }

  if (error.name === "NotFoundError") {
    return new Error("No camera was found on this device.");
  }

  return new Error(error.message || "Unable to open the camera.");
}

export async function openPreferredCameraStream(
  mediaDevices: CameraMediaDevices | undefined = navigator.mediaDevices,
) {
  if (!mediaDevices?.getUserMedia) {
    throw new Error(
      "Live camera capture is not available in this browser. Use photo upload instead.",
    );
  }

  const preferredFacingMode = await detectPreferredCameraFacingMode(mediaDevices);
  const constraintAttempts = buildCameraConstraintAttempts(preferredFacingMode);
  let lastError: unknown;

  for (const constraints of constraintAttempts) {
    try {
      return await mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;

      if (!shouldTryNextCameraConstraint(error)) {
        throw toCameraAccessError(error);
      }
    }
  }

  throw toCameraAccessError(lastError);
}
