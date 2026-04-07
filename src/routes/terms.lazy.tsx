import { createLazyFileRoute } from "@tanstack/react-router";
import { TermsOfServicePage } from "../modules/app-shell/TermsOfServicePage";

export const Route = createLazyFileRoute("/terms")({
  component: TermsOfServicePage,
});
