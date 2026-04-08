import { createFileRoute, redirect } from "@tanstack/react-router";
import { selectHasLlmConfiguration } from "../modules/onboarding-settings/onboardingSlice";
import { getSetupRouteRedirect } from "../modules/onboarding-settings/setupGate";

export const Route = createFileRoute("/setup")({
  beforeLoad: ({ context }) => {
    const redirectTarget = getSetupRouteRedirect(
      selectHasLlmConfiguration(context.store.getState()),
    );

    if (redirectTarget) {
      throw redirect({ to: redirectTarget });
    }
  },
});
