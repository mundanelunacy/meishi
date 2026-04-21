import { createContext, useContext } from "react";

export type AnalyticsContextValue = {
  capture: (
    eventName: string,
    properties?: Record<string, unknown> | null,
  ) => void;
  captureException: (
    error: unknown,
    properties?: Record<string, unknown>,
  ) => void;
  isEnabled: boolean;
};

export const noopAnalytics: AnalyticsContextValue = {
  capture: () => {},
  captureException: () => {},
  isEnabled: false,
};

export const AnalyticsContext =
  createContext<AnalyticsContextValue>(noopAnalytics);

export function useAnalytics() {
  return useContext(AnalyticsContext);
}
