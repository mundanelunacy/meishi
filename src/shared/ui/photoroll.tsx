import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { CapturedCardImage } from "../types/models";
import { cn } from "../lib/utils";
import { Alert } from "./alert";
import { Button } from "./button";

interface PhotorollProps {
  images: CapturedCardImage[];
  emptyMessage?: string;
  getItemClassName?: (image: CapturedCardImage) => string | undefined;
  renderOverlayAction?: (image: CapturedCardImage) => ReactNode;
  renderFooter?: (image: CapturedCardImage) => ReactNode;
}

export function Photoroll({
  images,
  emptyMessage = "No images captured yet.",
  getItemClassName,
  renderOverlayAction,
  renderFooter,
}: PhotorollProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }

    if (!images.length) {
      setLightboxIndex(null);
      return;
    }

    if (lightboxIndex >= images.length) {
      setLightboxIndex(images.length - 1);
    }
  }, [images, lightboxIndex]);

  const lightboxImage =
    lightboxIndex === null ? null : images[lightboxIndex] ?? null;
  const hasMultipleImages = images.length > 1;

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  function showPreviousImage() {
    if (!images.length || lightboxIndex === null) {
      return;
    }

    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  }

  function showNextImage() {
    if (!images.length || lightboxIndex === null) {
      return;
    }

    setLightboxIndex((lightboxIndex + 1) % images.length);
  }

  return (
    <>
      {images.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                "overflow-hidden rounded-xl border border-border bg-background",
                getItemClassName?.(image),
              )}
            >
              <div className="relative">
                <button
                  type="button"
                  className="block w-full"
                  onClick={() => openLightbox(index)}
                  aria-label={`Open ${image.fileName}`}
                >
                  <img
                    src={image.dataUrl}
                    alt={image.fileName}
                    className="aspect-[4/3] w-full object-cover transition-opacity hover:opacity-95"
                  />
                </button>
                {renderOverlayAction ? (
                  <div className="absolute right-3 top-3">
                    {renderOverlayAction(image)}
                  </div>
                ) : null}
              </div>
              <div className="space-y-1 p-4 text-xs text-muted-foreground">
                {renderFooter ? (
                  renderFooter(image)
                ) : (
                  <>
                    <p className="font-medium text-foreground">
                      {image.fileName}
                    </p>
                    <p>
                      {image.width}×{image.height} •{" "}
                      {new Date(image.capturedAt).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Alert>{emptyMessage}</Alert>
      )}

      {lightboxImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="photoroll-lightbox-title"
        >
          <div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-black text-white shadow-elevated">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <h2
                  id="photoroll-lightbox-title"
                  className="truncate text-lg font-semibold"
                >
                  {lightboxImage.fileName}
                </h2>
                <p className="text-sm text-white/70">
                  {lightboxImage.width}×{lightboxImage.height}
                  {hasMultipleImages
                    ? ` • ${lightboxIndex! + 1} of ${images.length}`
                    : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="shrink-0 text-white hover:bg-white/10 hover:text-white"
                onClick={closeLightbox}
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black px-4 py-4 sm:px-6">
              {hasMultipleImages ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-3 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-black/55 px-0 text-white hover:bg-black/75 hover:text-white"
                  onClick={showPreviousImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              ) : null}
              <img
                src={lightboxImage.dataUrl}
                alt={lightboxImage.fileName}
                className="max-h-full max-w-full object-contain"
              />
              {hasMultipleImages ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-black/55 px-0 text-white hover:bg-black/75 hover:text-white"
                  onClick={showNextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
