import { beforeEach, describe, expect, it, vi } from "vitest";
import { startSync, syncFailed, syncSucceeded } from "./syncSessionSlice";
import {
  normalizeGoogleSyncError,
  syncGoogleContact,
} from "./useSyncGoogleContact";
import type { CapturedCardImage, VerifiedContact } from "../../shared/types/models";

const images: CapturedCardImage[] = [
  {
    id: "img-1",
    dataUrl: "data:image/png;base64,ZmFrZQ==",
    fileName: "card.png",
    mimeType: "image/png",
    capturedAt: "2026-04-05T00:00:00.000Z",
  },
  {
    id: "img-2",
    dataUrl: "data:image/png;base64,bW9yZQ==",
    fileName: "back.png",
    mimeType: "image/png",
    capturedAt: "2026-04-05T00:00:01.000Z",
  },
];

const contact: VerifiedContact = {
  id: "draft-1",
  sourceImageIds: ["img-1", "img-2"],
  fullName: "Ada Lovelace",
  namePrefix: "",
  firstName: "Ada",
  phoneticFirstName: "",
  phoneticMiddleName: "",
  phoneticLastName: "",
  lastName: "Lovelace",
  nickname: "",
  fileAs: "Lovelace, Ada",
  organization: "Analytical Engines",
  department: "",
  title: "Founder",
  email: "ada@example.com",
  phone: "",
  website: "",
  notes: "",
  address: "",
  emails: [{ value: "ada@example.com", type: "WORK", label: "" }],
  phones: [],
  websites: [],
  addresses: [],
  relatedPeople: [],
  significantDates: [],
  customFields: [],
  confidenceNotes: [],
  extractionSnapshot: null,
  createdAt: "2026-04-05T00:00:00.000Z",
  updatedAt: "2026-04-05T00:00:00.000Z",
  verifiedAt: "2026-04-06T00:00:00.000Z",
  selectedPhotoImageId: "img-1",
};

describe("syncGoogleContact", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-06T00:00:00.000Z"));
  });

  it("creates the contact, uploads the selected photo, and records success", async () => {
    const createContact = vi.fn().mockResolvedValue({ resourceName: "people/123" });
    const updateContactPhoto = vi.fn().mockResolvedValue({
      person: { resourceName: "people/123" },
    });
    const saveOutcome = vi.fn().mockResolvedValue(undefined);
    const dispatch = vi.fn();

    const result = await syncGoogleContact(
      { contact, images },
      { createContact, updateContactPhoto, saveOutcome, dispatch },
    );

    expect(createContact).toHaveBeenCalledWith(contact);
    expect(updateContactPhoto).toHaveBeenCalledTimes(1);
    expect(saveOutcome).toHaveBeenCalledWith({
      contactResourceName: "people/123",
      photoUploaded: true,
      localOnlyImageIds: ["img-2"],
      syncedAt: "2026-04-06T00:00:00.000Z",
    });
    expect(dispatch).toHaveBeenNthCalledWith(1, startSync());
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      syncSucceeded({
        contactResourceName: "people/123",
        photoUploaded: true,
        localOnlyImageIds: ["img-2"],
        syncedAt: "2026-04-06T00:00:00.000Z",
      }),
    );
    expect(result).toEqual({
      outcome: {
        contactResourceName: "people/123",
        photoUploaded: true,
        localOnlyImageIds: ["img-2"],
        syncedAt: "2026-04-06T00:00:00.000Z",
      },
    });
  });

  it("skips photo upload when no selected image is present", async () => {
    const createContact = vi.fn().mockResolvedValue({ resourceName: "people/123" });
    const updateContactPhoto = vi.fn();
    const saveOutcome = vi.fn().mockResolvedValue(undefined);
    const dispatch = vi.fn();

    const result = await syncGoogleContact(
      {
        contact: {
          ...contact,
          selectedPhotoImageId: undefined,
        },
        images,
      },
      { createContact, updateContactPhoto, saveOutcome, dispatch },
    );

    expect(updateContactPhoto).not.toHaveBeenCalled();
    expect(result.outcome.photoUploaded).toBe(false);
    expect(result.warningMessage).toBeUndefined();
  });

  it("retries photo upload until it succeeds before the final attempt", async () => {
    const createContact = vi.fn().mockResolvedValue({ resourceName: "people/123" });
    const updateContactPhoto = vi
      .fn()
      .mockRejectedValueOnce({ data: { error: { message: "Temporary failure" } } })
      .mockRejectedValueOnce(new Error("Still failing"))
      .mockResolvedValueOnce({ person: { resourceName: "people/123" } });
    const saveOutcome = vi.fn().mockResolvedValue(undefined);
    const dispatch = vi.fn();

    const result = await syncGoogleContact(
      { contact, images },
      { createContact, updateContactPhoto, saveOutcome, dispatch },
    );

    expect(updateContactPhoto).toHaveBeenCalledTimes(3);
    expect(result.warningMessage).toBeUndefined();
    expect(result.outcome.photoUploaded).toBe(true);
    expect(dispatch).not.toHaveBeenCalledWith(syncFailed("Still failing"));
  });

  it("records partial success when photo upload fails three times", async () => {
    const createContact = vi.fn().mockResolvedValue({ resourceName: "people/123" });
    const updateContactPhoto = vi
      .fn()
      .mockRejectedValue({ data: { error: { message: "Photo rejected" } } });
    const saveOutcome = vi.fn().mockResolvedValue(undefined);
    const dispatch = vi.fn();

    const result = await syncGoogleContact(
      { contact, images },
      { createContact, updateContactPhoto, saveOutcome, dispatch },
    );

    expect(updateContactPhoto).toHaveBeenCalledTimes(3);
    expect(result.outcome.photoUploaded).toBe(false);
    expect(result.warningMessage).toContain(
      "Google contact created, but the photo upload failed after 3 attempts.",
    );
    expect(result.warningMessage).toContain("Photo rejected");
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenNthCalledWith(1, startSync());
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      syncSucceeded({
        contactResourceName: "people/123",
        photoUploaded: false,
        localOnlyImageIds: ["img-2"],
        syncedAt: "2026-04-06T00:00:00.000Z",
      }),
    );
  });

  it("fails the sync when contact creation fails", async () => {
    const createContact = vi
      .fn()
      .mockRejectedValue({ data: { error: { message: "Create denied" } } });
    const updateContactPhoto = vi.fn();
    const saveOutcome = vi.fn();
    const dispatch = vi.fn();

    await expect(
      syncGoogleContact(
        { contact, images },
        { createContact, updateContactPhoto, saveOutcome, dispatch },
      ),
    ).rejects.toThrow("Create denied");

    expect(updateContactPhoto).not.toHaveBeenCalled();
    expect(saveOutcome).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenNthCalledWith(1, startSync());
    expect(dispatch).toHaveBeenNthCalledWith(2, syncFailed("Create denied"));
  });

  it("fails the sync when saving the outcome fails", async () => {
    const createContact = vi.fn().mockResolvedValue({ resourceName: "people/123" });
    const updateContactPhoto = vi.fn().mockResolvedValue({
      person: { resourceName: "people/123" },
    });
    const saveOutcome = vi.fn().mockRejectedValue(new Error("IndexedDB unavailable"));
    const dispatch = vi.fn();

    await expect(
      syncGoogleContact(
        { contact, images },
        { createContact, updateContactPhoto, saveOutcome, dispatch },
      ),
    ).rejects.toThrow("IndexedDB unavailable");

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenNthCalledWith(1, startSync());
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      syncFailed("IndexedDB unavailable"),
    );
  });
});

describe("normalizeGoogleSyncError", () => {
  it("prefers nested Google API messages", () => {
    expect(
      normalizeGoogleSyncError(
        {
          data: {
            error: {
              message: "Google says no",
            },
          },
        },
        "Fallback message",
      ),
    ).toBe("Google says no");
  });

  it("falls back when no readable message exists", () => {
    expect(normalizeGoogleSyncError({ data: { error: {} } }, "Fallback message")).toBe(
      "Fallback message",
    );
  });
});
