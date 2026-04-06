import { useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import { saveSyncOutcome } from "../local-data";
import {
  type GoogleCreateContactResponse,
  type GoogleUpdatePhotoResponse,
} from "../../shared/types/google";
import type {
  CapturedCardImage,
  SyncOutcome,
  VerifiedContact,
} from "../../shared/types/models";
import {
  startSync,
  syncFailed,
  syncSucceeded,
} from "./syncSessionSlice";
import {
  useCreateContactMutation,
  useUpdateContactPhotoMutation,
} from "./googlePeopleApi";

const PHOTO_UPLOAD_MAX_ATTEMPTS = 3;
const CREATE_CONTACT_ERROR_MESSAGE = "Unable to create Google contact.";
const PHOTO_UPLOAD_ERROR_MESSAGE = "Unable to upload the Google contact photo.";
const SAVE_SYNC_OUTCOME_ERROR_MESSAGE = "Unable to save sync history.";
const PARTIAL_SUCCESS_WARNING =
  "Google contact created, but the photo upload failed after 3 attempts.";

class SyncFlowError extends Error {
  alreadyDispatched: boolean;

  constructor(message: string, alreadyDispatched = false) {
    super(message);
    this.name = "SyncFlowError";
    this.alreadyDispatched = alreadyDispatched;
  }
}

interface SyncGoogleContactParams {
  contact: VerifiedContact;
  images: CapturedCardImage[];
}

interface SyncGoogleContactDependencies {
  createContact: (contact: VerifiedContact) => Promise<GoogleCreateContactResponse>;
  updateContactPhoto: (args: {
    resourceName: string;
    dataUrl: string;
  }) => Promise<GoogleUpdatePhotoResponse>;
  saveOutcome: (outcome: SyncOutcome) => Promise<void>;
  dispatch: (action: unknown) => void;
}

export interface SyncGoogleContactResult {
  outcome: SyncOutcome;
  warningMessage?: string;
}

export function normalizeGoogleSyncError(
  error: unknown,
  fallbackMessage: string,
): string {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error !== "object" || error === null) {
    return fallbackMessage;
  }

  const record = error as Record<string, unknown>;
  const directMessage = findNestedMessage(record);
  return directMessage ?? fallbackMessage;
}

function findNestedMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findNestedMessage(item);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;

  const prioritizedKeys = ["message", "error_description", "statusText"];
  for (const key of prioritizedKeys) {
    const nested = findNestedMessage(record[key]);
    if (nested) {
      return nested;
    }
  }

  const nestedKeys = ["error", "data", "details"];
  for (const key of nestedKeys) {
    const nested = findNestedMessage(record[key]);
    if (nested) {
      return nested;
    }
  }

  return null;
}

export async function syncGoogleContact(
  { contact, images }: SyncGoogleContactParams,
  { createContact, updateContactPhoto, saveOutcome, dispatch }: SyncGoogleContactDependencies,
): Promise<SyncGoogleContactResult> {
  dispatch(startSync());

  try {
    const created = await createContact(contact);
    const selectedPhoto = images.find(
      (image) => image.id === contact.selectedPhotoImageId,
    );

    let photoUploaded = false;
    let warningMessage: string | undefined;

    if (selectedPhoto) {
      for (let attempt = 1; attempt <= PHOTO_UPLOAD_MAX_ATTEMPTS; attempt += 1) {
        try {
          await updateContactPhoto({
            resourceName: created.resourceName,
            dataUrl: selectedPhoto.dataUrl,
          });
          photoUploaded = true;
          break;
        } catch (error) {
          if (attempt === PHOTO_UPLOAD_MAX_ATTEMPTS) {
            warningMessage = `${PARTIAL_SUCCESS_WARNING} ${normalizeGoogleSyncError(
              error,
              PHOTO_UPLOAD_ERROR_MESSAGE,
            )}`;
          }
        }
      }
    }

    const outcome = {
      contactResourceName: created.resourceName,
      photoUploaded,
      localOnlyImageIds: images
        .filter((image) => image.id !== contact.selectedPhotoImageId)
        .map((image) => image.id),
      syncedAt: new Date().toISOString(),
    } satisfies SyncOutcome;

    try {
      await saveOutcome(outcome);
    } catch (error) {
      const message = normalizeGoogleSyncError(
        error,
        SAVE_SYNC_OUTCOME_ERROR_MESSAGE,
      );
      dispatch(syncFailed(message));
      throw new SyncFlowError(message, true);
    }

    dispatch(syncSucceeded(outcome));
    return {
      outcome,
      ...(warningMessage ? { warningMessage } : {}),
    };
  } catch (error) {
    const message = normalizeGoogleSyncError(
      error,
      CREATE_CONTACT_ERROR_MESSAGE,
    );
    if (error instanceof SyncFlowError && error.alreadyDispatched) {
      throw error;
    }

    dispatch(syncFailed(message));
    throw new SyncFlowError(message, true);
  }
}

export function useSyncGoogleContact() {
  const dispatch = useAppDispatch();
  const [createContactMutation] = useCreateContactMutation();
  const [updateContactPhotoMutation] = useUpdateContactPhotoMutation();
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function syncContact(
    params: SyncGoogleContactParams,
  ): Promise<SyncGoogleContactResult> {
    setIsSyncing(true);
    setErrorMessage(null);

    try {
      return await syncGoogleContact(params, {
        createContact: (contact) => createContactMutation(contact).unwrap(),
        updateContactPhoto: (args) => updateContactPhotoMutation(args).unwrap(),
        saveOutcome: saveSyncOutcome,
        dispatch,
      });
    } catch (error) {
      const message = normalizeGoogleSyncError(
        error,
        CREATE_CONTACT_ERROR_MESSAGE,
      );
      setErrorMessage(message);
      throw new Error(message);
    } finally {
      setIsSyncing(false);
    }
  }

  return {
    syncContact,
    isSyncing,
    errorMessage,
  };
}
