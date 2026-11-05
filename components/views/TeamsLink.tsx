"use client";

import type { MouseEvent } from "react";
import { Button } from "@/components/ds";
import { useCopy } from "@/lib/client/hooks";
import { Glyph, GLYPH, QuietButton } from "./bits";

const VIDEO_OFF =
  '<path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><path d="m2 2 20 20"/>';

export type TeamsState = "ready" | "missing" | "cancelled";

export function teamsState(booking: { status: string; teams_join_url: string | null }): TeamsState {
  if (booking.status === "cancelled") return "cancelled";
  return booking.teams_join_url ? "ready" : "missing";
}

function MiniButton({ paths, label, onClick, tone, disabled }: { paths: string; label: string; onClick?: () => void; tone?: "teal" | "done" | "gray"; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={!!disabled}
      className={disabled ? undefined : "hti-ibtn"}
      onClick={(event: MouseEvent) => {
        event.stopPropagation();
        onClick?.();
      }}
      style={{
        width: 32,
        height: 32,
        flex: "none",
        border: "none",
        borderRadius: "var(--radius-sm)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        background: tone === "teal" ? "var(--teal-50)" : tone === "done" ? "var(--green-50)" : "var(--gray-100)",
        color: disabled ? "var(--gray-300)" : tone === "teal" ? "var(--teal-700)" : tone === "done" ? "var(--green-700)" : "var(--gray-500)",
      }}
    >
      <Glyph paths={paths} />
    </button>
  );
}

export function TeamsLink({ url, state, variant }: { url: string | null; state: TeamsState; variant: "compact" | "join" | "inline" | "full" }) {
  const { copied, copy } = useCopy();
  const done = copied === "teams";
  const open = () => {
    if (url) window.open(url, "_blank", "noopener");
  };
  const doCopy = () => {
    if (url) copy("teams", url);
  };

  if (variant === "compact") {
    if (state === "missing") {
      return (
        <span title="אין קישור Teams" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-placeholder)", font: "var(--type-caption)", whiteSpace: "nowrap" }}>
          <Glyph paths={VIDEO_OFF} />
          אין קישור
        </span>
      );
    }
    if (state === "cancelled") {
      return (
        <span style={{ display: "inline-flex", gap: 6 }}>
          <MiniButton paths={GLYPH.VIDEO} label="הקישור אינו פעיל, הפגישה בוטלה" tone="gray" disabled />
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", gap: 6 }}>
        <MiniButton paths={GLYPH.VIDEO} label="הצטרפות ל-Teams" onClick={open} tone="teal" />
        <MiniButton paths={done ? GLYPH.CHECK : GLYPH.COPY} label={done ? "הועתק" : "העתקת קישור Teams"} onClick={doCopy} tone={done ? "done" : "gray"} />
      </span>
    );
  }

  if (variant === "join") {
    if (state === "cancelled") return null;
    if (state === "missing") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-placeholder)", font: "var(--type-caption)" }}>
          <Glyph paths={VIDEO_OFF} />
          אין קישור Teams
        </span>
      );
    }
    return (
      <Button size="md" onClick={open} style={{ alignSelf: "flex-start" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Glyph paths={GLYPH.VIDEO} size={18} />
          הצטרפות
        </span>
      </Button>
    );
  }

  if (variant === "inline") {
    if (state !== "ready") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "var(--type-body-sm)", color: "var(--text-tertiary)" }}>
          <span style={{ color: "var(--gray-400)", display: "flex" }}>
            <Glyph paths={VIDEO_OFF} />
          </span>
          {state === "missing" ? "אין קישור Teams" : "לא פעיל, הפגישה בוטלה"}
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <QuietButton paths={GLYPH.VIDEO} label="הצטרפות" onClick={open} />
        <QuietButton paths={done ? GLYPH.CHECK : GLYPH.COPY} label={done ? "הועתק" : "העתקה"} onClick={doCopy} tone={done ? "done" : "neutral"} />
      </span>
    );
  }

  if (state === "missing") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: "var(--radius-control)", background: "var(--gray-50)", border: "1px dashed var(--border-default)", color: "var(--text-tertiary)", font: "var(--type-body-sm)" }}>
        <span style={{ color: "var(--gray-400)", display: "flex" }}>
          <Glyph paths={VIDEO_OFF} size={20} />
        </span>
        אין קישור Teams
      </div>
    );
  }

  const off = state === "cancelled";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: "var(--radius-control)", background: off ? "var(--gray-50)" : "var(--teal-50)", border: "1px solid " + (off ? "var(--border-subtle)" : "var(--teal-200)") }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 200px", minWidth: 0 }}>
        <span style={{ width: 40, height: 40, flex: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: off ? "var(--gray-200)" : "#fff", color: off ? "var(--gray-400)" : "var(--teal-700)" }}>
          <Glyph paths={GLYPH.VIDEO} size={20} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ font: "var(--type-label)", color: off ? "var(--text-tertiary)" : "var(--text-primary)" }}>פגישת Teams</div>
          {off ? (
            <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>הקישור אינו פעיל, הפגישה בוטלה</div>
          ) : (
            <div dir="ltr" style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
              {url}
            </div>
          )}
        </div>
      </div>
      {!off && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button size="md" onClick={open}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Glyph paths={GLYPH.VIDEO} size={18} />
              הצטרפות
            </span>
          </Button>
          <Button variant="outline" size="md" onClick={doCopy} style={done ? { borderColor: "var(--green-300)", color: "var(--green-800)", background: "var(--green-50)" } : undefined}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Glyph paths={done ? GLYPH.CHECK : GLYPH.COPY} size={18} />
              {done ? "הועתק" : "העתקה"}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
