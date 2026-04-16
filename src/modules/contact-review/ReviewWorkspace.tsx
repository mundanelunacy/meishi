import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePostHog } from "@posthog/react";
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
import { defineMessages, useIntl } from "react-intl";
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
  clearReviewDraft,
  finalizeDraft,
  selectCapturedImages,
  selectDraft,
  restoreDraft,
  setCapturedImages,
  updateDraft,
} from "./reviewDraftSlice";
import {
  clearLatestDraft,
  loadCapturedImages,
  loadLatestDraft,
  saveCapturedImages,
  saveDraft,
} from "../local-data";
import { buildContactPayload, useSyncGoogleContact } from "../google-contacts";
import { buildContactVCard, saveContactVCard } from "../vcard-export";
import { pushToast } from "../../shared/ui/toastBus";
import { buildPreservedNotes } from "../../shared/lib/contactFidelity";
import {
  connectGoogleContacts,
  shouldReconnectGoogleContacts,
} from "../google-auth/googleIdentity";
import { useGoogleAuthStateSync } from "../google-auth/useGoogleAuthStateSync";
import {
  selectGoogleAuth,
  setGoogleAuthState,
} from "../onboarding-settings/onboardingSlice";

const messages = defineMessages({
  noDraftTitle: {
    id: "review.empty.title",
    defaultMessage: "No draft available",
  },
  noDraftDescription: {
    id: "review.empty.description",
    defaultMessage:
      "Capture at least one business-card image and run extraction before opening the review screen.",
  },
  goToCapture: {
    id: "review.empty.goToCapture",
    defaultMessage: "Go to capture",
  },
  syncedToGoogle: {
    id: "review.toast.syncedToGoogle",
    defaultMessage: "Verified contact synced to Google Contacts.",
  },
  unableCreateGoogle: {
    id: "review.error.unableCreateGoogle",
    defaultMessage: "Unable to create Google contact.",
  },
  vcardShared: {
    id: "review.toast.vcardShared",
    defaultMessage: "vCard opened in the share sheet.",
  },
  vcardDownloaded: {
    id: "review.toast.vcardDownloaded",
    defaultMessage: "vCard downloaded to your device.",
  },
  unableSaveVcard: {
    id: "review.error.unableSaveVcard",
    defaultMessage: "Unable to save vCard.",
  },
  photorollCleared: {
    id: "review.toast.photorollCleared",
    defaultMessage: "Photoroll cleared.",
  },
  photorollTitle: {
    id: "review.photoroll.title",
    defaultMessage: "Photoroll",
  },
  clearPhotoroll: {
    id: "review.photoroll.clear",
    defaultMessage: "Clear photoroll",
  },
  uploadImage: {
    id: "review.photoroll.uploadImage",
    defaultMessage: "Upload {fileName}",
  },
  upload: {
    id: "review.photoroll.upload",
    defaultMessage: "Upload",
  },
  verifyTitle: {
    id: "review.workspace.title",
    defaultMessage: "Verify contact",
  },
  clearReviewedData: {
    id: "review.workspace.clearReviewedData",
    defaultMessage: "Clear reviewed contact data",
  },
  showFewerFields: {
    id: "review.workspace.showFewerFields",
    defaultMessage: "Show fewer name fields",
  },
  showMoreFields: {
    id: "review.workspace.showMoreFields",
    defaultMessage: "Show more name fields",
  },
  showLess: {
    id: "review.workspace.showLess",
    defaultMessage: "Show less",
  },
  showMore: {
    id: "review.workspace.showMore",
    defaultMessage: "Show more",
  },
  saveVcard: {
    id: "review.action.saveVcard",
    defaultMessage: "Save vCard",
  },
  connectingGoogle: {
    id: "review.action.connectingGoogle",
    defaultMessage: "Connecting Google...",
  },
  syncing: {
    id: "review.action.syncing",
    defaultMessage: "Syncing...",
  },
  saveToGoogle: {
    id: "review.action.saveToGoogle",
    defaultMessage: "Save to Google Contacts",
  },
  saveSuccessTitle: {
    id: "review.success.title",
    defaultMessage: "Contact saved",
  },
  saveSuccessDescription: {
    id: "review.success.description",
    defaultMessage: "What would you like to do next?",
  },
  scanAnotherCard: {
    id: "review.success.scanAnotherCard",
    defaultMessage: "Scan another card",
  },
  cancel: {
    id: "review.success.cancel",
    defaultMessage: "Cancel",
  },
  sectionName: { id: "review.section.name", defaultMessage: "Name" },
  sectionCompany: { id: "review.section.company", defaultMessage: "Company" },
  sectionEmails: {
    id: "review.section.emails",
    defaultMessage: "Email addresses",
  },
  sectionPhones: {
    id: "review.section.phones",
    defaultMessage: "Phone numbers",
  },
  sectionAddresses: {
    id: "review.section.addresses",
    defaultMessage: "Addresses",
  },
  sectionDates: {
    id: "review.section.dates",
    defaultMessage: "Significant dates",
  },
  sectionWebsites: {
    id: "review.section.websites",
    defaultMessage: "Websites",
  },
  sectionPeople: {
    id: "review.section.people",
    defaultMessage: "Related people",
  },
  sectionCustom: {
    id: "review.section.custom",
    defaultMessage: "Custom fields",
  },
  sectionNotes: { id: "review.section.notes", defaultMessage: "Notes" },
  labelPrefix: { id: "review.label.prefix", defaultMessage: "Prefix" },
  labelFirstName: {
    id: "review.label.firstName",
    defaultMessage: "First name",
  },
  labelLastName: { id: "review.label.lastName", defaultMessage: "Last name" },
  labelNickname: { id: "review.label.nickname", defaultMessage: "Nickname" },
  labelPhoneticFirst: {
    id: "review.label.phoneticFirst",
    defaultMessage: "Phonetic first",
  },
  labelPhoneticMiddle: {
    id: "review.label.phoneticMiddle",
    defaultMessage: "Phonetic middle",
  },
  labelPhoneticLast: {
    id: "review.label.phoneticLast",
    defaultMessage: "Phonetic last",
  },
  labelDisplayName: {
    id: "review.label.displayName",
    defaultMessage: "Display name",
  },
  labelFileAs: { id: "review.label.fileAs", defaultMessage: "File as" },
  labelCompany: { id: "review.label.company", defaultMessage: "Company" },
  labelJobTitle: { id: "review.label.jobTitle", defaultMessage: "Job title" },
  labelDepartment: {
    id: "review.label.department",
    defaultMessage: "Department",
  },
  labelNotes: { id: "review.label.notes", defaultMessage: "Notes" },
  addEmail: { id: "review.add.email", defaultMessage: "Add email" },
  addPhone: { id: "review.add.phone", defaultMessage: "Add phone" },
  addAddress: { id: "review.add.address", defaultMessage: "Add address" },
  addDate: { id: "review.add.date", defaultMessage: "Add significant date" },
  addWebsite: { id: "review.add.website", defaultMessage: "Add website" },
  addPerson: { id: "review.add.person", defaultMessage: "Add related person" },
  addCustomField: {
    id: "review.add.customField",
    defaultMessage: "Add custom field",
  },
  legendEmail: { id: "review.legend.email", defaultMessage: "Email" },
  legendPhone: { id: "review.legend.phone", defaultMessage: "Phone" },
  legendAddress: { id: "review.legend.address", defaultMessage: "Address" },
  legendDate: { id: "review.legend.date", defaultMessage: "Significant date" },
  legendWebsite: { id: "review.legend.website", defaultMessage: "Website" },
  legendPerson: {
    id: "review.legend.person",
    defaultMessage: "Related person",
  },
  legendCustomField: {
    id: "review.legend.customField",
    defaultMessage: "Custom field",
  },
  fieldType: { id: "review.field.type", defaultMessage: "Type" },
  fieldLabel: { id: "review.field.label", defaultMessage: "Label" },
  removeItem: {
    id: "review.field.removeItem",
    defaultMessage: "Remove {legend} {index}",
  },
  remove: { id: "review.field.remove", defaultMessage: "Remove" },
  debugTitle: {
    id: "review.debug.title",
    defaultMessage: "Developer debug preview",
  },
  debugRaw: {
    id: "review.debug.raw",
    defaultMessage: "Raw extraction snapshot",
  },
  debugRawMissing: {
    id: "review.debug.rawMissing",
    defaultMessage: "No extraction snapshot is available for this draft.",
  },
  debugVcard: { id: "review.debug.vcard", defaultMessage: "Derived vCard" },
  debugPayload: {
    id: "review.debug.payload",
    defaultMessage: "Derived Google createContact payload",
  },
  debugPhoto: {
    id: "review.debug.photo",
    defaultMessage: "Selected photo metadata",
  },
  debugNoPhoto: {
    id: "review.debug.noPhoto",
    defaultMessage: "No image is currently selected.",
  },
});

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
  const intl = useIntl();
  useGoogleAuthStateSync();

  const posthog = usePostHog();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const draft = useAppSelector(selectDraft);
  const images = useAppSelector(selectCapturedImages);
  const googleAuth = useAppSelector(selectGoogleAuth);
  const debugQueryEnabled = isDebugQueryEnabled();
  const { syncContact, isSyncing, errorMessage } = useSyncGoogleContact();
  const autosaveTimeoutRef = useRef<number | null>(null);
  const hydratedDraftSignatureRef = useRef<string | null>(null);
  const isAutosavePausedRef = useRef(false);
  const isHydrationPausedRef = useRef(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSaveSuccessModalOpen, setIsSaveSuccessModalOpen] = useState(false);
  const [showMoreFields, setShowMoreFields] = useState(false);

  useEffect(() => {
    if (draft || images.length || isHydrationPausedRef.current) {
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
      if (isAutosavePausedRef.current) {
        return;
      }

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

  async function authorizeGoogle(currentGoogleAuth: typeof googleAuth) {
    setIsAuthorizing(true);
    dispatch(setGoogleAuthState({ ...currentGoogleAuth, status: "connecting" }));

    try {
      const nextAuthState = await connectGoogleContacts();
      dispatch(setGoogleAuthState(nextAuthState));
      return nextAuthState;
    } catch (error) {
      dispatch(
        setGoogleAuthState({
          ...currentGoogleAuth,
          status: currentGoogleAuth.connectedAt ? "connected" : "signed_out",
        }),
      );
      throw error;
    } finally {
      setIsAuthorizing(false);
    }
  }

  function clearPendingAutosave() {
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
  }

  if (!draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{intl.formatMessage(messages.noDraftTitle)}</CardTitle>
          <CardDescription>
            {intl.formatMessage(messages.noDraftDescription)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate({ to: "/capture" })}>
            {intl.formatMessage(messages.goToCapture)}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeDraft = draft;

  async function onSubmit(values: ReviewFormValues) {
    if (!hasReviewData(values)) {
      return;
    }

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
      let currentGoogleAuth = googleAuth;
      if (googleAuth.status !== "connected") {
        currentGoogleAuth = await authorizeGoogle(currentGoogleAuth);
      }

      let result;

      try {
        result = await syncContact({
          contact: verifiedContact,
          images,
        });
      } catch (error) {
        if (!shouldReconnectGoogleContacts(error)) {
          throw error;
        }

        await authorizeGoogle(currentGoogleAuth);
        result = await syncContact({
          contact: verifiedContact,
          images,
        });
      }

      posthog.capture("google_contact_synced", {
        photo_uploaded: result.outcome.photoUploaded,
        had_warning: Boolean(result.warningMessage),
      });
      pushToast(
        result.warningMessage ?? intl.formatMessage(messages.syncedToGoogle),
      );
      setIsSaveSuccessModalOpen(true);
    } catch (error) {
      posthog.capture("google_contact_sync_failed", {
        error_message: error instanceof Error ? error.message : String(error),
      });
      pushToast(
        error instanceof Error
          ? error.message
          : intl.formatMessage(messages.unableCreateGoogle),
      );
    }
  }

  async function handleSaveVCard() {
    const values = form.getValues();

    if (!hasReviewData(values)) {
      return;
    }

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
      posthog.capture("vcard_saved", { method: exportResult });
      pushToast(
        exportResult === "shared"
          ? intl.formatMessage(messages.vcardShared)
          : intl.formatMessage(messages.vcardDownloaded),
      );
      setIsSaveSuccessModalOpen(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      pushToast(
        error instanceof Error
          ? error.message
          : intl.formatMessage(messages.unableSaveVcard),
      );
    }
  }

  async function handleResetReview() {
    if (!draft) {
      return;
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

    isAutosavePausedRef.current = true;
    clearPendingAutosave();

    try {
      form.reset(emptyValues);
      setShowMoreFields(false);
      dispatch(updateDraft(resetDraftFields));
      await saveDraft(resetDraft);
    } finally {
      isAutosavePausedRef.current = false;
    }
  }

  async function handleScanAnotherCard() {
    isHydrationPausedRef.current = true;
    isAutosavePausedRef.current = true;
    clearPendingAutosave();

    try {
      hydratedDraftSignatureRef.current = null;
      form.reset(buildEmptyFormValues());
      setShowMoreFields(false);
      setIsSaveSuccessModalOpen(false);
      dispatch(clearReviewDraft());

      await Promise.all([saveCapturedImages([]), clearLatestDraft()]);
      navigate({ to: "/capture" });
    } finally {
      isAutosavePausedRef.current = false;
      isHydrationPausedRef.current = false;
    }
  }

  async function handleClearPhotoroll() {
    dispatch(setCapturedImages([]));
    form.setValue("selectedPhotoImageId", undefined);
    await saveCapturedImages([]);
    pushToast(intl.formatMessage(messages.photorollCleared));
  }

  return (
    <>
      <form
        className="grid min-h-[70vh] gap-6 lg:grid-cols-2"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>
                {intl.formatMessage(messages.photorollTitle)}
              </CardTitle>
              {images.length ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-full p-0 text-muted-foreground"
                  aria-label={intl.formatMessage(messages.clearPhotoroll)}
                  onClick={() => {
                    void handleClearPhotoroll();
                  }}
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
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
                    aria-label={intl.formatMessage(messages.uploadImage, {
                      fileName: image.fileName,
                    })}
                    onClick={() =>
                      form.setValue(
                        "selectedPhotoImageId",
                        isSelected ? undefined : image.id,
                      )
                    }
                  >
                    <Upload className="h-4 w-4" />
                    {intl.formatMessage(messages.upload)}
                  </Button>
                );
              }}
            />
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{intl.formatMessage(messages.verifyTitle)}</CardTitle>
              {hasAnyReviewData ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-full p-0 text-muted-foreground"
                  aria-label={intl.formatMessage(messages.clearReviewedData)}
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
              title={intl.formatMessage(messages.sectionName)}
              action={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-full p-0 text-muted-foreground"
                  onClick={() => setShowMoreFields((value) => !value)}
                  aria-label={
                    showMoreFields
                      ? intl.formatMessage(messages.showFewerFields)
                      : intl.formatMessage(messages.showMoreFields)
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
                  <GoogleField
                    label={intl.formatMessage(messages.labelPrefix)}
                    htmlFor="review-name-prefix"
                  >
                    <Input
                      id="review-name-prefix"
                      {...form.register("namePrefix")}
                    />
                  </GoogleField>
                ) : null}
                <GoogleField
                  label={intl.formatMessage(messages.labelFirstName)}
                  htmlFor="review-first-name"
                >
                  <Input
                    id="review-first-name"
                    {...form.register("firstName")}
                  />
                </GoogleField>
                <GoogleField
                  label={intl.formatMessage(messages.labelLastName)}
                  htmlFor="review-last-name"
                >
                  <Input id="review-last-name" {...form.register("lastName")} />
                </GoogleField>
                {showMoreFields ? (
                  <GoogleField
                    label={intl.formatMessage(messages.labelNickname)}
                    htmlFor="review-nickname"
                  >
                    <Input
                      id="review-nickname"
                      {...form.register("nickname")}
                    />
                  </GoogleField>
                ) : null}
                <GoogleField
                  label={intl.formatMessage(messages.labelPhoneticFirst)}
                  htmlFor="review-phonetic-first-name"
                >
                  <Input
                    id="review-phonetic-first-name"
                    {...form.register("phoneticFirstName")}
                  />
                </GoogleField>
                {showMoreFields ? (
                  <GoogleField
                    label={intl.formatMessage(messages.labelPhoneticMiddle)}
                    htmlFor="review-phonetic-middle-name"
                  >
                    <Input
                      id="review-phonetic-middle-name"
                      {...form.register("phoneticMiddleName")}
                    />
                  </GoogleField>
                ) : null}
                <GoogleField
                  label={intl.formatMessage(messages.labelPhoneticLast)}
                  htmlFor="review-phonetic-last-name"
                >
                  <Input
                    id="review-phonetic-last-name"
                    {...form.register("phoneticLastName")}
                  />
                </GoogleField>
                <GoogleField
                  label={intl.formatMessage(messages.labelDisplayName)}
                  htmlFor="review-full-name"
                >
                  <Input id="review-full-name" {...form.register("fullName")} />
                </GoogleField>
                <GoogleField
                  label={intl.formatMessage(messages.labelFileAs)}
                  htmlFor="review-file-as"
                >
                  <Input id="review-file-as" {...form.register("fileAs")} />
                </GoogleField>
              </div>
            </GoogleSection>

            <GoogleSection
              icon={Building2}
              title={intl.formatMessage(messages.sectionCompany)}
            >
              <div className="space-y-3">
                <GoogleField
                  label={intl.formatMessage(messages.labelCompany)}
                  htmlFor="review-organization"
                >
                  <Input
                    id="review-organization"
                    {...form.register("organization")}
                  />
                </GoogleField>
                <GoogleField
                  label={intl.formatMessage(messages.labelJobTitle)}
                  htmlFor="review-title"
                >
                  <Input id="review-title" {...form.register("title")} />
                </GoogleField>
                <GoogleField
                  label={intl.formatMessage(messages.labelDepartment)}
                  htmlFor="review-department"
                >
                  <Input
                    id="review-department"
                    {...form.register("department")}
                  />
                </GoogleField>
              </div>
            </GoogleSection>

            <RepeatableFieldSection
              title={intl.formatMessage(messages.sectionEmails)}
              icon={Mail}
              addLabel={intl.formatMessage(messages.addEmail)}
              fieldArray={emailsFieldArray}
              register={form.register}
              name="emails"
              legend={intl.formatMessage(messages.legendEmail)}
            />

            <RepeatableFieldSection
              title={intl.formatMessage(messages.sectionPhones)}
              icon={Phone}
              addLabel={intl.formatMessage(messages.addPhone)}
              fieldArray={phonesFieldArray}
              register={form.register}
              name="phones"
              legend={intl.formatMessage(messages.legendPhone)}
            />

            <RepeatableFieldSection
              title={intl.formatMessage(messages.sectionAddresses)}
              icon={MapPin}
              addLabel={intl.formatMessage(messages.addAddress)}
              fieldArray={addressesFieldArray}
              register={form.register}
              name="addresses"
              legend={intl.formatMessage(messages.legendAddress)}
              multiline
            />

            <RepeatableFieldSection
              title={intl.formatMessage(messages.sectionDates)}
              icon={CalendarDays}
              addLabel={intl.formatMessage(messages.addDate)}
              fieldArray={significantDatesFieldArray}
              register={form.register}
              name="significantDates"
              legend={intl.formatMessage(messages.legendDate)}
              valueInputType="date"
              showAddButton={showMoreFields}
              hideWhenEmpty={!showMoreFields}
            />

            <RepeatableFieldSection
              title={intl.formatMessage(messages.sectionWebsites)}
              icon={Link2}
              addLabel={intl.formatMessage(messages.addWebsite)}
              fieldArray={websitesFieldArray}
              register={form.register}
              name="websites"
              legend={intl.formatMessage(messages.legendWebsite)}
            />

            <RepeatableFieldSection
              title={intl.formatMessage(messages.sectionPeople)}
              icon={UsersRound}
              addLabel={intl.formatMessage(messages.addPerson)}
              fieldArray={relatedPeopleFieldArray}
              register={form.register}
              name="relatedPeople"
              legend={intl.formatMessage(messages.legendPerson)}
              hideWhenEmpty={!showMoreFields}
            />

            <CustomFieldSection
              fieldArray={customFieldsFieldArray}
              register={form.register}
            />

            <GoogleSection
              icon={FileText}
              title={intl.formatMessage(messages.sectionNotes)}
            >
              <GoogleField
                label={intl.formatMessage(messages.labelNotes)}
                htmlFor="review-notes"
              >
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
                {showMoreFields
                  ? intl.formatMessage(messages.showLess)
                  : intl.formatMessage(messages.showMore)}
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
                disabled={!hasAnyReviewData}
                onClick={() => {
                  void handleSaveVCard();
                }}
              >
                <Download className="h-4 w-4" />
                {intl.formatMessage(messages.saveVcard)}
              </Button>
              <Button
                size="lg"
                type="submit"
                className="h-14 rounded-xl"
                disabled={!hasAnyReviewData || isSyncing || isAuthorizing}
              >
                <UserRoundPlus className="h-4 w-4" />
                {isSyncing || isAuthorizing ? <Spinner /> : null}
                {isAuthorizing
                  ? intl.formatMessage(messages.connectingGoogle)
                  : isSyncing
                    ? intl.formatMessage(messages.syncing)
                    : intl.formatMessage(messages.saveToGoogle)}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {isSaveSuccessModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-save-success-title"
          aria-describedby="review-save-success-description"
        >
          <div className="flex w-full max-w-lg flex-col gap-6 rounded-3xl border border-border bg-background px-6 py-8 shadow-elevated sm:px-8">
            <div className="space-y-2 text-center">
              <h2
                id="review-save-success-title"
                className="text-2xl font-semibold"
              >
                {intl.formatMessage(messages.saveSuccessTitle)}
              </h2>
              <p
                id="review-save-success-description"
                className="text-sm text-muted-foreground"
              >
                {intl.formatMessage(messages.saveSuccessDescription)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                className="h-12 rounded-xl"
                onClick={() => {
                  void handleScanAnotherCard();
                }}
              >
                {intl.formatMessage(messages.scanAnotherCard)}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => setIsSaveSuccessModalOpen(false)}
              >
                {intl.formatMessage(messages.cancel)}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
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
  const intl = useIntl();
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
              <GoogleField
                label={intl.formatMessage(messages.fieldType)}
                htmlFor={`${name}-${index}-type`}
              >
                <Input
                  id={`${name}-${index}-type`}
                  className="rounded-xl"
                  {...register(`${name}.${index}.type` as const)}
                />
              </GoogleField>
              {multiline ? null : (
                <GoogleField
                  label={intl.formatMessage(messages.fieldLabel)}
                  htmlFor={`${name}-${index}-label`}
                >
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
                  aria-label={intl.formatMessage(messages.removeItem, {
                    legend,
                    index: index + 1,
                  })}
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
  const intl = useIntl();

  return (
    <GoogleSection
      icon={Rows3}
      title={intl.formatMessage(messages.sectionCustom)}
    >
      <div className="space-y-3">
        {fieldArray.fields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-3 sm:grid-cols-[1.1fr_1.1fr_auto]"
          >
            <GoogleField
              label={intl.formatMessage(messages.legendCustomField)}
              htmlFor={`custom-fields-${index}-value`}
            >
              <Input
                id={`custom-fields-${index}-value`}
                className="rounded-xl"
                {...register(`customFields.${index}.value` as const)}
              />
            </GoogleField>
            <GoogleField
              label={intl.formatMessage(messages.fieldLabel)}
              htmlFor={`custom-fields-${index}-key`}
            >
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
                {intl.formatMessage(messages.remove)}
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
          {intl.formatMessage(messages.addCustomField)}
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
  const intl = useIntl();
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
        {intl.formatMessage(messages.debugTitle)}
      </summary>
      <div className="mt-4 space-y-4">
        <DebugBlock
          title={intl.formatMessage(messages.debugRaw)}
          body={
            draft.extractionSnapshot
              ? JSON.stringify(draft.extractionSnapshot, null, 2)
              : intl.formatMessage(messages.debugRawMissing)
          }
        />
        <DebugBlock
          title={intl.formatMessage(messages.debugVcard)}
          body={buildContactVCard(previewContact)}
        />
        <DebugBlock
          title={intl.formatMessage(messages.debugPayload)}
          body={JSON.stringify(buildContactPayload(previewContact), null, 2)}
        />
        <DebugBlock
          title={intl.formatMessage(messages.debugPhoto)}
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
                  note: intl.formatMessage(messages.debugNoPhoto),
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
