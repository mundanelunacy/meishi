import { createFileRoute, redirect } from "@tanstack/react-router";
import { SettingsPanel } from "../modules/onboarding-settings/SettingsPanel";
import { selectHasCompletedOnboarding } from "../modules/onboarding-settings/onboardingSlice";

export const Route = createFileRoute("/settings")({
  beforeLoad: ({ context }) => {
    if (!selectHasCompletedOnboarding(context.store.getState())) {
      throw redirect({ to: "/landing" });
    }
  },
  component: SettingsPanel,
});
