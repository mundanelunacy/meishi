# Card Extraction Module

## Responsibilities

- Convert captured business-card images into structured contact drafts.
- Keep provider logic behind a consistent abstraction boundary.
- Validate model output before it reaches the review form.

## Features

- Provider registry via `LLMProviderAdapter`
- OpenAI Responses API integration
- Structured output schema validation with Zod
- Error handling for missing keys, unsupported providers, and invalid model output

## Interfaces

- Exposes:
  - `llmProviders`
  - `businessCardExtractionSchema`
  - `openAiApi`
  - `useExtractBusinessCardMutation`
- Consumes:
  - `ExtractionRequest`
  - `AppSettings`

## External docs

- [Images and vision](https://platform.openai.com/docs/guides/images-vision)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Best Practices for API Key Safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)

## Constraints

- OpenAI is the only implemented provider in this scaffold.
- Anthropic and Gemini should be added as parallel adapters, not by branching UI logic.
