import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { pushToast } from "../../shared/ui/toastBus";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function getIsInstalled() {
  if (typeof window === "undefined") {
    return false;
  }

  const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
  const standaloneDisplayMode = mediaQuery?.matches ?? false;
  const iosStandalone = Boolean((window.navigator as NavigatorWithStandalone).standalone);

  return standaloneDisplayMode || iosStandalone;
}

export function usePwaLifecycle() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      pushToast("A Meishi update is available. Refresh the app to apply it.");
    },
    onOfflineReady() {
      pushToast(
        "Meishi can reopen its shell and saved local data offline. Extraction and Google sync still require a network connection."
      );
    },
    onRegisterError(error) {
      console.error("PWA registration failed", error);
    },
  });
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(getIsInstalled);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");

    const handleBeforeInstallPrompt = (event: Event) => {
      const nextInstallEvent = event as BeforeInstallPromptEvent;
      if (typeof nextInstallEvent.prompt !== "function") {
        return;
      }

      event.preventDefault();
      setInstallEvent(nextInstallEvent);
      pushToast("Meishi can be installed on this device.");
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
      pushToast("Meishi was installed on this device.");
    };

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      setIsInstalled(event.matches || Boolean((window.navigator as NavigatorWithStandalone).standalone));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery?.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery?.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  async function promptInstall() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") {
      setIsInstalled(true);
    }

    setInstallEvent(null);
  }

  async function applyUpdate() {
    await updateServiceWorker(true);
  }

  return {
    needRefresh,
    offlineReady,
    canInstall: installEvent !== null && !isInstalled,
    isInstalled,
    promptInstall,
    applyUpdate,
    dismissOfflineReady() {
      setOfflineReady(false);
    },
  };
}
