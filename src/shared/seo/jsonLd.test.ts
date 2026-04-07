import { describe, expect, it } from "vitest";
import { getDocsPageSchema, getLandingPageSchema } from "./jsonLd";

function findNodeByType(
  graph: Array<Record<string, unknown>>,
  type: string,
) {
  return graph.find((node) => node["@type"] === type);
}

describe("JSON-LD schema builders", () => {
  it("builds a landing-page graph with software application metadata", () => {
    const graph = getLandingPageSchema();
    const software = findNodeByType(graph, "SoftwareApplication");

    expect(software).toMatchObject({
      "@type": "SoftwareApplication",
      name: "Meishi",
      applicationCategory: "BusinessApplication",
      url: "https://meishi-492400.web.app/landing",
      softwareHelp: {
        "@type": "CreativeWork",
        url: "https://meishi-492400.web.app/docs",
      },
    });
    expect(software?.featureList).toContain(
      "Export a vCard or sync the verified contact to Google Contacts.",
    );
  });

  it("builds docs-page FAQ and how-to graphs with absolute public URLs", () => {
    const graph = getDocsPageSchema();
    const howTo = findNodeByType(graph, "HowTo") as
      | Record<string, unknown>
      | undefined;
    const faq = findNodeByType(graph, "FAQPage") as
      | Record<string, unknown>
      | undefined;

    expect(howTo).toBeDefined();
    expect(faq).toBeDefined();

    const steps = howTo?.step as Array<Record<string, unknown>>;
    const questions = faq?.mainEntity as Array<Record<string, unknown>>;

    expect(steps).toHaveLength(5);
    expect(steps[0]).toMatchObject({
      "@type": "HowToStep",
      position: 1,
      url: "https://meishi-492400.web.app/settings",
      image:
        "https://meishi-492400.web.app/docs/screenshots/setup-settings-llm-provider.png",
    });
    expect(questions).toHaveLength(5);
    expect(questions[0]).toMatchObject({
      "@type": "Question",
      name: "What is Meishi?",
    });
  });
});