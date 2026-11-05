"use client";

/* eslint-disable @next/next/no-img-element, react/jsx-key */
import { Fragment } from "react";
import { Card, Icon } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function AgentMeetingsView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="hti-fade-in">
        <div>
          <h1 style={{ font: "var(--type-h1)" }}>
            הפגישות שלי
          </h1>
          <p style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
            3 פגישות בשבוע הקרוב
          </p>
        </div>
        {(v.agMeetings ?? []).map((m: VM, index: number) => (
          <Fragment key={m.key ?? m.id ?? index}>
            <Card padding="none" onClick={v.goAgDetail} {...v.rowCardProps}>
              <div style={{ display: "flex", alignItems: "stretch", minHeight: "132px" }}>
                <div style={{ flex: "none", width: "116px", background: "var(--color-primary-soft)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", padding: "16px 10px" }}>
                  <div style={{ font: "var(--type-caption)", color: "var(--teal-700)" }}>
                    {m.day}
                  </div>
                  <div dir="ltr" style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "32px", lineHeight: "1.1", color: "var(--text-brand)" }}>
                    {m.dayNum}
                  </div>
                  <div style={{ font: "var(--type-caption)", color: "var(--teal-700)" }}>
                    {m.month}
                  </div>
                  <div dir="ltr" style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--teal-200)", width: "100%", textAlign: "center", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "17px", color: "var(--text-brand)", whiteSpace: "nowrap" }}>
                    {m.time}
                  </div>
                </div>
                <div style={{ flex: "1 1 auto", minWidth: "0", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "20px", color: "var(--text-primary)" }}>
                      {m.customer}
                    </span>
                    {m.joint && (
                      <>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", height: "24px", padding: "0 10px", borderRadius: "var(--radius-pill)", background: "var(--green-50)", border: "1px solid var(--green-300)", color: "var(--green-800)", font: "var(--type-caption)" }}>
                          <Icon name="users" size={14} />
                          <span>
                            פגישה זוגית
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", height: "26px", padding: "0 10px", borderRadius: "var(--radius-pill)", background: `${m.kindBg}`, color: `${m.kindColor}`, font: "var(--type-caption)", whiteSpace: "nowrap" }}>
                      <Icon name={m.icon} size={14} />
                      <span>
                        {m.kind}
                      </span>
                    </span>
                    {m.onsite && (
                      <>
                        <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)", textWrap: "pretty" }}>
                          {m.address}
                        </span>
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-tertiary)" }}>
                    <Icon name="shield-check" size={18} />
                    <span style={{ font: "var(--type-body-sm)" }}>
                      {m.topic}
                    </span>
                  </div>
                  {m.hasJoin && (
                    <>
                      <div style={{ display: "flex" }}>
                        {m.join}
                      </div>
                    </>
                  )}
                </div>
                <div style={{ flex: "none", display: "flex", alignItems: "center", paddingInlineEnd: "14px", color: "var(--text-placeholder)" }}>
                  <Icon name="chevron-left" size={20} />
                </div>
              </div>
            </Card>
          </Fragment>
        ))}
      </div>
    </>
  );
}
