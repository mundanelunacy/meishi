import { LegalPageLayout, LegalSection } from "./LegalPageLayout";

export function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      summary="These terms govern use of the Meishi web app and related open-source project materials. They focus on the current browser-only product shape, third-party integrations, and prototype limitations."
      effectiveDate="April 7, 2026"
    >
      <LegalSection title="Use of the app">
        <p>
          Meishi is provided as a browser-based tool for scanning business
          cards, extracting structured contact information, reviewing results,
          exporting vCards, and optionally syncing contacts to Google Contacts.
        </p>
        <p>
          You may use the app only in compliance with applicable law, the rights
          of the people whose information you process, and the terms of any
          third-party provider you connect to through the app.
        </p>
      </LegalSection>

      <LegalSection title="Your responsibilities">
        <p>
          You are responsible for the data you upload or process, the API keys
          and connected accounts you use, and the accuracy of any contact data
          you decide to export or sync.
        </p>
        <p>
          Meishi can assist with extraction, but you remain responsible for
          reviewing the output before saving, sharing, or syncing it to another
          service.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          Meishi depends on third-party services including LLM providers,
          Firebase, and Google APIs. Your use of those services is governed by
          their own terms, privacy policies, quotas, and availability.
        </p>
        <p>
          The app may stop working in whole or in part if a third-party service
          changes its APIs, pricing, quotas, or acceptable-use rules.
        </p>
      </LegalSection>

      <LegalSection title="Open-source license">
        <p>
          The Meishi project is distributed under the AGPL-3.0-or-later license.
          These terms do not replace or narrow the rights and obligations that
          arise under that license for the source code itself.
        </p>
      </LegalSection>

      <LegalSection title="No warranties">
        <p>
          Meishi is provided on an as-is and as-available basis, without
          warranties of any kind, whether express or implied. This includes no
          warranty that extraction results will be complete, accurate, or fit
          for a particular purpose.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, the project maintainers and
          contributors are not liable for any indirect, incidental, special,
          consequential, or exemplary damages arising from your use of Meishi,
          including data loss, inaccurate contact data, service interruptions,
          or third-party account issues.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          The app and these terms may change over time as the project evolves.
          Continued use after a published update means you accept the revised
          terms for future use.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For project issues, feature requests, or questions about these terms,
          use the public repository linked from the landing page and app shell.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
