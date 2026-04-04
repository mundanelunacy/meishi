import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { CapturedCardImage, ContactDraft, VerifiedContact } from "../../shared/types/models";
import type { OpenAiExtractionResponse } from "../../shared/types/openai";

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

function newDraft(images: CapturedCardImage[], extraction?: OpenAiExtractionResponse): ContactDraft {
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    sourceImageIds: images.map((image) => image.id),
    fullName: extraction?.fullName ?? "",
    firstName: extraction?.firstName ?? "",
    lastName: extraction?.lastName ?? "",
    organization: extraction?.organization ?? "",
    title: extraction?.title ?? "",
    email: extraction?.email ?? "",
    phone: extraction?.phone ?? "",
    website: extraction?.website ?? "",
    notes: extraction?.notes ?? "",
    address: extraction?.address ?? "",
    confidenceNotes: extraction?.confidenceNotes ?? [],
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
      state.draft = state.draft ?? newDraft(action.payload);
      state.verifiedContact = null;
    },
    populateDraftFromExtraction(state, action: PayloadAction<OpenAiExtractionResponse>) {
      state.draft = newDraft(state.images, action.payload);
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
