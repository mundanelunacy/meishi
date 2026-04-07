import { createLazyFileRoute } from "@tanstack/react-router";
import { GoogleAuthCallbackPage } from "../../../modules/google-auth/GoogleAuthCallbackPage";

export const Route = createLazyFileRoute("/auth/google/callback")({
  component: GoogleAuthCallbackPage,
});
