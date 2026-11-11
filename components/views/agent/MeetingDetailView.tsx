"use client";

 
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
                    {v.dTime}
                  </span>
                </h1>
                <p style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
                  {v.dWhen}
                </p>
              </div>
              <Badge tone={v.ftTone} icon={v.ftIcon}>
                {v.ftLabel}
              </Badge>
            </div>
            <Card tone="subtle" padding="sm" style={css(v.summaryBox)}>
              <SummaryItem label="לקוח/ה" value={v.dCustomer} />
              <SummaryItem label="מספר ליד" value={v.dLead} ltr={true} />
              <SummaryItem label="טלפון" value={v.dPhone} ltr={true} />
              <SummaryItem label="סוג פגישה" value={v.dKind} />
              <SummaryItem label="סוג ליד" value={v.dTopic} last={true} />
            </Card>
            {v.agDCx && (
              <Card tone="subtle" padding="sm" style={css(v.summaryBox)}>
                <SummaryItem label="בוטלה ע״י" value={v.agDCxBy} />
                <SummaryItem label="מועד הביטול" value={v.agDCxWhen} ltr={true} />
                <SummaryItem label="סיבת הביטול" value={v.agDCxReason} last={true} />
              </Card>
            )}
            {v.teamsFull && <div>{v.teamsFull}</div>}
            {v.canAct && (
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
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
