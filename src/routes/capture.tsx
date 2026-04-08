import { createFileRoute, redirect } from "@tanstack/react-router";
import { selectHasLlmConfiguration } from "../modules/onboarding-settings/onboardingSlice";
import { getProtectedRouteSetupRedirect } from "../modules/onboarding-settings/setupGate";

export const Route = createFileRoute("/capture")({
  beforeLoad: ({ context }) => {
    const redirectTarget = getProtectedRouteSetupRedirect(
      selectHasLlmConfiguration(context.store.getState()),
    );

    if (redirectTarget) {
      throw redirect({ to: redirectTarget });
    }
  },
});
