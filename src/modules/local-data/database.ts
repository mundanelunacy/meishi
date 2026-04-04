import Dexie, { type Table } from "dexie";
import type { CapturedCardImage, ContactDraft, SyncOutcome } from "../../shared/types/models";

export interface StoredCaptureSession {
  id: string;
  imageIds: string[];
  createdAt: string;
}

class MeishiDatabase extends Dexie {
  images!: Table<CapturedCardImage, string>;
  drafts!: Table<ContactDraft, string>;
  syncHistory!: Table<SyncOutcome, string>;
  sessions!: Table<StoredCaptureSession, string>;

  constructor() {
    super("meishi-db");
    this.version(1).stores({
      images: "id, capturedAt",
      drafts: "id, updatedAt",
      syncHistory: "contactResourceName, syncedAt",
      sessions: "id, createdAt",
    });
  }
}

export const db = new MeishiDatabase();

export async function saveCapturedImages(images: CapturedCardImage[]) {
  await db.images.bulkPut(images);
  await db.sessions.put({
    id: "active-session",
    imageIds: images.map((image) => image.id),
    createdAt: new Date().toISOString(),
  });
}

export async function loadCapturedImages() {
  const session = await db.sessions.get("active-session");
  if (!session) {
    return [];
  }

  const results = await db.images.bulkGet(session.imageIds);
  return results.filter(Boolean) as CapturedCardImage[];
}

export async function saveDraft(draft: ContactDraft) {
  await db.drafts.put(draft);
}

export async function loadLatestDraft() {
  const drafts = await db.drafts.orderBy("updatedAt").reverse().limit(1).toArray();
  return drafts[0];
}

export async function saveSyncOutcome(outcome: SyncOutcome) {
  await db.syncHistory.put(outcome, outcome.contactResourceName);
}
