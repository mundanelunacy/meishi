import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { AppSettings, GoogleAuthState, SupportedLlmProvider } from "../../shared/types/models";
import {
  clearPersistedState,
  defaultSettings,
  loadPersistedState,
  persistOnboardingState,
} from "../local-data";
import { createInitialGoogleAuthState } from "../google-auth/googleIdentity";

const persisted = typeof window === "undefined" ? { settings: defaultSettings } : loadPersistedState();

interface OnboardingState {
  settings: AppSettings;
  googleAuth: GoogleAuthState;
}

const initialState: OnboardingState = {
  settings: persisted.settings,
  googleAuth: createInitialGoogleAuthState(persisted.googleAuth),
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

function hasProviderConfiguration(settings: AppSettings) {
  switch (settings.llmProvider) {
    case "openai":
      return settings.openAiApiKey.trim().length > 0;
    case "anthropic":
      return settings.anthropicApiKey.trim().length > 0;
    default:
      return false;
  }
}

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setLlmProvider(state, action: PayloadAction<SupportedLlmProvider>) {
      state.settings.llmProvider = action.payload;
      persistState(state);
    },
    setOpenAiApiKey(state, action: PayloadAction<string>) {
      state.settings.openAiApiKey = action.payload;
      persistState(state);
    },
    setAnthropicApiKey(state, action: PayloadAction<string>) {
      state.settings.anthropicApiKey = action.payload;
      persistState(state);
    },
    setPreferredOpenAiModel(state, action: PayloadAction<string>) {
      state.settings.preferredOpenAiModel = action.payload;
      persistState(state);
    },
    setPreferredAnthropicModel(state, action: PayloadAction<string>) {
      state.settings.preferredAnthropicModel = action.payload;
      persistState(state);
    },
    setExtractionPrompt(state, action: PayloadAction<string>) {
      state.settings.extractionPrompt = action.payload;
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
      state.googleAuth = createInitialGoogleAuthState();
      persistState(state);
    },
    clearAllSettings(state) {
      state.settings = defaultSettings;
      state.googleAuth = createInitialGoogleAuthState();
      clearPersistedState();
    },
  },
});

export const {
  setLlmProvider,
  setOpenAiApiKey,
  setAnthropicApiKey,
  setPreferredOpenAiModel,
  setPreferredAnthropicModel,
  setExtractionPrompt,
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
  hasProviderConfiguration(state.onboarding.settings);
export const selectHasGoogleAuthorization = (state: RootState) =>
  state.onboarding.googleAuth.status === "connected";
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
    isCaptureReady: hasLlmConfiguration && hasCompletedOnboarding,
    googleAuthStatus: googleAuth.status,
  })
);
