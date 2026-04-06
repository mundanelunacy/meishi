import { useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useFieldArray,
  useForm,
  type DeepPartial,
  type FieldArrayWithId,
  type UseFormRegister,
} from "react-hook-form";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { isDebugQueryEnabled } from "../../app/debug";
import type {
  CapturedCardImage,
  ContactDraft,
  CustomContactField,
  MultiValueContactField,
  RelatedPersonField,
  SignificantDateField,
} from "../../shared/types/models";
import { Button } from "../../shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shared/ui/card";
import { Input } from "../../shared/ui/input";
import { Label } from "../../shared/ui/label";
import { Textarea } from "../../shared/ui/textarea";
import { Badge } from "../../shared/ui/badge";
import { Alert } from "../../shared/ui/alert";
import {
  finalizeDraft,
  selectCapturedImages,
  selectDraft,
  restoreDraft,
  updateDraft,
} from "./reviewDraftSlice";
import {
  loadCapturedImages,
  loadLatestDraft,
  saveDraft,
} from "../local-data";
import {
  buildContactPayload,
  useSyncGoogleContact,
} from "../google-contacts";
import { buildContactVCard, saveContactVCard } from "../vcard-export";
import { pushToast } from "../../shared/ui/toastBus";
import { buildPreservedNotes } from "../../shared/lib/contactFidelity";

const multiValueFieldSchema = z.object({
  value: z.string(),
  type: z.string(),
  label: z.string(),
});

const customFieldSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const reviewSchema = z.object({
  fullName: z.string(),
  namePrefix: z.string(),
  firstName: z.string(),
  phoneticFirstName: z.string(),
  phoneticMiddleName: z.string(),
  phoneticLastName: z.string(),
  lastName: z.string(),
  nickname: z.string(),
  fileAs: z.string(),
  organization: z.string(),
  department: z.string(),
  title: z.string(),
  notes: z.string(),
  emails: z.array(multiValueFieldSchema),
  phones: z.array(multiValueFieldSchema),
  websites: z.array(multiValueFieldSchema),
  addresses: z.array(multiValueFieldSchema),
  relatedPeople: z.array(multiValueFieldSchema),
  significantDates: z.array(multiValueFieldSchema),
  customFields: z.array(customFieldSchema),
  selectedPhotoImageId: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;
type RepeatableFieldName =
  | "emails"
  | "phones"
  | "websites"
  | "addresses"
  | "relatedPeople"
  | "significantDates";

const AUTOSAVE_DELAY_MS = 400;

function emptyMultiValueField(): MultiValueContactField {
  return { value: "", type: "", label: "" };
}

function emptyRelatedPerson(): RelatedPersonField {
  return { value: "", type: "", label: "" };
}

function emptySignificantDate(): SignificantDateField {
  return { value: "", type: "", label: "" };
}

function emptyCustomField(): CustomContactField {
  return { key: "", value: "" };
}

function normalizeMultiValueFields(
  fields: MultiValueContactField[] | undefined,
  fallbackValue = "",
): MultiValueContactField[] {
  const sanitized = (fields ?? []).filter(
    (field) =>
      field.value.trim().length > 0 ||
      field.type.trim().length > 0 ||
      field.label.trim().length > 0,
  );

  if (sanitized.length > 0) {
    return sanitized;
  }

  return fallbackValue ? [{ value: fallbackValue, type: "", label: "" }] : [];
}

function normalizeCustomFields(fields: CustomContactField[] | undefined) {
  return (fields ?? []).filter(
    (field) => field.key.trim().length > 0 || field.value.trim().length > 0,
  );
}

function buildFormValues(
  draft: ContactDraft | null,
  images: CapturedCardImage[],
): ReviewFormValues {
  return {
    fullName: draft?.fullName ?? "",
    namePrefix: draft?.namePrefix ?? "",
    firstName: draft?.firstName ?? "",
    phoneticFirstName: draft?.phoneticFirstName ?? "",
    phoneticMiddleName: draft?.phoneticMiddleName ?? "",
    phoneticLastName: draft?.phoneticLastName ?? "",
    lastName: draft?.lastName ?? "",
    nickname: draft?.nickname ?? "",
    fileAs: draft?.fileAs ?? "",
    organization: draft?.organization ?? "",
    department: draft?.department ?? "",
    title: draft?.title ?? "",
    notes: draft?.notes ?? "",
    emails: normalizeMultiValueFields(draft?.emails, draft?.email ?? ""),
    phones: normalizeMultiValueFields(draft?.phones, draft?.phone ?? ""),
    websites: normalizeMultiValueFields(draft?.websites, draft?.website ?? ""),
    addresses: normalizeMultiValueFields(
      draft?.addresses,
      draft?.address ?? "",
    ),
    relatedPeople: draft?.relatedPeople ?? [],
    significantDates: draft?.significantDates ?? [],
    customFields: normalizeCustomFields(draft?.customFields),
    selectedPhotoImageId: images[0]?.id,
  };
}

function normalizeWatchedMultiValueFields(
  fields: Array<Partial<MultiValueContactField> | undefined> | undefined,
): MultiValueContactField[] {
  return (fields ?? []).map((field) => ({
    value: field?.value ?? "",
    type: field?.type ?? "",
    label: field?.label ?? "",
  }));
}

function normalizeWatchedCustomFields(
  fields: Array<Partial<CustomContactField> | undefined> | undefined,
): CustomContactField[] {
  return (fields ?? []).map((field) => ({
    key: field?.key ?? "",
    value: field?.value ?? "",
  }));
}

function normalizeWatchedValues(
  values: DeepPartial<ReviewFormValues>,
): ReviewFormValues {
  return {
    fullName: values.fullName ?? "",
    namePrefix: values.namePrefix ?? "",
    firstName: values.firstName ?? "",
    phoneticFirstName: values.phoneticFirstName ?? "",
    phoneticMiddleName: values.phoneticMiddleName ?? "",
    phoneticLastName: values.phoneticLastName ?? "",
    lastName: values.lastName ?? "",
    nickname: values.nickname ?? "",
    fileAs: values.fileAs ?? "",
    organization: values.organization ?? "",
    department: values.department ?? "",
    title: values.title ?? "",
    notes: values.notes ?? "",
    emails: normalizeWatchedMultiValueFields(values.emails),
    phones: normalizeWatchedMultiValueFields(values.phones),
    websites: normalizeWatchedMultiValueFields(values.websites),
    addresses: normalizeWatchedMultiValueFields(values.addresses),
    relatedPeople: normalizeWatchedMultiValueFields(
      values.relatedPeople,
    ) as RelatedPersonField[],
    significantDates: normalizeWatchedMultiValueFields(
      values.significantDates,
    ) as SignificantDateField[],
    customFields: normalizeWatchedCustomFields(values.customFields),
    selectedPhotoImageId: values.selectedPhotoImageId,
  };
}

function sanitizeMultiValueFields(fields: MultiValueContactField[]) {
  return fields
    .map((field) => ({
      value: field.value.trim(),
      type: field.type.trim(),
      label: field.label.trim(),
    }))
    .filter((field) => field.value.length > 0);
}

function sanitizeCustomFields(fields: CustomContactField[]) {
  return fields
    .map((field) => ({
      key: field.key.trim(),
      value: field.value.trim(),
    }))
    .filter((field) => field.key.length > 0 && field.value.length > 0);
}

function getDraftFields(values: ReviewFormValues) {
  const emails = sanitizeMultiValueFields(values.emails);
  const phones = sanitizeMultiValueFields(values.phones);
  const websites = sanitizeMultiValueFields(values.websites);
  const addresses = sanitizeMultiValueFields(values.addresses);
  const relatedPeople = sanitizeMultiValueFields(
    values.relatedPeople,
  ) as RelatedPersonField[];
  const significantDates = sanitizeMultiValueFields(
    values.significantDates,
  ) as SignificantDateField[];
  const customFields = sanitizeCustomFields(values.customFields);

  return {
    fullName: values.fullName,
    namePrefix: values.namePrefix,
    firstName: values.firstName,
    phoneticFirstName: values.phoneticFirstName,
    phoneticMiddleName: values.phoneticMiddleName,
    phoneticLastName: values.phoneticLastName,
    lastName: values.lastName,
    nickname: values.nickname,
    fileAs: values.fileAs,
    organization: values.organization,
    department: values.department,
    title: values.title,
    email: emails[0]?.value ?? "",
    phone: phones[0]?.value ?? "",
    website: websites[0]?.value ?? "",
    address: addresses[0]?.value ?? "",
    notes: buildPreservedNotes(values.notes, customFields),
    emails,
    phones,
    websites,
    addresses,
    relatedPeople,
    significantDates,
    customFields,
  } satisfies Pick<
    ContactDraft,
    | "fullName"
    | "namePrefix"
    | "firstName"
    | "phoneticFirstName"
    | "phoneticMiddleName"
    | "phoneticLastName"
    | "lastName"
    | "nickname"
    | "fileAs"
    | "organization"
    | "department"
    | "title"
    | "email"
    | "phone"
    | "website"
    | "address"
    | "notes"
    | "emails"
    | "phones"
    | "websites"
    | "addresses"
    | "relatedPeople"
    | "significantDates"
    | "customFields"
  >;
}

export function ReviewWorkspace() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const draft = useAppSelector(selectDraft);
  const images = useAppSelector(selectCapturedImages);
  const debugQueryEnabled = isDebugQueryEnabled();
  const { syncContact, isSyncing, errorMessage } = useSyncGoogleContact();
  const autosaveTimeoutRef = useRef<number | null>(null);
  const hydratedDraftSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (draft || images.length) {
      return;
    }

    void Promise.all([loadCapturedImages(), loadLatestDraft()]).then(
      ([storedImages, storedDraft]) => {
        if (storedImages.length || storedDraft) {
          dispatch(
            restoreDraft({ images: storedImages, draft: storedDraft ?? null }),
          );
        }
      },
    );
  }, [dispatch, draft, images.length]);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    values: buildFormValues(draft, images),
  });

  const emailsFieldArray = useFieldArray({
    control: form.control,
    name: "emails",
  });
  const phonesFieldArray = useFieldArray({
    control: form.control,
    name: "phones",
  });
  const websitesFieldArray = useFieldArray({
    control: form.control,
    name: "websites",
  });
  const addressesFieldArray = useFieldArray({
    control: form.control,
    name: "addresses",
  });
  const relatedPeopleFieldArray = useFieldArray({
    control: form.control,
    name: "relatedPeople",
  });
  const significantDatesFieldArray = useFieldArray({
    control: form.control,
    name: "significantDates",
  });
  const customFieldsFieldArray = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  useEffect(() => {
    if (!draft) {
      return;
    }

    const nextSignature = `${draft.id}:${images.map((image) => image.id).join(",")}`;
    if (hydratedDraftSignatureRef.current === nextSignature) {
      return;
    }

    hydratedDraftSignatureRef.current = nextSignature;
    form.reset(buildFormValues(draft, images));
  }, [draft, form, images]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    const activeDraft = draft;

    const subscription = form.watch((values) => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = window.setTimeout(() => {
        const normalizedValues = normalizeWatchedValues(values);
        const draftFields = getDraftFields(normalizedValues);

        dispatch(updateDraft(draftFields));
        void saveDraft({
          ...activeDraft,
          ...draftFields,
          sourceImageIds: activeDraft.sourceImageIds,
          confidenceNotes: activeDraft.confidenceNotes,
          extractionSnapshot: activeDraft.extractionSnapshot,
          updatedAt: new Date().toISOString(),
        });
      }, AUTOSAVE_DELAY_MS);
    });

    return () => {
      subscription.unsubscribe();
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [dispatch, draft, form]);

  const currentValues = normalizeWatchedValues(form.watch());

  if (!draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No draft available</CardTitle>
          <CardDescription>
            Capture at least one business-card image and run extraction before
            opening the review screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate({ to: "/capture" })}>
            Go to capture
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeDraft = draft;

  async function onSubmit(values: ReviewFormValues) {
    const draftFields = getDraftFields(values);
    dispatch(updateDraft(draftFields));
    await saveDraft({
      ...activeDraft,
      ...draftFields,
      sourceImageIds: activeDraft.sourceImageIds,
      confidenceNotes: activeDraft.confidenceNotes,
      extractionSnapshot: activeDraft.extractionSnapshot,
      updatedAt: new Date().toISOString(),
    });
    dispatch(
      finalizeDraft({ selectedPhotoImageId: values.selectedPhotoImageId }),
    );
    const verifiedContact = buildVerifiedContact(activeDraft, values);

    try {
      const result = await syncContact({
        contact: verifiedContact,
        images,
      });

      pushToast(
        result.warningMessage ??
          "Verified contact synced to Google Contacts.",
      );
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Unable to create Google contact.",
      );
    }
  }

  async function handleSaveVCard() {
    const values = form.getValues();
    const draftFields = getDraftFields(values);
    const updatedDraft = {
      ...activeDraft,
      ...draftFields,
      sourceImageIds: activeDraft.sourceImageIds,
      confidenceNotes: activeDraft.confidenceNotes,
      extractionSnapshot: activeDraft.extractionSnapshot,
      updatedAt: new Date().toISOString(),
    };

    dispatch(updateDraft(draftFields));
    await saveDraft(updatedDraft);
    dispatch(
      finalizeDraft({ selectedPhotoImageId: values.selectedPhotoImageId }),
    );
    try {
      const exportResult = await saveContactVCard(
        buildVerifiedContact(updatedDraft, values),
      );
      pushToast(
        exportResult === "shared"
          ? "vCard opened in the share sheet."
          : "vCard downloaded to your device.",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      pushToast(
        error instanceof Error ? error.message : "Unable to save vCard.",
      );
    }
  }

  return (
    <form
      className="grid min-h-[70vh] gap-6 xl:grid-cols-[1.05fr_0.95fr]"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Source images</CardTitle>
          <CardDescription>
            Keep the visual reference visible while you edit the extracted
            fields. One image can be chosen as the Google contact photo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-4">
          {images.map((image) => (
            <label
              key={image.id}
              className={`block min-w-0 max-w-full overflow-hidden rounded-[28px] border ${
                form.watch("selectedPhotoImageId") === image.id
                  ? "border-primary"
                  : "border-border/70"
              }`}
            >
              <div className="flex h-[min(70vh,100vw)] min-w-0 max-w-full items-center justify-center overflow-hidden bg-muted/20">
                <img
                  src={image.dataUrl}
                  alt={image.fileName}
                  className="block max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{image.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    Local capture only unless selected as contact photo.
                  </p>
                </div>
                <input
                  type="radio"
                  value={image.id}
                  checked={form.watch("selectedPhotoImageId") === image.id}
                  onChange={() =>
                    form.setValue("selectedPhotoImageId", image.id)
                  }
                />
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <CardTitle>Verify extracted contact</CardTitle>
          <CardDescription>
            Edit anything the model got wrong before syncing. The review form
            expands to show extracted contact collections and lets you add more
            values like Google Contacts does.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {draft.confidenceNotes.length ? (
            <div className="flex flex-wrap gap-2">
              {draft.confidenceNotes.map((note) => (
                <Badge key={note}>{note}</Badge>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="review-full-name">
              <Input id="review-full-name" {...form.register("fullName")} />
            </Field>
            <Field label="Name prefix" htmlFor="review-name-prefix">
              <Input id="review-name-prefix" {...form.register("namePrefix")} />
            </Field>
            <Field label="Title" htmlFor="review-title">
              <Input id="review-title" {...form.register("title")} />
            </Field>
            <Field label="First name" htmlFor="review-first-name">
              <Input id="review-first-name" {...form.register("firstName")} />
            </Field>
            <Field label="Last name" htmlFor="review-last-name">
              <Input id="review-last-name" {...form.register("lastName")} />
            </Field>
            <Field
              label="Phonetic first"
              htmlFor="review-phonetic-first-name"
            >
              <Input
                id="review-phonetic-first-name"
                {...form.register("phoneticFirstName")}
              />
            </Field>
            <Field
              label="Phonetic middle"
              htmlFor="review-phonetic-middle-name"
            >
              <Input
                id="review-phonetic-middle-name"
                {...form.register("phoneticMiddleName")}
              />
            </Field>
            <Field label="Phonetic last" htmlFor="review-phonetic-last-name">
              <Input
                id="review-phonetic-last-name"
                {...form.register("phoneticLastName")}
              />
            </Field>
            <Field label="Nickname" htmlFor="review-nickname">
              <Input id="review-nickname" {...form.register("nickname")} />
            </Field>
            <Field label="File as" htmlFor="review-file-as">
              <Input id="review-file-as" {...form.register("fileAs")} />
            </Field>
            <Field
              label="Organization"
              htmlFor="review-organization"
              className="sm:col-span-2"
            >
              <Input
                id="review-organization"
                {...form.register("organization")}
              />
            </Field>
            <Field label="Department" htmlFor="review-department">
              <Input
                id="review-department"
                {...form.register("department")}
              />
            </Field>
          </div>

          <RepeatableFieldSection
            title="Email addresses"
            description="All extracted and manually added email addresses are editable here."
            addLabel="Add email"
            fieldArray={emailsFieldArray}
            register={form.register}
            name="emails"
            legend="Email"
          />

          <RepeatableFieldSection
            title="Phone numbers"
            description="Store multiple direct, mobile, or office numbers."
            addLabel="Add phone number"
            fieldArray={phonesFieldArray}
            register={form.register}
            name="phones"
            legend="Phone"
          />

          <RepeatableFieldSection
            title="Addresses"
            description="Use one card line per address, with optional type and label."
            addLabel="Add address"
            fieldArray={addressesFieldArray}
            register={form.register}
            name="addresses"
            legend="Address"
            multiline
          />

          <RepeatableFieldSection
            title="Websites"
            description="Support multiple URLs such as company site, profile, or booking link."
            addLabel="Add website"
            fieldArray={websitesFieldArray}
            register={form.register}
            name="websites"
            legend="Website"
          />

          <RepeatableFieldSection
            title="Related people"
            description="Model assistant, manager, spouse, or other related contacts."
            addLabel="Add related person"
            fieldArray={relatedPeopleFieldArray}
            register={form.register}
            name="relatedPeople"
            legend="Related person"
          />

          <RepeatableFieldSection
            title="Significant dates"
            description="Modeled after the Google Contacts edit view. Enter ISO dates for sync to Google; other text still remains in local notes/custom fields."
            addLabel="Add significant date"
            fieldArray={significantDatesFieldArray}
            register={form.register}
            name="significantDates"
            legend="Significant date"
            valueInputType="date"
          />

          <CustomFieldSection
            fieldArray={customFieldsFieldArray}
            register={form.register}
          />

          <Field className="sm:col-span-2" label="Notes" htmlFor="review-notes">
            <Textarea
              id="review-notes"
              {...form.register("notes")}
              className="min-h-[120px]"
            />
          </Field>

          {errorMessage ? (
            <Alert className="border-destructive/30 text-destructive">
              {errorMessage}
            </Alert>
          ) : null}

          {debugQueryEnabled ? (
            <DebugPanel
              draft={draft}
              images={images}
              values={{
                fullName: currentValues.fullName ?? "",
                namePrefix: currentValues.namePrefix ?? "",
                firstName: currentValues.firstName ?? "",
                phoneticFirstName: currentValues.phoneticFirstName ?? "",
                phoneticMiddleName: currentValues.phoneticMiddleName ?? "",
                phoneticLastName: currentValues.phoneticLastName ?? "",
                lastName: currentValues.lastName ?? "",
                nickname: currentValues.nickname ?? "",
                fileAs: currentValues.fileAs ?? "",
                organization: currentValues.organization ?? "",
                department: currentValues.department ?? "",
                title: currentValues.title ?? "",
                notes: currentValues.notes ?? "",
                emails: currentValues.emails ?? [],
                phones: currentValues.phones ?? [],
                websites: currentValues.websites ?? [],
                addresses: currentValues.addresses ?? [],
                relatedPeople: currentValues.relatedPeople ?? [],
                significantDates: currentValues.significantDates ?? [],
                customFields: currentValues.customFields ?? [],
                selectedPhotoImageId: currentValues.selectedPhotoImageId,
              }}
            />
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleSaveVCard();
              }}
            >
              Save vCard
            </Button>
            <Button
              size="lg"
              type="submit"
              disabled={isSyncing}
            >
              {isSyncing
                ? "Syncing..."
                : "Save to Google Contacts"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/capture" })}
            >
              Back to capture
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-2 block">
        {label}
      </Label>
      {children}
    </div>
  );
}

function RepeatableFieldSection({
  title,
  description,
  addLabel,
  fieldArray,
  register,
  name,
  legend,
  multiline = false,
  valueInputType = "text",
}: {
  title: string;
  description: string;
  addLabel: string;
  fieldArray: {
    fields: FieldArrayWithId<ReviewFormValues, RepeatableFieldName, "id">[];
    append(
      value: MultiValueContactField | RelatedPersonField | SignificantDateField,
    ): void;
    remove(index: number): void;
  };
  register: UseFormRegister<ReviewFormValues>;
  name: RepeatableFieldName;
  legend: string;
  multiline?: boolean;
  valueInputType?: "text" | "date";
}) {
  return (
    <section className="space-y-3 rounded-[24px] border border-border/70 bg-muted/25 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            fieldArray.append(
              name === "relatedPeople"
                ? emptyRelatedPerson()
                : name === "significantDates"
                  ? emptySignificantDate()
                  : emptyMultiValueField(),
            )
          }
        >
          {addLabel}
        </Button>
      </div>

      {fieldArray.fields.length ? (
        <div className="space-y-3">
          {fieldArray.fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-[20px] border border-border/70 bg-background/80 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {legend} {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fieldArray.remove(index)}
                >
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <Field label="Value" htmlFor={`${name}-${index}-value`}>
                  {multiline ? (
                    <Textarea
                      id={`${name}-${index}-value`}
                      className="min-h-[96px]"
                      {...register(`${name}.${index}.value` as const)}
                    />
                  ) : (
                    <Input
                      id={`${name}-${index}-value`}
                      type={valueInputType}
                      {...register(`${name}.${index}.value` as const)}
                    />
                  )}
                </Field>
                <Field label="Type" htmlFor={`${name}-${index}-type`}>
                  <Input
                    id={`${name}-${index}-type`}
                    {...register(`${name}.${index}.type` as const)}
                  />
                </Field>
                <Field label="Label" htmlFor={`${name}-${index}-label`}>
                  <Input
                    id={`${name}-${index}-label`}
                    {...register(`${name}.${index}.label` as const)}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Alert>No {title.toLowerCase()} yet.</Alert>
      )}
    </section>
  );
}

function CustomFieldSection({
  fieldArray,
  register,
}: {
  fieldArray: {
    fields: FieldArrayWithId<ReviewFormValues, "customFields", "id">[];
    append(value: CustomContactField): void;
    remove(index: number): void;
  };
  register: UseFormRegister<ReviewFormValues>;
}) {
  return (
    <section className="space-y-3 rounded-[24px] border border-border/70 bg-muted/25 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-medium text-foreground">Custom fields</p>
          <p className="text-sm text-muted-foreground">
            Use this for non-standard card data or anything you want preserved
            as a custom/X- field.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fieldArray.append(emptyCustomField())}
        >
          Add custom field
        </Button>
      </div>

      {fieldArray.fields.length ? (
        <div className="space-y-3">
          {fieldArray.fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-[20px] border border-border/70 bg-background/80 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  Custom field {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fieldArray.remove(index)}
                >
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                <Field label="Key" htmlFor={`custom-fields-${index}-key`}>
                  <Input
                    id={`custom-fields-${index}-key`}
                    {...register(`customFields.${index}.key` as const)}
                  />
                </Field>
                <Field label="Value" htmlFor={`custom-fields-${index}-value`}>
                  <Input
                    id={`custom-fields-${index}-value`}
                    {...register(`customFields.${index}.value` as const)}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Alert>No custom fields yet.</Alert>
      )}
    </section>
  );
}

function DebugPanel({
  draft,
  images,
  values,
}: {
  draft: ContactDraft;
  images: CapturedCardImage[];
  values: ReviewFormValues;
}) {
  const previewContact = {
    ...draft,
    ...getDraftFields(values),
    selectedPhotoImageId: values.selectedPhotoImageId,
    verifiedAt: draft.updatedAt,
  };
  const selectedPhoto = images.find(
    (image) => image.id === values.selectedPhotoImageId,
  );

  return (
    <details
      className="rounded-[24px] border border-border/70 bg-muted/35 p-4"
      open
    >
      <summary className="cursor-pointer text-sm font-medium text-foreground">
        Developer debug preview
      </summary>
      <div className="mt-4 space-y-4">
        <DebugBlock
          title="Raw extraction snapshot"
          body={
            draft.extractionSnapshot
              ? JSON.stringify(draft.extractionSnapshot, null, 2)
              : "No extraction snapshot is available for this draft."
          }
        />
        <DebugBlock
          title="Derived vCard"
          body={buildContactVCard(previewContact)}
        />
        <DebugBlock
          title="Derived Google createContact payload"
          body={JSON.stringify(buildContactPayload(previewContact), null, 2)}
        />
        <DebugBlock
          title="Selected photo metadata"
          body={JSON.stringify(
            selectedPhoto
              ? {
                  id: selectedPhoto.id,
                  fileName: selectedPhoto.fileName,
                  mimeType: selectedPhoto.mimeType,
                  width: selectedPhoto.width,
                  height: selectedPhoto.height,
                }
              : {
                  selectedPhotoImageId: values.selectedPhotoImageId ?? null,
                  note: "No image is currently selected.",
                },
            null,
            2,
          )}
        />
      </div>
    </details>
  );
}

function buildVerifiedContact(draft: ContactDraft, values: ReviewFormValues) {
  return {
    ...draft,
    ...getDraftFields(values),
    selectedPhotoImageId: values.selectedPhotoImageId,
    verifiedAt: new Date().toISOString(),
  } satisfies ContactDraft & {
    selectedPhotoImageId?: string;
    verifiedAt: string;
  };
}

function DebugBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <pre className="overflow-x-auto rounded-2xl bg-background/90 p-4 text-xs leading-6 text-foreground">
        <code>{body}</code>
      </pre>
    </div>
  );
}
