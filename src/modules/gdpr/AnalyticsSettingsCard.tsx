import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/ui/card";
import { setAnalyticsConsent } from "../onboarding-settings/onboardingSlice";
import {
  selectAnalyticsConsent,
  selectAnalyticsConsentUpdatedAt,
} from "../onboarding-settings/onboardingSlice";
import { readPrivacyRegion } from "./bootstrap";
import { getAnalyticsSettingsContent } from "./content";

export function AnalyticsSettingsCard() {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const consent = useAppSelector(selectAnalyticsConsent);
  const consentUpdatedAt = useAppSelector(selectAnalyticsConsentUpdatedAt);
  const region = readPrivacyRegion();
  const content = getAnalyticsSettingsContent(intl, {
    consent,
    consentUpdatedAt,
    region,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{content.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{content.description}</p>
          <p>{content.regionLabel}</p>
        </div>

        <div className="space-y-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">{content.currentStatusLabel}</p>
          <p className="text-muted-foreground">{content.currentStatus}</p>
          {content.updatedAtLabel ? (
            <p className="text-xs text-muted-foreground">{content.updatedAtLabel}</p>
          ) : null}
        </div>

        <fieldset>
          <div className="flex flex-col gap-3">
            {(
              [
                ["granted", content.allow, content.allowHelp],
                ["denied", content.decline, content.declineHelp],
              ] as const
            ).map(([value, label, help]) => {
              const checked = consent === value;

              return (
                <label
                  key={value}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    checked
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="analytics-consent"
                      className="mt-0.5 h-4 w-4"
                      checked={checked}
                      onChange={() => dispatch(setAnalyticsConsent(value))}
                    />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{label}</p>
                      <p>{help}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}
