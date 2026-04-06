import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { CapturedCardImage, ContactDraft, VerifiedContact } from "../../shared/types/models";
import type { BusinessCardExtraction } from "../card-extraction/extractionSchema";
import {
  buildPreservedNotes,
  customFieldsFromExtractionXFields,
  mergePrimaryWithMethods,
} from "../../shared/lib/contactFidelity";

interface ReviewDraftState {
  images: CapturedCardImage[];
  draft: ContactDraft | null;
  verifiedContact: VerifiedContact | null;
}

const initialState: ReviewDraftState = {
  images: [],
  draft: null,
  verifiedContact: null,
};

export function createContactDraft(
  images: CapturedCardImage[],
  extraction?: BusinessCardExtraction
): ContactDraft {
  const timestamp = new Date().toISOString();
  const customFields = customFieldsFromExtractionXFields(extraction?.xFields, extraction?.ambiguousText);
  const emails = mergePrimaryWithMethods(extraction?.email ?? "", extraction?.emails);
  const phones = mergePrimaryWithMethods(extraction?.phone ?? "", extraction?.phones);
  const websites = mergePrimaryWithMethods(extraction?.website ?? "", extraction?.urls);
  const addresses = mergePrimaryWithMethods(extraction?.address ?? "", extraction?.addresses);

  return {
    id: crypto.randomUUID(),
    sourceImageIds: images.map((image) => image.id),
    fullName: extraction?.fullName ?? "",
    namePrefix: extraction?.namePrefix ?? "",
    firstName: extraction?.firstName ?? "",
    phoneticFirstName: extraction?.phoneticFirstName ?? "",
    phoneticMiddleName: extraction?.phoneticMiddleName ?? "",
    phoneticLastName: extraction?.phoneticLastName ?? "",
    lastName: extraction?.lastName ?? "",
    nickname: extraction?.nickname ?? "",
    fileAs: extraction?.fileAs ?? "",
    organization: extraction?.organization ?? "",
    department: extraction?.department ?? "",
    title: extraction?.title ?? "",
    email: emails[0]?.value ?? "",
    phone: phones[0]?.value ?? "",
    website: websites[0]?.value ?? "",
    notes: buildPreservedNotes(extraction?.notes ?? "", customFields),
    address: addresses[0]?.value ?? "",
    emails,
    phones,
    websites,
    addresses,
    relatedPeople: extraction?.relations ?? [],
    significantDates: extraction?.events ?? [],
    customFields,
    confidenceNotes: extraction?.confidenceNotes ?? [],
    extractionSnapshot: extraction ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

const reviewDraftSlice = createSlice({
  name: "reviewDraft",
  initialState,
  reducers: {
    setCapturedImages(state, action: PayloadAction<CapturedCardImage[]>) {
      state.images = action.payload;
      state.draft = state.draft ?? createContactDraft(action.payload);
      state.verifiedContact = null;
    },
    populateDraftFromExtraction(
      state,
      action: PayloadAction<{ extraction: BusinessCardExtraction; draft: ContactDraft }>
    ) {
      state.draft = action.payload.draft;
      state.verifiedContact = null;
    },
    restoreDraft(
      state,
      action: PayloadAction<{ images: CapturedCardImage[]; draft: ContactDraft | null }>
    ) {
      state.images = action.payload.images;
      state.draft = action.payload.draft;
      state.verifiedContact = null;
    },
    updateDraft(state, action: PayloadAction<Partial<ContactDraft>>) {
      if (!state.draft) {
        return;
      }

      state.draft = {
        ...state.draft,
        ...action.payload,
        updatedAt: new Date().toISOString(),
      };
      state.verifiedContact = null;
    },
    finalizeDraft(state, action: PayloadAction<{ selectedPhotoImageId?: string }>) {
      if (!state.draft) {
        return;
      }

      state.verifiedContact = {
        ...state.draft,
        selectedPhotoImageId: action.payload.selectedPhotoImageId,
        verifiedAt: new Date().toISOString(),
      };
    },
    clearReviewDraft() {
      return initialState;
    },
  },
});

export const {
  setCapturedImages,
  populateDraftFromExtraction,
  restoreDraft,
  updateDraft,
  finalizeDraft,
  clearReviewDraft,
} = reviewDraftSlice.actions;

export const reviewDraftReducer = reviewDraftSlice.reducer;

export const selectCapturedImages = (state: RootState) => state.reviewDraft.images;
export const selectDraft = (state: RootState) => state.reviewDraft.draft;
export const selectVerifiedContact = (state: RootState) => state.reviewDraft.verifiedContact;
