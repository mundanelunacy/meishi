import { useRegisterSW } from "virtual:pwa-register/react";
import { pushToast } from "../../shared/ui/toastBus";

export function usePwaLifecycle() {
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW() {
      pushToast("Meishi is ready for install and background updates.");
    },
    onRegisterError(error) {
      console.error("PWA registration failed", error);
    },
  });

  return {
    needRefresh,
    updateServiceWorker,
  };
}
