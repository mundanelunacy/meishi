const SITE_ORIGIN = "https://meishi-492400.web.app";
const SITE_NAME = "Meishi";
const SITE_DESCRIPTION =
  "Meishi helps you turn business cards into contacts you can review, edit, export as a vCard, and sync to Google Contacts.";
const GITHUB_REPO_URL = "https://github.com/mundanelunacy/meishi";
const CREATOR_URL = "https://github.com/mundanelunacy";

type JsonLdNode = Record<string, unknown>;

interface DocsSchemaContent {
  locale: "en-US" | "ja";
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
    "Extract structured contact details with OpenAI or Anthropic.",
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

export function getLandingPageSchema(): JsonLdNode[] {
  const base = getBaseGraph();
  const landingUrl = absoluteUrl("/landing");

  return [
    base.website,
    base.creator,
    base.software,
    {
      "@id": `${landingUrl}#webpage`,
      "@type": "WebPage",
      url: landingUrl,
      name: "Meishi | AI business card scanner",
      description:
        "Open-source AI business card scanner for private, browser-based capture, review, vCard export, and optional Google Contacts sync.",
      isPartOf: { "@id": base.websiteId },
      about: { "@id": base.softwareId },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: absoluteUrl("/landing/networking_scene.jpg"),
      },
      keywords: [
        "business card scanner",
        "AI contact extraction",
        "Google Contacts sync",
        "vCard export",
        "OpenAI business card OCR",
        "Anthropic business card scanner",
      ],
    },
  ];
}

export function getDocsPageSchema(content: DocsSchemaContent): JsonLdNode[] {
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
