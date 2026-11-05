"use client";

 
import { Fragment } from "react";
import { Alert, Badge, Button, Card, Icon, IconButton, SectionHeader } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function AgentSettingsView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-fade-in">
        <div style={{ display: "flex" }}>
          <Button variant="link" iconStart="arrow-right" onClick={v.goAgents}>
            חזרה לסוכנים
          </Button>
        </div>
        {v.agDisc && (
          <>
            <Alert tone="error" title="היומן לא מחובר">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                <span>
                  הסוכן/ת לא מוצע/ת לקביעת פגישות עד שהיומן יחובר מחדש.
                </span>
                <Button variant="link" size="sm" iconStart="mail" onClick={v.sendCalLink}>
                  שליחת קישור לחיבור היומן
                </Button>
              </div>
            </Alert>
          </>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ width: "48px", height: "48px", flex: "none", borderRadius: "50%", background: "var(--color-primary-soft-2)", color: "var(--color-primary-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="user" size={24} />
          </div>
          <div style={{ flex: "1 1 200px", minWidth: "0" }}>
            <h1 style={{ font: "var(--type-h1)" }}>
              {v.agName}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ color: "var(--text-secondary)" }} dir="ltr">
                {v.agEmailCur}
              </span>
              {v.agDisc && (
                <>
                  <Badge tone="error" icon="alert-circle" size="sm">
                    היומן לא מחובר
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button variant="outline" size="md" iconStart="mail" onClick={v.openEmail}>
              שינוי מייל
            </Button>
            <Button variant="outline" size="md" iconStart="calendar" onClick={v.goCalendar}>
              יומן הסוכן/ת
            </Button>
          </div>
        </div>
        <Card padding="md">
          <SectionHeader title="הגדרות הסוכן בAirtable" divider={true} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginTop: "16px" }}>
            {(v.commercial ?? []).map((c: VM, index: number) => (
              <Fragment key={c.key ?? c.id ?? index}>
                <div style={{ background: "var(--surface-subtle)", borderRadius: "var(--radius-control)", padding: "14px 16px" }}>
                  <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                    {c.label}
                  </div>
                  <div style={{ font: "var(--type-h3)", color: "var(--text-primary)", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {c.dot && (
                      <>
                        <span style={{ width: "12px", height: "12px", borderRadius: "50%", flex: "none", background: `${c.dotColor}` }} />
                      </>
                    )}
                    <span dir="ltr">
                      {c.value}
                    </span>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </Card>
        <Card padding="md">
          <SectionHeader title="שעות פעילות" divider={true} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
            {(v.days ?? []).map((d: VM, index: number) => (
              <Fragment key={d.key ?? d.id ?? index}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <button type="button" onClick={d.toggle} style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 140px", minWidth: "130px", background: "none", border: "none", padding: "0", cursor: "pointer", font: "var(--type-label)", fontFamily: "var(--font-body)", color: "var(--text-primary)", textAlign: "start" }}>
                    <span style={{ display: "inline-flex", width: "44px", height: "24px", borderRadius: "var(--radius-pill)", background: `${d.trackBg}`, position: "relative", flex: "none", transition: "background var(--dur-base) var(--ease-out)" }}>
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
            <Button size="md" iconStart="check" onClick={v.showSaved}>
              שמירת שעות
            </Button>
            <Button variant="ghost" size="md" onClick={v.noop}>
              ביטול
            </Button>
          </div>
        </Card>
        <Card padding="md">
          <SectionHeader title="החרגות מיוחדות" divider={true} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(v.overrides ?? []).map((o: VM, index: number) => (
              <Fragment key={o.key ?? o.id ?? index}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto auto", gap: "12px", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ minWidth: "0" }}>
                    <div style={{ font: "var(--type-label)" }}>
                      <span dir="ltr">
                        {o.date}
                      </span>
                    </div>
                    <div style={{ font: "var(--type-body-sm)", color: "var(--text-tertiary)" }}>
                      <span dir="ltr">
                        {o.time}
                      </span>
                      <span>
                        {o.note}
                      </span>
                    </div>
                  </div>
                  <Badge tone={o.tone} icon={o.icon}>
                    {o.label}
                  </Badge>
                  <IconButton icon="trash-2" label="מחיקת ההחרגה" variant="subtle" onClick={v.noop} />
                </div>
              </Fragment>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: "24px" }}>
            <Button variant="outline" size="md" iconStart="plus" onClick={v.openExc}>
              הוספת החרגה
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
