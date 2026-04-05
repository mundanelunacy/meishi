import type { ContactMethod, XField } from "../../modules/card-extraction/extractionSchema";
import type { CustomContactField } from "../types/contact";

export function buildPreservedNotes(
  baseNotes: string,
  customFields: CustomContactField[] | undefined
) {
  const lines = dedupeLines([
    ...splitLines(baseNotes),
    ...buildPreservationLines(customFields),
  ]);

  return lines.join("\n").trim();
}

export function mergePrimaryWithMethods(primaryValue: string, methods: ContactMethod[] | undefined) {
  const merged = dedupeContactMethods([
    primaryValue ? { value: primaryValue, type: "", label: "" } : null,
    ...(methods ?? []),
  ]);

  return merged.filter((item) => item.value.trim().length > 0);
}

export function buildPreservationLines(customFields: CustomContactField[] | undefined) {
  return (customFields ?? [])
    .filter((field) => field.key.trim().length > 0 && field.value.trim().length > 0)
    .map((field) => `${sanitizeXFieldName(field.key)}: ${field.value.trim()}`);
}

export function buildPreservedXFields(customFields: CustomContactField[] | undefined) {
  return (customFields ?? [])
    .filter((field) => field.key.trim().length > 0 && field.value.trim().length > 0)
    .map((field) => ({
      name: sanitizeXFieldName(field.key),
      value: field.value.trim(),
    }));
}

function dedupeContactMethods(values: Array<ContactMethod | null>) {
  const seen = new Map<string, ContactMethod>();

  values.forEach((value) => {
    if (!value) {
      return;
    }

    const normalized = normalizeMethod(value);
    if (!normalized.value) {
      return;
    }

    const key = normalized.value.toLowerCase();
    const existing = seen.get(key);
    if (existing) {
      seen.set(key, {
        value: existing.value,
        type: existing.type || normalized.type,
        label: existing.label || normalized.label,
      });
      return;
    }

    seen.set(key, normalized);
  });

  return [...seen.values()];
}

function normalizeMethod(value: ContactMethod): ContactMethod {
  return {
    value: value.value.trim(),
    type: value.type.trim(),
    label: value.label.trim(),
  };
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function dedupeLines(lines: string[]) {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const key = line.trim();
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sanitizeXFieldName(name: string) {
  const raw = name.trim().toUpperCase().replace(/^X-/, "");
  const sanitized = raw.replace(/[^A-Z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `X-${sanitized || "MEISHI-FIELD"}`;
}

export function hasPreservedFidelityData(customFields: CustomContactField[] | undefined) {
  return Boolean((customFields ?? []).length);
}

export type PreservedXField = XField;

export function customFieldsFromExtractionXFields(
  xFields: XField[] | undefined,
  ambiguousText: string[] | undefined
): CustomContactField[] {
  return [
    ...(xFields ?? []).map((field) => ({
      key: sanitizeXFieldName(field.name),
      value: field.value.trim(),
    })),
    ...(ambiguousText ?? [])
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => ({
        key: "X-AMBIGUOUS-TEXT",
        value,
      })),
  ].filter((field) => field.key.trim().length > 0 && field.value.trim().length > 0);
}
