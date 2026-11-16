"use client";

import { useState } from "react";
import { FieldLabel } from "@/components/ds";

export function NoteField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
      <FieldLabel htmlFor="booking-note">הערה לפגישה</FieldLabel>
      <textarea
        id="booking-note"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        maxLength={1000}
        rows={2}
        placeholder="ההערה תירשם בליד בשורנס"
        style={{
          border: "2px solid " + (focus ? "var(--border-focus)" : "var(--border-default)"),
          borderRadius: "var(--radius-control)",
          padding: "10px var(--pad-input-x)",
          font: "var(--type-body)",
          fontFamily: "var(--font-body)",
          color: "var(--text-primary)",
          background: "var(--surface-card)",
          width: "100%",
          resize: "vertical",
        }}
      />
    </div>
  );
}
