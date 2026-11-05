"use client";

/* eslint-disable @next/next/no-img-element, react/jsx-key */
import { Fragment } from "react";
import { Badge, Button, Card, SummaryItem } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function AgentMeetingDetailView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="hti-fade-in">
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <Button variant="link" iconStart="arrow-right" onClick={v.goAgMeetings}>
            חזרה לפגישות שלי
          </Button>
        </div>
        <Card padding="lg">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h1 style={{ font: "var(--type-h1)", fontSize: "var(--text-2xl)" }}>
                  <span dir="ltr">
                    10:00 - 10:30
                  </span>
                </h1>
                <p style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
                  יום שלישי ● 15.09.2026
                </p>
              </div>
              <Badge tone={v.ftTone} icon={v.ftIcon}>
                {v.ftLabel}
              </Badge>
            </div>
            <Card tone="subtle" padding="sm" style={css(v.summaryBox)}>
              <SummaryItem label="לקוח/ה" value="יעל כהן" />
              <SummaryItem label="מספר ליד" value="84213" ltr={true} />
              <SummaryItem label="טלפון" value="050-0000000" ltr={true} />
              <SummaryItem label="סוג פגישה" value="פגישה מרחוק" />
              <SummaryItem label="סוג ליד" value="פנסיה" last={true} />
            </Card>
            <div>
              {v.teamsFull}
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "nowrap" }}>
              <div style={{ flex: "1 1 0", minWidth: "0", display: "flex" }}>
                <Button size="lg" fullWidth={true} iconStart="calendar" onClick={v.goAgReschedule}>
                  שינוי מועד
                </Button>
              </div>
              <div style={{ flex: "1 1 0", minWidth: "0", display: "flex" }}>
                <Button variant="destructive" size="lg" fullWidth={true} iconStart="x" onClick={v.openAgCancel}>
                  ביטול פגישה
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
