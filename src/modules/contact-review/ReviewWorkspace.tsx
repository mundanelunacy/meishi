import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Button } from "../../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../shared/ui/card";
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
  saveSyncOutcome,
} from "../local-data/database";
import {
  useCreateContactMutation,
  useUpdateContactPhotoMutation,
} from "../google-contacts/googlePeopleApi";
import { pushToast } from "../../shared/ui/toastBus";
import { startSync, syncFailed, syncSucceeded } from "../google-contacts/syncSessionSlice";

const reviewSchema = z.object({
  fullName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  organization: z.string(),
  title: z.string(),
  email: z.string(),
  phone: z.string(),
  website: z.string(),
  notes: z.string(),
  address: z.string(),
  selectedPhotoImageId: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function ReviewWorkspace() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const draft = useAppSelector(selectDraft);
  const images = useAppSelector(selectCapturedImages);
  const [createContact, createContactState] = useCreateContactMutation();
  const [updateContactPhoto] = useUpdateContactPhotoMutation();

  useEffect(() => {
    if (draft || images.length) {
      return;
    }

    void Promise.all([loadCapturedImages(), loadLatestDraft()]).then(([storedImages, storedDraft]) => {
      if (storedImages.length || storedDraft) {
        dispatch(restoreDraft({ images: storedImages, draft: storedDraft ?? null }));
      }
    });
  }, [dispatch, draft, images.length]);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    values: {
      fullName: draft?.fullName ?? "",
      firstName: draft?.firstName ?? "",
      lastName: draft?.lastName ?? "",
      organization: draft?.organization ?? "",
      title: draft?.title ?? "",
      email: draft?.email ?? "",
      phone: draft?.phone ?? "",
      website: draft?.website ?? "",
      notes: draft?.notes ?? "",
      address: draft?.address ?? "",
      selectedPhotoImageId: images[0]?.id,
    },
  });

  useEffect(() => {
    if (!draft) {
      return;
    }

    form.reset({
      fullName: draft.fullName,
      firstName: draft.firstName,
      lastName: draft.lastName,
      organization: draft.organization,
      title: draft.title,
      email: draft.email,
      phone: draft.phone,
      website: draft.website,
      notes: draft.notes,
      address: draft.address,
      selectedPhotoImageId: images[0]?.id,
    });
  }, [draft, form, images]);

  if (!draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No draft available</CardTitle>
          <CardDescription>
            Capture at least one business-card image and run extraction before opening the review screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate({ to: "/capture" })}>Go to capture</Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(values: ReviewFormValues) {
    const selectedPhoto = images.find((image) => image.id === values.selectedPhotoImageId);
    dispatch(updateDraft(values));
    await saveDraft({
      ...draft,
      ...values,
      sourceImageIds: draft.sourceImageIds,
      confidenceNotes: draft.confidenceNotes,
      updatedAt: new Date().toISOString(),
    });
    dispatch(finalizeDraft({ selectedPhotoImageId: values.selectedPhotoImageId }));
    dispatch(startSync());

    const verifiedContact = {
      ...draft,
      ...values,
      selectedPhotoImageId: values.selectedPhotoImageId,
      verifiedAt: new Date().toISOString(),
    };

    const created = await createContact(verifiedContact);
    if (!("data" in created)) {
      dispatch(syncFailed(String(created.error.data ?? "Unable to create Google contact.")));
      return;
    }

    let photoUploaded = false;
    if (selectedPhoto) {
      const photoResult = await updateContactPhoto({
        resourceName: created.data.resourceName,
        dataUrl: selectedPhoto.dataUrl,
      });
      photoUploaded = "data" in photoResult;
    }

    const outcome = {
      contactResourceName: created.data.resourceName,
      photoUploaded,
      localOnlyImageIds: images
        .filter((image) => image.id !== values.selectedPhotoImageId)
        .map((image) => image.id),
      syncedAt: new Date().toISOString(),
    };
    await saveSyncOutcome(outcome);
    dispatch(syncSucceeded(outcome));
    pushToast("Verified contact synced to Google Contacts.");
  }

  return (
    <form
      className="grid min-h-[70vh] gap-6 xl:grid-cols-[1.05fr_0.95fr]"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Source images</CardTitle>
          <CardDescription>
            Keep the visual reference visible while you edit the extracted fields. One image can be chosen as the Google contact photo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {images.map((image) => (
            <label
              key={image.id}
              className={`overflow-hidden rounded-[28px] border ${
                form.watch("selectedPhotoImageId") === image.id ? "border-primary" : "border-border/70"
              }`}
            >
              <img src={image.dataUrl} alt={image.fileName} className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{image.fileName}</p>
                  <p className="text-xs text-muted-foreground">Local capture only unless selected as contact photo.</p>
                </div>
                <input
                  type="radio"
                  value={image.id}
                  checked={form.watch("selectedPhotoImageId") === image.id}
                  onChange={() => form.setValue("selectedPhotoImageId", image.id)}
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
            Edit anything the model got wrong before syncing. Confidence notes are preserved with the local draft for traceability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.confidenceNotes.length ? (
            <div className="flex flex-wrap gap-2">
              {draft.confidenceNotes.map((note) => (
                <Badge key={note}>{note}</Badge>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input {...form.register("fullName")} />
            </Field>
            <Field label="Title">
              <Input {...form.register("title")} />
            </Field>
            <Field label="First name">
              <Input {...form.register("firstName")} />
            </Field>
            <Field label="Last name">
              <Input {...form.register("lastName")} />
            </Field>
            <Field label="Organization">
              <Input {...form.register("organization")} />
            </Field>
            <Field label="Email">
              <Input {...form.register("email")} />
            </Field>
            <Field label="Phone">
              <Input {...form.register("phone")} />
            </Field>
            <Field label="Website">
              <Input {...form.register("website")} />
            </Field>
            <Field className="sm:col-span-2" label="Address">
              <Textarea {...form.register("address")} className="min-h-[96px]" />
            </Field>
            <Field className="sm:col-span-2" label="Notes">
              <Textarea {...form.register("notes")} />
            </Field>
          </div>

          {createContactState.isError ? (
            <Alert className="border-destructive/30 text-destructive">
              {String(createContactState.error)}
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button size="lg" type="submit" disabled={createContactState.isLoading}>
              {createContactState.isLoading ? "Syncing..." : "Save to Google Contacts"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/capture" })}>
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
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  );
}
