import { createLazyFileRoute } from "@tanstack/react-router";
import { LandingPage } from "../modules/onboarding-settings/LandingPage";

export const Route = createLazyFileRoute("/landing")({
  component: LandingPage,
});
