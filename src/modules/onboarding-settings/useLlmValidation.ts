import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  completeLlmValidationFailure,
  completeLlmValidationSuccess,
  selectCurrentLlmValidation,
  selectLlmValidationState,
  selectSettings,
  startLlmValidation,
} from "./onboardingSlice";
import {
  getLlmValidationPrecheck,
  getCurrentLlmConfiguration,
  matchesLlmConfiguration,
  validateLlmConfiguration,
} from "./llmKeyValidation";

interface UseLlmValidationOptions {
  autoValidate?: boolean;
  debounceMs?: number;
}

export function useLlmValidation({
  autoValidate = false,
  debounceMs = 700,
}: UseLlmValidationOptions = {}) {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const validation = useAppSelector(selectCurrentLlmValidation);
  const llmValidationState = useAppSelector(selectLlmValidationState);
  const currentConfiguration = useMemo(
    () => getCurrentLlmConfiguration(settings),
    [settings],
  );
  const precheck = useMemo(
    () => getLlmValidationPrecheck(currentConfiguration),
    [currentConfiguration],
  );
  const [isDebouncing, setIsDebouncing] = useState(false);
  const activeConfigurationRef = useRef(currentConfiguration);

  activeConfigurationRef.current = currentConfiguration;

  const validateCurrentConfiguration = useCallback(async () => {
    if (!currentConfiguration) {
      return {
        ok: false as const,
        errorMessage: "Enter an API key before validating.",
      };
    }

    const currentPrecheck = getLlmValidationPrecheck(currentConfiguration);
    if (!currentPrecheck.eligible) {
      return {
        ok: false as const,
        errorMessage: undefined,
      };
    }

    dispatch(startLlmValidation(currentConfiguration));

    try {
      await validateLlmConfiguration(currentConfiguration);
      if (
        matchesLlmConfiguration(activeConfigurationRef.current, currentConfiguration)
      ) {
        dispatch(completeLlmValidationSuccess(currentConfiguration));
      }
      return {
        ok: true as const,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to validate the selected provider.";

      if (
        matchesLlmConfiguration(activeConfigurationRef.current, currentConfiguration)
      ) {
        dispatch(
          completeLlmValidationFailure({
            ...currentConfiguration,
            errorMessage,
          }),
        );
      }

      return {
        ok: false as const,
        errorMessage,
      };
    }
  }, [currentConfiguration, dispatch]);

  useEffect(() => {
    if (!autoValidate) {
      return;
    }

    setIsDebouncing(false);

    if (!currentConfiguration || !precheck.eligible) {
      return;
    }

    if (
      validation.status === "valid" ||
      validation.status === "invalid"
    ) {
      return;
    }

    if (
      validation.status === "validating" &&
      matchesLlmConfiguration(
        llmValidationState.pendingConfiguration,
        currentConfiguration,
      )
    ) {
      return;
    }

    setIsDebouncing(true);
    const timeoutId = window.setTimeout(() => {
      setIsDebouncing(false);
      void validateCurrentConfiguration();
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
      setIsDebouncing(false);
    };
  }, [
    autoValidate,
    currentConfiguration,
    debounceMs,
    llmValidationState.pendingConfiguration,
    precheck.eligible,
    validateCurrentConfiguration,
    validation.status,
  ]);

  return {
    currentConfiguration,
    isDebouncing,
    precheck,
    validation,
    validateCurrentConfiguration,
  };
}
