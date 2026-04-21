import type {
  AnalyticsConsent,
  AppLocale,
  AppSettings,
  GoogleAuthState,
  LlmValidationResult,
  ThemeMode,
} from "../../shared/types/models";
import { DEFAULT_EXTRACTION_PROMPT } from "../../shared/lib/extractionPrompt";

const SETTINGS_KEY = "meishi.settings";
const VALID_THEME_MODES = new Set<ThemeMode>(["system", "light", "dark"]);
const VALID_LOCALES = new Set<AppLocale>(["en-US", "ja", "ko"]);
const VALID_ANALYTICS_CONSENT = new Set<AnalyticsConsent>([
  "granted",
  "denied",
]);

export interface PersistedOnboardingState {
  settings: AppSettings;
  googleAuth?: Pick<GoogleAuthState, "scope" | "accountEmail" | "connectedAt">;
  llmValidation?: LlmValidationResult;
}

const defaultSettings: AppSettings = {
  llmProvider: "openai",
  openAiApiKey: "",
  anthropicApiKey: "",
  preferredOpenAiModel: "gpt-5.4-mini",
  preferredAnthropicModel: "claude-haiku-4-5-20251001",
  extractionPrompt: DEFAULT_EXTRACTION_PROMPT,
  themeMode: "system",
  locale: "en-US",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function sanitizeSettings(settings: unknown): AppSettings {
  const candidate = isRecord(settings) ? settings : {};
  const llmProvider = candidate.llmProvider;
  const themeMode = candidate.themeMode;
  const locale = candidate.locale;
  const analyticsConsent = candidate.analyticsConsent;
  const legacyApiKey =
    typeof candidate.llmApiKey === "string" ? candidate.llmApiKey : "";

  return {
    llmProvider:
      llmProvider === "openai" ||
      llmProvider === "anthropic" ||
      llmProvider === "gemini"
        ? llmProvider
        : defaultSettings.llmProvider,
    openAiApiKey:
      typeof candidate.openAiApiKey === "string"
        ? candidate.openAiApiKey
        : legacyApiKey || defaultSettings.openAiApiKey,
    anthropicApiKey:
      typeof candidate.anthropicApiKey === "string"
        ? candidate.anthropicApiKey
        : defaultSettings.anthropicApiKey,
    preferredOpenAiModel:
      typeof candidate.preferredOpenAiModel === "string"
        ? candidate.preferredOpenAiModel
        : defaultSettings.preferredOpenAiModel,
    preferredAnthropicModel:
      typeof candidate.preferredAnthropicModel === "string"
        ? candidate.preferredAnthropicModel
        : defaultSettings.preferredAnthropicModel,
    extractionPrompt:
      typeof candidate.extractionPrompt === "string" &&
      candidate.extractionPrompt.trim().length > 0
        ? candidate.extractionPrompt
        : defaultSettings.extractionPrompt,
    themeMode:
      typeof themeMode === "string" &&
      VALID_THEME_MODES.has(themeMode as ThemeMode)
        ? (themeMode as ThemeMode)
        : defaultSettings.themeMode,
    locale:
      typeof locale === "string" && VALID_LOCALES.has(locale as AppLocale)
        ? (locale as AppLocale)
        : defaultSettings.locale,
    onboardingCompletedAt:
      typeof candidate.onboardingCompletedAt === "string"
        ? candidate.onboardingCompletedAt
        : undefined,
    analyticsConsent:
      typeof analyticsConsent === "string" &&
      VALID_ANALYTICS_CONSENT.has(analyticsConsent as AnalyticsConsent)
        ? (analyticsConsent as AnalyticsConsent)
        : undefined,
    analyticsConsentUpdatedAt:
      typeof candidate.analyticsConsentUpdatedAt === "string"
        ? candidate.analyticsConsentUpdatedAt
        : undefined,
  };
}

function sanitizeGoogleAuthMetadata(
  googleAuth: unknown,
): PersistedOnboardingState["googleAuth"] | undefined {
  if (!isRecord(googleAuth)) {
    return undefined;
  }

  const scope = typeof googleAuth.scope === "string" ? googleAuth.scope : null;
  const accountEmail =
    typeof googleAuth.accountEmail === "string"
      ? googleAuth.accountEmail
      : undefined;
  const connectedAt =
    typeof googleAuth.connectedAt === "string" ? googleAuth.connectedAt : null;

  if (scope === null && accountEmail === undefined && connectedAt === null) {
    return undefined;
  }

  return {
    scope,
    accountEmail,
    connectedAt,
  };
}

function sanitizeLlmValidation(
  llmValidation: unknown,
): PersistedOnboardingState["llmValidation"] | undefined {
  if (!isRecord(llmValidation)) {
    return undefined;
  }

  const provider = llmValidation.provider;
  const apiKey = llmValidation.apiKey;
  const model = llmValidation.model;
  const checkedAt = llmValidation.checkedAt;
  const isValid = llmValidation.isValid;
  const errorMessage = llmValidation.errorMessage;

  if (
    (provider !== "openai" && provider !== "anthropic" && provider !== "gemini") ||
    typeof apiKey !== "string" ||
    typeof model !== "string" ||
    typeof checkedAt !== "string" ||
    typeof isValid !== "boolean"
  ) {
    return undefined;
  }

  return {
    provider,
    apiKey,
    model,
    checkedAt,
    isValid,
    errorMessage: typeof errorMessage === "string" ? errorMessage : undefined,
  };
}

export function loadPersistedState(): PersistedOnboardingState {
  try {
    const storage = readLocalStorage();
    const raw = storage?.getItem(SETTINGS_KEY);
    if (!raw) {
      return { settings: defaultSettings };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedOnboardingState>;
    return {
      settings: sanitizeSettings(parsed.settings),
      googleAuth: sanitizeGoogleAuthMetadata(parsed.googleAuth),
      llmValidation: sanitizeLlmValidation(parsed.llmValidation),
    };
  } catch {
    return { settings: defaultSettings };
  }
}

export function persistOnboardingState(state: PersistedOnboardingState) {
  try {
    const storage = readLocalStorage();
    storage?.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        settings: sanitizeSettings(state.settings),
        googleAuth: sanitizeGoogleAuthMetadata(state.googleAuth),
        llmValidation: sanitizeLlmValidation(state.llmValidation),
      }),
    );
  } catch {
    // Ignore browser storage failures so reducer writes remain safe.
  }
}

export function clearPersistedState() {
  try {
    readLocalStorage()?.removeItem(SETTINGS_KEY);
  } catch {
    // Ignore browser storage failures so local reset remains safe.
  }
}

export { defaultSettings };
