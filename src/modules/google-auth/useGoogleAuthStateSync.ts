import { useEffect, useRef } from "react";
import { hasFirebaseConfiguration } from "../../app/env";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectGoogleAuth,
  setGoogleAuthState,
} from "../onboarding-settings/onboardingSlice";
import { initializeGoogleAuth } from "./googleIdentity";

function matchesGoogleAuthSnapshot(
  left: ReturnType<typeof selectGoogleAuth>,
  right: ReturnType<typeof selectGoogleAuth>,
) {
  return (
    left.status === right.status &&
    left.firebaseUid === right.firebaseUid &&
    left.scope === right.scope &&
    left.accountEmail === right.accountEmail &&
    left.connectedAt === right.connectedAt
  );
}

export function useGoogleAuthStateSync(enabled = true) {
  const dispatch = useAppDispatch();
  const googleAuth = useAppSelector(selectGoogleAuth);
  const googleAuthRef = useRef(googleAuth);

  googleAuthRef.current = googleAuth;

  useEffect(() => {
    if (!enabled || !hasFirebaseConfiguration()) {
      return;
    }

    let active = true;
    const initialGoogleAuth = googleAuthRef.current;

    void initializeGoogleAuth()
      .then((nextGoogleAuth) => {
        if (
          !active ||
          !matchesGoogleAuthSnapshot(googleAuthRef.current, initialGoogleAuth)
        ) {
          return;
        }

        dispatch(setGoogleAuthState(nextGoogleAuth));
      })
      .catch(() => {
        if (
          !active ||
          !matchesGoogleAuthSnapshot(
            googleAuthRef.current,
            initialGoogleAuth,
          ) ||
          initialGoogleAuth.connectedAt
        ) {
          return;
        }

        dispatch(
          setGoogleAuthState({
            accountEmail: initialGoogleAuth.accountEmail,
            connectedAt: initialGoogleAuth.connectedAt,
            firebaseUid: initialGoogleAuth.firebaseUid,
            scope: initialGoogleAuth.scope,
            status: "signed_out",
          }),
        );
      });

    return () => {
      active = false;
    };
  }, [dispatch, enabled]);
}
