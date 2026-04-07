import type { GoogleAuthState } from "../../shared/types/models";

export function createInitialGoogleAuthState(
  metadata?: Partial<
    Pick<
      GoogleAuthState,
      "firebaseUid" | "scope" | "accountEmail" | "connectedAt"
    >
  >,
): GoogleAuthState {
  return {
    status:
      metadata?.scope || metadata?.accountEmail || metadata?.connectedAt
        ? "connecting"
        : "signed_out",
    firebaseUid: metadata?.firebaseUid ?? null,
    scope: metadata?.scope ?? null,
    accountEmail: metadata?.accountEmail,
    connectedAt: metadata?.connectedAt ?? null,
  };
}
