import type { AppLocale } from "../shared/types/models";
import jaMessages from "./locales/ja.json";

export const DEFAULT_LOCALE: AppLocale = "en-US";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  "en-US": "English (US)",
  ja: "Japanese",
};

const localeMessages: Record<AppLocale, Record<string, string>> = {
  "en-US": {},
  ja: jaMessages,
};

export function getLocaleMessages(locale: AppLocale) {
  return localeMessages[locale] ?? localeMessages[DEFAULT_LOCALE];
}
