import type { BusinessCardExtraction } from "../../modules/card-extraction/extractionSchema";
import type {
  CustomContactField,
  MultiValueContactField,
  RelatedPersonField,
  SignificantDateField,
} from "./contact";
export type {
  CustomContactField,
  MultiValueContactField,
  RelatedPersonField,
  SignificantDateField,
} from "./contact";

export type SupportedLlmProvider = "openai" | "anthropic" | "gemini";
export type GoogleAuthStatus =
  | "signed_out"
  | "connecting"
  | "disconnecting"
  | "connected";
export type ThemeMode = "system" | "light" | "dark";
export type AppLocale = "en-US" | "ja" | "ko";
export type LlmValidationStatus = "idle" | "validating" | "valid" | "invalid";

export interface AppSettings {
  llmProvider: SupportedLlmProvider;
  openAiApiKey: string;
  anthropicApiKey: string;
  preferredOpenAiModel: string;
  preferredAnthropicModel: string;
  extractionPrompt: string;
  themeMode: ThemeMode;
  locale: AppLocale;
  onboardingCompletedAt?: string;
}

export interface LlmValidationResult {
  provider: SupportedLlmProvider;
  apiKey: string;
  model: string;
  isValid: boolean;
  checkedAt: string;
  errorMessage?: string;
}

export interface GoogleAuthState {
  status: GoogleAuthStatus;
  firebaseUid: string | null;
  scope: string | null;
  accountEmail?: string;
  connectedAt: string | null;
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
  namePrefix: string;
  firstName: string;
  phoneticFirstName: string;
  phoneticMiddleName: string;
  phoneticLastName: string;
  lastName: string;
  nickname: string;
  fileAs: string;
  organization: string;
  department: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  address: string;
  emails: MultiValueContactField[];
  phones: MultiValueContactField[];
  websites: MultiValueContactField[];
  addresses: MultiValueContactField[];
  relatedPeople: RelatedPersonField[];
  significantDates: SignificantDateField[];
  customFields: CustomContactField[];
  confidenceNotes: string[];
  extractionSnapshot: BusinessCardExtraction | null;
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
