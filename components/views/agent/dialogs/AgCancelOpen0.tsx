"use client";

/* eslint-disable @next/next/no-img-element, react/jsx-key */
import { Fragment } from "react";
import { Alert, Dialog, FieldLabel, RadioGroup, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function AgCancelOpen0({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <Dialog open={v.agCancelOpen} onClose={v.closeAgCancel} title="ביטול פגישה" description="יום שלישי ● 15.09.2026, 10:00 - 10:30 ● יעל כהן" footer={v.agCancelFooter} {...v.dialogProps}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: "1 1 auto", minHeight: "0", overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
            <FieldLabel>
              לבקשת מי הפגישה מבוטלת?*
            </FieldLabel>
            <RadioGroup options={v.cancelByOptions} value={v.agCancelBy} onChange={v.onAgCancelBy} />
          </div>
          <TextInput label="סיבה*" placeholder="לקוח החליט להישאר עם הסוכן הקיים שלו" value={v.agCancelReason} onChange={v.onAgCancelReason} />
          <Alert tone="warning">
            הפגישה תימחק מהיומן, הלקוח/ה יקבל/תקבל הודעת ביטול, והתגית המתאימה תירשם בשורנס.
          </Alert>
        </div>
      </Dialog>
    </>
  );
}
