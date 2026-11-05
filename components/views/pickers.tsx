"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Calendar, Icon } from "@/components/ds";

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function controlStyle(open: boolean, disabled?: boolean): CSSProperties {
  return {
    height: 44,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    border: "2px solid " + (open ? "var(--color-primary)" : "var(--border-default)"),
    borderRadius: "var(--radius-control)",
    padding: "0 12px",
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-base)",
    color: disabled ? "var(--text-tertiary)" : "var(--text-primary)",
    background: disabled ? "var(--gray-50)" : "var(--surface-card)",
    cursor: disabled ? "not-allowed" : "pointer",
    textAlign: "start",
  };
}

interface Rect {
  top: number;
  bottom: number;
  right: number;
}

export function DateField({
  value,
  onChange,
  disabled,
  placeholder,
  today = new Date(),
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  disabled?: boolean;
  placeholder?: string;
  today?: Date;
}) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!rect) return;
    const close = () => setRect(null);
    const onScroll = (event: Event) => {
      if ((event.target as Element)?.closest?.(".hti-dp")) return;
      close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [rect]);

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setRect(rect ? null : { top: box.top, bottom: box.bottom, right: box.right });
  };

  let popup = null;
  if (rect) {
    const width = 320;
    const height = 360;
    const margin = 8;
    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - margin) top = rect.top - height - 6;
    if (top < margin) top = Math.max(margin, window.innerHeight - margin - height);
    const left = Math.max(margin, Math.min(rect.right - width, window.innerWidth - margin - width));
    popup = createPortal(
      <div
        dir="rtl"
        className="hti-dp"
        style={{ position: "fixed", inset: 0, zIndex: 1000, fontFamily: "var(--font-body)" }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setRect(null);
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="hti-pop" style={{ position: "absolute", top, left, width, boxShadow: "var(--shadow-xl)", borderRadius: "var(--radius-control)" }}>
          <Calendar
            value={value}
            today={today}
            disabledWeekdays={[]}
            onChange={(date: Date) => {
              onChange(date);
              setRect(null);
            }}
          />
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <>
      <button type="button" disabled={!!disabled} aria-haspopup="dialog" aria-expanded={!!rect} onClick={disabled ? undefined : toggle} style={controlStyle(!!rect, disabled)}>
        <span dir="ltr">{value ? formatDate(value) : placeholder}</span>
        <Icon name="calendar" size={18} />
      </button>
      {popup}
    </>
  );
}

export const TIME_LIST: string[] = [];
for (let hour = 6; hour <= 21; hour++) {
  TIME_LIST.push(`${String(hour).padStart(2, "0")}:00`, `${String(hour).padStart(2, "0")}:30`);
}

export function timeOptionStyle(on: boolean): CSSProperties {
  return {
    height: 34,
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    border: "1px solid " + (on ? "var(--color-primary)" : "var(--border-default)"),
    background: on ? "var(--color-primary)" : "#fff",
    color: on ? "#fff" : "var(--text-primary)",
    font: "var(--type-tabular)",
    fontSize: 13,
  };
}
