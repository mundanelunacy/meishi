import { useIntl } from "react-intl";
import { LegalPageLayout, LegalSection } from "./LegalPageLayout";
import { getPrivacyPolicyContent } from "./legalContent";

export function PrivacyPolicyPage() {
  const intl = useIntl();
  const content = getPrivacyPolicyContent(intl);

  return (
    <LegalPageLayout
      title={content.title}
      summary={content.summary}
      effectiveDate={content.effectiveDate}
    >
      {content.sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.paragraphs[0] ? <p>{section.paragraphs[0]}</p> : null}
          {section.listItems?.length ? (
            <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground/70">
              {section.listItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {section.paragraphs.slice(1).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </LegalSection>
      ))}
    </LegalPageLayout>
  );
}
