import type { CreateContactPayload } from "../../shared/types/google";
import type { VerifiedContact } from "../../shared/types/models";
import {
  buildPreservedNotes,
} from "../../shared/lib/contactFidelity";

export function buildContactPayload(contact: VerifiedContact): CreateContactPayload {
  const notes = buildPreservedNotes(contact.notes, contact.customFields);

  return {
    names: [
      {
        ...(contact.fullName ? { displayName: contact.fullName } : {}),
        ...(contact.namePrefix ? { honorificPrefix: contact.namePrefix } : {}),
        ...(contact.firstName ? { givenName: contact.firstName } : {}),
        ...(contact.lastName ? { familyName: contact.lastName } : {}),
        ...(contact.phoneticFirstName
          ? { phoneticGivenName: contact.phoneticFirstName }
          : {}),
        ...(contact.phoneticMiddleName
          ? { phoneticMiddleName: contact.phoneticMiddleName }
          : {}),
        ...(contact.phoneticLastName
          ? { phoneticFamilyName: contact.phoneticLastName }
          : {}),
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
      contact.organization || contact.department || contact.title
        ? [
            {
              ...(contact.organization ? { name: contact.organization } : {}),
              ...(contact.department ? { department: contact.department } : {}),
              ...(contact.title ? { title: contact.title } : {}),
            },
          ]
        : undefined,
    nicknames: contact.nickname
      ? [{ value: contact.nickname, type: "default" }]
      : undefined,
    fileAses: contact.fileAs ? [{ value: contact.fileAs }] : undefined,
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
