"use client";

/* eslint-disable @next/next/no-img-element, react/jsx-key */
import { Fragment } from "react";
import { Dialog, FieldLabel, RadioGroup, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function CancelOpen0({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <Dialog open={v.cancelOpen} onClose={v.closeCancel} title="ביטול פגישה" description="יום שלישי ● 15.09.2026, 10:00 - 10:30 ● יעל כהן ● דניאל כהן" footer={v.cancelFooter}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
            <FieldLabel>
              לבקשת מי הפגישה מבוטלת?*
            </FieldLabel>
            <RadioGroup options={v.cancelByOptions} value={v.cancelBy} onChange={v.onCancelBy} />
          </div>
          <TextInput label="סיבה*" placeholder="לקוח החליט להישאר עם הסוכן הקיים שלו" value={v.cancelReason} onChange={v.onCancelReason} />
        </div>
      </Dialog>
    </>
  );
}
