"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import clsx from "clsx";

type ToastVariant = "success" | "error" | "info";

type ToastRecord = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextState = {
  pushToast: (toast: Omit<ToastRecord, "id">) => void;
};

const ToastContext = createContext<ToastContextState | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef<Record<string, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastRecord, "id">) => {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const nextToast: ToastRecord = { ...toast, id };
      setToasts((prev) => [...prev, nextToast]);
      const ttl = toast.duration ?? 5000;
      timers.current[id] = setTimeout(() => removeToast(id), ttl);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-3 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={clsx(
              "pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
              toast.variant === "success" && "border-emerald-500/40 bg-emerald-500/15 text-emerald-50",
              toast.variant === "error" && "border-red-500/40 bg-red-500/15 text-red-50",
              (!toast.variant || toast.variant === "info") && "border-white/15 bg-white/10 text-white",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && <p className="mt-1 text-xs text-white/80">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-xs font-medium uppercase tracking-wide text-white/70 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
