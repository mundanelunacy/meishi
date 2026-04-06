import {getApps, initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {logger} from "firebase-functions";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {
  GOOGLE_CONTACTS_CREDENTIALS_COLLECTION,
  GOOGLE_CONTACTS_CREDENTIAL_RETENTION_DAYS,
  evaluateGoogleContactsCredentialRetention,
} from "./googleContactsCredentialRetention.js";

if (getApps().length === 0) {
  initializeApp();
}

const firestore = getFirestore();

export const cleanupGoogleContactsCredentials = onSchedule(
  {
    schedule: "every day 00:00",
    timeZone: "Asia/Seoul",
  },
  async () => {
    const startedAt = new Date().toISOString();
    const nowMs = Date.now();
    const snapshot = await firestore
      .collection(GOOGLE_CONTACTS_CREDENTIALS_COLLECTION)
      .select("connectedAt")
      .get();
    const bulkWriter = firestore.bulkWriter();
    let deleted = 0;
    let skipped = 0;

    try {
      for (const document of snapshot.docs) {
        const result = evaluateGoogleContactsCredentialRetention(
          document.get("connectedAt"),
          nowMs,
        );

        if (!result.shouldDelete) {
          skipped += 1;
          if (
            result.reason === "missing_connected_at" ||
            result.reason === "invalid_connected_at"
          ) {
            logger.warn(
              "Skipped malformed Google credential during daily cleanup.",
              {
                documentId: document.id,
                reason: result.reason,
                runStartedAt: startedAt,
              },
            );
          }
          continue;
        }

        bulkWriter.delete(document.ref);
        deleted += 1;
      }

      await bulkWriter.close();
    } catch (error) {
      await bulkWriter.close();
      throw error;
    }

    logger.info("Completed daily Google credential retention cleanup.", {
      collection: GOOGLE_CONTACTS_CREDENTIALS_COLLECTION,
      retentionDays: GOOGLE_CONTACTS_CREDENTIAL_RETENTION_DAYS,
      scanned: snapshot.size,
      deleted,
      skipped,
      runStartedAt: startedAt,
      completedAt: new Date().toISOString(),
    });
  },
);
