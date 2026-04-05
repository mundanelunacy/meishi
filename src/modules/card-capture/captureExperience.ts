export type CaptureExperience = "native-camera-input" | "live-preview";

type MatchMediaResult = Pick<MediaQueryList, "matches">;

type CaptureExperienceEnvironment = {
  matchMedia?: (query: string) => MatchMediaResult;
  maxTouchPoints?: number;
  userAgent?: string;
  userAgentDataMobile?: boolean;
};

const MOBILE_USER_AGENT_PATTERN =
  /\b(android|iphone|ipad|ipod|mobile|tablet|silk|kindle)\b/i;

function readDefaultEnvironment(): CaptureExperienceEnvironment {
  const currentNavigator =
    typeof navigator === "undefined"
      ? undefined
      : (navigator as Navigator & {
          userAgentData?: {
            mobile?: boolean;
          };
        });

  return {
    matchMedia:
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? (query) => window.matchMedia(query)
        : undefined,
    maxTouchPoints: currentNavigator?.maxTouchPoints,
    userAgent: currentNavigator?.userAgent,
    userAgentDataMobile: currentNavigator?.userAgentData?.mobile,
  };
}

function hasCoarsePointer(
  matchMedia: CaptureExperienceEnvironment["matchMedia"],
) {
  if (!matchMedia) {
    return false;
  }

  return (
    matchMedia("(any-pointer: coarse)").matches ||
    matchMedia("(pointer: coarse)").matches
  );
}

function isKnownMobileUserAgent(
  environment: Pick<CaptureExperienceEnvironment, "maxTouchPoints" | "userAgent">,
) {
  const userAgent = environment.userAgent ?? "";

  if (MOBILE_USER_AGENT_PATTERN.test(userAgent)) {
    return true;
  }

  // iPadOS Safari can report a desktop-class Macintosh user agent.
  return /\bmacintosh\b/i.test(userAgent) && (environment.maxTouchPoints ?? 0) > 1;
}

export function detectPreferredCaptureExperience(
  environment: CaptureExperienceEnvironment = readDefaultEnvironment(),
): CaptureExperience {
  if (environment.userAgentDataMobile === true) {
    return "native-camera-input";
  }

  const knownMobileUserAgent = isKnownMobileUserAgent(environment);
  const touchCapable = (environment.maxTouchPoints ?? 0) > 0;
  const coarsePointer = hasCoarsePointer(environment.matchMedia);

  if (knownMobileUserAgent && (touchCapable || coarsePointer)) {
    return "native-camera-input";
  }

  const hasCapabilitySignals =
    typeof environment.userAgentDataMobile === "boolean" ||
    typeof environment.maxTouchPoints === "number" ||
    typeof environment.matchMedia === "function";

  if (!hasCapabilitySignals && knownMobileUserAgent) {
    return "native-camera-input";
  }

  return "live-preview";
}
