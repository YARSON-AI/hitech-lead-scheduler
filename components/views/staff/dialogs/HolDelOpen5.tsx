"use client";

 
import { Fragment } from "react";
import { Alert, Dialog } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function HolDelOpen5({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <Dialog open={v.holDelOpen} onClose={v.closeHolDel} title="מחיקת יום חופש" description={v.holDelDesc} footer={v.holDelFooter} {...v.dialogProps}>
        <Alert tone="warning">
          היום ייפתח שוב לקביעת פגישות. אי אפשר לבטל את המחיקה.
        </Alert>
      </Dialog>
    </>
  );
}
