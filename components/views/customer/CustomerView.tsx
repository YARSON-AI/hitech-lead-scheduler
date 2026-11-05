"use client";

/* eslint-disable @next/next/no-img-element */
import { Fragment } from "react";
import { Alert, Badge, Button, Card, EmptyState, Icon, Spinner, TimeSlots } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function CustomerView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ padding: "24px 16px 64px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: `${v.custFrameMax}`, background: "var(--bg-page-gradient)", borderRadius: "var(--radius-card-lg)", boxShadow: "var(--shadow-lg)", position: "relative", overflow: "hidden", minHeight: "760px", display: "flex", flexDirection: "column" }}>
          <header style={{ display: "flex", justifyContent: "center", padding: "22px 16px 6px" }}>
            <img src="/brand/logo.png" alt="הייטק סוכנות לביטוח" style={{ height: `${v.custLogoH}`, width: "auto", display: "block" }} />
          </header>
          <div style={{ flex: "1", padding: "12px 16px 32px", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: `${v.custCardMax}` }}>
              <Card padding={v.custPad} elevation="xl">
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-fade-in">
                  {v.custLoading && (
                    <>
                      <div style={{ minHeight: "360px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", color: "var(--text-tertiary)" }}>
                        <Spinner size={32} />
                        <p style={{ font: "var(--type-body)" }}>
                          טוען זמנים פנויים...
                        </p>
                      </div>
                    </>
                  )}
                  {v.custShowAgent && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingBottom: "18px", borderBottom: "1px solid var(--border-subtle)" }}>
                        <div style={{ width: "52px", height: "52px", flex: "none", borderRadius: "50%", background: "var(--color-primary-soft-2)", color: "var(--color-primary-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name={v.custHeadIcon} size={26} />
                        </div>
                        <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div>
                            <p style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                              {v.custHeadEyebrow}
                            </p>
                            <h1 style={{ font: "var(--type-h2)", color: "var(--text-primary)" }}>
                              {v.custHeadTitle}
                            </h1>
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {" "}{v.custKindBadge}{" "}
                            <Badge tone="neutral" icon="clock">
                              30 דקות
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {v.custPicker && (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                          <h2 style={{ font: "var(--type-h3)", color: "var(--text-brand)" }}>
                            בחירת מועד
                          </h2>
                          <p style={{ marginTop: "4px", font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
                            בחר/י יום ושעה שנוחים לך.
                          </p>
                        </div>
                        {v.custTaken && (
                          <>
                            <Alert {...v.alertProps} tone="warning">
                              המועד נתפס הרגע, בחר/י מועד אחר
                            </Alert>
                          </>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "flex-start" }}>
                          <div style={css(v.custCalWrap)}>
                            {v.custCalendar}
                          </div>
                          <div style={{ flex: "1 1 260px", minWidth: "0", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                              <div style={{ font: "var(--type-label)", color: "var(--gray-700)" }}>
                                {v.custDayLabel}
                              </div>
                              <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                                {v.custSlotCount}
                              </div>
                            </div>
                            <TimeSlots slots={v.custSlots} value={v.custSlot} onChange={v.pickCustSlot} columns={v.custCols} />
                          </div>
                        </div>
                        {v.isDesktop && (
                          <>
                            <div style={{ paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
                              <Button size="lg" fullWidth={true} iconStart="calendar" disabled={v.custNoSlot} loading={v.custBusy} onClick={v.custConfirm}>
                                {v.custCta}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                  {v.custEmpty && (
                    <>
                      <EmptyState icon="calendar" title="אין כרגע זמנים פנויים" description="יש לפנות לסוכן או למוקד" />
                    </>
                  )}
                  {v.custDone && (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", textAlign: "center", paddingTop: "8px" }}>
                        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: `${v.custDoneBg}`, color: `${v.custDoneFg}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name={v.custDoneIcon} size={40} />
                        </div>
                        <h2 style={{ font: "var(--type-h2)" }}>
                          {v.custDoneTitle}
                        </h2>
                        <div style={{ width: "100%", background: "var(--surface-subtle)", borderRadius: "var(--radius-control)", padding: "6px 20px", textAlign: "start" }}>
                          {(v.custFacts ?? []).map((f: VM, index: number) => (
                            <Fragment key={f.key ?? f.id ?? index}>
                              <div style={css(f.rowStyle)}>
                                <span style={{ font: "var(--type-body-sm)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                                  {f.label}
                                </span>
                                <span style={{ font: "var(--type-label)", color: "var(--text-brand)", textAlign: "end", minWidth: "0" }}>
                                  <span dir={f.dir}>
                                    {f.value}
                                  </span>
                                </span>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--text-secondary)", font: "var(--type-body-sm)", textWrap: "pretty" }}>
                          <Icon name={v.custNoteIcon} size={18} />
                          <span>
                            {v.custDoneNote}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  {v.custDead && (
                    <>
                      <EmptyState icon="lock" title="הקישור אינו בתוקף" description="יש לפנות לסוכן או למוקד" />
                    </>
                  )}
                  {v.custError && (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <EmptyState icon="alert-triangle" title="משהו השתבש, נסה/י שוב" />
                        <Button variant="outline" size="lg" onClick={v.custRetry}>
                          נסה/י שוב
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </div>
          {v.custPhoneBar && (
            <>
              <div style={{ position: "sticky", bottom: "0", padding: "12px 16px", background: "var(--surface-card)", borderTop: "1px solid var(--border-default)", boxShadow: "var(--shadow-md)" }}>
                <Button size="lg" fullWidth={true} iconStart="calendar" disabled={v.custNoSlot} loading={v.custBusy} onClick={v.custConfirm}>
                  {v.custCta}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
