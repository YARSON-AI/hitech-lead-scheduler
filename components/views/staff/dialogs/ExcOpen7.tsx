"use client";

 
import { Fragment } from "react";
import { Calendar, Checkbox, Dialog, FieldLabel, RadioGroup, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function ExcOpen7({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <Dialog open={v.excOpen} onClose={v.closeExc} title="הוספת החרגה" description="דניאל כהן" footer={v.excFooter} {...v.dialogProps}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: "1 1 auto", minHeight: "0", overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
            <FieldLabel>
              סוג החריגה*
            </FieldLabel>
            <RadioGroup options={v.excKindOptions} value={v.excKind} onChange={v.onExcKind} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
            <FieldLabel>
              תאריך*
            </FieldLabel>
            <div style={{ display: "flex", justifyContent: "center", minWidth: "0" }}>
              <Calendar value={v.excDate} onChange={v.pickExcDate} disabledWeekdays={v.noDisabled} today={v.todayDate} {...v.excCalProps} />
            </div>
          </div>
          {v.showAllDay && <Checkbox checked={v.excAllDay} onChange={v.toggleExcAllDay} label="כל היום" />}
          {v.excHours && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
                <FieldLabel>
                  שעות*
                </FieldLabel>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: "1" }}>
                    <button type="button" onClick={v.openExcStart} className="hti-ctl" style={css(v.excStartStyle)}>
                      <span dir="ltr">
                        {v.excStart}
                      </span>
                    </button>
                    {v.excStartOpen && (
                      <>
                        <div className="hti-pop hti-slots" style={{ position: "absolute", zIndex: "30", top: "100%", insetInlineStart: "0", marginTop: "6px", width: "208px", maxHeight: "200px", overflowY: "auto", background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-control)", boxShadow: "var(--shadow-xl)", padding: "8px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                          {(v.timeOptions ?? []).map((t: VM, index: number) => (
                            <Fragment key={t.key ?? t.id ?? index}>
                              <button type="button" dir="ltr" onClick={t.pick} style={css(t.style)}>
                                {t.label}
                              </button>
                            </Fragment>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <span style={{ color: "var(--text-tertiary)" }}>
                    –
                  </span>
                  <div style={{ position: "relative", flex: "1" }}>
                    <button type="button" onClick={v.openExcEnd} className="hti-ctl" style={css(v.excEndStyle)}>
                      <span dir="ltr">
                        {v.excEnd}
                      </span>
                    </button>
                    {v.excEndOpen && (
                      <>
                        <div className="hti-pop hti-slots" style={{ position: "absolute", zIndex: "30", top: "100%", insetInlineStart: "0", marginTop: "6px", width: "208px", maxHeight: "200px", overflowY: "auto", background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-control)", boxShadow: "var(--shadow-xl)", padding: "8px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                          {(v.timeOptions ?? []).map((t: VM, index: number) => (
                            <Fragment key={t.key ?? t.id ?? index}>
                              <button type="button" dir="ltr" onClick={t.pick} style={css(t.style)}>
                                {t.label}
                              </button>
                            </Fragment>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          <TextInput label="הערה (לא חובה)" placeholder="לדוגמה: חופשה" value={v.excNote} onChange={v.onExcNote} />
        </div>
      </Dialog>
    </>
  );
}
