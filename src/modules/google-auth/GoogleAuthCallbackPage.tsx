import { useEffect, useState } from "react";
import { defineMessages, useIntl } from "react-intl";
import {
  completeGoogleContactsAuthCallback,
  POPUP_MESSAGE_TYPE,
  postPopupMessage,
} from "./googleIdentity";

type CallbackStatus = "working" | "success" | "error";

const messages = defineMessages({
  workingMessage: {
    id: "googleAuth.callback.workingMessage",
    defaultMessage: "Finishing Google authorization...",
  },
  missingParams: {
    id: "googleAuth.callback.missingParams",
    defaultMessage:
      "Google authorization returned without the required callback parameters.",
  },
  successMessage: {
    id: "googleAuth.callback.successMessage",
    defaultMessage: "Google Contacts is connected. This window can close now.",
  },
  unableComplete: {
    id: "googleAuth.callback.unableComplete",
    defaultMessage: "Unable to complete Google authorization.",
  },
  eyebrow: {
    id: "googleAuth.callback.eyebrow",
    defaultMessage: "Google Contacts",
  },
  headingWorking: {
    id: "googleAuth.callback.headingWorking",
    defaultMessage: "Connecting...",
  },
  headingSuccess: {
    id: "googleAuth.callback.headingSuccess",
    defaultMessage: "Connected",
  },
  headingError: {
    id: "googleAuth.callback.headingError",
    defaultMessage: "Connection failed",
  },
});

function readSearchParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get("code"),
    state: params.get("state"),
    error: params.get("error"),
    errorDescription: params.get("error_description"),
  };
}

export function GoogleAuthCallbackPage() {
  const intl = useIntl();
  const [status, setStatus] = useState<CallbackStatus>("working");
  const [message, setMessage] = useState(
    intl.formatMessage(messages.workingMessage),
  );

  useEffect(() => {
    const { code, error, errorDescription, state } = readSearchParams();

    if (error) {
      const nextMessage = errorDescription || error;
      setStatus("error");
      setMessage(nextMessage);
      postPopupMessage({
        type: POPUP_MESSAGE_TYPE,
        status: "error",
        error: nextMessage,
      });
      return;
    }

    if (!code || !state) {
      const nextMessage = intl.formatMessage(messages.missingParams);
      setStatus("error");
      setMessage(nextMessage);
      postPopupMessage({
        type: POPUP_MESSAGE_TYPE,
        status: "error",
        error: nextMessage,
      });
      return;
    }

    void completeGoogleContactsAuthCallback({
      code,
      state,
    })
      .then((googleAuth) => {
        setStatus("success");
        setMessage(intl.formatMessage(messages.successMessage));
        postPopupMessage({
          type: POPUP_MESSAGE_TYPE,
          status: "success",
          googleAuth,
        });
        window.setTimeout(() => {
          window.close();
        }, 150);
      })
      .catch((callbackError) => {
        const nextMessage =
          callbackError instanceof Error
            ? callbackError.message
            : intl.formatMessage(messages.unableComplete);
        setStatus("error");
        setMessage(nextMessage);
        postPopupMessage({
          type: POPUP_MESSAGE_TYPE,
          status: "error",
          error: nextMessage,
        });
      });
  }, [intl]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-6 py-12">
      <section className="w-full rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          {intl.formatMessage(messages.eyebrow)}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">
          {status === "working"
            ? intl.formatMessage(messages.headingWorking)
            : status === "success"
              ? intl.formatMessage(messages.headingSuccess)
              : intl.formatMessage(messages.headingError)}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </section>
    </main>
  );
}
