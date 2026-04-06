import { useEffect, useState } from "react";
import {
  completeGoogleContactsAuthCallback,
  POPUP_MESSAGE_TYPE,
  postPopupMessage,
} from "./googleIdentity";

type CallbackStatus = "working" | "success" | "error";

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
  const [status, setStatus] = useState<CallbackStatus>("working");
  const [message, setMessage] = useState("Finishing Google authorization...");

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
      const nextMessage =
        "Google authorization returned without the required callback parameters.";
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
        setMessage("Google Contacts is connected. This window can close now.");
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
            : "Unable to complete Google authorization.";
        setStatus("error");
        setMessage(nextMessage);
        postPopupMessage({
          type: POPUP_MESSAGE_TYPE,
          status: "error",
          error: nextMessage,
        });
      });
  }, []);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-6 py-12">
      <section className="w-full rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Google Contacts
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">
          {status === "working"
            ? "Connecting..."
            : status === "success"
              ? "Connected"
              : "Connection failed"}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </section>
    </main>
  );
}
