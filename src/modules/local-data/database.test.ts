// @vitest-environment jsdom

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { CapturedCardImage, ContactDraft, SyncOutcome } from "../../shared/types/models";
import { db, loadCapturedImages, loadLatestDraft, saveCapturedImages, saveDraft, saveSyncOutcome } from "./index";

const baseImage: CapturedCardImage = {
  id: "image-1",
  dataUrl: "data:image/png;base64,AAA",
  fileName: "front.png",
  mimeType: "image/png",
  capturedAt: "2026-04-05T01:00:00.000Z",
  width: 1200,
  height: 800,
};

const baseDraft: ContactDraft = {
  id: "draft-1",
  sourceImageIds: ["image-1"],
  fullName: "Ada Lovelace",
  firstName: "Ada",
  lastName: "Lovelace",
  organization: "Analytical Engines",
  title: "Founder",
  email: "ada@example.com",
  phone: "123",
  website: "https://example.com",
  notes: "Important contact",
  address: "London",
  confidenceNotes: ["Name inferred from title block"],
  createdAt: "2026-04-05T01:00:00.000Z",
  updatedAt: "2026-04-05T01:00:00.000Z",
};

async function resetDb() {
  db.close();
  await db.delete();
  await db.open();
}

describe("local-data/database", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("saves and restores captured images through the active session in order", async () => {
    const secondImage: CapturedCardImage = {
      ...baseImage,
      id: "image-2",
      fileName: "back.png",
      dataUrl: "data:image/png;base64,BBB",
    };

    await saveCapturedImages([secondImage, baseImage]);

    await expect(loadCapturedImages()).resolves.toEqual([secondImage, baseImage]);
  });

  it("loads the most recently updated draft", async () => {
    await saveDraft(baseDraft);
    await saveDraft({
      ...baseDraft,
      id: "draft-2",
      fullName: "Grace Hopper",
      updatedAt: "2026-04-05T02:00:00.000Z",
    });

    await expect(loadLatestDraft()).resolves.toMatchObject({
      id: "draft-2",
      fullName: "Grace Hopper",
    });
  });

  it("stores sync outcomes as append-only records", async () => {
    const firstOutcome: SyncOutcome = {
      contactResourceName: "people/123",
      photoUploaded: true,
      localOnlyImageIds: ["image-2"],
      syncedAt: "2026-04-05T03:00:00.000Z",
    };
    const secondOutcome: SyncOutcome = {
      ...firstOutcome,
      syncedAt: "2026-04-05T04:00:00.000Z",
    };

    await saveSyncOutcome(firstOutcome);
    await saveSyncOutcome(secondOutcome);

    const outcomes = await db.syncHistory.orderBy("syncedAt").toArray();
    expect(outcomes).toHaveLength(2);
    expect(outcomes[0].syncedAt).toBe(firstOutcome.syncedAt);
    expect(outcomes[1].syncedAt).toBe(secondOutcome.syncedAt);
    expect(outcomes[0].id).not.toBe(outcomes[1].id);
  });
});
