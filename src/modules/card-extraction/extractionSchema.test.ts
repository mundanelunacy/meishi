import { describe, expect, it } from "vitest";
import { businessCardExtractionSchema } from "./extractionSchema";

describe("businessCardExtractionSchema", () => {
  it("accepts a complete extraction payload", () => {
    const result = businessCardExtractionSchema.parse({
      fullName: "Ada Lovelace",
      firstName: "Ada",
      lastName: "Lovelace",
      organization: "Analytical Engines",
      title: "Mathematician",
      email: "ada@example.com",
      phone: "+82-10-5555-1111",
      website: "https://example.com",
      notes: "Met at a conference.",
      address: "Seoul, South Korea",
      confidenceNotes: ["Phone number inferred from formatting."],
    });

    expect(result.fullName).toBe("Ada Lovelace");
    expect(result.confidenceNotes).toHaveLength(1);
  });

  it("rejects malformed confidence notes", () => {
    expect(() =>
      businessCardExtractionSchema.parse({
        fullName: "Ada Lovelace",
        firstName: "Ada",
        lastName: "Lovelace",
        organization: "",
        title: "",
        email: "",
        phone: "",
        website: "",
        notes: "",
        address: "",
        confidenceNotes: "wrong",
      })
    ).toThrow();
  });
});
