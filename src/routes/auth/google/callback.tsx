import { createFileRoute } from "@tanstack/react-router";
import { GoogleAuthCallbackPage } from "../../../modules/google-auth/GoogleAuthCallbackPage";

export const Route = createFileRoute("/auth/google/callback")({
  component: GoogleAuthCallbackPage,
});
