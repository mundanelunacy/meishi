import { createFileRoute, redirect } from "@tanstack/react-router";
import { selectHasCompletedOnboarding } from "../modules/onboarding-settings/onboardingSlice";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    const ready = selectHasCompletedOnboarding(context.store.getState());
    throw redirect({
      to: ready ? "/capture" : "/onboarding",
    });
  },
});
