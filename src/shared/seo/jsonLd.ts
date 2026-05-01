import type { AppLocale } from "../types/models";

const SITE_ORIGIN = "https://meishi-492400.web.app";
const SITE_NAME = "Meishi";
const SITE_DESCRIPTION =
  "Meishi helps you turn business cards into contacts you can review, edit, export as a vCard, and sync to Google Contacts.";
const GITHUB_REPO_URL = "https://github.com/mundanelunacy/meishi";
const CREATOR_URL = "https://github.com/mundanelunacy";

type JsonLdNode = Record<string, unknown>;

interface LandingSchemaContent {
  locale: AppLocale;
  softwareDescription: string;
  browserRequirements: string;
  featureList: string[];
  pageName: string;
  pageDescription: string;
  keywords: string[];
}

interface DocsSchemaContent {
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

function absoluteUrl(path: string) {
  return new URL(path, SITE_ORIGIN).toString();
}

function getBaseGraph(
  language = "en-US",
  softwareDescription = SITE_DESCRIPTION,
  browserRequirements = "Requires JavaScript and a modern browser with camera or image upload support.",
  featureList = [
    "Scan business cards from your camera or photo library.",
    "Extract structured contact details with OpenAI, Anthropic, or Gemini.",
    "Review and edit the extracted contact data in your browser.",
    "Export a vCard or sync the verified contact to Google Contacts.",
    "Keep captured images and draft edits on-device while you work.",
  ],
  softwareHelpName = "Meishi documentation",
) {
  const websiteId = `${SITE_ORIGIN}/#website`;
  const creatorId = `${SITE_ORIGIN}/#creator`;
  const softwareId = `${SITE_ORIGIN}/landing#software`;

  return {
    creatorId,
    softwareId,
    website: {
      "@id": websiteId,
      "@type": "WebSite",
      url: SITE_ORIGIN,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: language,
    },
    creator: {
      "@id": creatorId,
      "@type": "Person",
      name: "Satoshi Kawase",
      url: CREATOR_URL,
      sameAs: [CREATOR_URL, GITHUB_REPO_URL],
    },
    software: {
      "@id": softwareId,
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web browser",
      url: absoluteUrl("/landing"),
      description: softwareDescription,
      isAccessibleForFree: true,
      browserRequirements,
      featureList,
      screenshot: [
        absoluteUrl("/landing/networking_scene.jpg"),
        absoluteUrl("/docs/screenshots/review-verify-contact.png"),
      ],
      sameAs: [GITHUB_REPO_URL],
      author: { "@id": creatorId },
      creator: { "@id": creatorId },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: absoluteUrl("/landing"),
      },
      softwareHelp: {
        "@type": "CreativeWork",
        url: absoluteUrl("/docs"),
        name: softwareHelpName,
      },
    },
    websiteId,
  };
}

export function getLandingPageSchema(
  content: LandingSchemaContent = {
    locale: "en-US",
    softwareDescription: SITE_DESCRIPTION,
    browserRequirements:
      "Requires JavaScript and a modern browser with camera or image upload support.",
    featureList: [
      "Scan business cards from your camera or photo library.",
      "Extract structured contact details with OpenAI, Anthropic, or Gemini.",
      "Review and edit the extracted contact data in your browser.",
      "Export a vCard or sync the verified contact to Google Contacts.",
      "Keep captured images and draft edits on-device while you work.",
    ],
    pageName: "Meishi | AI business card scanner",
    pageDescription:
      "Open-source AI business card scanner for private, browser-based capture, review, vCard export, and optional Google Contacts sync.",
    keywords: [
      "business card scanner",
      "AI contact extraction",
      "Google Contacts sync",
      "vCard export",
      "OpenAI business card OCR",
      "Anthropic business card scanner",
      "Gemini business card scanner",
    ],
  },
): JsonLdNode[] {
  const base = getBaseGraph(
    content.locale,
    content.softwareDescription,
    content.browserRequirements,
    content.featureList,
    content.pageName,
  );
  const landingUrl = absoluteUrl("/landing");

  return [
    base.website,
    base.creator,
    base.software,
    {
      "@id": `${landingUrl}#webpage`,
      "@type": "WebPage",
      url: landingUrl,
      name: content.pageName,
      description: content.pageDescription,
      isPartOf: { "@id": base.websiteId },
      about: { "@id": base.softwareId },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: absoluteUrl("/landing/networking_scene.jpg"),
      },
      keywords: content.keywords,
      inLanguage: content.locale,
    },
  ];
}

export function getDocsPageSchema(
  content: DocsSchemaContent = {
    locale: "en-US",
    softwareDescription: SITE_DESCRIPTION,
    browserRequirements:
      "Requires JavaScript and a modern browser with camera or image upload support.",
    featureList: [
      "Scan business cards from your camera or photo library.",
      "Extract structured contact details with OpenAI, Anthropic, or Gemini.",
      "Review and edit the extracted contact data in your browser.",
      "Export a vCard or sync the verified contact to Google Contacts.",
      "Keep captured images and draft edits on-device while you work.",
    ],
    pageName: "How to use Meishi",
    pageDescription:
      "Documentation for setting up Meishi, capturing business card images, running extraction, reviewing contacts, exporting vCards, and syncing to Google Contacts.",
    pageKeywords: [
      "how to use Meishi",
      "business card scanner tutorial",
      "OpenAI API key setup",
      "Anthropic API key setup",
      "Gemini API key setup",
      "Google Contacts sync help",
    ],
    howToDescription:
      "Set up your AI provider, capture business-card images, run extraction, review the draft, and export or sync the finished contact.",
    howToSupplies: ["An OpenAI, Anthropic, or Gemini API key"],
    howToSteps: [
      {
        name: "Open Meishi and complete first-run setup",
        text: "Open Settings, choose OpenAI, Anthropic, or Gemini, paste your own API key, confirm the selected model, and save your setup.",
        url: "/settings",
        image: "/docs/screenshots/setup-settings-llm-provider.png",
      },
      {
        name: "Capture one or more business-card images",
        text: "Open the Capture page, use the camera or image library, and make sure both sides of the card are included if needed.",
        url: "/capture",
        image: "/docs/screenshots/capture-photoroll.png",
      },
      {
        name: "Run extraction",
        text: "Start extraction after images are captured.",
        url: "/capture",
        image: "/docs/screenshots/capture-extract-button.png",
      },
      {
        name: "Review and correct the extracted contact",
        text: "Open Review and check the extracted fields before saving.",
        url: "/review",
        image: "/docs/screenshots/review-verify-contact.png",
      },
      {
        name: "Export or sync",
        text: "Save a vCard or sync the verified contact to Google Contacts.",
        url: "/review",
        image: "/docs/screenshots/review-save-buttons.png",
      },
    ],
    faq: [
      {
        name: "What is Meishi?",
        answer: SITE_DESCRIPTION,
      },
      {
        name: "How do I obtain an API key?",
        answer:
          "Choose OpenAI, Anthropic, or Gemini in Meishi, then create an API key in that provider's dashboard and paste it into Meishi during setup or later on the Settings page.",
      },
      {
        name: "How do I use Meishi?",
        answer:
          "Set up your AI provider, capture one or more business-card images, run extraction, review and correct the contact draft, then export a vCard or sync to Google Contacts.",
      },
      {
        name: "How do I view contacts once they are scanned?",
        answer:
          "Use the Review page to inspect and edit the current draft, save a vCard to your device, or sync the verified contact to Google Contacts.",
      },
      {
        name: "How do I support Meishi?",
        answer:
          "Use it with real card samples, report gaps, star or share the GitHub repository, and support the project directly through Buy Me a Coffee.",
      },
    ],
  },
): JsonLdNode[] {
  const base = getBaseGraph(
    content.locale,
    content.softwareDescription,
    content.browserRequirements,
    content.featureList,
    content.pageName,
  );
  const docsUrl = absoluteUrl("/docs");
  const howToId = `${docsUrl}#howto`;
  const faqId = `${docsUrl}#faq`;

  return [
    base.website,
    base.creator,
    base.software,
    {
      "@id": `${docsUrl}#webpage`,
      "@type": "WebPage",
      url: docsUrl,
      name: content.pageName,
      description: content.pageDescription,
      isPartOf: { "@id": base.websiteId },
      about: { "@id": base.softwareId },
      mainEntity: [{ "@id": howToId }, { "@id": faqId }],
      keywords: content.pageKeywords,
      inLanguage: content.locale,
    },
    {
      "@id": howToId,
      "@type": "HowTo",
      name: content.pageName,
      description: content.howToDescription,
      totalTime: "PT5M",
      supply: content.howToSupplies.map((name) => ({
        "@type": "HowToSupply",
        name,
      })),
      step: content.howToSteps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.name,
        text: step.text,
        url: absoluteUrl(step.url),
        image: absoluteUrl(step.image),
      })),
      inLanguage: content.locale,
    },
    {
      "@id": faqId,
      "@type": "FAQPage",
      mainEntity: content.faq.map((item) => ({
        "@type": "Question",
        name: item.name,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
      inLanguage: content.locale,
    },
  ];
}
