import { useEffect } from "react";
import { Provider } from "react-redux";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { store } from "./store";
import { routeTree } from "../routeTree.gen";
import { Toaster } from "../shared/ui/toaster";
import { useAppDispatch } from "./hooks";
import { initializeGoogleAuth } from "../modules/google-auth/googleIdentity";
import { setGoogleAuthState } from "../modules/onboarding-settings/onboardingSlice";

declare global {
  interface Window {
    __meishiPageSessionId?: string;
  }
}

if (typeof window !== "undefined" && !window.__meishiPageSessionId) {
  window.__meishiPageSessionId = crypto.randomUUID();
}

const router = createRouter({
  routeTree,
  context: {
    store,
  },
  defaultPreload: "intent",
  defaultPendingMinMs: 150,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRoot() {
  return (
    <Provider store={store}>
      <GoogleAuthBootstrap />
      <RouterProvider router={router} />
      <Toaster />
    </Provider>
  );
}

function GoogleAuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let active = true;

    void initializeGoogleAuth()
      .then((googleAuth) => {
        if (!active) {
          return;
        }

        dispatch(setGoogleAuthState(googleAuth));
      })
      .catch(() => {
        // Surface connect errors when the user explicitly tries to authorize.
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  return null;
}
