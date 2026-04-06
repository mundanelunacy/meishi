// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VerifiedContact } from "../../shared/types/models";
import {
  buildContactVCard,
  buildVCardFileName,
  downloadContactVCard,
  saveContactVCard,
} from "./vcardExport";

const contact: VerifiedContact = {
  id: "draft-1",
  sourceImageIds: ["img-1"],
  fullName: "Ada Lovelace",
  namePrefix: "Countess",
  firstName: "Ada",
  phoneticFirstName: "A-da",
  phoneticMiddleName: "By-ron",
  phoneticLastName: "Love-lace",
  lastName: "Lovelace",
  nickname: "Ada",
  fileAs: "Lovelace, Ada",
  organization: "Analytical Engines",
  department: "Research",
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
    namePrefix: "Countess",
    firstName: "Ada",
    phoneticFirstName: "A-da",
    phoneticMiddleName: "By-ron",
    phoneticLastName: "Love-lace",
    lastName: "Lovelace",
    nickname: "Ada",
    fileAs: "Lovelace, Ada",
    organization: "Analytical Engines",
    department: "Research",
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

describe("vcardExport", () => {
  const createObjectURLMock = vi.fn(() => "blob:card");
  const revokeObjectURLMock = vi.fn();
  const shareMock = vi.fn();
  const canShareMock = vi.fn();

  beforeEach(() => {
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();
    shareMock.mockReset();
    canShareMock.mockReset();
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: canShareMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits repeated vCard fields and preserved X-fields without losing fidelity", () => {
    const vCard = buildContactVCard(contact);

    expect(vCard).toContain("EMAIL;TYPE=WORK:ada@example.com");
    expect(vCard).toContain("N:Lovelace;Ada;;Countess;");
    expect(vCard).toContain("NICKNAME:Ada");
    expect(vCard).toContain("SORT-STRING:Lovelace\\, Ada");
    expect(vCard).toContain("ORG:Analytical Engines;Research");
    expect(vCard).toContain("X-PHONETIC-FIRST-NAME:A-da");
    expect(vCard).toContain("X-PHONETIC-MIDDLE-NAME:By-ron");
    expect(vCard).toContain("X-PHONETIC-LAST-NAME:Love-lace");
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

  it("omits empty fields in vCard output", () => {
    const minimalContact = {
      ...contact,
      namePrefix: "",
      phoneticFirstName: "",
      phoneticMiddleName: "",
      phoneticLastName: "",
      nickname: "",
      fileAs: "",
      organization: "",
      department: "",
      title: "",
      phone: "",
      website: "",
      notes: "",
      address: "",
      phones: [],
      websites: [],
      addresses: [],
      relatedPeople: [],
      significantDates: [],
      customFields: [],
      extractionSnapshot: {
        ...contact.extractionSnapshot!,
        namePrefix: "",
        phoneticFirstName: "",
        phoneticMiddleName: "",
        phoneticLastName: "",
        nickname: "",
        fileAs: "",
        organization: "",
        department: "",
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

    expect(buildContactVCard(minimalContact)).not.toContain("ORG:");
    expect(buildContactVCard(minimalContact)).not.toContain("TEL:");
  });

  it("builds a readable .vcf filename from reviewed contact metadata", () => {
    expect(buildVCardFileName(contact)).toBe(
      "Ada Lovelace - Analytical Engines.vcf",
    );
    expect(
      buildVCardFileName({
        ...contact,
        fullName: "",
        organization: "",
      }),
    ).toBe("contact.vcf");
  });

  it("downloads the vCard through a temporary object URL", () => {
    const clickMock = vi.fn();
    const appendMock = vi.spyOn(document.body, "append");
    const removeMock = vi.spyOn(HTMLAnchorElement.prototype, "remove");
    const createElementSpy = vi.spyOn(document, "createElement");

    createElementSpy.mockImplementation((tagName: string) => {
      const element = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tagName,
      );

      if (tagName === "a") {
        Object.defineProperty(element, "click", {
          value: clickMock,
          configurable: true,
        });
      }

      return element;
    });

    downloadContactVCard(contact);

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(appendMock).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(removeMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:card");
  });

  it("prefers the native share sheet when file sharing is supported", async () => {
    canShareMock.mockReturnValue(true);
    shareMock.mockResolvedValue(undefined);

    const result = await saveContactVCard(contact);

    expect(result).toBe("shared");
    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Ada Lovelace - Analytical Engines",
        files: [expect.any(File)],
      }),
    );
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:card");
  });

  it("falls back to download when file sharing is unavailable", async () => {
    canShareMock.mockReturnValue(false);
    const clickMock = vi.fn();
    const appendMock = vi.spyOn(document.body, "append");
    const removeMock = vi.spyOn(HTMLAnchorElement.prototype, "remove");
    const createElementSpy = vi.spyOn(document, "createElement");

    createElementSpy.mockImplementation((tagName: string) => {
      const element = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tagName,
      );

      if (tagName === "a") {
        Object.defineProperty(element, "click", {
          value: clickMock,
          configurable: true,
        });
      }

      return element;
    });

    const result = await saveContactVCard(contact);

    expect(result).toBe("downloaded");
    expect(shareMock).not.toHaveBeenCalled();
    expect(appendMock).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(removeMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:card");
  });

  it("falls back to download when sharing fails for non-cancel reasons", async () => {
    canShareMock.mockReturnValue(true);
    shareMock.mockRejectedValue(new Error("Share failed"));
    const clickMock = vi.fn();
    const createElementSpy = vi.spyOn(document, "createElement");

    createElementSpy.mockImplementation((tagName: string) => {
      const element = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tagName,
      );

      if (tagName === "a") {
        Object.defineProperty(element, "click", {
          value: clickMock,
          configurable: true,
        });
      }

      return element;
    });

    const result = await saveContactVCard(contact);

    expect(result).toBe("downloaded");
    expect(shareMock).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:card");
  });

  it("does not fall back to download when the user cancels sharing", async () => {
    canShareMock.mockReturnValue(true);
    shareMock.mockRejectedValue(new DOMException("Canceled", "AbortError"));
    const createElementSpy = vi.spyOn(document, "createElement");

    await expect(saveContactVCard(contact)).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(createElementSpy).not.toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:card");
  });
});
