import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  completeLlmValidationFailure,
  completeLlmValidationSuccess,
  selectCurrentLlmValidation,
  selectSettings,
  startLlmValidation,
} from "./onboardingSlice";
import {
  getCurrentLlmConfiguration,
  validateLlmConfiguration,
} from "./llmKeyValidation";

export function useLlmValidation() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const validation = useAppSelector(selectCurrentLlmValidation);
  const currentConfiguration = getCurrentLlmConfiguration(settings);

  async function validateCurrentConfiguration() {
    if (!currentConfiguration) {
      return {
        ok: false as const,
        errorMessage: "Enter an API key before validating.",
      };
    }

    dispatch(startLlmValidation(currentConfiguration));

    try {
      await validateLlmConfiguration(currentConfiguration);
      dispatch(completeLlmValidationSuccess(currentConfiguration));
      return {
        ok: true as const,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to validate the selected provider.";

      dispatch(
        completeLlmValidationFailure({
          ...currentConfiguration,
          errorMessage,
        }),
      );

      return {
        ok: false as const,
        errorMessage,
      };
    }
  }

  return {
    currentConfiguration,
    validation,
    validateCurrentConfiguration,
  };
}
