export const BASE_EXTRACTION_PROMPT = [
  "Extract business card details into the required structured schema with best-effort vCard 3.0 fidelity.",
  "Read every image provided and merge duplicate fields across front/back or multiple shots.",
  "Populate the scalar summary fields for the primary values, and also populate the repeatable arrays for every distinct email, phone number, URL, address, related person, and significant date found.",
  "Do not drop extra values such as secondary email addresses.",
  "Use empty strings for unknown scalar fields and empty arrays when no repeatable values are present.",
  "Only infer first and last name when the card clearly supports that split.",
  "Keep notes concise and factual, but preserve fidelity.",
  "For recognizable information that does not map cleanly to the standard fields, add it to xFields using an X- compatible field name and also summarize it in notes.",
  "For recognizable text that is ambiguous and cannot be confidently mapped to a standard field, add it to ambiguousText and also mention it in notes.",
  "Use confidenceNotes to record ambiguities, low-confidence OCR, competing values, or inferred fields.",
].join(" ");

export const DEFAULT_EXTRACTION_PROMPT =
  "Prefer explicit card text over inference when multiple OCR interpretations are possible.";

export function buildEffectiveExtractionPrompt(advancedPrompt: string) {
  const normalizedAdvancedPrompt = advancedPrompt.trim();
  if (!normalizedAdvancedPrompt) {
    return BASE_EXTRACTION_PROMPT;
  }

  return `${BASE_EXTRACTION_PROMPT}\n\nAdditional extraction guidance:\n${normalizedAdvancedPrompt}`;
}
