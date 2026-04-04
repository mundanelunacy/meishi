import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function base64FromDataUrl(dataUrl: string) {
  const [, base64] = dataUrl.split(",");
  return base64 ?? "";
}

export function assertNever(value: never) {
  throw new Error(`Unexpected value: ${String(value)}`);
}
