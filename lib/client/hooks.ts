"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

const QUERY = "(max-width: 767px)";

function subscribe(listener: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function useIsPhone(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}

export function useCommonVM() {
  const isPhone = useIsPhone();
  return {
    isPhone,
    isDesktop: !isPhone,
    dialogProps: {
      style: isPhone
        ? { width: "100%", maxWidth: 344, maxHeight: "calc(100vh - 140px)", padding: 20, gap: 14 }
        : { maxHeight: "calc(100vh - 140px)" },
    },
    alertProps: { style: { alignItems: "center" } },
    toastProps: { style: { alignItems: "center" } },
    cqMode: isPhone ? "hti-cards" : "",
    tableScroll: { overflowX: "hidden", borderRadius: "var(--radius-control)" },
    mb8: { marginBottom: 8 },
    mt8: { marginTop: 8 },
    formCard: { width: "100%", maxWidth: 600 },
    wideCard: { width: "100%", maxWidth: 880 },
  };
}

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copy = useCallback((key: string, text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopied(key);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1800);
  }, []);
  return { copied, copy };
}
