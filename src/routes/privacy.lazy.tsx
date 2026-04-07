import { createLazyFileRoute } from "@tanstack/react-router";
import { PrivacyPolicyPage } from "../modules/app-shell/PrivacyPolicyPage";

export const Route = createLazyFileRoute("/privacy")({
  component: PrivacyPolicyPage,
});
