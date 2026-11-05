"use client";

 
import { Fragment } from "react";
import { Alert, Dialog, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function EmailOpen6({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <Dialog open={v.emailOpen} onClose={v.closeEmail} title="שינוי מייל הסוכן/ת" description={v.agName} footer={v.emailFooter} {...v.dialogProps}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: "1 1 auto", minHeight: "0", overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain" }}>
          <TextInput label="מייל נוכחי" value={v.agEmailCur} disabled={true} dir="ltr" />
          <TextInput label="מייל חדש*" placeholder="name@example.com" value={v.newEmail} onChange={v.onNewEmail} dir="ltr" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 16px", background: "var(--surface-subtle)", borderRadius: "var(--radius-control)" }}>
            <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
              פגישות עתידיות שיעברו לתיבה החדשה
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "22px", color: "var(--text-brand)" }}>
              {v.futureCount}
            </span>
          </div>
          <Alert tone="warning" title="מה קורה אחרי השמירה">
            <ul style={{ margin: "4px 0 0", paddingInlineStart: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <li>
                הסוכן/ת ייכנס/תיכנס למערכת עם המייל החדש, באותה סיסמה.
              </li>
              <li>
                יישלח קישור לחיבור היומן החדש. עד החיבור הסוכן/ת לא יוצע/תוצע לפגישות חדשות.
              </li>
              <li>
                כל הפגישות העתידיות יעברו לתיבה החדשה, וכל לקוח/ה יקבל/תקבל הזמנה מעודכנת עם קישור Teams חדש.
              </li>
              <li>
                הודעה על השינוי תישלח גם למייל הקודם וגם למייל החדש.
              </li>
            </ul>
          </Alert>
        </div>
      </Dialog>
    </>
  );
}
