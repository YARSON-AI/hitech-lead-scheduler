"use client";

import type { MouseEvent, ReactNode } from "react";

export const GLYPH = {
  SEND: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  RESEND: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  BAN: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  COPY: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  CHECK: '<path d="M20 6 9 17l-5-5"/>',
  EXTERNAL: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  VIDEO: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
} as const;

export function Glyph({ paths, size = 16 }: { paths: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
}

type Tone = "neutral" | "danger" | "brand" | "done";

export function QuietButton({
  paths,
  label,
  onClick,
  tone = "neutral",
}: {
  paths: string;
  label: ReactNode;
  onClick?: () => void;
  tone?: Tone;
}) {
  return (
    <button
      type="button"
      className={`hti-q hti-q-${tone}`}
      onClick={(event: MouseEvent) => {
        event.stopPropagation();
        onClick?.();
      }}
      style={{
        height: 32,
        padding: "0 10px",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flex: "none",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        fontWeight: 500,
        background: "transparent",
        border: tone === "neutral" || tone === "done" ? "1px solid var(--border-default)" : "1px solid transparent",
        color: tone === "danger" ? "var(--red-600)" : tone === "brand" ? "var(--teal-700)" : tone === "done" ? "var(--green-700)" : "var(--gray-700)",
      }}
    >
      <Glyph paths={paths} />
      {label}
    </button>
  );
}

export function pressable(go: () => void) {
  return {
    tabIndex: 0,
    onKeyDown: (event: { key: string; target: unknown; currentTarget: unknown; preventDefault: () => void }) => {
      if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        go();
      }
    },
  };
}
