import { useEffect, useState, type ReactNode } from "react";
import type { CapturedCardImage } from "../types/models";
import { cn } from "../lib/utils";
import { Alert } from "./alert";
import { ImageLightbox } from "./image-lightbox";

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
        <ImageLightbox
          alt={lightboxImage.fileName}
          src={lightboxImage.dataUrl}
          title={lightboxImage.fileName}
          subtitle={`${lightboxImage.width}×${lightboxImage.height}`}
          index={lightboxIndex ?? undefined}
          total={images.length}
          onClose={closeLightbox}
          onPrevious={hasMultipleImages ? showPreviousImage : undefined}
          onNext={hasMultipleImages ? showNextImage : undefined}
        />
      ) : null}
    </>
  );
}
