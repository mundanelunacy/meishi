import { useEffect } from "react";
import { Provider } from "react-redux";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { store } from "./store";
import { routeTree } from "../routeTree.gen";
import { Toaster } from "../shared/ui/toaster";
import { useAppSelector } from "./hooks";
import { applyThemeMode, SYSTEM_THEME_QUERY } from "./theme";
import { selectThemeMode } from "../modules/onboarding-settings/onboardingSlice";

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
  defaultPreload: false,
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
      <ThemeBootstrap />
      <RouterProvider router={router} />
      <Toaster />
    </Provider>
  );
}

function ThemeBootstrap() {
  const themeMode = useAppSelector(selectThemeMode);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
    const syncTheme = () => {
      applyThemeMode(themeMode, mediaQuery.matches);
    };

    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, [themeMode]);

  return null;
}
