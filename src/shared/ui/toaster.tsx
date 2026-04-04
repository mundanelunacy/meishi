import { useEffect, useState } from "react";
import { subscribeToToasts } from "./toastBus";

type Toast = {
  id: number;
  message: string;
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return subscribeToToasts((message) => {
      const toast = { id: Date.now(), message };
      setToasts((current) => [...current, toast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 3200);
    });
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-card"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
