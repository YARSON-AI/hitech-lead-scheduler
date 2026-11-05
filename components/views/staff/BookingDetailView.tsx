"use client";

/* eslint-disable @next/next/no-img-element, react/jsx-key */
import { Fragment } from "react";
import { Badge, Button, Card, Icon, SectionHeader } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function BookingDetailView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-fade-in">
        <div style={{ display: "flex" }}>
          <Button variant="link" iconStart="arrow-right" onClick={v.goBookings}>
            חזרה לפגישות
          </Button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "stretch" }}>
          <div style={{ flex: "2.25 1 0%", minWidth: "300px", display: "flex" }}>
            <Card padding="lg" {...v.cardFill}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {v.isPhone && (
                  <>
                    <div style={{ background: "var(--color-primary-soft)", borderRadius: "var(--radius-control)", padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <span dir="ltr" style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "28px", color: "var(--text-brand)" }}>
                        {v.dTime}
                      </span>
                      <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
                        {v.dDow}{" ● "}
                        <span dir="ltr">
                          {v.dDate}
                        </span>
                      </span>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginTop: "6px" }}>
                        <Badge tone={v.dTone} icon={v.dIcon}>
                          {v.dLabel}
                        </Badge>
                        <Badge tone="neutral">
                          הקצאה אוטומטית
                        </Badge>
                        {v.detailJoint && (
                          <>
                            <Badge tone="purple" icon="users">
                              פגישה זוגית
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {v.isDesktop && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "fit-content" }}>
                        <h1 style={{ font: "var(--type-h1)", fontSize: "var(--text-2xl)" }}>
                          <span dir="ltr">
                            {v.dTime}
                          </span>
                        </h1>
                        <p style={{ marginTop: "4px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {v.dDow}{" ● "}
                          <span dir="ltr">
                            {v.dDate}
                          </span>
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <Badge tone={v.dTone} icon={v.dIcon}>
                          {v.dLabel}
                        </Badge>
                        <Badge tone="neutral">
                          הקצאה אוטומטית
                        </Badge>
                        {v.detailJoint && (
                          <>
                            <Badge tone="purple" icon="users">
                              פגישה זוגית
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div style={{ background: "var(--surface-subtle)", borderRadius: "var(--radius-control)", padding: "6px 20px" }}>
                  {(v.meetingFacts ?? []).map((f: VM, index: number) => (
                    <Fragment key={f.key ?? f.id ?? index}>
                      <div style={css(f.rowStyle)}>
                        <span style={{ font: "var(--type-body-sm)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                          {f.label}
                        </span>
                        <span style={{ font: "var(--type-label)", color: "var(--text-brand)", textAlign: "end", minWidth: "0", overflowWrap: "anywhere" }}>
                          <span dir={f.dir}>
                            {f.value}
                          </span>
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div>
                  {v.teamsFull}
                </div>
                {v.detailActDesk && (
                  <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "18px" }}>
                      <div style={{ flex: "1 1 220px", minWidth: "0", display: "flex" }}>
                        <Button size="lg" fullWidth={true} iconStart="calendar" onClick={v.showSaved}>
                          שינוי מועד
                        </Button>
                      </div>
                      <div style={{ flex: "1 1 220px", minWidth: "0", display: "flex" }}>
                        <Button variant="secondary" size="lg" fullWidth={true} iconStart="users" onClick={v.showSaved}>
                          העברה לסוכן/ת
                        </Button>
                      </div>
                      {v.detailNotPast && (
                        <>
                          <div style={{ flex: "1 1 220px", minWidth: "0", display: "flex" }}>
                            <Button variant="outline" size="lg" fullWidth={true} iconStart="mail" onClick={v.openCustEmail}>
                              שינוי מייל הלקוח/ה
                            </Button>
                          </div>
                        </>
                      )}
                      <div style={{ flex: "1 1 220px", minWidth: "0", display: "flex" }}>
                        <Button variant="destructive" size="lg" fullWidth={true} iconStart="x" onClick={v.openCancel}>
                          ביטול פגישה
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                {v.detailActPhone && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
                      <Button size="lg" fullWidth={true} iconStart="calendar" onClick={v.showSaved}>
                        שינוי מועד
                      </Button>
                      <Button variant="secondary" size="lg" fullWidth={true} iconStart="users" onClick={v.showSaved}>
                        העברה לסוכן/ת
                      </Button>
                      {v.detailNotPast && (
                        <>
                          <Button variant="outline" size="lg" fullWidth={true} iconStart="mail" onClick={v.openCustEmail}>
                            שינוי מייל הלקוח/ה
                          </Button>
                        </>
                      )}
                      <Button variant="destructive" size="lg" fullWidth={true} iconStart="x" onClick={v.openCancel}>
                        ביטול פגישה
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
          <div style={{ flex: "1 1 0%", minWidth: "250px", maxWidth: "400px", display: "flex" }}>
            <Card padding="lg" {...v.cardFill}>
              <SectionHeader title="יומן הפעולות" divider={true} />
              <div style={{ display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: "0", overflowY: "auto" }} className="hti-hscroll">
                {(v.history ?? []).map((h: VM, index: number) => (
                  <Fragment key={h.key ?? h.id ?? index}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                      <div style={{ width: "32px", height: "32px", flex: "none", borderRadius: "50%", background: `${h.bg}`, color: `${h.fg}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={h.icon} size={16} />
                      </div>
                      <div style={{ flex: "1", minWidth: "0" }}>
                        <div style={{ font: "var(--type-label)", color: "var(--text-primary)" }}>
                          {h.action}
                        </div>
                        <div style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)", textWrap: "pretty" }}>
                          {h.detail}
                        </div>
                        <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", marginTop: "2px" }}>
                          <span dir="ltr">
                            {h.when}
                          </span>
                          {" ● "}{h.actor}
                        </div>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
