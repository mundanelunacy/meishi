import { useIntl } from "react-intl";
import { LegalPageLayout, LegalSection } from "./LegalPageLayout";
import { getTermsOfServiceContent } from "./legalContent";

export function TermsOfServicePage() {
  const intl = useIntl();
  const content = getTermsOfServiceContent(intl);

  return (
    <LegalPageLayout
      title={content.title}
      summary={content.summary}
      effectiveDate={content.effectiveDate}
    >
      {content.sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </LegalSection>
      ))}
    </LegalPageLayout>
  );
}
