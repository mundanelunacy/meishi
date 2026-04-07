import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "./button";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

interface ImageLightboxProps {
  alt: string;
  caption?: ReactNode;
  index?: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  src: string;
  subtitle?: string;
  title: string;
  total?: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ImageLightbox({
  alt,
  caption,
  index,
  onClose,
  onNext,
  onPrevious,
  src,
  subtitle,
  title,
  total,
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [captionsVisible, setCaptionsVisible] = useState(true);
  const dragStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(
    null,
  );
  const hasMultipleImages = typeof total === "number" && total > 1;

  useEffect(() => {
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
    setCaptionsVisible(true);
    dragStartRef.current = null;
  }, [src]);

  function zoomTo(nextZoom: number) {
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    setZoom(clampedZoom);

    if (clampedZoom === MIN_ZOOM) {
      setOffset({ x: 0, y: 0 });
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (zoom <= MIN_ZOOM) {
      return;
    }

    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    if (!dragStart || zoom <= MIN_ZOOM) {
      return;
    }

    setOffset({
      x: dragStart.originX + (event.clientX - dragStart.x),
      y: dragStart.originY + (event.clientY - dragStart.y),
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStartRef.current = null;
  }

  function toggleCaptions() {
    if (!caption) {
      return;
    }

    setCaptionsVisible((current) => !current);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-lightbox-title"
    >
      <div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-black text-white shadow-elevated">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 border-b border-white/10 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <h2 id="image-lightbox-title" className="truncate text-lg font-semibold">
              {title}
            </h2>
            <p className="text-sm text-white/70">
              {subtitle}
              {hasMultipleImages && typeof index === "number" ? ` • ${index + 1} of ${total}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-self-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full bg-white/5 px-0 text-white hover:bg-white/10 hover:text-white"
              onClick={() => zoomTo(zoom - ZOOM_STEP)}
              aria-label="Zoom out"
              disabled={zoom <= MIN_ZOOM}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full bg-white/5 px-0 text-white hover:bg-white/10 hover:text-white"
              onClick={() => zoomTo(zoom + ZOOM_STEP)}
              aria-label="Zoom in"
              disabled={zoom >= MAX_ZOOM}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 rounded-full bg-white/5 px-3 text-white hover:bg-white/10 hover:text-white"
              onClick={() => zoomTo(MIN_ZOOM)}
              disabled={zoom === MIN_ZOOM && offset.x === 0 && offset.y === 0}
            >
              <RotateCcw className="h-4 w-4" />
              Reset view
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="shrink-0 text-white hover:bg-white/10 hover:text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black px-4 py-4 sm:px-6">
          {hasMultipleImages ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute left-3 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-black/55 px-0 text-white hover:bg-black/75 hover:text-white"
              onClick={onPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          ) : null}
          <div
            className="relative flex h-full w-full touch-none items-center justify-center overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ cursor: zoom > MIN_ZOOM ? "grab" : "default" }}
          >
            <img
              src={src}
              alt={alt}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
              onClick={toggleCaptions}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                transition: dragStartRef.current ? "none" : "transform 160ms ease-out",
              }}
            />
            {caption && captionsVisible ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-5 pb-5 pt-20">
                {caption}
              </div>
            ) : null}
          </div>
          {hasMultipleImages ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-black/55 px-0 text-white hover:bg-black/75 hover:text-white"
              onClick={onNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
