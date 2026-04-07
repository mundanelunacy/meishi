import { createLazyFileRoute } from "@tanstack/react-router";
import { SettingsPanel } from "../modules/onboarding-settings/SettingsPanel";

export const Route = createLazyFileRoute("/settings")({
  component: SettingsPanel,
});
