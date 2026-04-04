import type { AppSettings, GoogleAuthState } from "../../shared/types/models";

const SETTINGS_KEY = "meishi.settings";

interface PersistedOnboardingState {
  settings: AppSettings;
  googleAuth?: GoogleAuthState;
}

const defaultSettings: AppSettings = {
  llmProvider: "openai",
  llmApiKey: "",
  preferredOpenAiModel: "gpt-4.1-mini",
};

export function loadPersistedState(): PersistedOnboardingState {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { settings: defaultSettings };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedOnboardingState>;
    return {
      settings: {
        ...defaultSettings,
        ...parsed.settings,
      },
      googleAuth: parsed.googleAuth
        ? {
            accessToken: null,
            scope: parsed.googleAuth.scope ?? null,
            expiresAt: null,
            accountHint: parsed.googleAuth.accountHint,
          }
        : undefined,
    };
  } catch {
    return { settings: defaultSettings };
  }
}

export function persistOnboardingState(state: PersistedOnboardingState) {
  window.localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      settings: state.settings,
      googleAuth: state.googleAuth
        ? {
            scope: state.googleAuth.scope,
            accountHint: state.googleAuth.accountHint,
          }
        : undefined,
    })
  );
}

export function clearPersistedState() {
  window.localStorage.removeItem(SETTINGS_KEY);
}

export { defaultSettings };
