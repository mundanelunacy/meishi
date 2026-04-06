import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  Eraser,
  FileText,
  Link2,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Rows3,
  Upload,
  UserRound,
  UsersRound,
  UserRoundPlus,
} from "lucide-react";
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
import { Spinner } from "../../shared/ui/spinner";
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
import { Photoroll } from "../../shared/ui/photoroll";
import {
  finalizeDraft,
  selectCapturedImages,
  selectDraft,
  restoreDraft,
  updateDraft,
} from "./reviewDraftSlice";
import { loadCapturedImages, loadLatestDraft, saveDraft } from "../local-data";
import { buildContactPayload, useSyncGoogleContact } from "../google-contacts";
import { buildContactVCard, saveContactVCard } from "../vcard-export";
import { pushToast } from "../../shared/ui/toastBus";
import { buildPreservedNotes } from "../../shared/lib/contactFidelity";
import { connectGoogleContacts } from "../google-auth/googleIdentity";
import {
  selectGoogleAuth,
  setGoogleAuthState,
} from "../onboarding-settings/onboardingSlice";

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

function hasText(value: string | undefined) {
  return (value ?? "").trim().length > 0;
}

function hasFieldValues(
  fields:
    | MultiValueContactField[]
    | RelatedPersonField[]
    | SignificantDateField[]
    | CustomContactField[],
) {
  return fields.some((field) =>
    Object.values(field).some(
      (value) => typeof value === "string" && value.trim().length > 0,
    ),
  );
}

function shouldExpandOptionalFields(values: ReviewFormValues) {
  return (
    hasText(values.namePrefix) ||
    hasText(values.nickname) ||
    hasText(values.phoneticMiddleName) ||
    hasFieldValues(values.relatedPeople) ||
    hasFieldValues(values.significantDates)
  );
}

function hasReviewData(values: ReviewFormValues) {
  return (
    hasText(values.fullName) ||
    hasText(values.namePrefix) ||
    hasText(values.firstName) ||
    hasText(values.phoneticFirstName) ||
    hasText(values.phoneticMiddleName) ||
    hasText(values.phoneticLastName) ||
    hasText(values.lastName) ||
    hasText(values.nickname) ||
    hasText(values.fileAs) ||
    hasText(values.organization) ||
    hasText(values.department) ||
    hasText(values.title) ||
    hasText(values.notes) ||
    hasFieldValues(values.emails) ||
    hasFieldValues(values.phones) ||
    hasFieldValues(values.websites) ||
    hasFieldValues(values.addresses) ||
    hasFieldValues(values.relatedPeople) ||
    hasFieldValues(values.significantDates) ||
    hasFieldValues(values.customFields)
  );
}

function buildEmptyFormValues(): ReviewFormValues {
  return {
    fullName: "",
    namePrefix: "",
    firstName: "",
    phoneticFirstName: "",
    phoneticMiddleName: "",
    phoneticLastName: "",
    lastName: "",
    nickname: "",
    fileAs: "",
    organization: "",
    department: "",
    title: "",
    notes: "",
    emails: [],
    phones: [],
    websites: [],
    addresses: [],
    relatedPeople: [],
    significantDates: [],
    customFields: [],
    selectedPhotoImageId: undefined,
  };
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
  const googleAuth = useAppSelector(selectGoogleAuth);
  const debugQueryEnabled = isDebugQueryEnabled();
  const { syncContact, isSyncing, errorMessage } = useSyncGoogleContact();
  const autosaveTimeoutRef = useRef<number | null>(null);
  const hydratedDraftSignatureRef = useRef<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [showMoreFields, setShowMoreFields] = useState(false);

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
    defaultValues: buildFormValues(draft, images),
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
    const nextValues = buildFormValues(draft, images);
    form.reset(nextValues);
    setShowMoreFields(shouldExpandOptionalFields(nextValues));
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
  const selectedPhotoImageId = form.watch("selectedPhotoImageId");
  const hasAnyReviewData = hasReviewData(currentValues);

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
      if (googleAuth.status !== "connected") {
        setIsAuthorizing(true);
        dispatch(setGoogleAuthState({ ...googleAuth, status: "connecting" }));

        try {
          const nextAuthState = await connectGoogleContacts();
          dispatch(setGoogleAuthState(nextAuthState));
        } catch (error) {
          dispatch(
            setGoogleAuthState({
              ...googleAuth,
              status: googleAuth.connectedAt ? "connected" : "signed_out",
            }),
          );
          throw error;
        } finally {
          setIsAuthorizing(false);
        }
      }

      const result = await syncContact({
        contact: verifiedContact,
        images,
      });

      pushToast(
        result.warningMessage ?? "Verified contact synced to Google Contacts.",
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

  async function handleResetReview() {
    if (!draft) {
      return;
    }

    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    const emptyValues = buildEmptyFormValues();
    const emptyDraftFields = getDraftFields(emptyValues);
    const resetDraftFields = {
      ...emptyDraftFields,
      confidenceNotes: [] as string[],
    };
    const resetDraft = {
      ...activeDraft,
      ...resetDraftFields,
      sourceImageIds: activeDraft.sourceImageIds,
      extractionSnapshot: activeDraft.extractionSnapshot,
      updatedAt: new Date().toISOString(),
    };

    form.reset(emptyValues);
    setShowMoreFields(false);
    dispatch(updateDraft(resetDraftFields));
    await saveDraft(resetDraft);
  }

  return (
    <form
      className="grid min-h-[70vh] gap-6 lg:grid-cols-2"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Photoroll</CardTitle>
        </CardHeader>
        <CardContent>
          <Photoroll
            images={images}
            getItemClassName={(image) =>
              selectedPhotoImageId === image.id
                ? "border-primary ring-2 ring-primary/25"
                : undefined
            }
            renderOverlayAction={(image) => {
              const isSelected = selectedPhotoImageId === image.id;

              return (
                <Button
                  type="button"
                  variant={isSelected ? "default" : "secondary"}
                  size="sm"
                  className={isSelected ? undefined : "bg-background/90"}
                  aria-pressed={isSelected}
                  aria-label={`Upload ${image.fileName}`}
                  onClick={() =>
                    form.setValue(
                      "selectedPhotoImageId",
                      isSelected ? undefined : image.id,
                    )
                  }
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              );
            }}
          />
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Verify contact</CardTitle>
            {hasAnyReviewData ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-full p-0 text-muted-foreground"
                aria-label="Clear reviewed contact data"
                onClick={() => {
                  void handleResetReview();
                }}
              >
                <Eraser className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-7">
          {draft.confidenceNotes.length ? (
            <div className="flex flex-wrap gap-2">
              {draft.confidenceNotes.map((note) => (
                <Badge
                  key={note}
                  className="bg-primary text-primary-foreground"
                >
                  {note}
                </Badge>
              ))}
            </div>
          ) : null}

          <GoogleSection
            icon={UserRound}
            title="Name"
            action={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-full p-0 text-muted-foreground"
                onClick={() => setShowMoreFields((value) => !value)}
                aria-label={
                  showMoreFields
                    ? "Show fewer name fields"
                    : "Show more name fields"
                }
              >
                {showMoreFields ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            }
          >
            <div className="space-y-3">
              {showMoreFields ? (
                <GoogleField label="Prefix" htmlFor="review-name-prefix">
                  <Input
                    id="review-name-prefix"
                    {...form.register("namePrefix")}
                  />
                </GoogleField>
              ) : null}
              <GoogleField label="First name" htmlFor="review-first-name">
                <Input id="review-first-name" {...form.register("firstName")} />
              </GoogleField>
              <GoogleField label="Last name" htmlFor="review-last-name">
                <Input id="review-last-name" {...form.register("lastName")} />
              </GoogleField>
              {showMoreFields ? (
                <GoogleField label="Nickname" htmlFor="review-nickname">
                  <Input id="review-nickname" {...form.register("nickname")} />
                </GoogleField>
              ) : null}
              <GoogleField
                label="Phonetic first"
                htmlFor="review-phonetic-first-name"
              >
                <Input
                  id="review-phonetic-first-name"
                  {...form.register("phoneticFirstName")}
                />
              </GoogleField>
              {showMoreFields ? (
                <GoogleField
                  label="Phonetic middle"
                  htmlFor="review-phonetic-middle-name"
                >
                  <Input
                    id="review-phonetic-middle-name"
                    {...form.register("phoneticMiddleName")}
                  />
                </GoogleField>
              ) : null}
              <GoogleField
                label="Phonetic last"
                htmlFor="review-phonetic-last-name"
              >
                <Input
                  id="review-phonetic-last-name"
                  {...form.register("phoneticLastName")}
                />
              </GoogleField>
              <GoogleField label="Display name" htmlFor="review-full-name">
                <Input id="review-full-name" {...form.register("fullName")} />
              </GoogleField>
              <GoogleField label="File as" htmlFor="review-file-as">
                <Input id="review-file-as" {...form.register("fileAs")} />
              </GoogleField>
            </div>
          </GoogleSection>

          <GoogleSection icon={Building2} title="Company">
            <div className="space-y-3">
              <GoogleField label="Company" htmlFor="review-organization">
                <Input
                  id="review-organization"
                  {...form.register("organization")}
                />
              </GoogleField>
              <GoogleField label="Job title" htmlFor="review-title">
                <Input id="review-title" {...form.register("title")} />
              </GoogleField>
              <GoogleField label="Department" htmlFor="review-department">
                <Input
                  id="review-department"
                  {...form.register("department")}
                />
              </GoogleField>
            </div>
          </GoogleSection>

          <RepeatableFieldSection
            title="Email addresses"
            icon={Mail}
            addLabel="Add email"
            fieldArray={emailsFieldArray}
            register={form.register}
            name="emails"
            legend="Email"
          />

          <RepeatableFieldSection
            title="Phone numbers"
            icon={Phone}
            addLabel="Add phone"
            fieldArray={phonesFieldArray}
            register={form.register}
            name="phones"
            legend="Phone"
          />

          <RepeatableFieldSection
            title="Addresses"
            icon={MapPin}
            addLabel="Add address"
            fieldArray={addressesFieldArray}
            register={form.register}
            name="addresses"
            legend="Address"
            multiline
          />

          <RepeatableFieldSection
            title="Significant dates"
            icon={CalendarDays}
            addLabel="Add significant date"
            fieldArray={significantDatesFieldArray}
            register={form.register}
            name="significantDates"
            legend="Significant date"
            valueInputType="date"
            showAddButton={showMoreFields}
            hideWhenEmpty={!showMoreFields}
          />

          <RepeatableFieldSection
            title="Websites"
            icon={Link2}
            addLabel="Add website"
            fieldArray={websitesFieldArray}
            register={form.register}
            name="websites"
            legend="Website"
          />

          <RepeatableFieldSection
            title="Related people"
            icon={UsersRound}
            addLabel="Add related person"
            fieldArray={relatedPeopleFieldArray}
            register={form.register}
            name="relatedPeople"
            legend="Related person"
            hideWhenEmpty={!showMoreFields}
          />

          <CustomFieldSection
            fieldArray={customFieldsFieldArray}
            register={form.register}
          />

          <GoogleSection icon={FileText} title="Notes">
            <GoogleField label="Notes" htmlFor="review-notes">
              <Textarea
                id="review-notes"
                {...form.register("notes")}
                className="min-h-[140px] rounded-xl"
              />
            </GoogleField>
          </GoogleSection>

          <div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-primary px-6 text-primary hover:bg-primary/5"
              onClick={() => setShowMoreFields((value) => !value)}
            >
              {showMoreFields ? "Show less" : "Show more"}
            </Button>
          </div>

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

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="h-14 rounded-xl"
              onClick={() => {
                void handleSaveVCard();
              }}
            >
              <Download className="h-4 w-4" />
              Save vCard
            </Button>
            <Button
              size="lg"
              type="submit"
              className="h-14 rounded-xl"
              disabled={isSyncing || isAuthorizing}
            >
              <UserRoundPlus className="h-4 w-4" />
              {isSyncing || isAuthorizing ? <Spinner /> : null}
              {isAuthorizing
                ? "Connecting Google..."
                : isSyncing
                  ? "Syncing..."
                  : "Save to Google Contacts"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function GoogleSection({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4"
    >
      <div className="flex justify-center pt-4 text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 space-y-3">
        {action ? (
          <div className="flex justify-end">{action}</div>
        ) : (
          <div className="h-2" aria-hidden="true" />
        )}
        {children}
      </div>
    </section>
  );
}

function GoogleField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative pt-2">
      <Label
        htmlFor={htmlFor}
        className="absolute left-3 top-0 z-10 bg-background px-1 text-xs font-medium text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function RepeatableFieldSection({
  title,
  icon,
  addLabel,
  fieldArray,
  register,
  name,
  legend,
  multiline = false,
  valueInputType = "text",
  showAddButton,
  hideWhenEmpty,
}: {
  title: string;
  icon: typeof UserRound;
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
  showAddButton?: boolean;
  hideWhenEmpty?: boolean;
}) {
  const shouldRender = !hideWhenEmpty || fieldArray.fields.length > 0;
  const rowGridClassName = multiline
    ? "grid gap-3 sm:grid-cols-[minmax(0,2.4fr)_minmax(5rem,0.45fr)_auto]"
    : "grid gap-3 sm:grid-cols-[minmax(0,2.8fr)_minmax(5rem,0.45fr)_minmax(5rem,0.45fr)_auto]";

  if (!shouldRender) {
    return null;
  }

  return (
    <GoogleSection icon={icon} title={title}>
      <div className="space-y-3">
        {fieldArray.fields.map((field, index) => (
          <div key={field.id} className="space-y-2">
            <div className={rowGridClassName}>
              <GoogleField label={legend} htmlFor={`${name}-${index}-value`}>
                {multiline ? (
                  <Textarea
                    id={`${name}-${index}-value`}
                    className="min-h-[96px] rounded-xl"
                    {...register(`${name}.${index}.value` as const)}
                  />
                ) : (
                  <Input
                    id={`${name}-${index}-value`}
                    type={valueInputType}
                    className="rounded-xl"
                    {...register(`${name}.${index}.value` as const)}
                  />
                )}
              </GoogleField>
              <GoogleField label="Type" htmlFor={`${name}-${index}-type`}>
                <Input
                  id={`${name}-${index}-type`}
                  className="rounded-xl"
                  {...register(`${name}.${index}.type` as const)}
                />
              </GoogleField>
              {multiline ? null : (
                <GoogleField label="Label" htmlFor={`${name}-${index}-label`}>
                  <Input
                    id={`${name}-${index}-label`}
                    className="rounded-xl"
                    {...register(`${name}.${index}.label` as const)}
                  />
                </GoogleField>
              )}
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 rounded-full border-border p-0 text-muted-foreground hover:bg-muted/60"
                  onClick={() => fieldArray.remove(index)}
                  aria-label={`Remove ${legend.toLowerCase()} ${index + 1}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {showAddButton === false && fieldArray.fields.length > 0 ? null : (
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center bg-primary/10 text-primary hover:bg-primary/15"
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
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
    </GoogleSection>
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
    <GoogleSection icon={Rows3} title="Custom fields">
      <div className="space-y-3">
        {fieldArray.fields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-3 sm:grid-cols-[1.1fr_1.1fr_auto]"
          >
            <GoogleField
              label="Custom field"
              htmlFor={`custom-fields-${index}-value`}
            >
              <Input
                id={`custom-fields-${index}-value`}
                className="rounded-xl"
                {...register(`customFields.${index}.value` as const)}
              />
            </GoogleField>
            <GoogleField label="Label" htmlFor={`custom-fields-${index}-key`}>
              <Input
                id={`custom-fields-${index}-key`}
                className="rounded-xl"
                {...register(`customFields.${index}.key` as const)}
              />
            </GoogleField>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground"
                onClick={() => fieldArray.remove(index)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          className="w-full justify-center bg-primary/10 text-primary hover:bg-primary/15"
          onClick={() => fieldArray.append(emptyCustomField())}
        >
          <Plus className="h-4 w-4" />
          Add custom field
        </Button>
      </div>
    </GoogleSection>
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
