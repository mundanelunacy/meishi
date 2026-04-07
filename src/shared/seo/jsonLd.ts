const SITE_ORIGIN = "https://meishi-492400.web.app";
const SITE_NAME = "Meishi";
const SITE_DESCRIPTION =
  "Meishi helps you turn business cards into contacts you can review, edit, export as a vCard, and sync to Google Contacts.";
const GITHUB_REPO_URL = "https://github.com/mundanelunacy/meishi";
const CREATOR_URL = "https://github.com/mundanelunacy";

type JsonLdNode = Record<string, unknown>;

function absoluteUrl(path: string) {
  return new URL(path, SITE_ORIGIN).toString();
}

function getBaseGraph() {
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
      inLanguage: "en",
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
      description: SITE_DESCRIPTION,
      isAccessibleForFree: true,
      browserRequirements:
        "Requires JavaScript and a modern browser with camera or image upload support.",
      featureList: [
        "Scan business cards from your camera or photo library.",
        "Extract structured contact details with OpenAI or Anthropic.",
        "Review and edit the extracted contact data in your browser.",
        "Export a vCard or sync the verified contact to Google Contacts.",
        "Keep captured images and draft edits on-device while you work.",
      ],
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
        name: "Meishi documentation",
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

export function getDocsPageSchema(): JsonLdNode[] {
  const base = getBaseGraph();
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
      name: "How to use Meishi",
      description:
        "Documentation for setting up Meishi, capturing business card images, running extraction, reviewing contacts, exporting vCards, and syncing to Google Contacts.",
      isPartOf: { "@id": base.websiteId },
      about: { "@id": base.softwareId },
      mainEntity: [{ "@id": howToId }, { "@id": faqId }],
      keywords: [
        "how to use Meishi",
        "business card scanner tutorial",
        "OpenAI API key setup",
        "Anthropic API key setup",
        "Google Contacts sync help",
      ],
    },
    {
      "@id": howToId,
      "@type": "HowTo",
      name: "How to use Meishi",
      description:
        "Set up your AI provider, capture business-card images, run extraction, review the draft, and export or sync the finished contact.",
      totalTime: "PT5M",
      supply: [
        {
          "@type": "HowToSupply",
          name: "An OpenAI or Anthropic API key",
        },
        {
          "@type": "HowToSupply",
          name: "One or more business-card images",
        },
      ],
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Open Meishi and complete first-run setup",
          text: "Open Settings, choose OpenAI or Anthropic, paste your API key, confirm the selected model, and save your setup. Google Contacts access is optional at this stage.",
          url: absoluteUrl("/settings"),
          image: absoluteUrl(
            "/docs/screenshots/setup-settings-llm-provider.png",
          ),
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Capture one or more business-card images",
          text: "Open Capture, use the camera or image library, and include both sides of the card if the back contains useful details.",
          url: absoluteUrl("/capture"),
          image: absoluteUrl("/docs/screenshots/capture-photoroll.png"),
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Run extraction",
          text: "Start the scan after your images are loaded so Meishi can send them to your chosen AI service, validate the response, and fill in the review form.",
          url: `${docsUrl}#how-to-use`,
          image: absoluteUrl("/docs/screenshots/capture-extract-button.png"),
        },
        {
          "@type": "HowToStep",
          position: 4,
          name: "Review and correct the extracted contact",
          text: "Open Review to verify the extracted fields, edit richer Google-Contacts-style data, and let edits autosave locally.",
          url: absoluteUrl("/review"),
          image: absoluteUrl("/docs/screenshots/review-verify-contact.png"),
        },
        {
          "@type": "HowToStep",
          position: 5,
          name: "Export or sync",
          text: "From Review, either save a local vCard file or sync the verified contact to Google Contacts.",
          url: absoluteUrl("/review"),
          image: absoluteUrl("/docs/screenshots/review-save-buttons.png"),
        },
      ],
    },
    {
      "@id": faqId,
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Meishi?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Meishi is a browser-based app for scanning business cards, turning them into organized contact details with AI, reviewing the results on your device, exporting a vCard, and optionally sending the finished contact to Google Contacts.",
          },
        },
        {
          "@type": "Question",
          name: "How do I obtain an API key?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Choose OpenAI or Anthropic in Meishi, then create an API key in that provider's dashboard and paste it into Meishi during setup or later on the Settings page.",
          },
        },
        {
          "@type": "Question",
          name: "How do I use Meishi?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Set up your AI provider, capture one or more business-card images, run extraction, review and correct the contact draft, then export a vCard or sync to Google Contacts.",
          },
        },
        {
          "@type": "Question",
          name: "How do I view contacts once they are scanned?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Use the Review page to inspect and edit the current draft, save a vCard to your device, or sync the verified contact to Google Contacts and view it there after sync succeeds.",
          },
        },
        {
          "@type": "Question",
          name: "How do I support Meishi?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can support Meishi by using it with real card samples, reporting gaps, starring or sharing the GitHub repository, and supporting the project directly through Buy Me a Coffee.",
          },
        },
      ],
    },
  ];
}
