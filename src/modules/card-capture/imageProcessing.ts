import type { CapturedCardImage } from "../../shared/types/models";
import { fileToDataUrl } from "../../shared/lib/utils";

async function measureImage(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => reject(new Error("Unable to read image dimensions."));
    image.src = dataUrl;
  });
}

export async function createCapturedCardImages(files: FileList | File[]) {
  const fileArray = Array.from(files);

  return Promise.all(
    fileArray.map(async (file) => {
      const dataUrl = await fileToDataUrl(file);
      const dimensions = await measureImage(dataUrl);
      const capturedAt = new Date().toISOString();

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
    })
  );
}
