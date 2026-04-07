import { LegalPageLayout, LegalSection } from "./LegalPageLayout";

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      summary="Meishi is designed to keep business-card data local to your device whenever possible. This page explains what stays in the browser, what is sent to third parties, and when Firebase Functions are involved."
      effectiveDate="April 7, 2026"
    >
      <LegalSection title="Overview">
        <p>
          Meishi is a browser-only progressive web app for capturing business
          card images, extracting structured contact details with a user-chosen
          LLM provider, reviewing the result, exporting a vCard, and optionally
          syncing the verified contact to Google Contacts.
        </p>
        <p>
          The app is open source and follows a bring-your-own-key model for LLM
          extraction. That means the app does not provide its own hosted model
          service for routine card extraction.
        </p>
      </LegalSection>

      <LegalSection title="Data stored on your device">
        <p>
          Meishi stores the following information locally in your browser so the
          app can work across refreshes and offline sessions:
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground/70">
          <li>Selected LLM provider and preferred model</li>
          <li>Provider API keys entered by you</li>
          <li>Appearance settings and extraction prompt preferences</li>
          <li>
            Captured card images, draft contact data, and extraction snapshots
          </li>
          <li>
            Append-only local sync history and lightweight Google connection
            metadata
          </li>
        </ul>
        <p>
          This local data is stored using browser storage such as localStorage
          and IndexedDB. It remains on the device and browser profile you use,
          unless you clear it yourself or reset the app.
        </p>
      </LegalSection>

      <LegalSection title="Data sent to third parties">
        <p>
          When you run extraction, the captured card image data and the fixed
          extraction prompt are sent directly from your browser to the LLM
          provider you selected, using the API key you supplied.
        </p>
        <p>
          When you choose Google Contacts sync, Meishi sends the reviewed
          contact data and one selected image to Google APIs so the contact can
          be created and the contact photo uploaded.
        </p>
        <p>
          Those external providers operate under their own terms and privacy
          policies. Meishi does not control how OpenAI, Anthropic, Google, or
          other providers process data once you send it to them.
        </p>
      </LegalSection>

      <LegalSection title="Firebase and Google authorization">
        <p>
          Google authorization is handled through Firebase-backed browser flows
          and Firebase Functions. Functions act as a token broker for OAuth code
          exchange, refresh-token storage, short-lived access-token refresh, and
          disconnection or retention cleanup tasks.
        </p>
        <p>
          Meishi does not store durable Google bearer tokens in browser storage.
          The browser may store lightweight metadata such as connected account
          email, granted scope, and connection timestamps.
        </p>
      </LegalSection>

      <LegalSection title="Retention">
        <p>
          Local data remains in your browser until you remove it. Server-side
          Google credential records used for token brokering are currently
          subject to a retention cleanup job that deletes stored records after
          about 90 days from connection time.
        </p>
        <p>
          If those backend records are deleted, you may need to reconnect your
          Google account before syncing again.
        </p>
      </LegalSection>

      <LegalSection title="Security limitations">
        <p>
          Meishi is privacy-oriented, but it is still a prototype-oriented
          browser app. Provider API keys are stored client-side for convenience,
          which is acceptable for personal use on a trusted device but is not a
          production-grade secret-management model.
        </p>
        <p>
          You are responsible for deciding whether the information on a card is
          appropriate to process with your selected LLM provider or Google
          account.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can stop using Meishi at any time, clear browser storage, remove
          the app, revoke Google access from your Google account, and delete
          generated contacts from Google Contacts if you no longer want them
          stored there.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
