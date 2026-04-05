import { z } from "zod";

export const contactMethodSchema = z.object({
  value: z.string().default(""),
  type: z.string().default(""),
  label: z.string().default(""),
});

export const xFieldSchema = z.object({
  name: z.string().default(""),
  value: z.string().default(""),
});

export const businessCardExtractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    fullName: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    organization: { type: "string" },
    title: { type: "string" },
    email: { type: "string" },
    emails: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          value: { type: "string" },
          type: { type: "string" },
          label: { type: "string" },
        },
        required: ["value", "type", "label"],
      },
    },
    phone: { type: "string" },
    phones: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          value: { type: "string" },
          type: { type: "string" },
          label: { type: "string" },
        },
        required: ["value", "type", "label"],
      },
    },
    website: { type: "string" },
    urls: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          value: { type: "string" },
          type: { type: "string" },
          label: { type: "string" },
        },
        required: ["value", "type", "label"],
      },
    },
    notes: { type: "string" },
    address: { type: "string" },
    addresses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          value: { type: "string" },
          type: { type: "string" },
          label: { type: "string" },
        },
        required: ["value", "type", "label"],
      },
    },
    relations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          value: { type: "string" },
          type: { type: "string" },
          label: { type: "string" },
        },
        required: ["value", "type", "label"],
      },
    },
    events: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          value: { type: "string" },
          type: { type: "string" },
          label: { type: "string" },
        },
        required: ["value", "type", "label"],
      },
    },
    xFields: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          value: { type: "string" },
        },
        required: ["name", "value"],
      },
    },
    ambiguousText: {
      type: "array",
      items: { type: "string" },
    },
    confidenceNotes: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "fullName",
    "firstName",
    "lastName",
    "organization",
    "title",
    "email",
    "emails",
    "phone",
    "phones",
    "website",
    "urls",
    "notes",
    "address",
    "addresses",
    "relations",
    "events",
    "xFields",
    "ambiguousText",
    "confidenceNotes",
  ],
} as const;

export const businessCardExtractionSchema = z.object({
  fullName: z.string().default(""),
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  organization: z.string().default(""),
  title: z.string().default(""),
  email: z.string().default(""),
  emails: z.array(contactMethodSchema).default([]),
  phone: z.string().default(""),
  phones: z.array(contactMethodSchema).default([]),
  website: z.string().default(""),
  urls: z.array(contactMethodSchema).default([]),
  notes: z.string().default(""),
  address: z.string().default(""),
  addresses: z.array(contactMethodSchema).default([]),
  relations: z.array(contactMethodSchema).default([]),
  events: z.array(contactMethodSchema).default([]),
  xFields: z.array(xFieldSchema).default([]),
  ambiguousText: z.array(z.string()).default([]),
  confidenceNotes: z.array(z.string()).default([]),
});

export type BusinessCardExtraction = z.infer<typeof businessCardExtractionSchema>;
export type ContactMethod = z.infer<typeof contactMethodSchema>;
export type XField = z.infer<typeof xFieldSchema>;
