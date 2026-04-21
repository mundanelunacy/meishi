import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type {
  AnalyticsConsent,
  AppLocale,
  AppSettings,
  GoogleAuthState,
  LlmValidationResult,
  LlmValidationStatus,
  SupportedLlmProvider,
  ThemeMode,
} from "../../shared/types/models";
import {
  clearPersistedState,
  defaultSettings,
  loadPersistedState,
  persistOnboardingState,
} from "../local-data";
import { createInitialGoogleAuthState } from "../google-auth/googleAuthState";
import {
  getCurrentLlmConfiguration,
  getValidationIdentity,
  matchesLlmConfiguration,
  type LlmConfigurationIdentity,
} from "./llmKeyValidation";

const persisted =
  typeof window === "undefined"
    ? { settings: defaultSettings }
    : loadPersistedState();

interface OnboardingState {
  settings: AppSettings;
  googleAuth: GoogleAuthState;
  llmValidation: {
    pendingConfiguration: LlmConfigurationIdentity | null;
    lastResult: LlmValidationResult | null;
  };
}

const initialState: OnboardingState = {
  settings: persisted.settings,
  googleAuth: createInitialGoogleAuthState(persisted.googleAuth),
  llmValidation: {
    pendingConfiguration: null,
    lastResult: persisted.llmValidation ?? null,
  },
};

function persistState(state: OnboardingState) {
  if (typeof window === "undefined") {
    return;
  }

  persistOnboardingState({
    settings: state.settings,
    googleAuth: state.googleAuth,
    llmValidation: state.llmValidation.lastResult ?? undefined,
  });
}

function hasProviderConfiguration(settings: AppSettings) {
  return getCurrentLlmConfiguration(settings) !== null;
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
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.settings.themeMode = action.payload;
      persistState(state);
    },
    setLocale(state, action: PayloadAction<AppLocale>) {
      state.settings.locale = action.payload;
      persistState(state);
    },
    setAnalyticsConsent(
      state,
      action: PayloadAction<AnalyticsConsent | undefined>,
    ) {
      state.settings.analyticsConsent = action.payload;
      state.settings.analyticsConsentUpdatedAt = action.payload
        ? new Date().toISOString()
        : undefined;
      persistState(state);
    },
    setGoogleAuthState(state, action: PayloadAction<GoogleAuthState>) {
      state.googleAuth = action.payload;
      persistState(state);
    },
    startLlmValidation(
      state,
      action: PayloadAction<LlmConfigurationIdentity>,
    ) {
      state.llmValidation.pendingConfiguration = action.payload;
      persistState(state);
    },
    completeLlmValidationSuccess(
      state,
      action: PayloadAction<LlmConfigurationIdentity>,
    ) {
      state.llmValidation.pendingConfiguration = null;
      state.llmValidation.lastResult = {
        ...action.payload,
        isValid: true,
        checkedAt: new Date().toISOString(),
      };
      persistState(state);
    },
    completeLlmValidationFailure(
      state,
      action: PayloadAction<LlmConfigurationIdentity & { errorMessage: string }>,
    ) {
      state.llmValidation.pendingConfiguration = null;
      state.llmValidation.lastResult = {
        provider: action.payload.provider,
        apiKey: action.payload.apiKey,
        model: action.payload.model,
        checkedAt: new Date().toISOString(),
        isValid: false,
        errorMessage: action.payload.errorMessage,
      };
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
      state.llmValidation = {
        pendingConfiguration: null,
        lastResult: null,
      };
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
  setThemeMode,
  setLocale,
  setAnalyticsConsent,
  setGoogleAuthState,
  startLlmValidation,
  completeLlmValidationSuccess,
  completeLlmValidationFailure,
  completeOnboarding,
  signOutGoogle,
  clearAllSettings,
} = onboardingSlice.actions;

export const onboardingReducer = onboardingSlice.reducer;

export const selectSettings = (state: RootState) => state.onboarding.settings;
export const selectGoogleAuth = (state: RootState) =>
  state.onboarding.googleAuth;
export const selectThemeMode = (state: RootState) =>
  state.onboarding.settings.themeMode;
export const selectLocale = (state: RootState) =>
  state.onboarding.settings.locale;
export const selectAnalyticsConsent = (state: RootState) =>
  state.onboarding.settings.analyticsConsent;
export const selectAnalyticsConsentUpdatedAt = (state: RootState) =>
  state.onboarding.settings.analyticsConsentUpdatedAt;
export const selectHasCompletedOnboarding = (state: RootState) =>
  Boolean(state.onboarding.settings.onboardingCompletedAt);
export const selectLlmValidationState = (state: RootState) =>
  state.onboarding.llmValidation;
export const selectCurrentLlmValidation = createSelector(
  [selectSettings, selectLlmValidationState],
  (settings, llmValidation): {
    status: LlmValidationStatus;
    errorMessage?: string;
    isValidated: boolean;
  } => {
    const currentConfiguration = getCurrentLlmConfiguration(settings);
    if (!currentConfiguration) {
      return {
        status: "idle",
        isValidated: false,
      };
    }

    if (
      matchesLlmConfiguration(
        llmValidation.pendingConfiguration,
        currentConfiguration,
      )
    ) {
      return {
        status: "validating",
        isValidated: false,
      };
    }

    const lastValidatedConfiguration = getValidationIdentity(
      llmValidation.lastResult,
    );
    if (
      matchesLlmConfiguration(lastValidatedConfiguration, currentConfiguration)
    ) {
      return {
        status: llmValidation.lastResult?.isValid ? "valid" : "invalid",
        errorMessage: llmValidation.lastResult?.errorMessage,
        isValidated: llmValidation.lastResult?.isValid ?? false,
      };
    }

    return {
      status: "idle",
      isValidated: false,
    };
  },
);
export const selectHasLlmConfiguration = (state: RootState) =>
  hasProviderConfiguration(state.onboarding.settings) &&
  selectCurrentLlmValidation(state).isValidated;
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
  (
    hasLlmConfiguration,
    hasGoogleAuthorization,
    hasCompletedOnboarding,
    googleAuth,
  ) => ({
    hasLlmConfiguration,
    hasGoogleAuthorization,
    hasCompletedOnboarding,
    isCaptureReady: hasLlmConfiguration && hasCompletedOnboarding,
    googleAuthStatus: googleAuth.status,
  }),
);
