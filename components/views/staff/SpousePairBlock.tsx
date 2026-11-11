"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { FieldLabel, Icon } from "@/components/ds";

export interface PairChip {
  key: string;
  word: string;
  range: string;
  taken: boolean;
}

function PairCard({ label, hint, selected, disabled, extra, onSelect, children }: { label: string; hint: string; selected: boolean; disabled: boolean; extra?: string | null; onSelect: () => void; children?: ReactNode }) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className="hti-rc"
      onClick={disabled ? undefined : onSelect}
      onKeyDown={(event: KeyboardEvent) => {
        if (!disabled && (event.key === " " || event.key === "Enter")) {
          event.preventDefault();
          onSelect();
        }
      }}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "flex-start",
        gap: 12,
        borderRadius: "var(--radius-control)",
        border: "2px solid " + (selected ? "var(--color-primary)" : "var(--border-default)"),
        background: selected ? "var(--color-primary-soft)" : disabled ? "var(--gray-50)" : "#fff",
        padding: "12px 16px",
        cursor: disabled ? "not-allowed" : "pointer",
        outline: "none",
        transition: "all var(--dur-base)",
      }}
    >
      <span style={{ width: 20, height: 20, marginTop: 1, borderRadius: "50%", border: "2px solid " + (selected ? "var(--color-primary)" : "var(--gray-300)"), background: selected ? "var(--color-primary)" : disabled ? "var(--gray-100)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ font: "var(--type-label)", color: selected ? "var(--color-primary-hover)" : disabled ? "var(--gray-400)" : "var(--gray-600)" }}>{label}</span>
        <p style={{ marginTop: 2, font: "var(--type-body-sm)", color: disabled ? "var(--gray-400)" : "var(--text-tertiary)" }}>{hint}</p>
        {extra && <p style={{ marginTop: 4, font: "var(--type-body-sm)", fontWeight: 500, color: "var(--text-secondary)" }}>{extra}</p>}
        {children}
      </div>
    </div>
  );
}

export function SpousePairBlock({
  customerName,
  dateLine,
  timeRange,
  agentName,
  dow,
  mode,
  anyFree,
  chips,
  chosen,
  onMode,
  onChip,
}: {
  customerName: string;
  dateLine: string;
  timeRange: string;
  agentName: string;
  dow: string;
  mode: "attach" | "calendar";
  anyFree: boolean;
  chips: PairChip[];
  chosen: string;
  onMode: (mode: "attach" | "calendar") => void;
  onChip: (key: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="hti-slide-down">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: "var(--radius-control)", background: "var(--surface-subtle)" }}>
        <span style={{ width: 40, height: 40, flex: "none", borderRadius: "50%", background: "var(--color-primary-soft-2)", color: "var(--color-primary-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="calendar" size={20} />
        </span>
        <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>פגישת בן/בת הזוג</span>
          <span style={{ font: "var(--type-label)", color: "var(--text-primary)" }}>{customerName}</span>
          <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
            {dow} ● <span dir="ltr" style={{ whiteSpace: "nowrap" }}>{dateLine}</span> ● <span dir="ltr" style={{ whiteSpace: "nowrap" }}>{timeRange}</span>
          </span>
          <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>{`סוכן/ת: ${agentName}`}</span>
        </div>
      </div>
      <div style={{ marginTop: 4 }}>
        <FieldLabel>מועד הפגישה*</FieldLabel>
      </div>
      <div role="radiogroup" aria-label="מועד הפגישה" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <PairCard
          label="הצמדה לפגישה הקיימת"
          hint="הפגישה תיקבע מיד לפני או אחרי הפגישה של בן/בת הזוג, אצל אותו/ה סוכן/ת."
          selected={mode === "attach"}
          disabled={!anyFree}
          extra={anyFree ? null : "אין מועד פנוי צמוד לפגישה"}
          onSelect={() => onMode("attach")}
        >
          {mode === "attach" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: 8, marginTop: 12 }}>
              {chips.map((chip) => {
                const on = chosen === chip.key;
                return (
                  <div key={chip.key} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <button
                      type="button"
                      className="hti-pchip"
                      disabled={chip.taken}
                      aria-pressed={on}
                      onClick={(event: MouseEvent) => {
                        event.stopPropagation();
                        onChip(chip.key);
                      }}
                      style={{
                        height: 44,
                        width: "100%",
                        borderRadius: "var(--radius-sm)",
                        padding: "0 10px",
                        whiteSpace: "nowrap",
                        border: "2px solid " + (on ? "var(--color-primary)" : chip.taken ? "var(--border-subtle)" : "var(--border-default)"),
                        background: on ? "var(--color-primary)" : chip.taken ? "var(--gray-50)" : "#fff",
                        color: on ? "#fff" : chip.taken ? "var(--gray-400)" : "var(--text-primary)",
                        font: "var(--type-label)",
                        fontFamily: "var(--font-body)",
                        cursor: chip.taken ? "not-allowed" : "pointer",
                        textDecoration: chip.taken ? "line-through" : "none",
                        transition: "all var(--dur-base)",
                      }}
                    >
                      {chip.word + " · "}
                      <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>{chip.range}</span>
                    </button>
                    {chip.taken && <span style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", textAlign: "center" }}>תפוס ביומן</span>}
                  </div>
                );
              })}
            </div>
          )}
        </PairCard>
        <PairCard label="בחירת מועד מהיומן" hint="כל מועד פנוי אצל הסוכן/ת של בן/בת הזוג." selected={mode === "calendar"} disabled={false} onSelect={() => onMode("calendar")} />
      </div>
    </div>
  );
}
