"use client";

 
import { Fragment } from "react";
import { Alert, Dialog } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function DeactOpen2({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <Dialog open={v.deactOpen} onClose={v.closeDeact} title="השבתת משתמש/ת" description={v.deactDesc} footer={v.deactFooter} {...v.dialogProps}>
        <Alert tone="warning">
          הגישה למערכת תיחסם מיד. אפשר להחזיר אותה בכל עת עם “שליחה מחדש”.
        </Alert>
      </Dialog>
    </>
  );
}
