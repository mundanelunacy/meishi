import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Camera, ImagePlus, Sparkles, Trash2 } from "lucide-react";
import { Spinner } from "../../shared/ui/spinner";
import { appEnv } from "../../app/env";
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
import { openPreferredCameraStream } from "./cameraFacingMode";
import { detectPreferredCaptureExperience } from "./captureExperience";
import {
  appendCaptureDebugEvent,
  clearCaptureDebugLog,
  getCaptureDebugPanelQueryKey,
  getCaptureDebugMaxEdgeStorageKey,
  isCaptureDebugPanelEnabled,
  readCaptureDebugLog,
  readCaptureDebugMaxEdge,
} from "./captureDebug";
import {
  loadCapturedImages,
  saveCapturedImages,
  saveDraft,
} from "../local-data";
import {
  createContactDraft,
  populateDraftFromExtraction,
  selectCapturedImages,
  setCapturedImages,
} from "../contact-review/reviewDraftSlice";
import { useExtractBusinessCardMutation } from "../card-extraction/extractionApi";
import { Photoroll } from "../../shared/ui/photoroll";
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
  const initialImageCountRef = useRef(images.length);
  const hydratedCaptureSessionRef = useRef(false);
  const latestImagesRef = useRef(images);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captureExperience] = useState(() =>
    detectPreferredCaptureExperience(),
  );
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [debugEntries, setDebugEntries] = useState(() => readCaptureDebugLog());
  const [extractBusinessCard, extraction] = useExtractBusinessCardMutation();
  const captureDebugMaxEdge = readCaptureDebugMaxEdge();
  const isDebugPanelEnabled = isCaptureDebugPanelEnabled();
  const pageSessionId =
    typeof window === "undefined"
      ? "server"
      : (window.__meishiPageSessionId ?? "unset");

  function refreshDebugEntries() {
    if (!appEnv.isDevelopment) {
      return;
    }

    setDebugEntries(readCaptureDebugLog());
  }

  function logDebugEvent(event: string, details?: unknown) {
    if (!appEnv.isDevelopment) {
      return;
    }

    setDebugEntries(appendCaptureDebugEvent(event, details));
  }

  useEffect(() => {
    latestImagesRef.current = images;
  }, [images]);

  useEffect(() => {
    if (hydratedCaptureSessionRef.current) {
      return;
    }

    hydratedCaptureSessionRef.current = true;
    if (images.length) {
      return;
    }

    let cancelled = false;

    void loadCapturedImages().then((storedImages) => {
      if (cancelled || latestImagesRef.current.length || !storedImages.length) {
        return;
      }

      if (storedImages.length) {
        dispatch(setCapturedImages(storedImages));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch, images.length]);

  useEffect(() => {
    if (!appEnv.isDevelopment || typeof window === "undefined") {
      return;
    }

    setDebugEntries(
      appendCaptureDebugEvent("component:mounted", {
        imageCount: initialImageCountRef.current,
        pageSessionId: window.__meishiPageSessionId ?? "unset",
      }),
    );

    const handlePageShow = (event: PageTransitionEvent) => {
      setDebugEntries(
        appendCaptureDebugEvent("window:pageshow", {
          persisted: event.persisted,
          pageSessionId: window.__meishiPageSessionId ?? "unset",
        }),
      );
    };
    const handlePageHide = (event: PageTransitionEvent) => {
      setDebugEntries(
        appendCaptureDebugEvent("window:pagehide", {
          persisted: event.persisted,
          pageSessionId: window.__meishiPageSessionId ?? "unset",
        }),
      );
    };
    const handleBeforeUnload = () => {
      appendCaptureDebugEvent("window:beforeunload", {
        pageSessionId: window.__meishiPageSessionId ?? "unset",
      });
    };
    const handleVisibilityChange = () => {
      setDebugEntries(
        appendCaptureDebugEvent("document:visibilitychange", {
          pageSessionId: window.__meishiPageSessionId ?? "unset",
          visibilityState: document.visibilityState,
        }),
      );
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      appendCaptureDebugEvent("component:unmounted", {
        pageSessionId: window.__meishiPageSessionId ?? "unset",
      });
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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
      logDebugEvent("handleFiles:skipped-empty");
      return;
    }

    try {
      logDebugEvent("handleFiles:start", { fileCount: files.length });
      logDebugEvent("createCapturedCardImages:start", {
        fileCount: files.length,
      });
      const nextImages = [
        ...images,
        ...(await createCapturedCardImages(files)),
      ];
      refreshDebugEntries();
      logDebugEvent("createCapturedCardImages:end", {
        nextImageCount: nextImages.length,
      });
      dispatch(setCapturedImages(nextImages));
      logDebugEvent("saveCapturedImages:start", {
        nextImageCount: nextImages.length,
      });
      await saveCapturedImages(nextImages);
      logDebugEvent("saveCapturedImages:end", {
        nextImageCount: nextImages.length,
      });
      pushToast(
        `${files.length} image${files.length === 1 ? "" : "s"} added to the active capture session.`,
      );
      logDebugEvent("toast:pushed", { fileCount: files.length });
      setCameraError(null);
    } catch (error) {
      logDebugEvent("handleFiles:error", {
        message:
          error instanceof Error ? error.message : "Unable to process images.",
      });
      setCameraError(
        error instanceof Error ? error.message : "Unable to process images.",
      );
    }
  }

  async function handleRemoveImage(imageId: string) {
    const nextImages = images.filter((image) => image.id !== imageId);
    dispatch(setCapturedImages(nextImages));
    logDebugEvent("handleRemoveImage:start", {
      imageId,
      nextImageCount: nextImages.length,
    });
    await saveCapturedImages(nextImages);
    logDebugEvent("handleRemoveImage:end", {
      imageId,
      nextImageCount: nextImages.length,
    });
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
    logDebugEvent("handleFileInputChange", {
      fileCount: input.files?.length ?? 0,
      inputCapture: input.getAttribute("capture") ?? "none",
    });

    try {
      await handleFiles(input.files);
    } finally {
      input.value = "";
    }
  }

  async function handleOpenCamera() {
    logDebugEvent("handleOpenCamera", {
      captureExperience,
      hasGetUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
    });
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
      logDebugEvent("handleOpenCamera:live-preview-opened");
    } catch (error) {
      logDebugEvent("handleOpenCamera:error", {
        message:
          error instanceof Error ? error.message : "Unable to open the camera.",
      });
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
      logDebugEvent("handleCapturePhoto:start", {
        height: videoElement.videoHeight,
        width: videoElement.videoWidth,
      });

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
      logDebugEvent("handleCapturePhoto:end", { fileName });
    } catch (error) {
      logDebugEvent("handleCapturePhoto:error", {
        message:
          error instanceof Error ? error.message : "Unable to capture a photo.",
      });
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Photoroll</CardTitle>
          </CardHeader>
          <CardContent>
            <Photoroll
              images={images}
              renderOverlayAction={(image) => (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="bg-background/90"
                  onClick={() => void handleRemoveImage(image.id)}
                  aria-label={`Delete ${image.fileName}`}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capture business cards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex aspect-square h-auto flex-col justify-center gap-3 rounded-2xl px-4 py-6 text-center"
                onClick={handleOpenCamera}
                disabled={isStartingCamera}
              >
                {isStartingCamera ? (
                  <Spinner />
                ) : (
                  <Camera className="h-8 w-8 text-primary" />
                )}
                <span className="text-base font-semibold">
                  {isStartingCamera ? "Opening camera..." : "Open Camera"}
                </span>
              </Button>

              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-background px-4 py-6 text-center transition-colors hover:bg-muted/40">
                <ImagePlus className="h-8 w-8 text-primary" />
                <span className="text-base font-semibold">
                  Add images from library
                </span>
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void handleFileInputChange(event)}
                />
              </label>

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

            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={handleExtract}
              disabled={extraction.isLoading || images.length === 0}
            >
              {extraction.isLoading ? (
                <Spinner />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {extraction.isLoading ? "Extracting..." : "Extract contact draft"}
            </Button>

            {cameraError ? (
              <Alert className="border-destructive/30 text-destructive">
                {cameraError}
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {isDebugPanelEnabled ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Capture debug</CardTitle>
            <CardDescription>
              Tracks page lifetime and capture events across reloads. Use `?
              {getCaptureDebugPanelQueryKey()}=1` to show this panel, and use `?
              {getCaptureDebugMaxEdgeStorageKey()}=1600` or localStorage to
              enable temporary downscaling.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="rounded-full border border-border px-3 py-1">
                Page session:{" "}
                <span className="font-mono text-foreground">
                  {pageSessionId}
                </span>
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                Downscale max edge:{" "}
                <span className="font-mono text-foreground">
                  {captureDebugMaxEdge ?? "disabled"}
                </span>
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                clearCaptureDebugLog();
                refreshDebugEntries();
              }}
            >
              Clear debug log
            </Button>
            <div className="rounded-xl border border-border bg-background p-4">
              {debugEntries.length ? (
                <ol className="space-y-2 font-mono text-xs text-muted-foreground">
                  {debugEntries.slice(-15).map((entry, index) => (
                    <li
                      key={`${entry.timestamp}-${entry.event}-${index}`}
                      className="space-y-1 break-all border-b border-border/50 pb-2 last:border-b-0 last:pb-0"
                    >
                      <p className="text-foreground">
                        {entry.timestamp} {entry.event}
                      </p>
                      {entry.details ? <p>{entry.details}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <Alert>No capture debug events recorded yet.</Alert>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {cameraStream ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="desktop-camera-dialog-title"
        >
          <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-elevated">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div className="space-y-1">
                <h2
                  id="desktop-camera-dialog-title"
                  className="text-xl font-semibold"
                >
                  Camera capture
                </h2>
                <p className="text-sm text-muted-foreground">
                  Use the larger webcam preview to frame the business card
                  before capturing.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={stopCamera}>
                Close camera
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-black">
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
                  {isCapturingPhoto ? (
                    <Spinner />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
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
