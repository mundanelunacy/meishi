export interface OpenAiExtractionResponse {
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
}
