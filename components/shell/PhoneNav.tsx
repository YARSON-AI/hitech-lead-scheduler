"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { Icon } from "@/components/ds";

export interface PhoneNavItem {
  key: string;
  href: string;
  label: string;
  icon: string;
  count?: number;
  on: boolean;
  primary?: boolean;
  onClick?: (event: { preventDefault: () => void }) => void;
}

const fade = (width: number, blur: number, stop: string): CSSProperties => {
  const mask = `linear-gradient(to left, transparent 0%, ${stop}, #000 100%)`;
  return {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width,
    pointerEvents: "none",
    borderRadius: "var(--radius-pill) 0 0 var(--radius-pill)",
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    maskImage: mask,
    WebkitMaskImage: mask,
  };
};

const itemStyle = (on: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  flex: "none",
  height: 36,
  padding: "0 14px",
  border: "none",
  borderRadius: "var(--radius-pill)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  background: on ? "var(--color-primary)" : "transparent",
  color: on ? "#fff" : "var(--gray-600)",
  fontFamily: "var(--font-body)",
  fontWeight: 500,
  fontSize: 14,
  textDecoration: "none",
});

export function PhoneNav({ items }: { items: PhoneNavItem[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const active = items.find((item) => item.on && !item.primary)?.key;

  useEffect(() => {
    const box = scroller.current;
    const el = box?.querySelector<HTMLElement>(`[data-navkey="${active}"]`);
    if (!box || !el) return;
    const b = box.getBoundingClientRect();
    const e = el.getBoundingClientRect();
    box.scrollLeft += e.left + e.width / 2 - (b.left + b.width / 2);
  }, [active]);

  return (
    <div style={{ position: "relative", width: "100%", minWidth: 0, borderRadius: "var(--radius-pill)", background: "var(--surface-subtle)" }}>
      <div ref={scroller} className="hti-hscroll" style={{ display: "flex", gap: 6, overflowX: "auto", padding: 4, borderRadius: "var(--radius-pill)" }}>
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            data-navkey={item.key}
            onClick={item.onClick}
            className={item.primary ? "hti-pill-primary" : "hti-pill"}
            data-on={item.on ? "1" : "0"}
            style={item.primary ? { ...itemStyle(true), fontFamily: "var(--font-display)", fontWeight: 600 } : itemStyle(item.on)}
            aria-current={item.on ? "page" : undefined}
          >
            <Icon name={item.icon} size={16} />
            <span>{item.label}</span>
            {!!item.count && (
              <span style={{ minWidth: 20, borderRadius: 999, padding: "0 6px", background: item.on ? "rgba(255,255,255,.25)" : "var(--status-error)", color: "#fff", fontSize: 12, textAlign: "center" }}>
                {item.count}
              </span>
            )}
          </Link>
        ))}
        <span style={{ flex: "none", width: 64 }} />
      </div>
      <div style={fade(68, 1, "rgba(0,0,0,.5) 40%")} />
      <div style={fade(44, 2.5, "rgba(0,0,0,.45) 45%")} />
      <div style={fade(26, 4.5, "rgba(0,0,0,.5) 50%")} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 68, pointerEvents: "none", borderRadius: "var(--radius-pill) 0 0 var(--radius-pill)", background: "linear-gradient(to left, rgba(70,180,157,0) 0%, rgba(70,180,157,.035) 55%, rgba(70,180,157,.07) 100%)" }} />
    </div>
  );
}
