import type { AppLocale } from "../shared/types/models";
import jaMessages from "./locales/ja.json";
import koMessages from "./locales/ko.json";

export const DEFAULT_LOCALE: AppLocale = "en-US";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  "en-US": "English",
  ja: "日本語",
  ko: "한국어",
};

const localeMessages: Record<AppLocale, Record<string, string>> = {
  "en-US": {},
  ja: jaMessages,
  ko: koMessages,
};

export function getLocaleMessages(locale: AppLocale) {
  return localeMessages[locale] ?? localeMessages[DEFAULT_LOCALE];
}
