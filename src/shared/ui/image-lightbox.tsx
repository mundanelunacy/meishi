import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "./button";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
const WHEEL_ZOOM_STEP = 0.25;

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

interface ViewportPoint {
  x: number;
  y: number;
}

interface PinchState {
  startDistance: number;
  startMidpoint: ViewportPoint;
  startOffset: ViewportPoint;
  startZoom: number;
}

function getOffsetForZoom(
  anchor: ViewportPoint,
  currentOffset: ViewportPoint,
  currentZoom: number,
  nextZoom: number,
): ViewportPoint {
  if (nextZoom === MIN_ZOOM) {
    return { x: 0, y: 0 };
  }

  return {
    x: anchor.x - ((anchor.x - currentOffset.x) / currentZoom) * nextZoom,
    y: anchor.y - ((anchor.y - currentOffset.y) / currentZoom) * nextZoom,
  };
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
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    originX: number;
    originY: number;
  } | null>(null);
  const pinchStateRef = useRef<PinchState | null>(null);
  const zoomRef = useRef(MIN_ZOOM);
  const offsetRef = useRef<ViewportPoint>({ x: 0, y: 0 });
  const hasMultipleImages = typeof total === "number" && total > 1;

  useEffect(() => {
    zoomRef.current = MIN_ZOOM;
    offsetRef.current = { x: 0, y: 0 };
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
    setCaptionsVisible(true);
    dragStartRef.current = null;
    pinchStateRef.current = null;
  }, [src]);

  function getViewportPoint(clientX: number, clientY: number): ViewportPoint {
    const viewport = viewportRef.current;

    if (!viewport) {
      return { x: 0, y: 0 };
    }

    const rect = viewport.getBoundingClientRect();

    return {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
  }

  function commitView(nextZoom: number, nextOffset: ViewportPoint) {
    const normalizedOffset =
      nextZoom === MIN_ZOOM ? { x: 0, y: 0 } : nextOffset;

    zoomRef.current = nextZoom;
    offsetRef.current = normalizedOffset;
    setZoom(nextZoom);
    setOffset(normalizedOffset);
  }

  function zoomTo(nextZoom: number, anchor: ViewportPoint = { x: 0, y: 0 }) {
    const currentZoom = zoomRef.current;
    const currentOffset = offsetRef.current;
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);

    commitView(
      clampedZoom,
      getOffsetForZoom(anchor, currentOffset, currentZoom, clampedZoom),
    );
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (zoomRef.current <= MIN_ZOOM || pinchStateRef.current) {
      return;
    }

    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      originX: offsetRef.current.x,
      originY: offsetRef.current.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    if (!dragStart || zoomRef.current <= MIN_ZOOM || pinchStateRef.current) {
      return;
    }

    const nextOffset = {
      x: dragStart.originX + (event.clientX - dragStart.x),
      y: dragStart.originY + (event.clientY - dragStart.y),
    };

    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStartRef.current = null;
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      return;
    }

    dragStartRef.current = null;

    const firstTouch = event.touches[0];
    const secondTouch = event.touches[1];
    const startMidpoint = getViewportPoint(
      (firstTouch.clientX + secondTouch.clientX) / 2,
      (firstTouch.clientY + secondTouch.clientY) / 2,
    );
    const startDistance = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );

    pinchStateRef.current = {
      startDistance: Math.max(startDistance, 1),
      startMidpoint,
      startOffset: offsetRef.current,
      startZoom: zoomRef.current,
    };
  }

  function handleTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    const pinchState = pinchStateRef.current;

    if (!pinchState || event.touches.length < 2) {
      return;
    }

    const firstTouch = event.touches[0];
    const secondTouch = event.touches[1];
    const midpoint = getViewportPoint(
      (firstTouch.clientX + secondTouch.clientX) / 2,
      (firstTouch.clientY + secondTouch.clientY) / 2,
    );
    const distance = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );
    const nextZoom = clamp(
      pinchState.startZoom * (distance / pinchState.startDistance),
      MIN_ZOOM,
      MAX_ZOOM,
    );
    const zoomedOffset = getOffsetForZoom(
      pinchState.startMidpoint,
      pinchState.startOffset,
      pinchState.startZoom,
      nextZoom,
    );

    event.preventDefault();
    commitView(nextZoom, {
      x: zoomedOffset.x + (midpoint.x - pinchState.startMidpoint.x),
      y: zoomedOffset.y + (midpoint.y - pinchState.startMidpoint.y),
    });
  }

  function handleTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      pinchStateRef.current = null;
    }
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    const zoomDelta = clamp(
      -event.deltaY * 0.0025,
      -WHEEL_ZOOM_STEP,
      WHEEL_ZOOM_STEP,
    );

    if (zoomDelta === 0) {
      return;
    }

    event.preventDefault();
    zoomTo(
      zoomRef.current + zoomDelta,
      getViewportPoint(event.clientX, event.clientY),
    );
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
            <h2
              id="image-lightbox-title"
              className="truncate text-lg font-semibold"
            >
              {title}
            </h2>
            <p className="text-sm text-white/70">
              {subtitle}
              {hasMultipleImages && typeof index === "number"
                ? ` • ${index + 1} of ${total}`
                : ""}
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
            ref={viewportRef}
            className="relative flex h-full w-full touch-none items-center justify-center overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onWheel={handleWheel}
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
                transition: dragStartRef.current
                  ? "none"
                  : "transform 160ms ease-out",
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
