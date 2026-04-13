import { defineMessages, type IntlShape } from "react-intl";

const messages = defineMessages({
  privacyTitle: {
    id: "legal.privacy.title",
    defaultMessage: "Privacy Policy",
  },
  privacySummary: {
    id: "legal.privacy.summary",
    defaultMessage:
      "Meishi is designed to keep business-card data local to your device whenever possible. This page explains what stays in the browser, what is sent to third parties, and when Firebase Functions are involved.",
  },
  privacyOverviewTitle: {
    id: "legal.privacy.overview.title",
    defaultMessage: "Overview",
  },
  privacyOverviewBody1: {
    id: "legal.privacy.overview.body1",
    defaultMessage:
      "Meishi is a browser-only progressive web app for capturing business card images, extracting structured contact details with a user-chosen LLM provider, reviewing the result, exporting a vCard, and optionally syncing the verified contact to Google Contacts.",
  },
  privacyOverviewBody2: {
    id: "legal.privacy.overview.body2",
    defaultMessage:
      "The app is open source and follows a bring-your-own-key model for LLM extraction. That means the app does not provide its own hosted model service for routine card extraction.",
  },
  privacyStoredTitle: {
    id: "legal.privacy.stored.title",
    defaultMessage: "Data stored on your device",
  },
  privacyStoredIntro: {
    id: "legal.privacy.stored.intro",
    defaultMessage:
      "Meishi stores the following information locally in your browser so the app can work across refreshes and offline sessions:",
  },
  privacyStoredItem1: {
    id: "legal.privacy.stored.item1",
    defaultMessage: "Selected LLM provider and preferred model",
  },
  privacyStoredItem2: {
    id: "legal.privacy.stored.item2",
    defaultMessage: "Provider API keys entered by you",
  },
  privacyStoredItem3: {
    id: "legal.privacy.stored.item3",
    defaultMessage: "Appearance settings and extraction prompt preferences",
  },
  privacyStoredItem4: {
    id: "legal.privacy.stored.item4",
    defaultMessage:
      "Captured card images, draft contact data, and extraction snapshots",
  },
  privacyStoredItem5: {
    id: "legal.privacy.stored.item5",
    defaultMessage:
      "Append-only local sync history and lightweight Google connection metadata",
  },
  privacyStoredBody: {
    id: "legal.privacy.stored.body",
    defaultMessage:
      "This local data is stored using browser storage such as localStorage and IndexedDB. It remains on the device and browser profile you use, unless you clear it yourself or reset the app.",
  },
  privacyThirdPartyTitle: {
    id: "legal.privacy.thirdParty.title",
    defaultMessage: "Data sent to third parties",
  },
  privacyThirdPartyBody1: {
    id: "legal.privacy.thirdParty.body1",
    defaultMessage:
      "When you run extraction, the captured card image data and the fixed extraction prompt are sent directly from your browser to the LLM provider you selected, using the API key you supplied.",
  },
  privacyThirdPartyBody2: {
    id: "legal.privacy.thirdParty.body2",
    defaultMessage:
      "When you choose Google Contacts sync, Meishi sends the reviewed contact data and one selected image to Google APIs so the contact can be created and the contact photo uploaded.",
  },
  privacyThirdPartyBody3: {
    id: "legal.privacy.thirdParty.body3",
    defaultMessage:
      "Those external providers operate under their own terms and privacy policies. Meishi does not control how OpenAI, Anthropic, Google, or other providers process data once you send it to them.",
  },
  privacyDisclosureTitle: {
    id: "legal.privacy.disclosure.title",
    defaultMessage: "How Meishi shares, transfers, or discloses Google user data",
  },
  privacyDisclosureBody1: {
    id: "legal.privacy.disclosure.body1",
    defaultMessage:
      "Meishi uses Google user data only to let you connect your Google account, create or update Google Contacts that you explicitly choose to sync, upload an optional contact photo for that contact, maintain your connection status, and support token refresh, disconnect, and account-reconnection flows.",
  },
  privacyDisclosureBody2: {
    id: "legal.privacy.disclosure.body2",
    defaultMessage:
      "Meishi does not sell Google user data or share it with advertisers, data brokers, or other unrelated third parties. Google user data is disclosed only to Google for the Google Contacts features you request and to the Firebase and Google Cloud services used to exchange OAuth codes, store refresh tokens server-side, mint short-lived access tokens, and run disconnect or retention-cleanup tasks.",
  },
  privacyDisclosureBody3: {
    id: "legal.privacy.disclosure.body3",
    defaultMessage:
      "Meishi does not use Google user data for advertising, resale, unrelated profiling, or training generalized AI models. Limited disclosure may occur only if required to comply with applicable law, enforce the app's terms, protect against fraud or security issues, or complete a merger, acquisition, or asset transfer.",
  },
  privacyFirebaseTitle: {
    id: "legal.privacy.firebase.title",
    defaultMessage: "Firebase and Google authorization",
  },
  privacyFirebaseBody1: {
    id: "legal.privacy.firebase.body1",
    defaultMessage:
      "Google authorization is handled through Firebase-backed browser flows and Firebase Functions. Functions act as a token broker for OAuth code exchange, refresh-token storage, short-lived access-token refresh, and disconnection or retention cleanup tasks.",
  },
  privacyFirebaseBody2: {
    id: "legal.privacy.firebase.body2",
    defaultMessage:
      "Meishi does not store durable Google bearer tokens in browser storage. The browser may store lightweight metadata such as connected account email, granted scope, and connection timestamps.",
  },
  privacyRetentionTitle: {
    id: "legal.privacy.retention.title",
    defaultMessage: "Retention",
  },
  privacyRetentionBody1: {
    id: "legal.privacy.retention.body1",
    defaultMessage:
      "Local data remains in your browser until you remove it. Server-side Google credential records used for token brokering are currently subject to a retention cleanup job that deletes stored records after about 90 days from connection time.",
  },
  privacyRetentionBody2: {
    id: "legal.privacy.retention.body2",
    defaultMessage:
      "If those backend records are deleted, you may need to reconnect your Google account before syncing again.",
  },
  privacySecurityTitle: {
    id: "legal.privacy.security.title",
    defaultMessage: "Security limitations",
  },
  privacySecurityBody1: {
    id: "legal.privacy.security.body1",
    defaultMessage:
      "Meishi is privacy-oriented, but it is still a prototype-oriented browser app. Provider API keys are stored client-side for convenience, which is acceptable for personal use on a trusted device but is not a production-grade secret-management model.",
  },
  privacySecurityBody2: {
    id: "legal.privacy.security.body2",
    defaultMessage:
      "You are responsible for deciding whether the information on a card is appropriate to process with your selected LLM provider or Google account.",
  },
  privacyChoicesTitle: {
    id: "legal.privacy.choices.title",
    defaultMessage: "Your choices",
  },
  privacyChoicesBody: {
    id: "legal.privacy.choices.body",
    defaultMessage:
      "You can stop using Meishi at any time, clear browser storage, remove the app, revoke Google access from your Google account, and delete generated contacts from Google Contacts if you no longer want them stored there.",
  },
  termsTitle: {
    id: "legal.terms.title",
    defaultMessage: "Terms of Service",
  },
  termsSummary: {
    id: "legal.terms.summary",
    defaultMessage:
      "These terms govern use of the Meishi web app and related open-source project materials. They focus on the current browser-only product shape, third-party integrations, and prototype limitations.",
  },
  termsUseTitle: {
    id: "legal.terms.use.title",
    defaultMessage: "Use of the app",
  },
  termsUseBody1: {
    id: "legal.terms.use.body1",
    defaultMessage:
      "Meishi is provided as a browser-based tool for scanning business cards, extracting structured contact information, reviewing results, exporting vCards, and optionally syncing contacts to Google Contacts.",
  },
  termsUseBody2: {
    id: "legal.terms.use.body2",
    defaultMessage:
      "You may use the app only in compliance with applicable law, the rights of the people whose information you process, and the terms of any third-party provider you connect to through the app.",
  },
  termsResponsibilitiesTitle: {
    id: "legal.terms.responsibilities.title",
    defaultMessage: "Your responsibilities",
  },
  termsResponsibilitiesBody1: {
    id: "legal.terms.responsibilities.body1",
    defaultMessage:
      "You are responsible for the data you upload or process, the API keys and connected accounts you use, and the accuracy of any contact data you decide to export or sync.",
  },
  termsResponsibilitiesBody2: {
    id: "legal.terms.responsibilities.body2",
    defaultMessage:
      "Meishi can assist with extraction, but you remain responsible for reviewing the output before saving, sharing, or syncing it to another service.",
  },
  termsThirdPartyTitle: {
    id: "legal.terms.thirdParty.title",
    defaultMessage: "Third-party services",
  },
  termsThirdPartyBody1: {
    id: "legal.terms.thirdParty.body1",
    defaultMessage:
      "Meishi depends on third-party services including LLM providers, Firebase, and Google APIs. Your use of those services is governed by their own terms, privacy policies, quotas, and availability.",
  },
  termsThirdPartyBody2: {
    id: "legal.terms.thirdParty.body2",
    defaultMessage:
      "The app may stop working in whole or in part if a third-party service changes its APIs, pricing, quotas, or acceptable-use rules.",
  },
  termsLicenseTitle: {
    id: "legal.terms.license.title",
    defaultMessage: "Open-source license",
  },
  termsLicenseBody: {
    id: "legal.terms.license.body",
    defaultMessage:
      "The Meishi project is distributed under the AGPL-3.0-or-later license. These terms do not replace or narrow the rights and obligations that arise under that license for the source code itself.",
  },
  termsWarrantyTitle: {
    id: "legal.terms.warranty.title",
    defaultMessage: "No warranties",
  },
  termsWarrantyBody: {
    id: "legal.terms.warranty.body",
    defaultMessage:
      "Meishi is provided on an as-is and as-available basis, without warranties of any kind, whether express or implied. This includes no warranty that extraction results will be complete, accurate, or fit for a particular purpose.",
  },
  termsLiabilityTitle: {
    id: "legal.terms.liability.title",
    defaultMessage: "Limitation of liability",
  },
  termsLiabilityBody: {
    id: "legal.terms.liability.body",
    defaultMessage:
      "To the maximum extent permitted by law, the project maintainers and contributors are not liable for any indirect, incidental, special, consequential, or exemplary damages arising from your use of Meishi, including data loss, inaccurate contact data, service interruptions, or third-party account issues.",
  },
  termsChangesTitle: {
    id: "legal.terms.changes.title",
    defaultMessage: "Changes",
  },
  termsChangesBody: {
    id: "legal.terms.changes.body",
    defaultMessage:
      "The app and these terms may change over time as the project evolves. Continued use after a published update means you accept the revised terms for future use.",
  },
  termsContactTitle: {
    id: "legal.terms.contact.title",
    defaultMessage: "Contact",
  },
  termsContactBody: {
    id: "legal.terms.contact.body",
    defaultMessage:
      "For project issues, feature requests, or questions about these terms, use the public repository linked from the landing page and app shell.",
  },
});

type LegalSectionContent = {
  title: string;
  paragraphs: string[];
  listItems?: string[];
};

type LegalPageContent = {
  title: string;
  summary: string;
  effectiveDate: string;
  sections: LegalSectionContent[];
};

export function getPrivacyPolicyContent(intl: IntlShape): LegalPageContent {
  return {
    title: intl.formatMessage(messages.privacyTitle),
    summary: intl.formatMessage(messages.privacySummary),
    effectiveDate: "April 13, 2026",
    sections: [
      {
        title: intl.formatMessage(messages.privacyOverviewTitle),
        paragraphs: [
          intl.formatMessage(messages.privacyOverviewBody1),
          intl.formatMessage(messages.privacyOverviewBody2),
        ],
      },
      {
        title: intl.formatMessage(messages.privacyStoredTitle),
        paragraphs: [
          intl.formatMessage(messages.privacyStoredIntro),
          intl.formatMessage(messages.privacyStoredBody),
        ],
        listItems: [
          intl.formatMessage(messages.privacyStoredItem1),
          intl.formatMessage(messages.privacyStoredItem2),
          intl.formatMessage(messages.privacyStoredItem3),
          intl.formatMessage(messages.privacyStoredItem4),
          intl.formatMessage(messages.privacyStoredItem5),
        ],
      },
      {
        title: intl.formatMessage(messages.privacyThirdPartyTitle),
        paragraphs: [
          intl.formatMessage(messages.privacyThirdPartyBody1),
          intl.formatMessage(messages.privacyThirdPartyBody2),
          intl.formatMessage(messages.privacyThirdPartyBody3),
        ],
      },
      {
        title: intl.formatMessage(messages.privacyDisclosureTitle),
        paragraphs: [
          intl.formatMessage(messages.privacyDisclosureBody1),
          intl.formatMessage(messages.privacyDisclosureBody2),
          intl.formatMessage(messages.privacyDisclosureBody3),
        ],
      },
      {
        title: intl.formatMessage(messages.privacyFirebaseTitle),
        paragraphs: [
          intl.formatMessage(messages.privacyFirebaseBody1),
          intl.formatMessage(messages.privacyFirebaseBody2),
        ],
      },
      {
        title: intl.formatMessage(messages.privacyRetentionTitle),
        paragraphs: [
          intl.formatMessage(messages.privacyRetentionBody1),
          intl.formatMessage(messages.privacyRetentionBody2),
        ],
      },
      {
        title: intl.formatMessage(messages.privacySecurityTitle),
        paragraphs: [
          intl.formatMessage(messages.privacySecurityBody1),
          intl.formatMessage(messages.privacySecurityBody2),
        ],
      },
      {
        title: intl.formatMessage(messages.privacyChoicesTitle),
        paragraphs: [intl.formatMessage(messages.privacyChoicesBody)],
      },
    ],
  };
}

export function getTermsOfServiceContent(intl: IntlShape): LegalPageContent {
  return {
    title: intl.formatMessage(messages.termsTitle),
    summary: intl.formatMessage(messages.termsSummary),
    effectiveDate: "April 7, 2026",
    sections: [
      {
        title: intl.formatMessage(messages.termsUseTitle),
        paragraphs: [
          intl.formatMessage(messages.termsUseBody1),
          intl.formatMessage(messages.termsUseBody2),
        ],
      },
      {
        title: intl.formatMessage(messages.termsResponsibilitiesTitle),
        paragraphs: [
          intl.formatMessage(messages.termsResponsibilitiesBody1),
          intl.formatMessage(messages.termsResponsibilitiesBody2),
        ],
      },
      {
        title: intl.formatMessage(messages.termsThirdPartyTitle),
        paragraphs: [
          intl.formatMessage(messages.termsThirdPartyBody1),
          intl.formatMessage(messages.termsThirdPartyBody2),
        ],
      },
      {
        title: intl.formatMessage(messages.termsLicenseTitle),
        paragraphs: [intl.formatMessage(messages.termsLicenseBody)],
      },
      {
        title: intl.formatMessage(messages.termsWarrantyTitle),
        paragraphs: [intl.formatMessage(messages.termsWarrantyBody)],
      },
      {
        title: intl.formatMessage(messages.termsLiabilityTitle),
        paragraphs: [intl.formatMessage(messages.termsLiabilityBody)],
      },
      {
        title: intl.formatMessage(messages.termsChangesTitle),
        paragraphs: [intl.formatMessage(messages.termsChangesBody)],
      },
      {
        title: intl.formatMessage(messages.termsContactTitle),
        paragraphs: [intl.formatMessage(messages.termsContactBody)],
      },
    ],
  };
}
