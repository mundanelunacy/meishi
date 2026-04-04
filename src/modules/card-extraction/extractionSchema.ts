import { z } from "zod";

export const businessCardExtractionSchema = z.object({
  fullName: z.string().default(""),
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  organization: z.string().default(""),
  title: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  website: z.string().default(""),
  notes: z.string().default(""),
  address: z.string().default(""),
  confidenceNotes: z.array(z.string()).default([]),
});

export type BusinessCardExtraction = z.infer<typeof businessCardExtractionSchema>;
