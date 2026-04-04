import { configureStore } from "@reduxjs/toolkit";
import { openAiApi } from "../modules/card-extraction/openAiApi";
import { googlePeopleApi } from "../modules/google-contacts/googlePeopleApi";
import { onboardingReducer } from "../modules/onboarding-settings/onboardingSlice";
import { reviewDraftReducer } from "../modules/contact-review/reviewDraftSlice";
import { syncSessionReducer } from "../modules/google-contacts/syncSessionSlice";

export const store = configureStore({
  reducer: {
    onboarding: onboardingReducer,
    reviewDraft: reviewDraftReducer,
    syncSession: syncSessionReducer,
    [openAiApi.reducerPath]: openAiApi.reducer,
    [googlePeopleApi.reducerPath]: googlePeopleApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(openAiApi.middleware, googlePeopleApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
