import type { ReactNode } from "react";
import {
  defineMessages,
  type FormatXMLElementFn,
  type IntlShape,
} from "react-intl";
import type { AppLocale } from "../../shared/types/models";

type RichTextValue = FormatXMLElementFn<ReactNode, ReactNode>;

export interface DocsRichTextValues {
  settingsLink: RichTextValue;
  captureLink: RichTextValue;
  reviewLink: RichTextValue;
}

export interface DocsSectionLink {
  id: string;
  label: string;
}

export interface DocsTutorialStep {
  id: string;
  title: string;
  body: ReactNode;
  bodyText: string;
  imageSrc: string;
  imageAlt: string;
}

export interface DocsSchemaContent {
  locale: AppLocale;
  softwareDescription: string;
  browserRequirements: string;
  featureList: string[];
  pageName: string;
  pageDescription: string;
  pageKeywords: string[];
  howToDescription: string;
  howToSupplies: string[];
  howToSteps: Array<{
    name: string;
    text: string;
    url: string;
    image: string;
  }>;
  faq: Array<{
    name: string;
    answer: string;
  }>;
}

const messages = defineMessages({
  heroEyebrow: {
    id: "docs.hero.eyebrow",
    defaultMessage: "Documentation",
  },
  heroTitle: {
    id: "docs.hero.title",
    defaultMessage: "How to use Meishi",
  },
  heroDescription: {
    id: "docs.hero.description",
    defaultMessage:
      "Meishi is a browser-based app for scanning business cards, turning them into organized contact details with AI, reviewing the results on your device, exporting a vCard, and optionally sending the finished contact to Google Contacts.",
  },
  tocTitle: {
    id: "docs.toc.title",
    defaultMessage: "Table of contents",
  },
  tocDescription: {
    id: "docs.toc.description",
    defaultMessage: "Jump directly to the section you need.",
  },
  sectionWhatIsMeishi: {
    id: "docs.sections.whatIsMeishi",
    defaultMessage: "What is Meishi?",
  },
  sectionApiKeys: {
    id: "docs.sections.apiKeys",
    defaultMessage: "How do I obtain an API key?",
  },
  sectionHowToUse: {
    id: "docs.sections.howToUse",
    defaultMessage: "How do I use Meishi?",
  },
  sectionViewContacts: {
    id: "docs.sections.viewContacts",
    defaultMessage: "How do I view contacts once they are scanned?",
  },
  sectionSupport: {
    id: "docs.sections.support",
    defaultMessage: "How do I support Meishi?",
  },
  overviewEyebrow: {
    id: "docs.overview.eyebrow",
    defaultMessage: "Overview",
  },
  overviewDescription: {
    id: "docs.overview.description",
    defaultMessage:
      "Meishi helps you turn a photo of a business card into a digital contact you can actually use. Your images and in-progress edits stay in your browser, the app uses your own OpenAI or Anthropic key to read the card, and you can export the final result as a vCard or send it to Google Contacts after checking it.",
  },
  overviewWhatAppDoesTitle: {
    id: "docs.overview.whatAppDoes.title",
    defaultMessage: "What the app does",
  },
  overviewWhatAppDoesItem1: {
    id: "docs.overview.whatAppDoes.item1",
    defaultMessage: "Captures card images from your camera or image library.",
  },
  overviewWhatAppDoesItem2: {
    id: "docs.overview.whatAppDoes.item2",
    defaultMessage:
      "Pulls contact details from the card with OpenAI or Anthropic.",
  },
  overviewWhatAppDoesItem3: {
    id: "docs.overview.whatAppDoes.item3",
    defaultMessage:
      "Lets you verify and edit the extracted data before saving.",
  },
  overviewWhatAppDoesItem4: {
    id: "docs.overview.whatAppDoes.item4",
    defaultMessage:
      "Exports a `.vcf` file or syncs the verified contact to Google Contacts.",
  },
  overviewGoodToKnowTitle: {
    id: "docs.overview.goodToKnow.title",
    defaultMessage: "Good to know",
  },
  overviewGoodToKnowItem1: {
    id: "docs.overview.goodToKnow.item1",
    defaultMessage:
      "Meishi runs in your browser and keeps your AI key on this device.",
  },
  overviewGoodToKnowItem2: {
    id: "docs.overview.goodToKnow.item2",
    defaultMessage:
      "Google sign-in access is refreshed when needed instead of being permanently saved in the browser.",
  },
  overviewGoodToKnowItem3: {
    id: "docs.overview.goodToKnow.item3",
    defaultMessage:
      "Extra business-card images remain local even if one photo is uploaded to Google Contacts.",
  },
  overviewGoodToKnowItem4: {
    id: "docs.overview.goodToKnow.item4",
    defaultMessage:
      "Extraction and Google sync both require a network connection.",
  },
  apiKeysEyebrow: {
    id: "docs.apiKeys.eyebrow",
    defaultMessage: "Setup",
  },
  apiKeysDescription: {
    id: "docs.apiKeys.description",
    defaultMessage:
      "Meishi asks you to use your own API key. During setup, or later on the settings page, choose either OpenAI or Anthropic and paste your key into the app.",
  },
  apiProviderAriaLabel: {
    id: "docs.apiKeys.providerAriaLabel",
    defaultMessage: "API provider",
  },
  providerOpenAi: {
    id: "docs.apiKeys.providers.openai",
    defaultMessage: "OpenAI",
  },
  providerAnthropic: {
    id: "docs.apiKeys.providers.anthropic",
    defaultMessage: "Anthropic",
  },
  openAiDescription: {
    id: "docs.apiKeys.openai.description",
    defaultMessage:
      "Choose this if you want Meishi to read cards using OpenAI.",
  },
  openAiStep1: {
    id: "docs.apiKeys.openai.step1",
    defaultMessage: "Go to the OpenAI platform API keys page.",
  },
  openAiStep2: {
    id: "docs.apiKeys.openai.step2",
    defaultMessage: "Sign in or create an OpenAI account.",
  },
  openAiStep3: {
    id: "docs.apiKeys.openai.step3",
    defaultMessage: "Create a new secret key in your API key dashboard.",
  },
  openAiStep4: {
    id: "docs.apiKeys.openai.step4",
    defaultMessage:
      "Copy the key immediately and paste it into Meishi on the <settingsLink>Settings</settingsLink> page.",
  },
  openAiStep5: {
    id: "docs.apiKeys.openai.step5",
    defaultMessage:
      "Meishi keeps this key in your browser on this device so it can use it again later.",
  },
  openAiLinkLabel: {
    id: "docs.apiKeys.openai.linkLabel",
    defaultMessage: "OpenAI API keys",
  },
  anthropicDescription: {
    id: "docs.apiKeys.anthropic.description",
    defaultMessage:
      "Choose this if you want Meishi to read cards using Claude.",
  },
  anthropicStep1: {
    id: "docs.apiKeys.anthropic.step1",
    defaultMessage: "Go to the Anthropic Console.",
  },
  anthropicStep2: {
    id: "docs.apiKeys.anthropic.step2",
    defaultMessage: "Sign in or create an Anthropic account.",
  },
  anthropicStep3: {
    id: "docs.apiKeys.anthropic.step3",
    defaultMessage: "Create a new API key from the console.",
  },
  anthropicStep4: {
    id: "docs.apiKeys.anthropic.step4",
    defaultMessage:
      "Copy the key and paste it into Meishi during setup or later on the <settingsLink>Settings</settingsLink> page.",
  },
  anthropicStep5: {
    id: "docs.apiKeys.anthropic.step5",
    defaultMessage:
      "Confirm that your Anthropic account has billing or usage access if your plan requires it.",
  },
  anthropicLinkLabel: {
    id: "docs.apiKeys.anthropic.linkLabel",
    defaultMessage: "Anthropic API keys",
  },
  tutorialEyebrow: {
    id: "docs.tutorial.eyebrow",
    defaultMessage: "Tutorial",
  },
  tutorialDescription: {
    id: "docs.tutorial.description",
    defaultMessage:
      "Follow this step-by-step flow from first setup through export or Google sync.",
  },
  tutorialStepCardTitle: {
    id: "docs.tutorial.stepCardTitle",
    defaultMessage: "Step {stepNumber}: {title}",
  },
  tutorialStep1Title: {
    id: "docs.tutorial.step1.title",
    defaultMessage: "Open Meishi and complete first-run setup",
  },
  tutorialStep1BodyRich: {
    id: "docs.tutorial.step1.bodyRich",
    defaultMessage:
      "Open <settingsLink>Settings</settingsLink>, choose OpenAI or Anthropic, paste your own API key, confirm the selected model, and save your setup. Google Contacts access is optional at this stage and can wait until you want to sync.",
  },
  tutorialStep1BodyPlain: {
    id: "docs.tutorial.step1.bodyPlain",
    defaultMessage:
      "Open Settings, choose OpenAI or Anthropic, paste your own API key, confirm the selected model, and save your setup. Google Contacts access is optional at this stage and can wait until you want to sync.",
  },
  tutorialStep1ImageAlt: {
    id: "docs.tutorial.step1.imageAlt",
    defaultMessage:
      "Cropped Meishi settings screen focused on the LLM Provider section with the provider picker, API key field, and model selection.",
  },
  tutorialStep2Title: {
    id: "docs.tutorial.step2.title",
    defaultMessage: "Capture one or more business-card images",
  },
  tutorialStep2BodyRich: {
    id: "docs.tutorial.step2.bodyRich",
    defaultMessage:
      "Open the <captureLink>Capture page</captureLink>, use the camera or image library, and make sure both sides of the card are included if the back contains useful details. Meishi keeps the card images on your device while you work.",
  },
  tutorialStep2BodyPlain: {
    id: "docs.tutorial.step2.bodyPlain",
    defaultMessage:
      "Open the Capture page, use the camera or image library, and make sure both sides of the card are included if the back contains useful details. Meishi keeps the card images on your device while you work.",
  },
  tutorialStep2ImageAlt: {
    id: "docs.tutorial.step2.imageAlt",
    defaultMessage:
      "Meishi capture screen cropped to the Photoroll section with uploaded business-card images.",
  },
  tutorialStep3Title: {
    id: "docs.tutorial.step3.title",
    defaultMessage: "Run extraction",
  },
  tutorialStep3BodyPlain: {
    id: "docs.tutorial.step3.bodyPlain",
    defaultMessage:
      "Start the scan after your images are loaded. Meishi sends the images to your chosen AI service, checks the response, and fills in the review form with the contact details it found.",
  },
  tutorialStep3ImageAlt: {
    id: "docs.tutorial.step3.imageAlt",
    defaultMessage:
      "Close-up of the Extract contact draft button on the Meishi capture screen.",
  },
  tutorialStep4Title: {
    id: "docs.tutorial.step4.title",
    defaultMessage: "Review and correct the extracted contact",
  },
  tutorialStep4BodyRich: {
    id: "docs.tutorial.step4.bodyRich",
    defaultMessage:
      "Open <reviewLink>Review</reviewLink> to verify the extracted fields in the Verify contact section. The form supports richer Google-Contacts-style data, including multiple emails, phone numbers, addresses, websites, related people, significant dates, notes, and custom fields. Edits autosave locally.",
  },
  tutorialStep4BodyPlain: {
    id: "docs.tutorial.step4.bodyPlain",
    defaultMessage:
      "Open Review to verify the extracted fields in the Verify contact section. The form supports richer Google-Contacts-style data, including multiple emails, phone numbers, addresses, websites, related people, significant dates, notes, and custom fields. Edits autosave locally.",
  },
  tutorialStep4ImageAlt: {
    id: "docs.tutorial.step4.imageAlt",
    defaultMessage:
      "Cropped Meishi review screen focused on the Verify contact section with extraction notes and editable contact fields.",
  },
  tutorialStep5Title: {
    id: "docs.tutorial.step5.title",
    defaultMessage: "Export or sync",
  },
  tutorialStep5BodyPlain: {
    id: "docs.tutorial.step5.bodyPlain",
    defaultMessage:
      "From Review, either save a local `.vcf` file or sync the verified contact to Google Contacts. If you are not connected to Google yet, Meishi can prompt for Google authorization at sync time.",
  },
  tutorialStep5ImageAlt: {
    id: "docs.tutorial.step5.imageAlt",
    defaultMessage:
      "Close-up of the Save vCard and Save to Google Contacts buttons on the Meishi review screen.",
  },
  afterScanningEyebrow: {
    id: "docs.afterScanning.eyebrow",
    defaultMessage: "After scanning",
  },
  afterScanningDescription: {
    id: "docs.afterScanning.description",
    defaultMessage:
      "Meishi lets you check and edit the contact before you save it anywhere else.",
  },
  insideMeishiTitle: {
    id: "docs.afterScanning.insideMeishi.title",
    defaultMessage: "Inside Meishi",
  },
  insideMeishiBody: {
    id: "docs.afterScanning.insideMeishi.body",
    defaultMessage:
      "Open <reviewLink>Review</reviewLink> to inspect the current draft, see the captured images, and edit the structured contact fields before saving anything externally.",
  },
  asVCardTitle: {
    id: "docs.afterScanning.asVCard.title",
    defaultMessage: "As a vCard",
  },
  asVCardBody: {
    id: "docs.afterScanning.asVCard.body",
    defaultMessage:
      "Use the Save vCard action to download a `.vcf` file to your device. You can then open that file in your preferred contacts app.",
  },
  inGoogleContactsTitle: {
    id: "docs.afterScanning.inGoogleContacts.title",
    defaultMessage: "In Google Contacts",
  },
  inGoogleContactsBody: {
    id: "docs.afterScanning.inGoogleContacts.body",
    defaultMessage:
      "Use Sync to Google from <reviewLink>Review</reviewLink>. After a successful sync, open Google Contacts to see the created contact and the uploaded primary photo.",
  },
  supportEyebrow: {
    id: "docs.support.eyebrow",
    defaultMessage: "GIVE BACK",
  },
  supportDescription: {
    id: "docs.support.description",
    defaultMessage:
      "If you want to help Meishi grow, the easiest options are sharing feedback, sharing the project, and supporting the work directly.",
  },
  supportUseItTitle: {
    id: "docs.support.useIt.title",
    defaultMessage: "Use it and report gaps",
  },
  supportUseItBody: {
    id: "docs.support.useIt.body",
    defaultMessage:
      "Real card samples and bug reports help improve scan quality, editing flow, and sync reliability.",
  },
  supportShareTitle: {
    id: "docs.support.share.title",
    defaultMessage: "Star or share the project",
  },
  supportShareBody: {
    id: "docs.support.share.body",
    defaultMessage:
      "Follow the repository and share it with people who need an easier way to turn business cards into digital contacts.",
  },
  supportGithubLinkLabel: {
    id: "docs.support.share.linkLabel",
    defaultMessage: "GitHub repository",
  },
  supportCoffeeTitle: {
    id: "docs.support.coffee.title",
    defaultMessage: "Buy Me a Coffee",
  },
  supportCoffeeBody: {
    id: "docs.support.coffee.body",
    defaultMessage:
      "If you want to support ongoing work directly, use the Buy Me a Coffee link from the menu or here.",
  },
  supportCoffeeImageAlt: {
    id: "docs.support.coffee.imageAlt",
    defaultMessage: "Buy Me a Coffee",
  },
  openScreenshotLabel: {
    id: "docs.lightbox.openScreenshot",
    defaultMessage: "Open screenshot: {alt}",
  },
  lightboxSubtitle: {
    id: "docs.lightbox.subtitle",
    defaultMessage: "Step {stepNumber} of {totalSteps}",
  },
  schemaSoftwareDescription: {
    id: "docs.schema.software.description",
    defaultMessage:
      "Meishi helps you turn business cards into contacts you can review, edit, export as a vCard, and sync to Google Contacts.",
  },
  schemaBrowserRequirements: {
    id: "docs.schema.software.browserRequirements",
    defaultMessage:
      "Requires JavaScript and a modern browser with camera or image upload support.",
  },
  schemaFeature1: {
    id: "docs.schema.software.feature1",
    defaultMessage: "Scan business cards from your camera or photo library.",
  },
  schemaFeature2: {
    id: "docs.schema.software.feature2",
    defaultMessage:
      "Extract structured contact details with OpenAI or Anthropic.",
  },
  schemaFeature3: {
    id: "docs.schema.software.feature3",
    defaultMessage:
      "Review and edit the extracted contact data in your browser.",
  },
  schemaFeature4: {
    id: "docs.schema.software.feature4",
    defaultMessage:
      "Export a vCard or sync the verified contact to Google Contacts.",
  },
  schemaFeature5: {
    id: "docs.schema.software.feature5",
    defaultMessage:
      "Keep captured images and draft edits on-device while you work.",
  },
  schemaPageDescription: {
    id: "docs.schema.page.description",
    defaultMessage:
      "Documentation for setting up Meishi, capturing business card images, running extraction, reviewing contacts, exporting vCards, and syncing to Google Contacts.",
  },
  schemaKeyword1: {
    id: "docs.schema.page.keyword1",
    defaultMessage: "how to use Meishi",
  },
  schemaKeyword2: {
    id: "docs.schema.page.keyword2",
    defaultMessage: "business card scanner tutorial",
  },
  schemaKeyword3: {
    id: "docs.schema.page.keyword3",
    defaultMessage: "OpenAI API key setup",
  },
  schemaKeyword4: {
    id: "docs.schema.page.keyword4",
    defaultMessage: "Anthropic API key setup",
  },
  schemaKeyword5: {
    id: "docs.schema.page.keyword5",
    defaultMessage: "Google Contacts sync help",
  },
  schemaHowToDescription: {
    id: "docs.schema.howTo.description",
    defaultMessage:
      "Set up your AI provider, capture business-card images, run extraction, review the draft, and export or sync the finished contact.",
  },
  schemaHowToSupplyApiKey: {
    id: "docs.schema.howTo.supplyApiKey",
    defaultMessage: "An OpenAI or Anthropic API key",
  },
  schemaHowToSupplyImages: {
    id: "docs.schema.howTo.supplyImages",
    defaultMessage: "One or more business-card images",
  },
  faqApiKeysAnswer: {
    id: "docs.schema.faq.apiKeys.answer",
    defaultMessage:
      "Choose OpenAI or Anthropic in Meishi, then create an API key in that provider's dashboard and paste it into Meishi during setup or later on the Settings page.",
  },
  faqHowToUseAnswer: {
    id: "docs.schema.faq.howToUse.answer",
    defaultMessage:
      "Set up your AI provider, capture one or more business-card images, run extraction, review and correct the contact draft, then export a vCard or sync to Google Contacts.",
  },
  faqViewContactsAnswer: {
    id: "docs.schema.faq.viewContacts.answer",
    defaultMessage:
      "Use the Review page to inspect and edit the current draft, save a vCard to your device, or sync the verified contact to Google Contacts and view it there after sync succeeds.",
  },
  faqSupportAnswer: {
    id: "docs.schema.faq.support.answer",
    defaultMessage:
      "You can support Meishi by using it with real card samples, reporting gaps, starring or sharing the GitHub repository, and supporting the project directly through Buy Me a Coffee.",
  },
});

function formatRich(
  intl: IntlShape,
  descriptor: (typeof messages)[keyof typeof messages],
  values: Record<string, RichTextValue>,
) {
  return intl.formatMessage(descriptor, values);
}

export function getDocsPageContent(
  intl: IntlShape,
  locale: AppLocale,
  linkValues: DocsRichTextValues,
) {
  const tutorialSteps: DocsTutorialStep[] = [
    {
      id: "setup",
      title: intl.formatMessage(messages.tutorialStep1Title),
      body: formatRich(intl, messages.tutorialStep1BodyRich, {
        settingsLink: linkValues.settingsLink,
      }),
      bodyText: intl.formatMessage(messages.tutorialStep1BodyPlain),
      imageSrc: "/docs/screenshots/setup-settings-llm-provider.png",
      imageAlt: intl.formatMessage(messages.tutorialStep1ImageAlt),
    },
    {
      id: "capture",
      title: intl.formatMessage(messages.tutorialStep2Title),
      body: formatRich(intl, messages.tutorialStep2BodyRich, {
        captureLink: linkValues.captureLink,
      }),
      bodyText: intl.formatMessage(messages.tutorialStep2BodyPlain),
      imageSrc: "/docs/screenshots/capture-photoroll.png",
      imageAlt: intl.formatMessage(messages.tutorialStep2ImageAlt),
    },
    {
      id: "extract",
      title: intl.formatMessage(messages.tutorialStep3Title),
      body: intl.formatMessage(messages.tutorialStep3BodyPlain),
      bodyText: intl.formatMessage(messages.tutorialStep3BodyPlain),
      imageSrc: "/docs/screenshots/capture-extract-button.png",
      imageAlt: intl.formatMessage(messages.tutorialStep3ImageAlt),
    },
    {
      id: "review",
      title: intl.formatMessage(messages.tutorialStep4Title),
      body: formatRich(intl, messages.tutorialStep4BodyRich, {
        reviewLink: linkValues.reviewLink,
      }),
      bodyText: intl.formatMessage(messages.tutorialStep4BodyPlain),
      imageSrc: "/docs/screenshots/review-verify-contact.png",
      imageAlt: intl.formatMessage(messages.tutorialStep4ImageAlt),
    },
    {
      id: "export",
      title: intl.formatMessage(messages.tutorialStep5Title),
      body: intl.formatMessage(messages.tutorialStep5BodyPlain),
      bodyText: intl.formatMessage(messages.tutorialStep5BodyPlain),
      imageSrc: "/docs/screenshots/review-save-buttons.png",
      imageAlt: intl.formatMessage(messages.tutorialStep5ImageAlt),
    },
  ];

  return {
    locale,
    hero: {
      eyebrow: intl.formatMessage(messages.heroEyebrow),
      title: intl.formatMessage(messages.heroTitle),
      description: intl.formatMessage(messages.heroDescription),
    },
    tableOfContents: {
      title: intl.formatMessage(messages.tocTitle),
      description: intl.formatMessage(messages.tocDescription),
    },
    sections: [
      {
        id: "what-is-meishi",
        label: intl.formatMessage(messages.sectionWhatIsMeishi),
      },
      {
        id: "api-keys",
        label: intl.formatMessage(messages.sectionApiKeys),
      },
      {
        id: "how-to-use",
        label: intl.formatMessage(messages.sectionHowToUse),
      },
      {
        id: "view-contacts",
        label: intl.formatMessage(messages.sectionViewContacts),
      },
      {
        id: "support",
        label: intl.formatMessage(messages.sectionSupport),
      },
    ] satisfies DocsSectionLink[],
    overview: {
      heading: {
        id: "what-is-meishi",
        eyebrow: intl.formatMessage(messages.overviewEyebrow),
        title: intl.formatMessage(messages.sectionWhatIsMeishi),
        description: intl.formatMessage(messages.overviewDescription),
      },
      whatAppDoes: {
        title: intl.formatMessage(messages.overviewWhatAppDoesTitle),
        items: [
          intl.formatMessage(messages.overviewWhatAppDoesItem1),
          intl.formatMessage(messages.overviewWhatAppDoesItem2),
          intl.formatMessage(messages.overviewWhatAppDoesItem3),
          intl.formatMessage(messages.overviewWhatAppDoesItem4),
        ],
      },
      goodToKnow: {
        title: intl.formatMessage(messages.overviewGoodToKnowTitle),
        items: [
          intl.formatMessage(messages.overviewGoodToKnowItem1),
          intl.formatMessage(messages.overviewGoodToKnowItem2),
          intl.formatMessage(messages.overviewGoodToKnowItem3),
          intl.formatMessage(messages.overviewGoodToKnowItem4),
        ],
      },
    },
    apiKeys: {
      heading: {
        id: "api-keys",
        eyebrow: intl.formatMessage(messages.apiKeysEyebrow),
        title: intl.formatMessage(messages.sectionApiKeys),
        description: intl.formatMessage(messages.apiKeysDescription),
      },
      providerAriaLabel: intl.formatMessage(messages.apiProviderAriaLabel),
      providers: {
        openai: {
          label: intl.formatMessage(messages.providerOpenAi),
          description: intl.formatMessage(messages.openAiDescription),
          steps: [
            intl.formatMessage(messages.openAiStep1),
            intl.formatMessage(messages.openAiStep2),
            intl.formatMessage(messages.openAiStep3),
            formatRich(intl, messages.openAiStep4, {
              settingsLink: linkValues.settingsLink,
            }),
            intl.formatMessage(messages.openAiStep5),
          ],
          linkLabel: intl.formatMessage(messages.openAiLinkLabel),
        },
        anthropic: {
          label: intl.formatMessage(messages.providerAnthropic),
          description: intl.formatMessage(messages.anthropicDescription),
          steps: [
            intl.formatMessage(messages.anthropicStep1),
            intl.formatMessage(messages.anthropicStep2),
            intl.formatMessage(messages.anthropicStep3),
            formatRich(intl, messages.anthropicStep4, {
              settingsLink: linkValues.settingsLink,
            }),
            intl.formatMessage(messages.anthropicStep5),
          ],
          linkLabel: intl.formatMessage(messages.anthropicLinkLabel),
        },
      },
    },
    tutorial: {
      heading: {
        id: "how-to-use",
        eyebrow: intl.formatMessage(messages.tutorialEyebrow),
        title: intl.formatMessage(messages.sectionHowToUse),
        description: intl.formatMessage(messages.tutorialDescription),
      },
      steps: tutorialSteps,
      getStepCardTitle(stepNumber: number, title: string) {
        return intl.formatMessage(messages.tutorialStepCardTitle, {
          stepNumber,
          title,
        });
      },
    },
    afterScanning: {
      heading: {
        id: "view-contacts",
        eyebrow: intl.formatMessage(messages.afterScanningEyebrow),
        title: intl.formatMessage(messages.sectionViewContacts),
        description: intl.formatMessage(messages.afterScanningDescription),
      },
      cards: [
        {
          id: "inside-meishi",
          title: intl.formatMessage(messages.insideMeishiTitle),
          body: formatRich(intl, messages.insideMeishiBody, {
            reviewLink: linkValues.reviewLink,
          }),
        },
        {
          id: "as-vcard",
          title: intl.formatMessage(messages.asVCardTitle),
          body: intl.formatMessage(messages.asVCardBody),
        },
        {
          id: "google-contacts",
          title: intl.formatMessage(messages.inGoogleContactsTitle),
          body: formatRich(intl, messages.inGoogleContactsBody, {
            reviewLink: linkValues.reviewLink,
          }),
        },
      ],
    },
    support: {
      heading: {
        id: "support",
        eyebrow: intl.formatMessage(messages.supportEyebrow),
        title: intl.formatMessage(messages.sectionSupport),
        description: intl.formatMessage(messages.supportDescription),
      },
      cards: [
        {
          id: "use-it",
          title: intl.formatMessage(messages.supportUseItTitle),
          body: intl.formatMessage(messages.supportUseItBody),
        },
        {
          id: "share",
          title: intl.formatMessage(messages.supportShareTitle),
          body: intl.formatMessage(messages.supportShareBody),
          linkLabel: intl.formatMessage(messages.supportGithubLinkLabel),
        },
        {
          id: "coffee",
          title: intl.formatMessage(messages.supportCoffeeTitle),
          body: intl.formatMessage(messages.supportCoffeeBody),
          imageAlt: intl.formatMessage(messages.supportCoffeeImageAlt),
        },
      ],
    },
    lightbox: {
      getOpenScreenshotLabel(alt: string) {
        return intl.formatMessage(messages.openScreenshotLabel, { alt });
      },
      getSubtitle(stepNumber: number, totalSteps: number) {
        return intl.formatMessage(messages.lightboxSubtitle, {
          stepNumber,
          totalSteps,
        });
      },
    },
    schema: getDocsSchemaContent(intl, locale, tutorialSteps),
  };
}

export function getDocsSchemaContent(
  intl: IntlShape,
  locale: AppLocale,
  tutorialSteps?: DocsTutorialStep[],
): DocsSchemaContent {
  const steps = tutorialSteps ?? [
    {
      id: "setup",
      title: intl.formatMessage(messages.tutorialStep1Title),
      body: intl.formatMessage(messages.tutorialStep1BodyPlain),
      bodyText: intl.formatMessage(messages.tutorialStep1BodyPlain),
      imageSrc: "/docs/screenshots/setup-settings-llm-provider.png",
      imageAlt: intl.formatMessage(messages.tutorialStep1ImageAlt),
    },
    {
      id: "capture",
      title: intl.formatMessage(messages.tutorialStep2Title),
      body: intl.formatMessage(messages.tutorialStep2BodyPlain),
      bodyText: intl.formatMessage(messages.tutorialStep2BodyPlain),
      imageSrc: "/docs/screenshots/capture-photoroll.png",
      imageAlt: intl.formatMessage(messages.tutorialStep2ImageAlt),
    },
    {
      id: "extract",
      title: intl.formatMessage(messages.tutorialStep3Title),
      body: intl.formatMessage(messages.tutorialStep3BodyPlain),
      bodyText: intl.formatMessage(messages.tutorialStep3BodyPlain),
      imageSrc: "/docs/screenshots/capture-extract-button.png",
      imageAlt: intl.formatMessage(messages.tutorialStep3ImageAlt),
    },
    {
      id: "review",
      title: intl.formatMessage(messages.tutorialStep4Title),
      body: intl.formatMessage(messages.tutorialStep4BodyPlain),
      bodyText: intl.formatMessage(messages.tutorialStep4BodyPlain),
      imageSrc: "/docs/screenshots/review-verify-contact.png",
      imageAlt: intl.formatMessage(messages.tutorialStep4ImageAlt),
    },
    {
      id: "export",
      title: intl.formatMessage(messages.tutorialStep5Title),
      body: intl.formatMessage(messages.tutorialStep5BodyPlain),
      bodyText: intl.formatMessage(messages.tutorialStep5BodyPlain),
      imageSrc: "/docs/screenshots/review-save-buttons.png",
      imageAlt: intl.formatMessage(messages.tutorialStep5ImageAlt),
    },
  ];

  return {
    locale,
    softwareDescription: intl.formatMessage(messages.schemaSoftwareDescription),
    browserRequirements: intl.formatMessage(messages.schemaBrowserRequirements),
    featureList: [
      intl.formatMessage(messages.schemaFeature1),
      intl.formatMessage(messages.schemaFeature2),
      intl.formatMessage(messages.schemaFeature3),
      intl.formatMessage(messages.schemaFeature4),
      intl.formatMessage(messages.schemaFeature5),
    ],
    pageName: intl.formatMessage(messages.heroTitle),
    pageDescription: intl.formatMessage(messages.schemaPageDescription),
    pageKeywords: [
      intl.formatMessage(messages.schemaKeyword1),
      intl.formatMessage(messages.schemaKeyword2),
      intl.formatMessage(messages.schemaKeyword3),
      intl.formatMessage(messages.schemaKeyword4),
      intl.formatMessage(messages.schemaKeyword5),
    ],
    howToDescription: intl.formatMessage(messages.schemaHowToDescription),
    howToSupplies: [
      intl.formatMessage(messages.schemaHowToSupplyApiKey),
      intl.formatMessage(messages.schemaHowToSupplyImages),
    ],
    howToSteps: steps.map((step) => ({
      name: step.title,
      text: step.bodyText,
      url:
        step.id === "setup"
          ? "/settings"
          : step.id === "capture"
            ? "/capture"
            : step.id === "review" || step.id === "export"
              ? "/review"
              : "/docs#how-to-use",
      image: step.imageSrc,
    })),
    faq: [
      {
        name: intl.formatMessage(messages.sectionWhatIsMeishi),
        answer: intl.formatMessage(messages.heroDescription),
      },
      {
        name: intl.formatMessage(messages.sectionApiKeys),
        answer: intl.formatMessage(messages.faqApiKeysAnswer),
      },
      {
        name: intl.formatMessage(messages.sectionHowToUse),
        answer: intl.formatMessage(messages.faqHowToUseAnswer),
      },
      {
        name: intl.formatMessage(messages.sectionViewContacts),
        answer: intl.formatMessage(messages.faqViewContactsAnswer),
      },
      {
        name: intl.formatMessage(messages.sectionSupport),
        answer: intl.formatMessage(messages.faqSupportAnswer),
      },
    ],
  };
}
