"use client";

/* eslint-disable react-hooks/refs */
 
import { Fragment } from "react";
import { Alert, Button, Card, IconButton, Tabs } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function AgentCalendarView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-fade-in">
        <div style={{ display: "flex" }}>
          <Button variant="link" iconStart="arrow-right" onClick={v.goAgent}>
            חזרה להגדרות הסוכן/ת
          </Button>
        </div>
        <h1 style={{ font: "var(--type-h1)" }}>
          {"יומן "}{v.agName}
        </h1>
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
        <Card padding="md">
          <div style={css(v.calBarStyle)}>
            <div style={{ font: "var(--type-label)", color: "var(--text-brand)" }} dir="ltr">
              {v.rangeLabel}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Button variant="outline" size="sm" onClick={v.goToday}>
                היום
              </Button>
              <IconButton icon="chevron-right" label="קודם" size="lg" variant="subtle" onClick={v.calPrev} />
              <Tabs variant="pills" tabs={v.viewTabs} value={v.calView} onChange={v.onCalView} />
              <IconButton icon="chevron-left" label="הבא" size="lg" variant="subtle" onClick={v.calNext} />
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", margin: "16px 0 18px" }}>
            {(v.legend ?? []).map((l: VM, index: number) => (
              <Fragment key={l.key ?? l.id ?? index}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "118px", font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
                  <span style={{ width: "34px", height: "20px", borderRadius: "6px", background: `${l.bg}`, border: `1px solid ${l.border}`, flex: "none", boxSizing: "border-box" }} />
                  <span>
                    {l.label}
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <div style={css(v.calHeadStyle)}>
              <div />
              {(v.visibleDays ?? []).map((w: VM, index: number) => (
                <Fragment key={w.key ?? w.id ?? index}>
                  <div style={{ textAlign: "center", padding: "0 4px 10px" }}>
                    <div style={css(w.nameStyle)}>
                      {w.name}
                    </div>
                    <div style={css(w.dateStyle)}>
                      <span dir="ltr">
                        {w.date}
                      </span>
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
            <div ref={v.calScroll} style={{ maxHeight: "528px", overflowY: "auto", overscrollBehavior: "contain" }} className="hti-hscroll">
              <div style={css(v.calGridStyle)}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {(v.hourLabels ?? []).map((t: VM, index: number) => (
                    <Fragment key={t.key ?? t.id ?? index}>
                      <div style={css(v.hourStyle)}>
                        <span dir="ltr" style={css(v.hourLabelStyle)}>
                          {t.label}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
                {(v.visibleDays ?? []).map((w: VM, index: number) => (
                  <Fragment key={w.key ?? w.id ?? index}>
                    <div style={css(w.colStyle)}>
                      {w.allDayLabel && (
                        <>
                          <div style={css(w.allDayStyle)} title={w.allDayLabel}>
                            <span style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {w.allDayLabel}
                            </span>
                            <span style={{ fontSize: "10.5px", opacity: ".7" }}>
                              כל היום
                            </span>
                          </div>
                        </>
                      )}
                      {(w.blocks ?? []).map((b: VM, index: number) => (
                        <Fragment key={b.key ?? b.id ?? index}>
                          <div style={css(b.style)} title={b.title}>
                            {b.isPair && (
                              <>
                                <div style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: "500", color: "var(--purple-700)", lineHeight: "1.1", paddingInline: "3px" }}>
                                  פגישה זוגית
                                </div>
                                {(b.parts ?? []).map((p: VM, index: number) => (
                                  <Fragment key={p.key ?? p.id ?? index}>
                                    <div style={css(p.style)}>
                                      <span style={{ flex: "1 1 auto", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {p.label}
                                      </span>
                                      <span dir="ltr" style={{ flex: "0 0 auto", opacity: ".7" }}>
                                        {p.time}
                                      </span>
                                    </div>
                                  </Fragment>
                                ))}
                              </>
                            )}
                            {b.isSingle && (
                              <>
                                <span style={{ flex: "1 1 auto", minWidth: "0", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {b.label}
                                </span>
                                <span dir="ltr" style={{ flex: "0 0 auto", opacity: ".7" }}>
                                  {b.time}
                                </span>
                              </>
                            )}
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
