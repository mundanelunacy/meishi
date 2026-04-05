import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { AppSettings, GoogleAuthState, SupportedLlmProvider } from "../../shared/types/models";
import {
  clearPersistedState,
  defaultSettings,
  loadPersistedState,
  persistOnboardingState,
} from "../local-data";
import { googleAuthClient } from "../google-auth/googleIdentity";
import { requiresRealGoogleClientId } from "../../app/env";

const persisted = typeof window === "undefined" ? { settings: defaultSettings } : loadPersistedState();

interface OnboardingState {
  settings: AppSettings;
  googleAuth: GoogleAuthState;
}

const initialState: OnboardingState = {
  settings: persisted.settings,
  googleAuth: googleAuthClient.getInitialState(persisted.googleAuth),
};

function persistState(state: OnboardingState) {
  if (typeof window === "undefined") {
    return;
  }

  persistOnboardingState({
    settings: state.settings,
    googleAuth: state.googleAuth,
  });
}

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setLlmProvider(state, action: PayloadAction<SupportedLlmProvider>) {
      state.settings.llmProvider = action.payload;
      persistState(state);
    },
    setLlmApiKey(state, action: PayloadAction<string>) {
      state.settings.llmApiKey = action.payload;
      persistState(state);
    },
    setPreferredOpenAiModel(state, action: PayloadAction<string>) {
      state.settings.preferredOpenAiModel = action.payload;
      persistState(state);
    },
    setGoogleAuthState(state, action: PayloadAction<GoogleAuthState>) {
      state.googleAuth = action.payload;
      persistState(state);
    },
    completeOnboarding(state) {
      state.settings.onboardingCompletedAt = new Date().toISOString();
      persistState(state);
    },
    signOutGoogle(state) {
      state.googleAuth = googleAuthClient.getInitialState(state.googleAuth);
      persistState(state);
    },
    clearAllSettings(state) {
      state.settings = defaultSettings;
      state.googleAuth = googleAuthClient.getInitialState();
      clearPersistedState();
    },
  },
});

export const {
  setLlmProvider,
  setLlmApiKey,
  setPreferredOpenAiModel,
  setGoogleAuthState,
  completeOnboarding,
  signOutGoogle,
  clearAllSettings,
} = onboardingSlice.actions;

export const onboardingReducer = onboardingSlice.reducer;

export const selectSettings = (state: RootState) => state.onboarding.settings;
export const selectGoogleAuth = (state: RootState) => state.onboarding.googleAuth;
export const selectHasCompletedOnboarding = (state: RootState) =>
  Boolean(state.onboarding.settings.onboardingCompletedAt);
export const selectHasLlmConfiguration = (state: RootState) =>
  state.onboarding.settings.llmApiKey.trim().length > 0;
export const selectHasGoogleAuthorization = (state: RootState) =>
  Boolean(state.onboarding.googleAuth.accessToken);
export const selectHasGoogleToken = selectHasGoogleAuthorization;

export const selectAppReadiness = createSelector(
  [
    selectHasLlmConfiguration,
    selectHasGoogleAuthorization,
    selectHasCompletedOnboarding,
    selectGoogleAuth,
  ],
  (hasLlmConfiguration, hasGoogleAuthorization, hasCompletedOnboarding, googleAuth) => ({
    hasLlmConfiguration,
    hasGoogleAuthorization,
    hasCompletedOnboarding,
    isCaptureReady:
      hasLlmConfiguration && hasGoogleAuthorization && hasCompletedOnboarding,
    requiresGoogleClientId: requiresRealGoogleClientId(),
    googleAuthMode: googleAuth.mode,
  })
);
