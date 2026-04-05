import { describe, expect, it } from "vitest";
import type { VerifiedContact } from "../../shared/types/models";
import { buildContactPayload, buildContactVCard } from "./contactMapping";

const contact: VerifiedContact = {
  id: "draft-1",
  sourceImageIds: ["img-1"],
  fullName: "Ada Lovelace",
  firstName: "Ada",
  lastName: "Lovelace",
  organization: "Analytical Engines",
  title: "Founder",
  email: "ada@example.com",
  phone: "+82 10-1234-5678",
  website: "https://example.com",
  notes:
    "Met at conference\nX-ASSISTANT: Jane Doe\nX-AMBIGUOUS-TEXT: Tower B, Level 7",
  address: "Seoul",
  emails: [
    { value: "ada@example.com", type: "WORK", label: "" },
    { value: "press@example.com", type: "INTERNET", label: "PRESS" },
  ],
  phones: [
    { value: "+82 10-1234-5678", type: "WORK", label: "" },
    { value: "+82 10-9999-8888", type: "CELL", label: "" },
  ],
  websites: [{ value: "https://example.com", type: "WORK", label: "" }],
  addresses: [{ value: "Seoul", type: "WORK", label: "" }],
  relatedPeople: [{ value: "Jane Doe", type: "assistant", label: "EA" }],
  significantDates: [
    { value: "2026-04-05", type: "anniversary", label: "Met" },
  ],
  customFields: [
    { key: "X-ASSISTANT", value: "Jane Doe" },
    { key: "X-AMBIGUOUS-TEXT", value: "Tower B, Level 7" },
  ],
  confidenceNotes: [],
  extractionSnapshot: {
    fullName: "Ada Lovelace",
    firstName: "Ada",
    lastName: "Lovelace",
    organization: "Analytical Engines",
    title: "Founder",
    email: "ada@example.com",
    emails: [
      { value: "ada@example.com", type: "WORK", label: "" },
      { value: "press@example.com", type: "INTERNET", label: "PRESS" },
    ],
    phone: "+82 10-1234-5678",
    phones: [
      { value: "+82 10-1234-5678", type: "WORK", label: "" },
      { value: "+82 10-9999-8888", type: "CELL", label: "" },
    ],
    website: "https://example.com",
    urls: [{ value: "https://example.com", type: "WORK", label: "" }],
    notes: "Met at conference",
    address: "Seoul",
    addresses: [{ value: "Seoul", type: "WORK", label: "" }],
    relations: [{ value: "Jane Doe", type: "assistant", label: "EA" }],
    events: [{ value: "2026-04-05", type: "anniversary", label: "Met" }],
    xFields: [{ name: "X-ASSISTANT", value: "Jane Doe" }],
    ambiguousText: ["Tower B, Level 7"],
    confidenceNotes: [],
  },
  selectedPhotoImageId: "img-1",
  createdAt: "2026-04-05T00:00:00.000Z",
  updatedAt: "2026-04-05T00:00:00.000Z",
  verifiedAt: "2026-04-05T00:00:00.000Z",
};

describe("contactMapping", () => {
  it("maps a reviewed contact to the Google People payload", () => {
    expect(buildContactPayload(contact)).toEqual({
      names: [
        {
          displayName: "Ada Lovelace",
          givenName: "Ada",
          familyName: "Lovelace",
        },
      ],
      emailAddresses: [
        { value: "ada@example.com", type: "work" },
        { value: "press@example.com", type: "internet" },
      ],
      phoneNumbers: [
        { value: "+82 10-1234-5678", type: "work" },
        { value: "+82 10-9999-8888", type: "cell" },
      ],
      organizations: [{ name: "Analytical Engines", title: "Founder" }],
      biographies: [
        {
          value:
            "Met at conference\nX-ASSISTANT: Jane Doe\nX-AMBIGUOUS-TEXT: Tower B, Level 7",
        },
      ],
      urls: [{ value: "https://example.com", type: "work" }],
      addresses: [{ formattedValue: "Seoul", type: "work" }],
      relations: [{ person: "Jane Doe", type: "assistant" }],
      events: [{ date: { year: 2026, month: 4, day: 5 }, type: "anniversary" }],
      userDefined: [
        { key: "X-ASSISTANT", value: "Jane Doe" },
        { key: "X-AMBIGUOUS-TEXT", value: "Tower B, Level 7" },
      ],
    });
  });

  it("omits empty fields in the Google People payload and vCard output", () => {
    const minimalContact = {
      ...contact,
      organization: "",
      title: "",
      phone: "",
      website: "",
      notes: "",
      address: "",
      emails: [{ value: "ada@example.com", type: "WORK", label: "" }],
      phones: [],
      websites: [],
      addresses: [],
      relatedPeople: [],
      significantDates: [],
      customFields: [],
      extractionSnapshot: {
        ...contact.extractionSnapshot!,
        email: "ada@example.com",
        emails: [{ value: "ada@example.com", type: "WORK", label: "" }],
        organization: "",
        title: "",
        phone: "",
        phones: [],
        website: "",
        urls: [],
        notes: "",
        address: "",
        addresses: [],
        xFields: [],
        ambiguousText: [],
      },
    };

    expect(buildContactPayload(minimalContact)).toEqual({
      names: [
        {
          displayName: "Ada Lovelace",
          givenName: "Ada",
          familyName: "Lovelace",
        },
      ],
      emailAddresses: [{ value: "ada@example.com", type: "work" }],
      phoneNumbers: undefined,
      organizations: undefined,
      biographies: undefined,
      urls: undefined,
      addresses: undefined,
      relations: undefined,
      events: undefined,
      userDefined: undefined,
    });
    expect(buildContactVCard(minimalContact)).not.toContain("ORG:");
    expect(buildContactVCard(minimalContact)).not.toContain("TEL:");
  });

  it("emits repeated vCard fields and preserved X-fields without losing fidelity", () => {
    const vCard = buildContactVCard(contact);

    expect(vCard).toContain("EMAIL;TYPE=WORK:ada@example.com");
    expect(vCard).toContain("EMAIL;TYPE=INTERNET,PRESS:press@example.com");
    expect(vCard).toContain("TEL;TYPE=WORK:+82 10-1234-5678");
    expect(vCard).toContain("TEL;TYPE=CELL:+82 10-9999-8888");
    expect(vCard).toContain("RELATED;TYPE=ASSISTANT,EA:Jane Doe");
    expect(vCard).toContain(
      "X-SIGNIFICANT-DATE;TYPE=ANNIVERSARY,MET:2026-04-05",
    );
    expect(vCard).toContain("X-ASSISTANT:Jane Doe");
    expect(vCard).toContain("X-AMBIGUOUS-TEXT:Tower B\\, Level 7");
    expect(vCard).toContain(
      "NOTE:Met at conference\\nX-ASSISTANT: Jane Doe\\nX-AMBIGUOUS-TEXT: Tower B\\, Level 7",
    );
  });
});
