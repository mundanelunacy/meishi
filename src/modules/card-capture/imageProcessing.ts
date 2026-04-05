import { appEnv } from "../../app/env";
import type { CapturedCardImage } from "../../shared/types/models";
import { fileToDataUrl } from "../../shared/lib/utils";
import { appendCaptureDebugEvent, readCaptureDebugMaxEdge } from "./captureDebug";

function loadImageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read image dimensions."));
    image.src = url;
  });
}

async function measureImage(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => reject(new Error("Unable to read image dimensions."));
    image.src = dataUrl;
  });
}

function getSupportedCanvasMimeType(fileType: string) {
  if (fileType === "image/png" || fileType === "image/webp") {
    return fileType;
  }

  return "image/jpeg";
}

async function buildCapturedImageDataUrl(file: File) {
  const debugMaxEdge = readCaptureDebugMaxEdge();

  if (!debugMaxEdge || typeof URL === "undefined") {
    return {
      dataUrl: await fileToDataUrl(file),
      sourceWidth: null,
      sourceHeight: null,
      outputWidth: null,
      outputHeight: null,
      downscaled: false,
      debugMaxEdge,
    };
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromUrl(objectUrl);
    const longestEdge = Math.max(image.width, image.height);

    if (longestEdge <= debugMaxEdge) {
      return {
        dataUrl: await fileToDataUrl(file),
        sourceWidth: image.width,
        sourceHeight: image.height,
        outputWidth: image.width,
        outputHeight: image.height,
        downscaled: false,
        debugMaxEdge,
      };
    }

    const scale = debugMaxEdge / longestEdge;
    const outputWidth = Math.max(1, Math.round(image.width * scale));
    const outputHeight = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to downscale the captured image.");
    }

    context.drawImage(image, 0, 0, outputWidth, outputHeight);

    return {
      dataUrl: canvas.toDataURL(getSupportedCanvasMimeType(file.type), 0.92),
      sourceWidth: image.width,
      sourceHeight: image.height,
      outputWidth,
      outputHeight,
      downscaled: true,
      debugMaxEdge,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function createCapturedCardImages(files: FileList | File[]) {
  const fileArray = Array.from(files);

  return Promise.all(
    fileArray.map(async (file) => {
      const {
        dataUrl,
        sourceWidth,
        sourceHeight,
        outputWidth,
        outputHeight,
        downscaled,
        debugMaxEdge,
      } = await buildCapturedImageDataUrl(file);
      const dimensions =
        outputWidth && outputHeight
          ? { width: outputWidth, height: outputHeight }
          : await measureImage(dataUrl);
      const capturedAt = new Date().toISOString();

      if (appEnv.isDevelopment) {
        appendCaptureDebugEvent("createCapturedCardImages:file", {
          fileName: file.name || `business-card-${capturedAt}.jpg`,
          fileSize: file.size,
          mimeType: file.type || "image/jpeg",
          originalWidth: sourceWidth ?? dimensions.width,
          originalHeight: sourceHeight ?? dimensions.height,
          width: dimensions.width,
          height: dimensions.height,
          dataUrlLength: dataUrl.length,
          downscaled,
          debugMaxEdge,
        });
      }

      const image: CapturedCardImage = {
        id: crypto.randomUUID(),
        dataUrl,
        fileName: file.name || `business-card-${capturedAt}.jpg`,
        mimeType: file.type || "image/jpeg",
        capturedAt,
        width: dimensions.width,
        height: dimensions.height,
      };

      return image;
    }),
  );
}
