import { createFileRoute, redirect } from "@tanstack/react-router";
import { CaptureWorkspace } from "../modules/card-capture/CaptureWorkspace";
import { selectHasCompletedOnboarding } from "../modules/onboarding-settings/onboardingSlice";

export const Route = createFileRoute("/capture")({
  beforeLoad: ({ context }) => {
    if (!selectHasCompletedOnboarding(context.store.getState())) {
      throw redirect({ to: "/landing" });
    }
  },
  component: CaptureWorkspace,
});
