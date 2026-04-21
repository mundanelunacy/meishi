import { useEffect, useMemo, type ReactNode } from "react";
import posthog from "posthog-js";
import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import type { AnalyticsConsent } from "../../shared/types/models";
import { Button } from "../../shared/ui/button";
import { Card, CardContent } from "../../shared/ui/card";
import {
  selectAnalyticsConsent,
  setAnalyticsConsent,
} from "../onboarding-settings/onboardingSlice";
import {
  AnalyticsContext,
  noopAnalytics,
  type AnalyticsContextValue,
} from "./analyticsContext";
import { getConsentScreenContent } from "./content";
import { readPrivacyRegion } from "./bootstrap";

const POSTHOG_API_HOST =
  import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const POSTHOG_UI_HOST =
  import.meta.env.VITE_PUBLIC_POSTHOG_UI_HOST || "https://us.posthog.com";
const POSTHOG_CLIENT_API_HOST = import.meta.env.DEV ? "/ingest" : POSTHOG_API_HOST;
const POSTHOG_PROJECT_TOKEN =
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  (import.meta.env.MODE === "test" ? "test-token" : undefined);

function getEffectiveConsent(
  region: ReturnType<typeof readPrivacyRegion>,
  storedConsent: AnalyticsConsent | undefined,
) {
  if (storedConsent) {
    return storedConsent;
  }

  return region === "non-gdpr" ? "granted" : undefined;
}

export function GdprBootstrap({ children }: { children: ReactNode }) {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const storedConsent = useAppSelector(selectAnalyticsConsent);
  const region = readPrivacyRegion();
  const effectiveConsent = getEffectiveConsent(region, storedConsent);
  const isAnalyticsEnabled =
    effectiveConsent === "granted" && Boolean(POSTHOG_PROJECT_TOKEN);
  const content = getConsentScreenContent(intl);

  useEffect(() => {
    if (region === "non-gdpr" && storedConsent === undefined) {
      dispatch(setAnalyticsConsent("granted"));
    }
  }, [dispatch, region, storedConsent]);

  useEffect(() => {
    if (!POSTHOG_PROJECT_TOKEN) {
      return;
    }

    if (effectiveConsent === "granted") {
      if (!posthog.__loaded) {
        posthog.init(POSTHOG_PROJECT_TOKEN, {
          api_host: POSTHOG_CLIENT_API_HOST,
          ui_host: POSTHOG_UI_HOST,
          defaults: "2026-01-30",
          capture_exceptions: true,
          debug: import.meta.env.DEV,
        });
      } else {
        posthog.opt_in_capturing();
        posthog.startExceptionAutocapture();
      }

      return;
    }

    if (posthog.__loaded) {
      posthog.opt_out_capturing();
      posthog.stopExceptionAutocapture();
    }
  }, [effectiveConsent]);

  const analytics = useMemo<AnalyticsContextValue>(() => {
    if (!isAnalyticsEnabled) {
      return noopAnalytics;
    }

    return {
      capture(eventName, properties) {
        posthog.capture(eventName, properties ?? undefined);
      },
      captureException(error, properties) {
        posthog.captureException(error, properties);
      },
      isEnabled: true,
    };
  }, [isAnalyticsEnabled]);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
      {region === "gdpr" && storedConsent === undefined ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="gdpr-consent-title"
            className="w-full max-w-xl border-border shadow-elevated"
          >
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {content.eyebrow}
                </p>
                <h1
                  id="gdpr-consent-title"
                  className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                >
                  {content.title}
                </h1>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {content.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => dispatch(setAnalyticsConsent("granted"))}
                  className="sm:flex-1"
                >
                  {content.allow}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => dispatch(setAnalyticsConsent("denied"))}
                  className="sm:flex-1"
                >
                  {content.decline}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AnalyticsContext.Provider>
  );
}
