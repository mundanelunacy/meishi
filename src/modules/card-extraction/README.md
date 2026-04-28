# Card Extraction Module

## Responsibilities

- Convert captured business-card images into structured contact drafts.
- Keep provider logic behind a consistent abstraction boundary.
- Validate model output before it reaches the review form.

## Features

- Provider registry via `LLMProviderAdapter`
- OpenAI Responses API integration with strict JSON schema output
- Anthropic Messages API integration with forced tool-based structured output
- Gemini `generateContent` integration with JSON schema output
- Structured output schema validation with Zod
- Google-Contacts-aligned top-level extraction for name/company details such as prefix, phonetic name parts, nickname, file-as, and department
- Repeatable vCard-style extraction for emails, phones, URLs, addresses, related people, and significant dates
- Preservation buckets for non-standard fields (`X-` fields) and ambiguous text
- Shared advanced extraction prompt used by all providers as additive guidance
- Error handling for missing keys, unsupported providers, and invalid model output

## Interfaces

- Exposes:
  - `llmProviders`
  - `businessCardExtractionSchema`
  - `businessCardExtractionJsonSchema`
  - `extractionApi`
  - `useExtractBusinessCardMutation`
- Consumes:
  - `ExtractionRequest`
  - `AppSettings`

## External docs

- [Images and vision](https://platform.openai.com/docs/guides/images-vision)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Best Practices for API Key Safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)
- [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini models](https://ai.google.dev/gemini-api/docs/models)

## Constraints

- OpenAI, Anthropic, and Gemini must stay behind the same extraction mutation boundary.
- Prompt customization must not weaken provider-enforced structured output mode.
- Extraction should preserve fidelity rather than collapse repeated or ambiguous card text into a single scalar field.
- If recognizable card text cannot be confidently mapped to a standard field, extraction should preserve it in both ambiguous text output and custom `X-` field material for review.
