import { createLazyFileRoute } from "@tanstack/react-router";
import { SetupPage } from "../modules/onboarding-settings/SetupPage";

export const Route = createLazyFileRoute("/setup")({
  component: SetupPage,
});
