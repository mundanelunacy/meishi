import { defineMessages, type IntlShape } from "react-intl";
import type { AnalyticsConsent } from "../../shared/types/models";
import type { PrivacyRegion } from "./bootstrap";

const messages = defineMessages({
  consentEyebrow: {
    id: "gdpr.consent.eyebrow",
    defaultMessage: "Privacy settings",
  },
  consentTitle: {
    id: "gdpr.consent.title",
    defaultMessage: "Allow optional analytics?",
  },
  consentBody1: {
    id: "gdpr.consent.body1",
    defaultMessage:
      "Meishi can collect limited usage data to understand which parts of the app are helpful and where problems occur.",
  },
  consentBody2: {
    id: "gdpr.consent.body2",
    defaultMessage:
      "Because you are visiting from a GDPR-region country, this stays off until you choose. You can change this later in Settings.",
  },
  consentAllow: {
    id: "gdpr.consent.allow",
    defaultMessage: "Allow analytics",
  },
  consentDecline: {
    id: "gdpr.consent.decline",
    defaultMessage: "Not now",
  },
  settingsTitle: {
    id: "gdpr.settings.title",
    defaultMessage: "Analytics",
  },
  settingsDescription: {
    id: "gdpr.settings.description",
    defaultMessage:
      "Product analytics are powered by PostHog. You can review and change this choice at any time.",
  },
  settingsCurrentStatusLabel: {
    id: "gdpr.settings.currentStatusLabel",
    defaultMessage: "Current status",
  },
  settingsUpdatedAtLabel: {
    id: "gdpr.settings.updatedAtLabel",
    defaultMessage: "Updated on {dateTime}",
  },
  settingsStatusGranted: {
    id: "gdpr.settings.status.granted",
    defaultMessage: "Analytics allowed",
  },
  settingsStatusDenied: {
    id: "gdpr.settings.status.denied",
    defaultMessage: "Analytics disabled",
  },
  settingsStatusPending: {
    id: "gdpr.settings.status.pending",
    defaultMessage: "No choice recorded yet",
  },
  settingsRegionGdpr: {
    id: "gdpr.settings.region.gdpr",
    defaultMessage: "Detected region: GDPR",
  },
  settingsRegionNonGdpr: {
    id: "gdpr.settings.region.nonGdpr",
    defaultMessage: "Detected region: non-GDPR",
  },
  settingsAllow: {
    id: "gdpr.settings.allow",
    defaultMessage: "Allow analytics",
  },
  settingsAllowHelp: {
    id: "gdpr.settings.allowHelp",
    defaultMessage:
      "Enable PostHog product analytics and error capture for this browser.",
  },
  settingsDecline: {
    id: "gdpr.settings.decline",
    defaultMessage: "Decline analytics",
  },
  settingsDeclineHelp: {
    id: "gdpr.settings.declineHelp",
    defaultMessage:
      "Keep PostHog disabled for this browser until you opt in later.",
  },
});

export function getConsentScreenContent(intl: IntlShape) {
  return {
    eyebrow: intl.formatMessage(messages.consentEyebrow),
    title: intl.formatMessage(messages.consentTitle),
    body: [
      intl.formatMessage(messages.consentBody1),
      intl.formatMessage(messages.consentBody2),
    ],
    allow: intl.formatMessage(messages.consentAllow),
    decline: intl.formatMessage(messages.consentDecline),
  };
}

function formatConsentStatus(
  intl: IntlShape,
  consent: AnalyticsConsent | undefined,
) {
  if (consent === "granted") {
    return intl.formatMessage(messages.settingsStatusGranted);
  }

  if (consent === "denied") {
    return intl.formatMessage(messages.settingsStatusDenied);
  }

  return intl.formatMessage(messages.settingsStatusPending);
}

export function getAnalyticsSettingsContent(
  intl: IntlShape,
  {
    consent,
    consentUpdatedAt,
    region,
  }: {
    consent: AnalyticsConsent | undefined;
    consentUpdatedAt?: string;
    region: PrivacyRegion;
  },
) {
  let updatedAtLabel: string | null = null;
  if (consentUpdatedAt) {
    updatedAtLabel = intl.formatMessage(messages.settingsUpdatedAtLabel, {
      dateTime: intl.formatDate(consentUpdatedAt, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    });
  }

  return {
    title: intl.formatMessage(messages.settingsTitle),
    description: intl.formatMessage(messages.settingsDescription),
    currentStatusLabel: intl.formatMessage(messages.settingsCurrentStatusLabel),
    currentStatus: formatConsentStatus(intl, consent),
    updatedAtLabel,
    regionLabel:
      region === "gdpr"
        ? intl.formatMessage(messages.settingsRegionGdpr)
        : intl.formatMessage(messages.settingsRegionNonGdpr),
    allow: intl.formatMessage(messages.settingsAllow),
    allowHelp: intl.formatMessage(messages.settingsAllowHelp),
    decline: intl.formatMessage(messages.settingsDecline),
    declineHelp: intl.formatMessage(messages.settingsDeclineHelp),
  };
}
