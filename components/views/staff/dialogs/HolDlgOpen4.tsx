"use client";

 
import { Fragment } from "react";
import { Checkbox, Dialog, FieldLabel, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function HolDlgOpen4({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <Dialog open={v.holDlgOpen} onClose={v.closeHolAdd} title={v.holDlgTitle} description={v.holDlgDesc} footer={v.holAddFooter} {...v.dialogProps}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: "1 1 auto", minHeight: "0", overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain" }}>
          <TextInput label="שם*" placeholder="לדוגמה: יום גיבוש" value={v.holName} onChange={v.onHolName} disabled={v.holLocked} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
              <FieldLabel>
                מתאריך*
              </FieldLabel>
              {" "}{v.holFromField}{" "}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
              <FieldLabel>
                עד תאריך*
              </FieldLabel>
              {" "}{v.holToField}{" "}
            </div>
          </div>
          {v.holDatesHint && (
            <>
              <p style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", marginTop: "-8px" }}>
                ליום אחד בוחרים את אותו תאריך בשני השדות.
              </p>
            </>
          )}
          {v.holStateOn && (
            <>
              <button type="button" onClick={v.onHolOn} aria-pressed={v.holOnPressed} style={{ display: "flex", alignItems: "center", gap: "10px", alignSelf: "flex-start", background: "none", border: "none", padding: "0", cursor: "pointer", font: "var(--type-label)", fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                <span style={{ display: "inline-flex", width: "44px", height: "24px", borderRadius: "var(--radius-pill)", background: `${v.holTrack}`, position: "relative", flex: "none", transition: "background var(--dur-base) var(--ease-out)" }}>
                  <span style={{ position: "absolute", top: "2px", insetInlineStart: `${v.holKnob}`, width: "20px", height: "20px", borderRadius: "50%", background: "#fff", boxShadow: "var(--shadow-toggle)", transition: "inset-inline-start var(--dur-base) var(--ease-out)" }} />
                </span>
                <span>
                  {v.holOnLabel}
                </span>
              </button>
            </>
          )}
          {v.holBlocked && (
            <>
              <Checkbox checked={v.holAllDay} onChange={v.toggleHolAllDay} label="כל היום" />
            </>
          )}
          {v.holPartial && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
                  <FieldLabel>
                    משעה*
                  </FieldLabel>
                  <span dir="ltr" style={{ display: "block" }}>
                    <TextInput value={v.holHFrom} placeholder="00:00" inputMode="numeric" maxLength={5} onChange={v.onHolHFrom} />
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
                  <FieldLabel>
                    עד שעה*
                  </FieldLabel>
                  <span dir="ltr" style={{ display: "block" }}>
                    <TextInput value={v.holHTo} placeholder="00:00" inputMode="numeric" maxLength={5} onChange={v.onHolHTo} />
                  </span>
                </div>
              </div>
            </>
          )}
          {v.holErr && (
            <>
              <p style={{ font: "var(--type-body-sm)", color: "var(--text-error)" }}>
                {v.holErr}
              </p>
            </>
          )}
        </div>
      </Dialog>
    </>
  );
}
