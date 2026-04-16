import { useNavigate } from "@tanstack/react-router";
import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { cn } from "../../shared/lib/utils";
import { pushToast } from "../../shared/ui/toastBus";
import {
  getCommonToastMessages,
  getLandingContent,
} from "./onboardingContent";
import {
  completeOnboarding,
  selectAppReadiness,
} from "./onboardingSlice";
import { LlmConfigurationForm } from "./LlmConfigurationForm";

type LandingQuickSetupSectionProps = {
  sectionId?: string;
  className?: string;
  withTopBorder?: boolean;
};

export function LandingQuickSetupSection({
  sectionId = "setup",
  className,
  withTopBorder = true,
}: LandingQuickSetupSectionProps) {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const readiness = useAppSelector(selectAppReadiness);
  const content = getLandingContent(intl);
  const commonToasts = getCommonToastMessages(intl);

  const canContinue = readiness.hasLlmConfiguration;

  function handleFinish() {
    dispatch(completeOnboarding());
    pushToast(commonToasts.landingSetupComplete);
    navigate({ to: "/capture" });
  }

  return (
    <section
      id={sectionId}
      className={cn(
        "scroll-mt-20 bg-muted/30",
        withTopBorder && "border-t border-border",
        className,
      )}
    >
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {content.setup.title}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {content.setup.description}
          </p>
        </div>

        <div className="space-y-8 rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
          <LlmConfigurationForm
            apiKeyInputId="api-key"
            modelInputId="model"
            providerInputId="provider"
            securityNote={{
              title: content.setup.securityTitle,
              body: content.setup.securityBody,
            }}
            showApiKeyLinks
            continueAction={{
              disabled: !canContinue,
              help: content.setup.continueHelp,
              label: content.setup.continueLabel,
              onContinue: handleFinish,
            }}
          />
        </div>
      </div>
    </section>
  );
}
