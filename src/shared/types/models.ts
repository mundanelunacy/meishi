export type SupportedLlmProvider = "openai" | "anthropic" | "gemini";

export interface AppSettings {
  llmProvider: SupportedLlmProvider;
  llmApiKey: string;
  preferredOpenAiModel: string;
  onboardingCompletedAt?: string;
}

export interface GoogleAuthState {
  accessToken: string | null;
  scope: string | null;
  expiresAt: number | null;
  accountHint?: string;
}

export interface CapturedCardImage {
  id: string;
  dataUrl: string;
  fileName: string;
  mimeType: string;
  capturedAt: string;
  width?: number;
  height?: number;
}

export interface ExtractionRequest {
  images: CapturedCardImage[];
}

export interface ContactDraft {
  id: string;
  sourceImageIds: string[];
  fullName: string;
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  address: string;
  confidenceNotes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VerifiedContact extends ContactDraft {
  selectedPhotoImageId?: string;
  verifiedAt: string;
}

export interface SyncOutcome {
  contactResourceName: string;
  photoUploaded: boolean;
  localOnlyImageIds: string[];
  syncedAt: string;
}

export interface LLMProviderAdapter {
  provider: SupportedLlmProvider;
  displayName: string;
  isConfigured(settings: AppSettings): boolean;
}
