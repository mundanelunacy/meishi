import { describe, expect, it } from "vitest";
import { businessCardExtractionSchema } from "./extractionSchema";

describe("businessCardExtractionSchema", () => {
  it("accepts a complete extraction payload", () => {
    const result = businessCardExtractionSchema.parse({
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
      title: "Mathematician",
      email: "ada@example.com",
      emails: [{ value: "ada@example.com", type: "WORK", label: "" }],
      phone: "+82-10-5555-1111",
      phones: [{ value: "+82-10-5555-1111", type: "WORK", label: "" }],
      website: "https://example.com",
      urls: [{ value: "https://example.com", type: "WORK", label: "" }],
      notes: "Met at a conference.",
      address: "Seoul, South Korea",
      addresses: [{ value: "Seoul, South Korea", type: "WORK", label: "" }],
      relations: [{ value: "Jane Doe", type: "assistant", label: "EA" }],
      events: [{ value: "2026-04-05", type: "anniversary", label: "Met" }],
      xFields: [{ name: "X-ASSISTANT", value: "Jane Doe" }],
      ambiguousText: [],
      confidenceNotes: ["Phone number inferred from formatting."],
    });

    expect(result.fullName).toBe("Ada Lovelace");
    expect(result.fileAs).toBe("Lovelace, Ada");
    expect(result.confidenceNotes).toHaveLength(1);
  });

  it("rejects malformed confidence notes", () => {
    expect(() =>
      businessCardExtractionSchema.parse({
        fullName: "Ada Lovelace",
        namePrefix: "",
        firstName: "Ada",
        phoneticFirstName: "",
        phoneticMiddleName: "",
        phoneticLastName: "",
        lastName: "Lovelace",
        nickname: "",
        fileAs: "",
        organization: "",
        department: "",
        title: "",
        email: "",
        emails: [],
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
        confidenceNotes: "wrong",
      })
    ).toThrow();
  });
});
