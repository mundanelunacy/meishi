import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Camera, ImagePlus, Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Button } from "../../shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shared/ui/card";
import { Alert } from "../../shared/ui/alert";
import { createCapturedCardImages } from "./imageProcessing";
import {
  loadCapturedImages,
  saveCapturedImages,
  saveDraft,
} from "../local-data";
import {
  createContactDraft,
  selectCapturedImages,
  populateDraftFromExtraction,
  setCapturedImages,
} from "../contact-review/reviewDraftSlice";
import { useExtractBusinessCardMutation } from "../card-extraction/extractionApi";
import { pushToast } from "../../shared/ui/toastBus";

function readExtractionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Extraction failed.";
  }

  const data = Reflect.get(error, "data");
  if (typeof data === "string" && data.length > 0) {
    return data;
  }

  const message = Reflect.get(error, "message");
  if (typeof message === "string" && message.length > 0) {
    return message;
  }

  return "Extraction failed.";
}

export function CaptureWorkspace() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const images = useAppSelector(selectCapturedImages);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [extractBusinessCard, extraction] = useExtractBusinessCardMutation();

  useEffect(() => {
    if (images.length) {
      return;
    }

    void loadCapturedImages().then((storedImages) => {
      if (storedImages.length) {
        dispatch(setCapturedImages(storedImages));
      }
    });
  }, [dispatch, images.length]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    try {
      const nextImages = [
        ...images,
        ...(await createCapturedCardImages(files)),
      ];
      dispatch(setCapturedImages(nextImages));
      await saveCapturedImages(nextImages);
      pushToast(
        `${files.length} image${files.length === 1 ? "" : "s"} added to the active capture session.`,
      );
      setCameraError(null);
    } catch (error) {
      setCameraError(
        error instanceof Error ? error.message : "Unable to process images.",
      );
    }
  }

  async function handleExtract() {
    if (!images.length) {
      setCameraError("Capture at least one image before extraction.");
      return;
    }

    const result = await extractBusinessCard({ images });
    if ("data" in result && result.data) {
      const nextDraft = createContactDraft(images, result.data);
      dispatch(
        populateDraftFromExtraction({
          extraction: result.data,
          draft: nextDraft,
        }),
      );
      await saveDraft(nextDraft);
      pushToast("Extraction finished. Review the draft before syncing.");
      navigate({ to: "/review" });
      return;
    }

    setCameraError(readExtractionError(result.error));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>Capture business cards</CardTitle>
          <CardDescription>
            Use a rear camera on mobile or upload existing photos. Multiple
            captures stay grouped in one local session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-border bg-background/60 px-6 py-12 text-center">
            <Camera className="h-8 w-8 text-primary" />
            <div className="space-y-1">
              <p className="font-medium">Open camera</p>
              <p className="text-sm text-muted-foreground">
                On supported mobile browsers this opens the rear camera
                directly.
              </p>
            </div>
            <input
              className="hidden"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-medium">
            <ImagePlus className="h-4 w-4" />
            Add images from library
            <input
              className="hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>

          <Button
            className="w-full"
            size="lg"
            onClick={handleExtract}
            disabled={extraction.isLoading || images.length === 0}
          >
            <Sparkles className="h-4 w-4" />
            {extraction.isLoading ? "Extracting..." : "Extract contact draft"}
          </Button>

          {cameraError ? (
            <Alert className="border-destructive/30 text-destructive">
              {cameraError}
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active capture session</CardTitle>
          <CardDescription>
            Captured images are kept in IndexedDB so you can recover the current
            session after navigation or refresh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {images.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-[24px] border border-border/70 bg-background/70"
                >
                  <img
                    src={image.dataUrl}
                    alt={image.fileName}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="space-y-1 p-4 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {image.fileName}
                    </p>
                    <p>
                      {image.width}×{image.height} •{" "}
                      {new Date(image.capturedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              No images captured yet. Start with the camera or photo library
              above.
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
