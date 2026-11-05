"use client";

 
import { Fragment } from "react";
import { Alert, Dialog, FieldLabel, RadioGroup, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function CustEmailOpen3({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <Dialog open={v.custEmailOpen} onClose={v.closeCustEmail} title="שינוי מייל הלקוח/ה" description={v.emailDesc} footer={v.custEmailFooter} {...v.dialogProps}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: "1 1 auto", minHeight: "0", overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain" }}>
          {v.detailJoint && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
                <FieldLabel>
                  של מי המייל משתנה?*
                </FieldLabel>
                <RadioGroup options={v.custEmailWhoOptions} value={v.custEmailWho} onChange={v.onCustEmailWho} />
              </div>
            </>
          )}
          <TextInput label="מייל נוכחי" value={v.custEmailCurrent} disabled={true} dir="ltr" />
          <TextInput label="מייל חדש*" placeholder="name@example.com" value={v.custEmailNew} onChange={v.onCustEmailNew} dir="ltr" />
          <Alert {...v.alertProps} tone="info">
            השינוי חל על פגישה זו בלבד. המייל החדש יקבל את הזמנת היומן, והמייל הקודם יקבל הודעת ביטול. מייל האישור והודעת ה-WhatsApp יישלחו שוב.
          </Alert>
        </div>
      </Dialog>
    </>
  );
}
