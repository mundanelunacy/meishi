import { createFileRoute, redirect } from "@tanstack/react-router";
import { selectHasLlmConfiguration } from "../modules/onboarding-settings/onboardingSlice";
import { getRootRouteRedirect } from "../modules/onboarding-settings/setupGate";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    throw redirect({
      to: getRootRouteRedirect(
        selectHasLlmConfiguration(context.store.getState()),
      ),
    });
  },
});
