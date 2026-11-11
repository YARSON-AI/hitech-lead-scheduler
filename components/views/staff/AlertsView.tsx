"use client";

 
import { Fragment } from "react";
import { Button, Card, EmptyState, Icon, IconButton } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function AlertsView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="hti-fade-in">
        <h1 style={{ font: "var(--type-h1)" }}>
          התראות
        </h1>
        {(v.alerts ?? []).map((a: VM, index: number) => (
          <Fragment key={a.key ?? a.id ?? index}>
            <div style={css(a.cardStyle)}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={css(a.circleStyle)}>
                  <Icon name={a.icon} size={20} />
                </div>
                <div style={{ flex: "1 1 260px", minWidth: "0", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ font: "var(--type-h3)", color: "var(--text-primary)" }}>
                    {a.title}
                  </div>
                  <div style={{ font: "var(--type-body)", color: "var(--text-secondary)", textWrap: "pretty" }}>
                    {a.detail}
                  </div>
                  <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                    <span dir="ltr">
                      {a.when}
                    </span>
                  </div>
                </div>
                <div style={css(v.alertActionsStyle)}>
                  <Button size="md" variant="outline" iconStart={a.actionIcon} onClick={a.act}>
                    {a.action}
                  </Button>
                  <IconButton icon="check" label="סימון כטופל" size="lg" variant="subtle" onClick={a.dismiss} />
                </div>
              </div>
            </div>
          </Fragment>
        ))}
        {!(v.alerts ?? []).length && (
          <Card padding="lg">
            <EmptyState icon="bell" title="אין התראות" description="התראות על פגישות שדורשות טיפול יופיעו כאן." />
          </Card>
        )}
      </div>
    </>
  );
}
