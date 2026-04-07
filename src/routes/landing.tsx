import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "../modules/onboarding-settings/LandingPage";

export const Route = createFileRoute("/landing")({
  component: LandingPage,
});
