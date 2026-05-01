import { describe, expect, it, vi } from "vitest";
import { DEFAULT_EXTRACTION_PROMPT } from "../../shared/lib/extractionPrompt";
import type { AppSettings, CapturedCardImage } from "../../shared/types/models";
import { extractBusinessCardWithProvider } from "./structuredExtraction";

const sampleImage: CapturedCardImage = {
  id: "img-1",
  dataUrl: "data:image/png;base64,ZmFrZQ==",
  fileName: "card.png",
  mimeType: "image/png",
  capturedAt: "2026-04-05T00:00:00.000Z",
  width: 1200,
  height: 800,
};

const baseSettings: AppSettings = {
  llmProvider: "openai",
  openAiApiKey: "sk-test",
  anthropicApiKey: "sk-ant-test",
  geminiApiKey: "AIzaabcdefghijklmnopqrstuvwxyz123456789",
  preferredOpenAiModel: "gpt-5.4-mini",
  preferredAnthropicModel: "claude-sonnet-4-20250514",
  preferredGeminiModel: "gemini-2.5-flash-lite",
  extractionPrompt: DEFAULT_EXTRACTION_PROMPT,
  themeMode: "system",
  locale: "en-US",
};

describe("structuredExtraction", () => {
  it("parses OpenAI structured output responses", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          output: [
            {
              content: [
                {
                  text: JSON.stringify({
                    fullName: "Ada Lovelace",
                    namePrefix: "Countess",
                    firstName: "Ada",
                    phoneticFirstName: "",
                    phoneticMiddleName: "Byron",
                    phoneticLastName: "",
                    lastName: "Lovelace",
                    nickname: "Ada",
                    fileAs: "Lovelace, Ada",
                    organization: "Analytical Engines",
                    department: "Research",
                    title: "Founder",
                    email: "ada@example.com",
                    emails: [
                      { value: "ada@example.com", type: "WORK", label: "" },
                      {
                        value: "press@example.com",
                        type: "INTERNET",
                        label: "PRESS",
                      },
                    ],
                    phone: "+82 10-1234-5678",
                    phones: [
                      { value: "+82 10-1234-5678", type: "WORK", label: "" },
                    ],
                    website: "https://example.com",
                    urls: [
                      { value: "https://example.com", type: "WORK", label: "" },
                    ],
                    notes: "Met at conference",
                    address: "Seoul",
                    addresses: [{ value: "Seoul", type: "WORK", label: "" }],
                    relations: [
                      { value: "Jane Doe", type: "assistant", label: "EA" },
                    ],
                    events: [
                      {
                        value: "2026-04-05",
                        type: "anniversary",
                        label: "Met",
                      },
                    ],
                    xFields: [{ name: "X-ASSISTANT", value: "Jane Doe" }],
                    ambiguousText: ["Tower B, Level 7"],
                    confidenceNotes: ["Name inferred from card header"],
                  }),
                },
              ],
            },
          ],
        }),
      ),
    );

    const result = await extractBusinessCardWithProvider({
      request: { images: [sampleImage] },
      settings: baseSettings,
      fetchImpl,
    });

    expect(result.fullName).toBe("Ada Lovelace");
    expect(result.department).toBe("Research");
    expect(result.emails).toHaveLength(2);
    expect(result.xFields[0]?.name).toBe("X-ASSISTANT");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("parses Anthropic structured tool output responses", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [
            {
              type: "tool_use",
              name: "submit_business_card_extraction",
              input: {
                fullName: "Grace Hopper",
                namePrefix: "Rear Admiral",
                firstName: "Grace",
                phoneticFirstName: "",
                phoneticMiddleName: "Brewster",
                phoneticLastName: "",
                lastName: "Hopper",
                nickname: "Amazing Grace",
                fileAs: "Hopper, Grace",
                organization: "US Navy",
                department: "Research",
                title: "Rear Admiral",
                email: "grace@example.com",
                emails: [
                  { value: "grace@example.com", type: "WORK", label: "" },
                ],
                phone: "",
                phones: [],
                website: "",
                urls: [],
                notes: "",
                address: "",
                addresses: [],
                relations: [],
                events: [],
                xFields: [],
                ambiguousText: [],
                confidenceNotes: [],
              },
            },
          ],
        }),
      ),
    );

    const result = await extractBusinessCardWithProvider({
      request: { images: [sampleImage] },
      settings: {
        ...baseSettings,
        llmProvider: "anthropic",
      },
      fetchImpl,
    });

    expect(result.organization).toBe("US Navy");
    expect(result.fileAs).toBe("Hopper, Grace");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("parses Gemini structured JSON responses and sends inline images", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      fullName: "Katherine Johnson",
                      namePrefix: "",
                      firstName: "Katherine",
                      phoneticFirstName: "",
                      phoneticMiddleName: "",
                      phoneticLastName: "",
                      lastName: "Johnson",
                      nickname: "",
                      fileAs: "Johnson, Katherine",
                      organization: "NASA",
                      department: "Flight Research",
                      title: "Mathematician",
                      email: "katherine@example.com",
                      emails: [
                        {
                          value: "katherine@example.com",
                          type: "WORK",
                          label: "",
                        },
                      ],
                      phone: "",
                      phones: [],
                      website: "",
                      urls: [],
                      notes: "",
                      address: "",
                      addresses: [],
                      relations: [],
                      events: [],
                      xFields: [],
                      ambiguousText: [],
                      confidenceNotes: [],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      ),
    );

    const result = await extractBusinessCardWithProvider({
      request: { images: [sampleImage] },
      settings: {
        ...baseSettings,
        llmProvider: "gemini",
      },
      fetchImpl,
    });

    expect(result.organization).toBe("NASA");
    expect(result.fileAs).toBe("Johnson, Katherine");
    expect(fetchImpl).toHaveBeenCalledOnce();

    const request = fetchImpl.mock.calls[0];
    expect(request[0]).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    );
    expect(request[1]?.headers).toMatchObject({
      "x-goog-api-key": baseSettings.geminiApiKey,
    });

    const body = JSON.parse(request[1]?.body as string) as {
      contents: Array<{ parts: Array<{ inlineData?: { data: string } }> }>;
      generationConfig: {
        maxOutputTokens: number;
        responseMimeType: string;
        responseJsonSchema: unknown;
        thinkingConfig: { thinkingBudget: number };
      };
    };
    expect(body.generationConfig.maxOutputTokens).toBe(8192);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseJsonSchema).toBeDefined();
    expect(body.generationConfig.thinkingConfig.thinkingBudget).toBe(0);
    expect(body.contents[0]?.parts[1]?.inlineData?.data).toBe("ZmFrZQ==");
  });

  it("rejects invalid provider output after schema validation", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          output: [
            {
              content: [
                {
                  text: JSON.stringify({
                    fullName: "Bad Response",
                    confidenceNotes: "should be array",
                  }),
                },
              ],
            },
          ],
        }),
      ),
    );

    await expect(
      extractBusinessCardWithProvider({
        request: { images: [sampleImage] },
        settings: baseSettings,
        fetchImpl,
      }),
    ).rejects.toThrow();
  });

  it("fails when the selected provider key is missing", async () => {
    await expect(
      extractBusinessCardWithProvider({
        request: { images: [sampleImage] },
        settings: {
          ...baseSettings,
          llmProvider: "anthropic",
          anthropicApiKey: "",
        },
      }),
    ).rejects.toThrow(
      "Add an Anthropic API key in settings before extraction.",
    );
  });

  it("fails when the selected Gemini key is missing", async () => {
    await expect(
      extractBusinessCardWithProvider({
        request: { images: [sampleImage] },
        settings: {
          ...baseSettings,
          llmProvider: "gemini",
          geminiApiKey: "",
        },
      }),
    ).rejects.toThrow("Add a Gemini API key in settings before extraction.");
  });

  it("surfaces Gemini provider errors", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: "API key not valid.",
          },
        }),
        { status: 400 },
      ),
    );

    await expect(
      extractBusinessCardWithProvider({
        request: { images: [sampleImage] },
        settings: {
          ...baseSettings,
          llmProvider: "gemini",
        },
        fetchImpl,
      }),
    ).rejects.toThrow("API key not valid.");
  });
});
