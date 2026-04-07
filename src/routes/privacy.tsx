import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPolicyPage } from "../modules/app-shell/PrivacyPolicyPage";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicyPage,
});
