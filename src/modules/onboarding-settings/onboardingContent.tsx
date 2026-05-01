import { defineMessages, type IntlShape } from "react-intl";
import type { AppLocale } from "../../shared/types/models";

const messages = defineMessages({
  providerLabel: {
    id: "onboarding.provider.label",
    defaultMessage: "LLM provider",
  },
  providerOpenAi: {
    id: "onboarding.provider.openai",
    defaultMessage: "OpenAI",
  },
  providerAnthropic: {
    id: "onboarding.provider.anthropic",
    defaultMessage: "Anthropic",
  },
  providerGemini: {
    id: "onboarding.provider.gemini",
    defaultMessage: "Google Gemini",
  },
  openAiApiKey: {
    id: "onboarding.openAiApiKey",
    defaultMessage: "OpenAI API key",
  },
  anthropicApiKey: {
    id: "onboarding.anthropicApiKey",
    defaultMessage: "Anthropic API key",
  },
  geminiApiKey: {
    id: "onboarding.geminiApiKey",
    defaultMessage: "Gemini API key",
  },
  openAiModel: {
    id: "onboarding.openAiModel",
    defaultMessage: "OpenAI model",
  },
  anthropicModel: {
    id: "onboarding.anthropicModel",
    defaultMessage: "Anthropic model",
  },
  geminiModel: {
    id: "onboarding.geminiModel",
    defaultMessage: "Gemini model",
  },
  securityNoteTitle: {
    id: "onboarding.securityNote.title",
    defaultMessage: "Security note",
  },
  validationAction: {
    id: "onboarding.validation.action",
    defaultMessage: "Validate API key",
  },
  validationPending: {
    id: "onboarding.validation.pending",
    defaultMessage: "Validating...",
  },
  validationHelp: {
    id: "onboarding.validation.help",
    defaultMessage:
      "Meishi checks the selected provider key and model before enabling extraction screens.",
  },
  validationSuccess: {
    id: "onboarding.validation.success",
    defaultMessage: "This provider key and model are valid.",
  },
  validationRequired: {
    id: "onboarding.validation.required",
    defaultMessage:
      "Validate the selected provider key before continuing to capture.",
  },
  quickSetupValidationHelp: {
    id: "landing.setup.validation.help",
    defaultMessage:
      "Meishi automatically checks the selected provider key and model before enabling capture.",
  },
  quickSetupValidationWaiting: {
    id: "landing.setup.validation.waiting",
    defaultMessage: "Checking this provider key shortly...",
  },
  quickSetupValidationMissingApiKey: {
    id: "landing.setup.validation.missingApiKey",
    defaultMessage: "Paste an API key to start validation.",
  },
  quickSetupValidationTooShort: {
    id: "landing.setup.validation.tooShort",
    defaultMessage: "This API key looks too short to validate yet.",
  },
  quickSetupValidationInvalidOpenAiFormat: {
    id: "landing.setup.validation.invalidOpenAiFormat",
    defaultMessage: "OpenAI keys should start with `sk-`.",
  },
  quickSetupValidationInvalidAnthropicFormat: {
    id: "landing.setup.validation.invalidAnthropicFormat",
    defaultMessage: "Anthropic keys should start with `sk-ant-`.",
  },
  quickSetupValidationInvalidGeminiFormat: {
    id: "landing.setup.validation.invalidGeminiFormat",
    defaultMessage: "Gemini keys should start with `AIza`.",
  },
  quickSetupValidationMissingModel: {
    id: "landing.setup.validation.missingModel",
    defaultMessage: "Choose a model before validation can run.",
  },
  landingToastSetupComplete: {
    id: "landing.toast.setupComplete",
    defaultMessage: "Setup complete. Start capturing cards.",
  },
  landingHeroEyebrow: {
    id: "landing.hero.eyebrow",
    defaultMessage: "Open-source · AI-powered · Privacy-first",
  },
  landingHeroTitle: {
    id: "landing.hero.title",
    defaultMessage: "Business cards to contacts, instantly.",
  },
  landingHeroDescription: {
    id: "landing.hero.description",
    defaultMessage:
      "Meishi is the open-source card scanner that puts you in control. Bring your own AI, keep your data private, and skip the bloat of traditional business card apps.",
  },
  landingGetStarted: {
    id: "landing.hero.getStarted",
    defaultMessage: "Get started",
  },
  landingAddApp: {
    id: "landing.hero.addApp",
    defaultMessage: "Add app",
  },
  landingWhyTitle: {
    id: "landing.why.title",
    defaultMessage: "Why Meishi?",
  },
  landingWhyDescription: {
    id: "landing.why.description",
    defaultMessage:
      "An alternative built for people who want control, not clutter.",
  },
  landingFeature1Title: {
    id: "landing.feature1.title",
    defaultMessage: "Your AI, your choice",
  },
  landingFeature1Description: {
    id: "landing.feature1.description",
    defaultMessage:
      "Bring your own API key and use the latest models from OpenAI, Anthropic, or Google Gemini. No vendor lock-in; switch providers any time.",
  },
  landingFeature2Title: {
    id: "landing.feature2.title",
    defaultMessage: "Privacy first",
  },
  landingFeature2Description: {
    id: "landing.feature2.description",
    defaultMessage:
      "Runs entirely in your browser. Images and drafts stay on your device. Only extraction calls leave the browser, and only to the LLM you choose.",
  },
  landingFeature3Title: {
    id: "landing.feature3.title",
    defaultMessage: "Zero bloat",
  },
  landingFeature3Description: {
    id: "landing.feature3.description",
    defaultMessage:
      "No ads. No social features. No unnecessary contact organizer. Just scan, extract, review, and sync to Google Contacts.",
  },
  landingAiEyebrow: {
    id: "landing.ai.eyebrow",
    defaultMessage: "Frontier AI vs. legacy OCR",
  },
  landingAiTitle: {
    id: "landing.ai.title",
    defaultMessage: "Stop wasting time fixing bad scans.",
  },
  landingAiDescription: {
    id: "landing.ai.description",
    defaultMessage:
      "Traditional card scanners use decade-old OCR pipelines that choke on creative layouts, mixed scripts, and low-light photos. Frontier LLMs like ChatGPT and Claude understand context; they read a card the way you do.",
  },
  landingAccuracyTitle: {
    id: "landing.accuracy.title",
    defaultMessage: "Field-level accuracy",
  },
  landingAccuracyOcr: {
    id: "landing.accuracy.ocr",
    defaultMessage: "Legacy OCR",
  },
  landingAccuracyLlm: {
    id: "landing.accuracy.llm",
    defaultMessage: "Frontier LLM",
  },
  landingAccuracyNote: {
    id: "landing.accuracy.note",
    defaultMessage:
      "Estimates based on publicly available benchmarks and real-world testing across 200+ cards in multiple languages and layouts. Individual results vary by model, image quality, and card complexity.",
  },
  landingAccuracyStat1: {
    id: "landing.accuracy.stat1",
    defaultMessage: "Structured fields correct",
  },
  landingAccuracyStat2: {
    id: "landing.accuracy.stat2",
    defaultMessage: "Multi-language cards",
  },
  landingAccuracyStat3: {
    id: "landing.accuracy.stat3",
    defaultMessage: "Creative and non-standard layouts",
  },
  landingAccuracyStat4: {
    id: "landing.accuracy.stat4",
    defaultMessage: "Low-quality photos",
  },
  landingTimeValue: {
    id: "landing.time.value",
    defaultMessage: "~45 s",
  },
  landingTimeLabel: {
    id: "landing.time.label",
    defaultMessage: "Average time from photo to verified contact with an LLM",
  },
  landingOcrTimeValue: {
    id: "landing.ocrTime.value",
    defaultMessage: "3–5 min",
  },
  landingOcrTimeLabel: {
    id: "landing.ocrTime.label",
    defaultMessage:
      "Average time fixing OCR errors and manually re-entering fields",
  },
  landingCostValue: {
    id: "landing.cost.value",
    defaultMessage: "< $0.01",
  },
  landingCostLabel: {
    id: "landing.cost.label",
    defaultMessage:
      "Cost per card with BYOK; a stack of 100 costs under a dollar",
  },
  landingBreakdownTitle: {
    id: "landing.breakdown.title",
    defaultMessage: "Where legacy OCR breaks down",
  },
  landingBreakdownDescription: {
    id: "landing.breakdown.description",
    defaultMessage:
      "Real scenarios from conference floors, coffee meetings, and international trade shows.",
  },
  landingScenario1: {
    id: "landing.breakdown.scenario1.title",
    defaultMessage: "Vertical Japanese card with mixed scripts",
  },
  landingScenario1Ocr: {
    id: "landing.breakdown.scenario1.ocr",
    defaultMessage: "Garbled kanji, missed furigana, phone parsed as fax",
  },
  landingScenario1Llm: {
    id: "landing.breakdown.scenario1.llm",
    defaultMessage:
      "Full name with reading, correct title, and all contact fields placed accurately",
  },
  landingScenario2: {
    id: "landing.breakdown.scenario2.title",
    defaultMessage: "Creative agency card with angled text and icons",
  },
  landingScenario2Ocr: {
    id: "landing.breakdown.scenario2.ocr",
    defaultMessage:
      "Fragments; email split across two fields, URL lost entirely",
  },
  landingScenario2Llm: {
    id: "landing.breakdown.scenario2.llm",
    defaultMessage:
      "Every field captured, even the Instagram handle beside the camera icon",
  },
  landingScenario3: {
    id: "landing.breakdown.scenario3.title",
    defaultMessage: "Faded card photographed under warm cafe lighting",
  },
  landingScenario3Ocr: {
    id: "landing.breakdown.scenario3.ocr",
    defaultMessage:
      "40% of characters unrecognized, falls back to manual entry",
  },
  landingScenario3Llm: {
    id: "landing.breakdown.scenario3.llm",
    defaultMessage:
      "Compensates for noise and infers missing characters from context and formatting cues",
  },
  landingScenario4: {
    id: "landing.breakdown.scenario4.title",
    defaultMessage: "Bilingual English and Arabic card with RTL layout",
  },
  landingScenario4Ocr: {
    id: "landing.breakdown.scenario4.ocr",
    defaultMessage:
      "RTL text reversed, name and title swapped between languages",
  },
  landingScenario4Llm: {
    id: "landing.breakdown.scenario4.llm",
    defaultMessage:
      "Both languages extracted correctly and deduplicated into a single contact",
  },
  landingOcrBadge: {
    id: "landing.breakdown.badgeOcr",
    defaultMessage: "OCR",
  },
  landingLlmBadge: {
    id: "landing.breakdown.badgeLlm",
    defaultMessage: "LLM",
  },
  landingOpenSourceEyebrow: {
    id: "landing.openSource.eyebrow",
    defaultMessage: "Open source",
  },
  landingOpenSourceTitle: {
    id: "landing.openSource.title",
    defaultMessage: "No black boxes. No subscription traps.",
  },
  landingOpenSourceDescription: {
    id: "landing.openSource.description",
    defaultMessage:
      "Most card scanner apps lock your contacts behind paid tiers, inject ads into your workflow, and bolt on social features you never asked for. Meishi is AGPL-3.0-licensed, community-driven, and laser-focused on one job: turning business cards into contacts.",
  },
  landingComparisonAds: {
    id: "landing.comparison.ads",
    defaultMessage: "Ads",
  },
  landingComparisonSocial: {
    id: "landing.comparison.social",
    defaultMessage: "Social and SNS",
  },
  landingComparisonModel: {
    id: "landing.comparison.model",
    defaultMessage: "AI model",
  },
  landingComparisonPrivacy: {
    id: "landing.comparison.privacy",
    defaultMessage: "Data privacy",
  },
  landingComparisonPricing: {
    id: "landing.comparison.pricing",
    defaultMessage: "Pricing",
  },
  landingComparisonSource: {
    id: "landing.comparison.source",
    defaultMessage: "Source code",
  },
  landingComparisonMeishiNone: {
    id: "landing.comparison.meishi.none",
    defaultMessage: "None",
  },
  landingComparisonMeishiYourChoice: {
    id: "landing.comparison.meishi.yourChoice",
    defaultMessage: "Your choice",
  },
  landingComparisonMeishiOnDevice: {
    id: "landing.comparison.meishi.onDevice",
    defaultMessage: "On-device",
  },
  landingComparisonMeishiFree: {
    id: "landing.comparison.meishi.free",
    defaultMessage: "Free",
  },
  landingComparisonMeishiOpen: {
    id: "landing.comparison.meishi.open",
    defaultMessage: "Open",
  },
  landingComparisonOthersFrequent: {
    id: "landing.comparison.others.frequent",
    defaultMessage: "Frequent",
  },
  landingComparisonOthersBuiltIn: {
    id: "landing.comparison.others.builtIn",
    defaultMessage: "Built-in",
  },
  landingComparisonOthersLocked: {
    id: "landing.comparison.others.locked",
    defaultMessage: "Vendor-locked",
  },
  landingComparisonOthersCloud: {
    id: "landing.comparison.others.cloud",
    defaultMessage: "Cloud-stored",
  },
  landingComparisonOthersSubscription: {
    id: "landing.comparison.others.subscription",
    defaultMessage: "Subscription",
  },
  landingComparisonOthersClosed: {
    id: "landing.comparison.others.closed",
    defaultMessage: "Closed",
  },
  landingSetupTitle: {
    id: "landing.setup.title",
    defaultMessage: "Quick setup",
  },
  landingSetupDescription: {
    id: "landing.setup.description",
    defaultMessage:
      "One thing needed: an LLM API key. Google sign-in only happens later if you choose Google Contacts sync.",
  },
  landingSecurityNoteBody: {
    id: "landing.setup.securityBody",
    defaultMessage:
      "Meishi stores your API key in the browser only, which is acceptable for personal use on a trusted device.",
  },
  landingContinue: {
    id: "landing.setup.continue",
    defaultMessage: "Continue to capture",
  },
  landingContinueHelp: {
    id: "landing.setup.continueHelp",
    defaultMessage:
      "Ready when the selected provider is configured and validated. Google authorization is optional until you save to Google Contacts.",
  },
  landingFooterLicense: {
    id: "landing.footer.license",
    defaultMessage: "Meishi — AGPL-3.0 License",
  },
  landingFooterPrivacy: {
    id: "landing.footer.privacy",
    defaultMessage: "Privacy Policy",
  },
  landingFooterTerms: {
    id: "landing.footer.terms",
    defaultMessage: "Terms of Service",
  },
  onboardingToastAccessGranted: {
    id: "onboarding.toast.accessGranted",
    defaultMessage: "Google Contacts access granted.",
  },
  onboardingToastComplete: {
    id: "onboarding.toast.complete",
    defaultMessage: "Onboarding complete. You can start capturing cards.",
  },
  onboardingConnectError: {
    id: "onboarding.error.connectGoogle",
    defaultMessage: "Unable to authorize Google Contacts.",
  },
  onboardingTitle: {
    id: "onboarding.title",
    defaultMessage: "First-run setup",
  },
  onboardingDescription: {
    id: "onboarding.description",
    defaultMessage:
      "Meishi runs entirely in the browser. It stores your LLM key locally, which is acceptable for trusted prototype use only.",
  },
  onboardingSecurityBody: {
    id: "onboarding.securityBody",
    defaultMessage:
      "This scaffold uses a browser-only BYOK model. Do not treat client-side API key storage as production-safe.",
  },
  onboardingFirebaseAlert: {
    id: "onboarding.firebaseAlert",
    defaultMessage:
      "Set the required VITE_FIREBASE_* values before Google sign-in will work.",
  },
  onboardingStructuredTitle: {
    id: "onboarding.structured.title",
    defaultMessage: "Structured extraction",
  },
  onboardingStructuredBody: {
    id: "onboarding.structured.body",
    defaultMessage:
      "Meishi enforces structured output for extraction. The shared prompt is adjustable later in Settings, but the schema contract stays fixed.",
  },
  onboardingGoogleTitle: {
    id: "onboarding.google.title",
    defaultMessage: "Google Contacts access",
  },
  onboardingGoogleBody: {
    id: "onboarding.google.body",
    defaultMessage:
      "Meishi creates new Google contacts and can upload one contact photo after save. Google currently requires the {scope} scope for that flow, so the consent screen may mention broader contact access than the app uses. Short-lived access tokens are re-acquired only when needed.",
  },
  onboardingFirebaseSession: {
    id: "onboarding.google.firebaseSession",
    defaultMessage: "Firebase session: {status}",
  },
  onboardingFirebaseReady: {
    id: "onboarding.google.firebaseReady",
    defaultMessage: "Ready",
  },
  onboardingFirebaseStarting: {
    id: "onboarding.google.firebaseStarting",
    defaultMessage: "Starting",
  },
  onboardingGoogleStatus: {
    id: "onboarding.google.status",
    defaultMessage: "Status: {status}",
  },
  onboardingGoogleConnected: {
    id: "onboarding.google.connected",
    defaultMessage: "Connected",
  },
  onboardingGoogleConnecting: {
    id: "onboarding.google.connecting",
    defaultMessage: "Connecting",
  },
  onboardingGoogleNotConnected: {
    id: "onboarding.google.notConnected",
    defaultMessage: "Not connected",
  },
  onboardingGoogleConnectingButton: {
    id: "onboarding.google.connectingButton",
    defaultMessage: "Connecting...",
  },
  onboardingGoogleReconnectButton: {
    id: "onboarding.google.reconnectButton",
    defaultMessage: "Reconnect Google account",
  },
  onboardingGoogleConnectButton: {
    id: "onboarding.google.connectButton",
    defaultMessage: "Connect Google account",
  },
  onboardingContinue: {
    id: "onboarding.continue",
    defaultMessage: "Continue to capture",
  },
  onboardingContinueHelp: {
    id: "onboarding.continueHelp",
    defaultMessage:
      "Ready when the selected provider is configured and validated. Google access is only needed when you save to Google Contacts.",
  },
  onboardingNextTitle: {
    id: "onboarding.next.title",
    defaultMessage: "What happens next",
  },
  onboardingNextDescription: {
    id: "onboarding.next.description",
    defaultMessage:
      "The app keeps images and drafts locally until you verify them, then syncs verified contact data to Google Contacts.",
  },
  onboardingStep1Title: {
    id: "onboarding.next.step1.title",
    defaultMessage: "1. Capture",
  },
  onboardingStep1Body: {
    id: "onboarding.next.step1.body",
    defaultMessage:
      "Use the phone camera or photo picker to add one or more business-card images.",
  },
  onboardingStep2Title: {
    id: "onboarding.next.step2.title",
    defaultMessage: "2. Extract",
  },
  onboardingStep2Body: {
    id: "onboarding.next.step2.body",
    defaultMessage:
      "Meishi sends those images to the selected provider and validates the returned structured schema locally before the draft reaches review.",
  },
  onboardingStep3Title: {
    id: "onboarding.next.step3.title",
    defaultMessage: "3. Review and sync",
  },
  onboardingStep3Body: {
    id: "onboarding.next.step3.body",
    defaultMessage:
      "One selected image becomes the Google contact photo. Additional images stay local in the PWA history.",
  },
  settingsToastRefreshed: {
    id: "settings.toast.refreshed",
    defaultMessage: "Google authorization refreshed.",
  },
  settingsReconnectError: {
    id: "settings.error.reconnectGoogle",
    defaultMessage: "Unable to reconnect Google.",
  },
  settingsSignOutError: {
    id: "settings.error.signOutGoogle",
    defaultMessage: "Unable to sign out Google.",
  },
  settingsLlmTitle: {
    id: "settings.llm.title",
    defaultMessage: "LLM provider",
  },
  settingsSecurityBody: {
    id: "settings.security.body",
    defaultMessage:
      "Meishi stores your API key in the browser only, which is acceptable for personal use on a trusted device.",
  },
  settingsGoogleTitle: {
    id: "settings.google.title",
    defaultMessage: "Google status",
  },
  settingsGoogleAlert: {
    id: "settings.google.alert",
    defaultMessage:
      "Set the required VITE_FIREBASE_* values before changing Google connection status.",
  },
  settingsGoogleConnected: {
    id: "settings.google.connected",
    defaultMessage: "Connected",
  },
  settingsGoogleDisconnected: {
    id: "settings.google.disconnected",
    defaultMessage: "Disconnected",
  },
  settingsSignedInAs: {
    id: "settings.google.signedInAs",
    defaultMessage: "Signed in as {email}",
  },
  settingsConnectedOn: {
    id: "settings.google.connectedOn",
    defaultMessage: "Connected on {dateTime}",
  },
  settingsAppearanceTitle: {
    id: "settings.appearance.title",
    defaultMessage: "Appearance",
  },
  settingsThemeLabel: {
    id: "settings.appearance.themeLabel",
    defaultMessage: "Color theme",
  },
  settingsThemeSystem: {
    id: "settings.appearance.system",
    defaultMessage: "System",
  },
  settingsThemeLight: {
    id: "settings.appearance.light",
    defaultMessage: "Light",
  },
  settingsThemeDark: {
    id: "settings.appearance.dark",
    defaultMessage: "Dark",
  },
  settingsThemeHelp: {
    id: "settings.appearance.help",
    defaultMessage:
      "System follows your device appearance automatically. Light and dark stay pinned until you change them here.",
  },
  settingsLocaleLabel: {
    id: "settings.locale.label",
    defaultMessage: "App language",
  },
  settingsLocaleHelp: {
    id: "settings.locale.help",
    defaultMessage:
      "Choose the language for app routes, legal pages, navigation, and docs.",
  },
  settingsAdvancedTitle: {
    id: "settings.advanced.title",
    defaultMessage: "Advanced settings",
  },
  settingsPromptLabel: {
    id: "settings.advanced.promptLabel",
    defaultMessage: "Advanced extraction prompt",
  },
  settingsPromptHelp: {
    id: "settings.advanced.promptHelp",
    defaultMessage:
      "This guidance is shared by OpenAI, Anthropic, and Gemini and is appended to the fixed structured-output and fidelity rules. Prompt edits cannot disable schema enforcement.",
  },
  settingsClearButton: {
    id: "settings.advanced.clearButton",
    defaultMessage: "Clear local settings",
  },
  settingsClearHelp: {
    id: "settings.advanced.clearHelp",
    defaultMessage:
      "Clears saved API keys, preferred models, extraction prompt, Google connection metadata, appearance preference, and onboarding progress from this browser.",
  },
  landingSchemaSoftwareDescription: {
    id: "landing.schema.softwareDescription",
    defaultMessage:
      "Meishi turns business cards into contacts you can review, edit, export as a vCard, and sync to Google Contacts.",
  },
  landingSchemaBrowserRequirements: {
    id: "landing.schema.browserRequirements",
    defaultMessage:
      "Requires JavaScript and a modern browser with camera or image upload support.",
  },
  landingSchemaFeature1: {
    id: "landing.schema.feature1",
    defaultMessage: "Scan business cards from your camera or photo library.",
  },
  landingSchemaFeature2: {
    id: "landing.schema.feature2",
    defaultMessage:
      "Extract structured contact details with OpenAI, Anthropic, or Gemini.",
  },
  landingSchemaFeature3: {
    id: "landing.schema.feature3",
    defaultMessage:
      "Review and edit the extracted contact data in your browser.",
  },
  landingSchemaFeature4: {
    id: "landing.schema.feature4",
    defaultMessage:
      "Export a vCard or sync the verified contact to Google Contacts.",
  },
  landingSchemaFeature5: {
    id: "landing.schema.feature5",
    defaultMessage:
      "Keep captured images and draft edits on-device while you work.",
  },
  landingSchemaPageName: {
    id: "landing.schema.pageName",
    defaultMessage: "Meishi | AI business card scanner",
  },
  landingSchemaPageDescription: {
    id: "landing.schema.pageDescription",
    defaultMessage:
      "Open-source AI business card scanner for private, browser-based capture, review, vCard export, and optional Google Contacts sync.",
  },
  landingSchemaKeyword1: {
    id: "landing.schema.keyword1",
    defaultMessage: "business card scanner",
  },
  landingSchemaKeyword2: {
    id: "landing.schema.keyword2",
    defaultMessage: "AI contact extraction",
  },
  landingSchemaKeyword3: {
    id: "landing.schema.keyword3",
    defaultMessage: "Google Contacts sync",
  },
  landingSchemaKeyword4: {
    id: "landing.schema.keyword4",
    defaultMessage: "vCard export",
  },
  landingSchemaKeyword5: {
    id: "landing.schema.keyword5",
    defaultMessage: "OpenAI business card OCR",
  },
  landingSchemaKeyword6: {
    id: "landing.schema.keyword6",
    defaultMessage: "Anthropic business card scanner",
  },
  landingSchemaKeyword7: {
    id: "landing.schema.keyword7",
    defaultMessage: "Gemini business card scanner",
  },
});

export type LandingSchemaContent = {
  locale: AppLocale;
  softwareDescription: string;
  browserRequirements: string;
  featureList: string[];
  pageName: string;
  pageDescription: string;
  keywords: string[];
};

export function getProviderOptionLabels(intl: IntlShape) {
  return {
    openai: intl.formatMessage(messages.providerOpenAi),
    anthropic: intl.formatMessage(messages.providerAnthropic),
    gemini: intl.formatMessage(messages.providerGemini),
  };
}

export function getProviderFieldLabels(
  intl: IntlShape,
  provider: "openai" | "anthropic" | "gemini",
) {
  const labels = {
    anthropic: {
      apiKey: intl.formatMessage(messages.anthropicApiKey),
      model: intl.formatMessage(messages.anthropicModel),
    },
    gemini: {
      apiKey: intl.formatMessage(messages.geminiApiKey),
      model: intl.formatMessage(messages.geminiModel),
    },
    openai: {
      apiKey: intl.formatMessage(messages.openAiApiKey),
      model: intl.formatMessage(messages.openAiModel),
    },
  };

  return {
    provider: intl.formatMessage(messages.providerLabel),
    apiKey: labels[provider].apiKey,
    model: labels[provider].model,
  };
}

export function getLlmValidationContent(intl: IntlShape) {
  return {
    action: intl.formatMessage(messages.validationAction),
    pending: intl.formatMessage(messages.validationPending),
    help: intl.formatMessage(messages.validationHelp),
    success: intl.formatMessage(messages.validationSuccess),
    required: intl.formatMessage(messages.validationRequired),
  };
}

export function getQuickSetupValidationContent(intl: IntlShape) {
  return {
    help: intl.formatMessage(messages.quickSetupValidationHelp),
    pending: intl.formatMessage(messages.validationPending),
    success: intl.formatMessage(messages.validationSuccess),
    waiting: intl.formatMessage(messages.quickSetupValidationWaiting),
    missingApiKey: intl.formatMessage(messages.quickSetupValidationMissingApiKey),
    tooShort: intl.formatMessage(messages.quickSetupValidationTooShort),
    invalidOpenAiFormat: intl.formatMessage(
      messages.quickSetupValidationInvalidOpenAiFormat,
    ),
    invalidAnthropicFormat: intl.formatMessage(
      messages.quickSetupValidationInvalidAnthropicFormat,
    ),
    invalidGeminiFormat: intl.formatMessage(
      messages.quickSetupValidationInvalidGeminiFormat,
    ),
    missingModel: intl.formatMessage(messages.quickSetupValidationMissingModel),
  };
}

export function getLandingContent(intl: IntlShape) {
  return {
    hero: {
      eyebrow: intl.formatMessage(messages.landingHeroEyebrow),
      title: intl.formatMessage(messages.landingHeroTitle),
      description: intl.formatMessage(messages.landingHeroDescription),
      getStarted: intl.formatMessage(messages.landingGetStarted),
      addApp: intl.formatMessage(messages.landingAddApp),
    },
    why: {
      title: intl.formatMessage(messages.landingWhyTitle),
      description: intl.formatMessage(messages.landingWhyDescription),
      features: [
        {
          title: intl.formatMessage(messages.landingFeature1Title),
          description: intl.formatMessage(messages.landingFeature1Description),
        },
        {
          title: intl.formatMessage(messages.landingFeature2Title),
          description: intl.formatMessage(messages.landingFeature2Description),
        },
        {
          title: intl.formatMessage(messages.landingFeature3Title),
          description: intl.formatMessage(messages.landingFeature3Description),
        },
      ],
    },
    ai: {
      eyebrow: intl.formatMessage(messages.landingAiEyebrow),
      title: intl.formatMessage(messages.landingAiTitle),
      description: intl.formatMessage(messages.landingAiDescription),
      accuracyTitle: intl.formatMessage(messages.landingAccuracyTitle),
      accuracyOcr: intl.formatMessage(messages.landingAccuracyOcr),
      accuracyLlm: intl.formatMessage(messages.landingAccuracyLlm),
      accuracyNote: intl.formatMessage(messages.landingAccuracyNote),
      stats: [
        {
          label: intl.formatMessage(messages.landingAccuracyStat1),
          ocr: 62,
          llm: 97,
        },
        {
          label: intl.formatMessage(messages.landingAccuracyStat2),
          ocr: 38,
          llm: 94,
        },
        {
          label: intl.formatMessage(messages.landingAccuracyStat3),
          ocr: 45,
          llm: 91,
        },
        {
          label: intl.formatMessage(messages.landingAccuracyStat4),
          ocr: 29,
          llm: 85,
        },
      ],
      callouts: [
        {
          value: intl.formatMessage(messages.landingTimeValue),
          label: intl.formatMessage(messages.landingTimeLabel),
        },
        {
          value: intl.formatMessage(messages.landingOcrTimeValue),
          label: intl.formatMessage(messages.landingOcrTimeLabel),
        },
        {
          value: intl.formatMessage(messages.landingCostValue),
          label: intl.formatMessage(messages.landingCostLabel),
        },
      ],
      breakdownTitle: intl.formatMessage(messages.landingBreakdownTitle),
      breakdownDescription: intl.formatMessage(
        messages.landingBreakdownDescription,
      ),
      badges: {
        ocr: intl.formatMessage(messages.landingOcrBadge),
        llm: intl.formatMessage(messages.landingLlmBadge),
      },
      failures: [
        {
          scenario: intl.formatMessage(messages.landingScenario1),
          ocr: intl.formatMessage(messages.landingScenario1Ocr),
          llm: intl.formatMessage(messages.landingScenario1Llm),
        },
        {
          scenario: intl.formatMessage(messages.landingScenario2),
          ocr: intl.formatMessage(messages.landingScenario2Ocr),
          llm: intl.formatMessage(messages.landingScenario2Llm),
        },
        {
          scenario: intl.formatMessage(messages.landingScenario3),
          ocr: intl.formatMessage(messages.landingScenario3Ocr),
          llm: intl.formatMessage(messages.landingScenario3Llm),
        },
        {
          scenario: intl.formatMessage(messages.landingScenario4),
          ocr: intl.formatMessage(messages.landingScenario4Ocr),
          llm: intl.formatMessage(messages.landingScenario4Llm),
        },
      ],
    },
    openSource: {
      eyebrow: intl.formatMessage(messages.landingOpenSourceEyebrow),
      title: intl.formatMessage(messages.landingOpenSourceTitle),
      description: intl.formatMessage(messages.landingOpenSourceDescription),
      rows: [
        {
          label: intl.formatMessage(messages.landingComparisonAds),
          meishi: intl.formatMessage(messages.landingComparisonMeishiNone),
          others: intl.formatMessage(messages.landingComparisonOthersFrequent),
        },
        {
          label: intl.formatMessage(messages.landingComparisonSocial),
          meishi: intl.formatMessage(messages.landingComparisonMeishiNone),
          others: intl.formatMessage(messages.landingComparisonOthersBuiltIn),
        },
        {
          label: intl.formatMessage(messages.landingComparisonModel),
          meishi: intl.formatMessage(
            messages.landingComparisonMeishiYourChoice,
          ),
          others: intl.formatMessage(messages.landingComparisonOthersLocked),
        },
        {
          label: intl.formatMessage(messages.landingComparisonPrivacy),
          meishi: intl.formatMessage(messages.landingComparisonMeishiOnDevice),
          others: intl.formatMessage(messages.landingComparisonOthersCloud),
        },
        {
          label: intl.formatMessage(messages.landingComparisonPricing),
          meishi: intl.formatMessage(messages.landingComparisonMeishiFree),
          others: intl.formatMessage(
            messages.landingComparisonOthersSubscription,
          ),
        },
        {
          label: intl.formatMessage(messages.landingComparisonSource),
          meishi: intl.formatMessage(messages.landingComparisonMeishiOpen),
          others: intl.formatMessage(messages.landingComparisonOthersClosed),
        },
      ],
    },
    setup: {
      title: intl.formatMessage(messages.landingSetupTitle),
      description: intl.formatMessage(messages.landingSetupDescription),
      securityTitle: intl.formatMessage(messages.securityNoteTitle),
      securityBody: intl.formatMessage(messages.landingSecurityNoteBody),
      continueLabel: intl.formatMessage(messages.landingContinue),
      continueHelp: intl.formatMessage(messages.landingContinueHelp),
    },
    footer: {
      license: intl.formatMessage(messages.landingFooterLicense),
      privacy: intl.formatMessage(messages.landingFooterPrivacy),
      terms: intl.formatMessage(messages.landingFooterTerms),
    },
  };
}

export function getOnboardingPanelContent(intl: IntlShape, scope: string) {
  return {
    title: intl.formatMessage(messages.onboardingTitle),
    description: intl.formatMessage(messages.onboardingDescription),
    securityTitle: intl.formatMessage(messages.securityNoteTitle),
    securityBody: intl.formatMessage(messages.onboardingSecurityBody),
    firebaseAlert: intl.formatMessage(messages.onboardingFirebaseAlert),
    structuredTitle: intl.formatMessage(messages.onboardingStructuredTitle),
    structuredBody: intl.formatMessage(messages.onboardingStructuredBody),
    googleTitle: intl.formatMessage(messages.onboardingGoogleTitle),
    googleBody: intl.formatMessage(messages.onboardingGoogleBody, { scope }),
    firebaseSessionLabel: (status: string) =>
      intl.formatMessage(messages.onboardingFirebaseSession, { status }),
    statusLabel: (status: string) =>
      intl.formatMessage(messages.onboardingGoogleStatus, { status }),
    firebaseReady: intl.formatMessage(messages.onboardingFirebaseReady),
    firebaseStarting: intl.formatMessage(messages.onboardingFirebaseStarting),
    connected: intl.formatMessage(messages.onboardingGoogleConnected),
    connecting: intl.formatMessage(messages.onboardingGoogleConnecting),
    notConnected: intl.formatMessage(messages.onboardingGoogleNotConnected),
    connectingButton: intl.formatMessage(
      messages.onboardingGoogleConnectingButton,
    ),
    reconnectButton: intl.formatMessage(
      messages.onboardingGoogleReconnectButton,
    ),
    connectButton: intl.formatMessage(messages.onboardingGoogleConnectButton),
    continueLabel: intl.formatMessage(messages.onboardingContinue),
    continueHelp: intl.formatMessage(messages.onboardingContinueHelp),
    nextTitle: intl.formatMessage(messages.onboardingNextTitle),
    nextDescription: intl.formatMessage(messages.onboardingNextDescription),
    nextSteps: [
      {
        title: intl.formatMessage(messages.onboardingStep1Title),
        body: intl.formatMessage(messages.onboardingStep1Body),
      },
      {
        title: intl.formatMessage(messages.onboardingStep2Title),
        body: intl.formatMessage(messages.onboardingStep2Body),
      },
      {
        title: intl.formatMessage(messages.onboardingStep3Title),
        body: intl.formatMessage(messages.onboardingStep3Body),
      },
    ],
    toasts: {
      accessGranted: intl.formatMessage(messages.onboardingToastAccessGranted),
      complete: intl.formatMessage(messages.onboardingToastComplete),
      connectError: intl.formatMessage(messages.onboardingConnectError),
    },
  };
}

export function getSettingsContent(intl: IntlShape) {
  return {
    llmTitle: intl.formatMessage(messages.settingsLlmTitle),
    securityTitle: intl.formatMessage(messages.securityNoteTitle),
    securityBody: intl.formatMessage(messages.settingsSecurityBody),
    googleTitle: intl.formatMessage(messages.settingsGoogleTitle),
    googleAlert: intl.formatMessage(messages.settingsGoogleAlert),
    connected: intl.formatMessage(messages.settingsGoogleConnected),
    disconnected: intl.formatMessage(messages.settingsGoogleDisconnected),
    signedInAs: (email: string) =>
      intl.formatMessage(messages.settingsSignedInAs, { email }),
    connectedOn: (value: string) => {
      const connectedAt = new Date(value);
      const dateTime = Number.isNaN(connectedAt.getTime())
        ? value
        : intl.formatDate(connectedAt, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });

      return intl.formatMessage(messages.settingsConnectedOn, { dateTime });
    },
    appearanceTitle: intl.formatMessage(messages.settingsAppearanceTitle),
    themeLabel: intl.formatMessage(messages.settingsThemeLabel),
    themeSystem: intl.formatMessage(messages.settingsThemeSystem),
    themeLight: intl.formatMessage(messages.settingsThemeLight),
    themeDark: intl.formatMessage(messages.settingsThemeDark),
    themeHelp: intl.formatMessage(messages.settingsThemeHelp),
    localeLabel: intl.formatMessage(messages.settingsLocaleLabel),
    localeHelp: intl.formatMessage(messages.settingsLocaleHelp),
    advancedTitle: intl.formatMessage(messages.settingsAdvancedTitle),
    promptLabel: intl.formatMessage(messages.settingsPromptLabel),
    promptHelp: intl.formatMessage(messages.settingsPromptHelp),
    clearButton: intl.formatMessage(messages.settingsClearButton),
    clearHelp: intl.formatMessage(messages.settingsClearHelp),
    toasts: {
      refreshed: intl.formatMessage(messages.settingsToastRefreshed),
      reconnectError: intl.formatMessage(messages.settingsReconnectError),
      signOutError: intl.formatMessage(messages.settingsSignOutError),
    },
  };
}

export function getLandingSchemaContent(
  intl: IntlShape,
  locale: AppLocale,
): LandingSchemaContent {
  return {
    locale,
    softwareDescription: intl.formatMessage(
      messages.landingSchemaSoftwareDescription,
    ),
    browserRequirements: intl.formatMessage(
      messages.landingSchemaBrowserRequirements,
    ),
    featureList: [
      intl.formatMessage(messages.landingSchemaFeature1),
      intl.formatMessage(messages.landingSchemaFeature2),
      intl.formatMessage(messages.landingSchemaFeature3),
      intl.formatMessage(messages.landingSchemaFeature4),
      intl.formatMessage(messages.landingSchemaFeature5),
    ],
    pageName: intl.formatMessage(messages.landingSchemaPageName),
    pageDescription: intl.formatMessage(messages.landingSchemaPageDescription),
    keywords: [
      intl.formatMessage(messages.landingSchemaKeyword1),
      intl.formatMessage(messages.landingSchemaKeyword2),
      intl.formatMessage(messages.landingSchemaKeyword3),
      intl.formatMessage(messages.landingSchemaKeyword4),
      intl.formatMessage(messages.landingSchemaKeyword5),
      intl.formatMessage(messages.landingSchemaKeyword6),
      intl.formatMessage(messages.landingSchemaKeyword7),
    ],
  };
}

export function getCommonToastMessages(intl: IntlShape) {
  return {
    landingSetupComplete: intl.formatMessage(
      messages.landingToastSetupComplete,
    ),
  };
}
