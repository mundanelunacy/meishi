import type { VerifiedContact } from "../../shared/types/models";
import {
  buildPreservedNotes,
  buildPreservedXFields,
} from "../../shared/lib/contactFidelity";

const VCARD_MIME_TYPE = "text/vcard;charset=utf-8";

export type VCardExportResult = "shared" | "downloaded";

export function buildContactVCard(contact: VerifiedContact) {
  const notes = buildPreservedNotes(contact.notes, contact.customFields);
  const xFields = buildPreservedXFields(contact.customFields);

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    line("FN", contact.fullName),
    structuredLine("N", buildNameComponents(contact)),
    line("NICKNAME", contact.nickname),
    line("SORT-STRING", contact.fileAs),
    structuredLine("ORG", buildOrganizationComponents(contact)),
    line("TITLE", contact.title),
    line("X-PHONETIC-FIRST-NAME", contact.phoneticFirstName),
    line("X-PHONETIC-MIDDLE-NAME", contact.phoneticMiddleName),
    line("X-PHONETIC-LAST-NAME", contact.phoneticLastName),
    ...contact.emails.map((email) =>
      typedLine("EMAIL", email.value, email.type, email.label),
    ),
    ...contact.phones.map((phone) =>
      typedLine("TEL", phone.value, phone.type, phone.label),
    ),
    ...contact.websites.map((url) =>
      typedLine("URL", url.value, url.type, url.label),
    ),
    ...contact.addresses.map((address) =>
      typedLine("ADR", address.value, address.type, address.label),
    ),
    ...contact.relatedPeople.map((relation) =>
      typedLine("RELATED", relation.value, relation.type, relation.label),
    ),
    ...contact.significantDates.map((event) =>
      typedLine("X-SIGNIFICANT-DATE", event.value, event.type, event.label),
    ),
    line("NOTE", notes),
    ...xFields.map((field) => line(field.name, field.value)),
    "END:VCARD",
  ].filter(Boolean);

  return lines.join("\n");
}

export function buildVCardFileName(contact: VerifiedContact) {
  const baseName = [contact.fullName, contact.organization]
    .map((part) => sanitizeFileNamePart(part))
    .filter(Boolean)
    .join(" - ");

  return `${baseName || "contact"}.vcf`;
}

export function downloadContactVCard(contact: VerifiedContact) {
  const artifact = createVCardArtifact(contact);
  const anchor = document.createElement("a");

  anchor.href = artifact.url;
  anchor.download = artifact.fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(artifact.url);
}

export async function saveContactVCard(
  contact: VerifiedContact,
): Promise<VCardExportResult> {
  const artifact = createVCardArtifact(contact);

  try {
    if (await tryShareVCardArtifact(artifact)) {
      URL.revokeObjectURL(artifact.url);
      return "shared";
    }
  } catch (error) {
    if (isShareCancellationError(error)) {
      URL.revokeObjectURL(artifact.url);
      throw error;
    }
  }

  downloadArtifact(artifact);
  return "downloaded";
}

function line(key: string, value: string) {
  if (!value) {
    return "";
  }

  return `${key}:${escapeVCardValue(value)}`;
}

function structuredLine(key: string, values: string[]) {
  const hasAnyValue = values.some((value) => value.length > 0);
  if (!hasAnyValue) {
    return "";
  }

  return `${key}:${values.map(escapeVCardValue).join(";")}`;
}

function typedLine(key: string, value: string, type: string, label: string) {
  if (!value) {
    return "";
  }

  const params = [normalizeParam(type), normalizeParam(label)].filter(Boolean);
  const suffix = params.length ? `;TYPE=${params.join(",")}` : "";
  return `${key}${suffix}:${escapeVCardValue(value)}`;
}

function escapeVCardValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function normalizeParam(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildNameComponents(contact: VerifiedContact) {
  return [contact.lastName, contact.firstName, "", contact.namePrefix, ""];
}

function buildOrganizationComponents(contact: VerifiedContact) {
  return [contact.organization, contact.department];
}

function sanitizeFileNamePart(value: string) {
  const sanitizedCharacters = Array.from(value.trim(), (character) => {
    if (character <= "\u001f" || '<>:"/\\|?*'.includes(character)) {
      return " ";
    }

    return character;
  }).join("");

  return sanitizedCharacters.replace(/\s+/g, " ").trim();
}

function createVCardArtifact(contact: VerifiedContact) {
  const fileName = buildVCardFileName(contact);
  const blob = new Blob([buildContactVCard(contact)], { type: VCARD_MIME_TYPE });
  const file = new File([blob], fileName, {
    type: VCARD_MIME_TYPE,
    lastModified: Date.now(),
  });

  return {
    fileName,
    file,
    url: URL.createObjectURL(blob),
  };
}

async function tryShareVCardArtifact(artifact: {
  fileName: string;
  file: File;
}) {
  if (!("share" in navigator) || typeof navigator.share !== "function") {
    return false;
  }

  const shareData = {
    files: [artifact.file],
    title: artifact.fileName.replace(/\.vcf$/i, ""),
  };

  if ("canShare" in navigator && typeof navigator.canShare === "function") {
    const canShareFiles = navigator.canShare({ files: shareData.files });
    if (!canShareFiles) {
      return false;
    }
  }

  await navigator.share(shareData);
  return true;
}

function downloadArtifact(artifact: { fileName: string; url: string }) {
  const anchor = document.createElement("a");

  anchor.href = artifact.url;
  anchor.download = artifact.fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(artifact.url);
}

function isShareCancellationError(error: unknown) {
  return (
    error instanceof DOMException && error.name === "AbortError"
  );
}
