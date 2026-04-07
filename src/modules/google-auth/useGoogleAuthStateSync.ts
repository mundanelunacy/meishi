import { useEffect } from "react";
import { hasFirebaseConfiguration } from "../../app/env";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectGoogleAuth,
  setGoogleAuthState,
} from "../onboarding-settings/onboardingSlice";
import { initializeGoogleAuth } from "./googleIdentity";

export function useGoogleAuthStateSync(enabled = true) {
  const dispatch = useAppDispatch();
  const googleAuth = useAppSelector(selectGoogleAuth);
  const { accountEmail, connectedAt, firebaseUid, scope, status } = googleAuth;

  useEffect(() => {
    if (!enabled || !hasFirebaseConfiguration()) {
      return;
    }

    let active = true;

    void initializeGoogleAuth()
      .then((nextGoogleAuth) => {
        if (!active) {
          return;
        }

        dispatch(setGoogleAuthState(nextGoogleAuth));
      })
      .catch(() => {
        if (!active || connectedAt) {
          return;
        }

        dispatch(
          setGoogleAuthState({
            accountEmail,
            connectedAt,
            firebaseUid,
            scope,
            status: "signed_out",
          }),
        );
      });

    return () => {
      active = false;
    };
  }, [
    accountEmail,
    connectedAt,
    dispatch,
    enabled,
    firebaseUid,
    scope,
    status,
  ]);
}
