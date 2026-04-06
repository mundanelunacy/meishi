const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const GOOGLE_CONTACTS_CREDENTIALS_COLLECTION =
  "googleContactsCredentials";
export const GOOGLE_CONTACTS_CREDENTIAL_RETENTION_DAYS = 90;
export const GOOGLE_CONTACTS_CREDENTIAL_RETENTION_MS =
  GOOGLE_CONTACTS_CREDENTIAL_RETENTION_DAYS * DAY_IN_MS;

export interface CleanupEvaluationResult {
  shouldDelete: boolean;
  reason:
    | "expired"
    | "fresh"
    | "boundary"
    | "missing_connected_at"
    | "invalid_connected_at";
}

/**
 * Returns the millisecond cutoff for retained Google credential records.
 * @param {number} nowMs Current wall-clock time in milliseconds.
 * @return {number} Millisecond cutoff for records that must be retained.
 */
export function getGoogleContactsCredentialCutoff(nowMs: number): number {
  return nowMs - GOOGLE_CONTACTS_CREDENTIAL_RETENTION_MS;
}

/**
 * Evaluates whether a stored Google credential record should be deleted.
 * @param {unknown} connectedAt Stored ISO timestamp for the credential.
 * @param {number} nowMs Current wall-clock time in milliseconds.
 * @return {CleanupEvaluationResult} Retention decision and reason.
 */
export function evaluateGoogleContactsCredentialRetention(
  connectedAt: unknown,
  nowMs: number,
): CleanupEvaluationResult {
  if (typeof connectedAt !== "string" || connectedAt.length === 0) {
    return {
      shouldDelete: false,
      reason: "missing_connected_at",
    };
  }

  const connectedAtMs = Date.parse(connectedAt);
  if (Number.isNaN(connectedAtMs)) {
    return {
      shouldDelete: false,
      reason: "invalid_connected_at",
    };
  }

  const cutoffMs = getGoogleContactsCredentialCutoff(nowMs);
  if (connectedAtMs < cutoffMs) {
    return {
      shouldDelete: true,
      reason: "expired",
    };
  }

  if (connectedAtMs === cutoffMs) {
    return {
      shouldDelete: false,
      reason: "boundary",
    };
  }

  return {
    shouldDelete: false,
    reason: "fresh",
  };
}
