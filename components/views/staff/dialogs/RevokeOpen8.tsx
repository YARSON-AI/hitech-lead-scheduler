"use client";

/* eslint-disable @next/next/no-img-element, react/jsx-key */
import { Fragment } from "react";
import { Alert, Dialog } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function RevokeOpen8({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <Dialog open={v.revokeOpen} onClose={v.closeRevoke} title="ביטול קישור" description={v.revokeDesc} footer={v.revokeFooter} {...v.dialogProps}>
        <Alert tone="warning">
          הלקוח/ה לא יוכל/תוכל לקבוע פגישה דרך הקישור הזה. אפשר ליצור קישור חדש לאותו ליד בכל עת.
        </Alert>
      </Dialog>
    </>
  );
}
