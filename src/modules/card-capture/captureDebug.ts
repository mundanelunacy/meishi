import { getDebugQueryKey, isDebugQueryEnabled } from "../../app/debug";
import { appEnv } from "../../app/env";

const CAPTURE_DEBUG_LOG_STORAGE_KEY = "meishi:capture-debug-log";
const CAPTURE_DEBUG_MAX_EDGE_STORAGE_KEY = "captureDebugMaxEdge";
const CAPTURE_DEBUG_LOG_LIMIT = 40;

export interface CaptureDebugEntry {
  timestamp: string;
  event: string;
  details?: string;
}

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseCaptureDebugLog(rawValue: string | null) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is CaptureDebugEntry => {
      if (!entry || typeof entry !== "object") {
        return false;
      }

      return (
        typeof Reflect.get(entry, "timestamp") === "string" &&
        typeof Reflect.get(entry, "event") === "string" &&
        (Reflect.get(entry, "details") === undefined ||
          typeof Reflect.get(entry, "details") === "string")
      );
    });
  } catch {
    return [];
  }
}

function formatCaptureDebugDetails(details: unknown) {
  if (details === undefined) {
    return undefined;
  }

  if (typeof details === "string") {
    return details;
  }

  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

export function readCaptureDebugLog() {
  if (!appEnv.isDevelopment || !canUseBrowserStorage()) {
    return [];
  }

  return parseCaptureDebugLog(window.localStorage.getItem(CAPTURE_DEBUG_LOG_STORAGE_KEY));
}

export function appendCaptureDebugEvent(event: string, details?: unknown) {
  if (!appEnv.isDevelopment || !canUseBrowserStorage()) {
    return [];
  }

  const nextEntry: CaptureDebugEntry = {
    timestamp: new Date().toISOString(),
    event,
    details: formatCaptureDebugDetails(details),
  };
  const nextEntries = [...readCaptureDebugLog(), nextEntry].slice(-CAPTURE_DEBUG_LOG_LIMIT);
  window.localStorage.setItem(CAPTURE_DEBUG_LOG_STORAGE_KEY, JSON.stringify(nextEntries));
  return nextEntries;
}

export function clearCaptureDebugLog() {
  if (!appEnv.isDevelopment || !canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(CAPTURE_DEBUG_LOG_STORAGE_KEY);
}

export function readCaptureDebugMaxEdge() {
  if (!appEnv.isDevelopment || typeof window === "undefined") {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const rawValue =
    searchParams.get(CAPTURE_DEBUG_MAX_EDGE_STORAGE_KEY) ??
    window.localStorage.getItem(CAPTURE_DEBUG_MAX_EDGE_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

export function getCaptureDebugMaxEdgeStorageKey() {
  return CAPTURE_DEBUG_MAX_EDGE_STORAGE_KEY;
}

export function isCaptureDebugPanelEnabled() {
  return appEnv.isDevelopment && isDebugQueryEnabled();
}

export function getCaptureDebugPanelQueryKey() {
  return getDebugQueryKey();
}
