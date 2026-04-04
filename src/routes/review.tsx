import { createFileRoute, redirect } from "@tanstack/react-router";
import { ReviewWorkspace } from "../modules/contact-review/ReviewWorkspace";
import { selectHasCompletedOnboarding } from "../modules/onboarding-settings/onboardingSlice";

export const Route = createFileRoute("/review")({
  beforeLoad: ({ context }) => {
    if (!selectHasCompletedOnboarding(context.store.getState())) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: ReviewWorkspace,
});
