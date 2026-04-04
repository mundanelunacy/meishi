import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPanel } from "../modules/onboarding-settings/OnboardingPanel";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPanel,
});
