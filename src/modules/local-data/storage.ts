import type { AppSettings, GoogleAuthState } from "../../shared/types/models";

const SETTINGS_KEY = "meishi.settings";

export interface PersistedOnboardingState {
  settings: AppSettings;
  googleAuth?: Pick<GoogleAuthState, "scope" | "accountHint">;
}

const defaultSettings: AppSettings = {
  llmProvider: "openai",
  llmApiKey: "",
  preferredOpenAiModel: "gpt-4.1-mini",
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

  return {
    llmProvider:
      llmProvider === "openai" || llmProvider === "anthropic" || llmProvider === "gemini"
        ? llmProvider
        : defaultSettings.llmProvider,
    llmApiKey: typeof candidate.llmApiKey === "string" ? candidate.llmApiKey : defaultSettings.llmApiKey,
    preferredOpenAiModel:
      typeof candidate.preferredOpenAiModel === "string"
        ? candidate.preferredOpenAiModel
        : defaultSettings.preferredOpenAiModel,
    onboardingCompletedAt:
      typeof candidate.onboardingCompletedAt === "string" ? candidate.onboardingCompletedAt : undefined,
  };
}

function sanitizeGoogleAuthMetadata(
  googleAuth: unknown
): PersistedOnboardingState["googleAuth"] | undefined {
  if (!isRecord(googleAuth)) {
    return undefined;
  }

  const scope = typeof googleAuth.scope === "string" ? googleAuth.scope : null;
  const accountHint = typeof googleAuth.accountHint === "string" ? googleAuth.accountHint : undefined;

  if (scope === null && accountHint === undefined) {
    return undefined;
  }

  return {
    scope,
    accountHint,
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
      })
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
