"use client";

 
import { Fragment } from "react";
import { Alert, Button, Card } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function AgentHoursView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="hti-fade-in">
        <h1 style={{ font: "var(--type-h1)" }}>
          שעות פעילות
        </h1>
        <Alert {...v.alertProps} tone="info" title="רק בתוך השעות האלה ניתן לקבוע לך פגישות">
          שינוי שעות משפיע רק על מועדים חדשים. פגישות שכבר נקבעו נשארות במועדן.
        </Alert>
        <Card padding="md">
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {(v.days ?? []).map((d: VM, index: number) => (
              <Fragment key={d.key ?? d.id ?? index}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <button type="button" onClick={d.toggle} style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 160px", minWidth: "150px", background: "none", border: "none", padding: "0", cursor: "pointer", font: "var(--type-label)", color: "var(--text-primary)", textAlign: "start" }}>
                    <span style={{ display: "inline-flex", width: "44px", height: "24px", borderRadius: "var(--radius-pill)", background: `${d.trackBg}`, position: "relative", transition: "background var(--dur-base) var(--ease-out)", flex: "none" }}>
                      <span style={{ position: "absolute", top: "2px", insetInlineStart: `${d.knob}`, width: "20px", height: "20px", borderRadius: "50%", background: "#fff", boxShadow: "var(--shadow-toggle)", transition: "inset-inline-start var(--dur-base) var(--ease-out)" }} />
                    </span>
                    <span>
                      {d.name}
                    </span>
                  </button>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: "1 1 220px", opacity: `${d.opacity}` }}>
                    <div style={{ position: "relative", flex: "1", minWidth: "96px" }}>
                      <button type="button" onClick={d.openStart} disabled={d.off} style={css(d.startStyle)}>
                        <span dir="ltr">
                          {d.start}
                        </span>
                      </button>
                      {d.startOpen && (
                        <>
                          <div style={{ position: "absolute", zIndex: "30", top: "100%", insetInlineStart: "0", marginTop: "6px", width: "208px", maxHeight: "232px", overflowY: "auto", background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-control)", boxShadow: "var(--shadow-xl)", padding: "8px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }} className="hti-pop">
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
                    <div style={{ position: "relative", flex: "1", minWidth: "96px" }}>
                      <button type="button" onClick={d.openEnd} disabled={d.off} style={css(d.endStyle)}>
                        <span dir="ltr">
                          {d.end}
                        </span>
                      </button>
                      {d.endOpen && (
                        <>
                          <div style={{ position: "absolute", zIndex: "30", top: "100%", insetInlineStart: "0", marginTop: "6px", width: "208px", maxHeight: "232px", overflowY: "auto", background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-control)", boxShadow: "var(--shadow-xl)", padding: "8px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }} className="hti-pop">
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
              </Fragment>
            ))}
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
            <Button size="lg" iconStart="check" onClick={v.agSaveHours} style={css(v.flex1)}>
              שמירת שעות
            </Button>
            <Button variant="ghost" size="lg" onClick={v.noop}>
              ביטול
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
