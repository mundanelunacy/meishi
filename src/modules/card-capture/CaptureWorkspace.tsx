import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Camera, ImagePlus, Sparkles, Trash2 } from "lucide-react";
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
  openPreferredCameraStream,
} from "./cameraFacingMode";
import { detectPreferredCaptureExperience } from "./captureExperience";
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
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captureExperience] = useState(() =>
    detectPreferredCaptureExperience(),
  );
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
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

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    videoElement.srcObject = cameraStream;
    setIsVideoReady(false);

    return () => {
      videoElement.srcObject = null;
    };
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  async function handleFiles(files: FileList | File[] | null) {
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

  async function handleRemoveImage(imageId: string) {
    const nextImages = images.filter((image) => image.id !== imageId);
    dispatch(setCapturedImages(nextImages));
    await saveCapturedImages(nextImages);
    pushToast("Image removed from the active capture session.");
  }

  function stopCamera() {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setIsStartingCamera(false);
    setIsCapturingPhoto(false);
    setIsVideoReady(false);
  }

  async function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;

    try {
      await handleFiles(input.files);
    } finally {
      input.value = "";
    }
  }

  async function handleOpenCamera() {
    stopCamera();

    if (
      captureExperience === "native-camera-input" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      setCameraError(null);
      setIsStartingCamera(true);
      const nextStream = await openPreferredCameraStream();
      setCameraStream(nextStream);
    } catch (error) {
      setCameraError(
        error instanceof Error ? error.message : "Unable to open the camera.",
      );
    } finally {
      setIsStartingCamera(false);
    }
  }

  async function handleCapturePhoto() {
    const videoElement = videoRef.current;
    if (!videoElement) {
      setCameraError("Camera preview is not ready yet.");
      return;
    }

    if (!videoElement.videoWidth || !videoElement.videoHeight) {
      setCameraError("Camera preview is not ready yet.");
      return;
    }

    try {
      setCameraError(null);
      setIsCapturingPhoto(true);

      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to capture a photo from the camera.");
      }

      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (nextBlob) => {
            if (!nextBlob) {
              reject(new Error("Unable to capture a photo from the camera."));
              return;
            }

            resolve(nextBlob);
          },
          "image/jpeg",
          0.92,
        );
      });

      const fileName = `business-card-${new Date().toISOString()}.jpg`;
      const file = new File([blob], fileName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      await handleFiles([file]);
    } catch (error) {
      setCameraError(
        error instanceof Error ? error.message : "Unable to capture a photo.",
      );
    } finally {
      setIsCapturingPhoto(false);
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
    <>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Capture business cards</CardTitle>
            <CardDescription>
              Mobile devices prefer the native camera experience. Desktop devices
              use the in-browser live preview, and some browsers may still show a
              chooser because camera capture is only a hint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 rounded-[28px] border border-dashed border-border bg-background/60 px-6 py-6">
              <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
                <Camera className="h-8 w-8 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium">
                    {captureExperience === "native-camera-input"
                      ? "Open native camera"
                      : "Open live camera"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {captureExperience === "native-camera-input"
                      ? "Mobile devices prefer the native camera flow with a rear-camera hint."
                      : "Desktop devices open the webcam in a larger capture dialog, and the front camera is used when no rear camera exists."}
                  </p>
                </div>
                <Button
                  type="button"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={handleOpenCamera}
                  disabled={isStartingCamera}
                >
                  <Camera className="h-4 w-4" />
                  {isStartingCamera ? "Opening camera..." : "Open camera"}
                </Button>
              </div>

              <input
                ref={cameraInputRef}
                className="hidden"
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(event) => void handleFileInputChange(event)}
              />
            </div>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-medium">
              <ImagePlus className="h-4 w-4" />
              Add images from library
              <input
                className="hidden"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => void handleFileInputChange(event)}
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
                    <div className="relative">
                      <img
                        src={image.dataUrl}
                        alt={image.fileName}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute right-3 top-3 bg-background/90"
                        onClick={() => void handleRemoveImage(image.id)}
                        aria-label={`Delete ${image.fileName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
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

      {cameraStream ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="desktop-camera-dialog-title"
        >
          <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-border/60 bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-5">
              <div className="space-y-1">
                <h2
                  id="desktop-camera-dialog-title"
                  className="text-xl font-semibold"
                >
                  Camera capture
                </h2>
                <p className="text-sm text-muted-foreground">
                  Use the larger webcam preview to frame the business card before
                  capturing.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={stopCamera}
              >
                Close camera
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
              <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-border/70 bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-contain"
                  onLoadedMetadata={() => setIsVideoReady(true)}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleCapturePhoto}
                  disabled={!isVideoReady || isCapturingPhoto}
                >
                  <Camera className="h-4 w-4" />
                  {isCapturingPhoto ? "Capturing..." : "Capture photo"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={stopCamera}
                >
                  Close camera
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
