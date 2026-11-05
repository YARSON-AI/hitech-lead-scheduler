"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Toast } from "@/components/ds";

type Tone = "success" | "error" | "info" | "warning";
type ShowToast = (title: string, description?: string, tone?: Tone) => void;

const ToastContext = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ title: string; description?: string; tone: Tone } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback<ShowToast>((title, description, tone = "success") => {
    clearTimeout(timer.current);
    setToast({ title, description, tone });
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div style={{ position: "fixed", top: 16, insetInline: 0, zIndex: 60, display: "flex", justifyContent: "center", padding: "0 16px", pointerEvents: "none" }}>
          <div role="status" aria-live="polite" style={{ pointerEvents: "auto", maxWidth: "100%" }}>
            <Toast style={{ alignItems: "center" }} tone={toast.tone} title={toast.title} description={toast.description} onClose={() => setToast(null)} />
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
