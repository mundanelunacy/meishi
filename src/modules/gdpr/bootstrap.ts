export type PrivacyRegion = "gdpr" | "non-gdpr";

declare global {
  interface Window {
    __MEISHI_PRIVACY_BOOTSTRAP__?: {
      region?: string;
    };
  }
}

export function readPrivacyRegion(): PrivacyRegion {
  if (typeof window === "undefined") {
    return "non-gdpr";
  }

  const region = window.__MEISHI_PRIVACY_BOOTSTRAP__?.region;
  return region === "gdpr" ? "gdpr" : "non-gdpr";
}
