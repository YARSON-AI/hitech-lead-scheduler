"use client";

/* eslint-disable @next/next/no-img-element, react/jsx-key */
import { Fragment } from "react";
import { Alert, Dialog, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function AddCoordOpen1({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <Dialog open={v.addCoordOpen} onClose={v.closeAddCoord} title="הוספת מתאמת" footer={v.addCoordFooter} {...v.dialogProps}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <TextInput label="מייל*" placeholder="name@example.com" value={v.addCoordEmail} onChange={v.onAddCoordEmail} error={v.addCoordErr} dir="ltr" />
          <Alert {...v.alertProps} tone="info">
            המתאמת תקבל מייל עם קישור להגדרת סיסמה.
          </Alert>
        </div>
      </Dialog>
    </>
  );
}
