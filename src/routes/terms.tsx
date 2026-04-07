import { createFileRoute } from "@tanstack/react-router";
import { TermsOfServicePage } from "../modules/app-shell/TermsOfServicePage";

export const Route = createFileRoute("/terms")({
  component: TermsOfServicePage,
});
