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
export type GoogleAuthMode = "real" | "mock";

export interface AppSettings {
  llmProvider: SupportedLlmProvider;
  openAiApiKey: string;
  anthropicApiKey: string;
  preferredOpenAiModel: string;
  preferredAnthropicModel: string;
  extractionPrompt: string;
  onboardingCompletedAt?: string;
}

export interface GoogleAuthState {
  mode: GoogleAuthMode;
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
