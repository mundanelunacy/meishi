import { useEffect } from "react";
import { IntlProvider } from "react-intl";
import { Provider } from "react-redux";
import { PostHogProvider } from "@posthog/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { store } from "./store";
import { routeTree } from "../routeTree.gen";
import { Toaster } from "../shared/ui/toaster";
import { useAppSelector } from "./hooks";
import { DEFAULT_LOCALE, getLocaleMessages } from "./intl";
import { applyThemeMode, SYSTEM_THEME_QUERY } from "./theme";
import {
  selectLocale,
  selectThemeMode,
} from "../modules/onboarding-settings/onboardingSlice";

declare global {
  interface Window {
    __meishiPageSessionId?: string;
  }
}

const POSTHOG_API_HOST =
  import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const POSTHOG_UI_HOST =
  import.meta.env.VITE_PUBLIC_POSTHOG_UI_HOST || "https://us.posthog.com";
const POSTHOG_CLIENT_API_HOST = import.meta.env.DEV ? "/ingest" : POSTHOG_API_HOST;

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
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN!}
      options={{
        api_host: POSTHOG_CLIENT_API_HOST,
        ui_host: POSTHOG_UI_HOST,
        defaults: "2026-01-30",
        capture_exceptions: true,
        debug: import.meta.env.DEV,
      }}
    >
      <Provider store={store}>
        <ThemeBootstrap />
        <IntlBootstrap />
      </Provider>
    </PostHogProvider>
  );
}

function IntlBootstrap() {
  const locale = useAppSelector(selectLocale);

  return (
    <IntlProvider
      locale={locale}
      defaultLocale={DEFAULT_LOCALE}
      messages={getLocaleMessages(locale)}
      wrapRichTextChunksInFragment
    >
      <RouterProvider router={router} />
      <Toaster />
    </IntlProvider>
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
