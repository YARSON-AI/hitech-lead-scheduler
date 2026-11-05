"use client";

 
import { Fragment } from "react";
import { Alert, Badge, Button, Card, IconButton } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function AgentOverridesView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="hti-fade-in">
        <h1 style={{ font: "var(--type-h1)" }}>
          החרגות מיוחדות
        </h1>
        <Alert {...v.alertProps} tone="info">
          החרגה חלה על תאריך מסוים ועוקפת את שעות הפעילות שלך. פגישות שכבר נקבעו נשארות במועדן.
        </Alert>
        <Card padding="md">
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
            <Button variant="outline" size="md" iconStart="plus" onClick={v.openAgExc}>
              הוספת החרגה
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
