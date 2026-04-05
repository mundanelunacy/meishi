import type { CreateContactPayload } from "../../shared/types/google";
import type { VerifiedContact } from "../../shared/types/models";
import {
  buildPreservedNotes,
  buildPreservedXFields,
} from "../../shared/lib/contactFidelity";

export function buildContactPayload(contact: VerifiedContact): CreateContactPayload {
  const notes = buildPreservedNotes(contact.notes, contact.customFields);

  return {
    names: [
      {
        displayName: contact.fullName || undefined,
        givenName: contact.firstName || undefined,
        familyName: contact.lastName || undefined,
      },
    ],
    emailAddresses: contact.emails.length
      ? contact.emails.map((email) => ({
          value: email.value,
          type: email.type ? email.type.toLowerCase() : undefined,
        }))
      : undefined,
    phoneNumbers: contact.phones.length
      ? contact.phones.map((phone) => ({
          value: phone.value,
          type: phone.type ? phone.type.toLowerCase() : undefined,
        }))
      : undefined,
    organizations:
      contact.organization || contact.title
        ? [
            {
              name: contact.organization || undefined,
              title: contact.title || undefined,
            },
          ]
        : undefined,
    biographies: notes ? [{ value: notes }] : undefined,
    urls: contact.websites.length
      ? contact.websites.map((url) => ({
          value: url.value,
          type: url.type ? url.type.toLowerCase() : "work",
        }))
      : undefined,
    addresses: contact.addresses.length
      ? contact.addresses.map((address) => ({
          formattedValue: address.value,
          type: address.type ? address.type.toLowerCase() : undefined,
        }))
      : undefined,
    relations: contact.relatedPeople.length
      ? contact.relatedPeople.map((relation) => ({
          person: relation.value,
          type: relation.type ? relation.type.toLowerCase() : undefined,
        }))
      : undefined,
    events: contact.significantDates.length
      ? contact.significantDates.flatMap((event) => {
          const parsedDate = parseDateValue(event.value);
          if (!parsedDate) {
            return [];
          }

          return [
            {
              date: parsedDate,
              type: event.type ? event.type.toLowerCase() : undefined,
            },
          ];
        })
      : undefined,
    userDefined: contact.customFields.length
      ? contact.customFields.map((field) => ({
          key: field.key,
          value: field.value,
        }))
      : undefined,
  };
}

export function buildContactVCard(contact: VerifiedContact) {
  const notes = buildPreservedNotes(contact.notes, contact.customFields);
  const xFields = buildPreservedXFields(contact.customFields);

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    line("FN", contact.fullName),
    line("N", formatName(contact)),
    line("ORG", contact.organization),
    line("TITLE", contact.title),
    ...contact.emails.map((email) => typedLine("EMAIL", email.value, email.type, email.label)),
    ...contact.phones.map((phone) => typedLine("TEL", phone.value, phone.type, phone.label)),
    ...contact.websites.map((url) => typedLine("URL", url.value, url.type, url.label)),
    ...contact.addresses.map((address) => typedLine("ADR", address.value, address.type, address.label)),
    ...contact.relatedPeople.map((relation) =>
      typedLine("RELATED", relation.value, relation.type, relation.label)
    ),
    ...contact.significantDates.map((event) =>
      typedLine("X-SIGNIFICANT-DATE", event.value, event.type, event.label)
    ),
    line("NOTE", notes),
    ...xFields.map((field) => line(field.name, field.value)),
    "END:VCARD",
  ].filter(Boolean);

  return lines.join("\n");
}

function formatName(contact: VerifiedContact) {
  const hasAnyName = Boolean(contact.firstName || contact.lastName || contact.fullName);
  if (!hasAnyName) {
    return "";
  }

  return escapeVCardValue(`${contact.lastName};${contact.firstName};;;`);
}

function line(key: string, value: string) {
  if (!value) {
    return "";
  }

  return `${key}:${escapeVCardValue(value)}`;
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
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function normalizeParam(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseDateValue(value: string) {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}
