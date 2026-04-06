import {describe, expect, it} from "vitest";
import {
  GOOGLE_CONTACTS_CREDENTIAL_RETENTION_DAYS,
  evaluateGoogleContactsCredentialRetention,
  getGoogleContactsCredentialCutoff,
} from "./googleContactsCredentialRetention";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

describe("googleContactsCredentialRetention", () => {
  it("marks credentials older than the retention window for deletion", () => {
    const nowMs = Date.parse("2026-04-06T00:00:00.000Z");
    const connectedAt = new Date(
      nowMs - GOOGLE_CONTACTS_CREDENTIAL_RETENTION_DAYS * DAY_IN_MS - 1,
    ).toISOString();

    expect(
      evaluateGoogleContactsCredentialRetention(connectedAt, nowMs),
    ).toEqual({
      shouldDelete: true,
      reason: "expired",
    });
  });

  it("keeps credentials newer than the retention window", () => {
    const nowMs = Date.parse("2026-04-06T00:00:00.000Z");
    const connectedAt = new Date(
      nowMs - GOOGLE_CONTACTS_CREDENTIAL_RETENTION_DAYS * DAY_IN_MS + 1,
    ).toISOString();

    expect(
      evaluateGoogleContactsCredentialRetention(connectedAt, nowMs),
    ).toEqual({
      shouldDelete: false,
      reason: "fresh",
    });
  });

  it("keeps credentials exactly on the retention boundary", () => {
    const nowMs = Date.parse("2026-04-06T00:00:00.000Z");
    const connectedAt = new Date(
      getGoogleContactsCredentialCutoff(nowMs),
    ).toISOString();

    expect(
      evaluateGoogleContactsCredentialRetention(connectedAt, nowMs),
    ).toEqual({
      shouldDelete: false,
      reason: "boundary",
    });
  });

  it("skips records with missing or invalid connectedAt values", () => {
    const nowMs = Date.parse("2026-04-06T00:00:00.000Z");

    expect(
      evaluateGoogleContactsCredentialRetention(undefined, nowMs),
    ).toEqual({
      shouldDelete: false,
      reason: "missing_connected_at",
    });
    expect(
      evaluateGoogleContactsCredentialRetention("not-a-date", nowMs),
    ).toEqual({
      shouldDelete: false,
      reason: "invalid_connected_at",
    });
  });
});
