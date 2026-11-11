"use client";

 
import { Fragment } from "react";
import { Alert, Button, Calendar, Card, EmptyState, Icon, Spinner, TimeSlots } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function AgentRescheduleView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="hti-fade-in">
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <Button variant="link" iconStart="arrow-right" onClick={v.goAgDetail}>
            חזרה לפגישה
          </Button>
        </div>
        <div>
          <h1 style={{ font: "var(--type-h1)" }}>
            שינוי מועד
          </h1>
          <p style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
            {v.resTitle}
            <span dir="ltr">
              {v.resWhen}
            </span>
          </p>
        </div>
        <Card padding={v.agResPad}>
          {v.agResLoading && (
            <>
              <div style={{ minHeight: "320px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", color: "var(--text-tertiary)" }}>
                <Spinner size={32} />
                <p style={{ font: "var(--type-body)" }}>
                  טוען מועדים פנויים...
                </p>
              </div>
            </>
          )}
          {v.agResEmpty && (
            <>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <EmptyState icon="calendar" title="אין מועדים פנויים ביומן שלך" description={v.resEmptyText} />
                <Button variant="outline" size="lg" onClick={v.goAgDetail}>
                  השארת המועד הנוכחי
                </Button>
              </div>
            </>
          )}
          {v.agResError && (
            <>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <EmptyState icon="alert-triangle" title="המועד לא שונה" description="משהו השתבש והפגישה נשארה במועד הקודם. אפשר לנסות שוב." />
                <Button variant="outline" size="lg" onClick={v.agResRetry}>
                  נסה/י שוב
                </Button>
              </div>
            </>
          )}
          {v.agResDone && (
            <>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--green-100)", color: "var(--green-800)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="check" size={40} />
                </div>
                <h2 style={{ font: "var(--type-h2)" }}>
                  המועד עודכן
                </h2>
                <p style={{ color: "var(--text-secondary)" }}>
                  {v.resDoneText}
                </p>
                <div style={{ width: "100%", background: "var(--surface-subtle)", borderRadius: "var(--radius-control)", padding: "6px 20px", textAlign: "start" }}>
                  {(v.agResFacts ?? []).map((f: VM, index: number) => (
                    <Fragment key={f.key ?? f.id ?? index}>
                      <div style={css(f.rowStyle)}>
                        <span style={{ font: "var(--type-body-sm)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                          {f.label}
                        </span>
                        <span style={{ font: "var(--type-label)", color: "var(--text-brand)", textAlign: "end" }}>
                          <span dir={f.dir}>
                            {f.value}
                          </span>
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <Button size="lg" onClick={v.goAgMeetings}>
                  חזרה לפגישות שלי
                </Button>
              </div>
            </>
          )}
          {v.agResGrid && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {v.agResTaken && (
                  <>
                    <Alert {...v.alertProps} tone="warning" title="המועד נתפס לפני רגע">
                      {v.resTakenText}
                    </Alert>
                  </>
                )}
                <Alert {...v.alertProps} tone="info">
                  המועד הנוכחי מסומן ונשאר זמין, כך שאפשר להשאיר אותו.
                </Alert>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "flex-start" }}>
                  <Calendar value={v.agResDate} onChange={v.pickAgResDate} today={v.todayDate} availableDates={v.agResDates} onlyAvailable={true} disabledWeekdays={[]} />
                  <div style={{ flex: "1 1 240px", minWidth: "0", display: "flex", flexDirection: "column", gap: "12px", alignSelf: "stretch" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                      <div style={{ font: "var(--type-label)", color: "var(--gray-700)" }}>
                        <span dir="ltr">
                          {v.agResDateLabel}
                        </span>
                      </div>
                      <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                        {v.agResCount}
                      </div>
                    </div>
                    <div className="hti-slots"><TimeSlots slots={v.agResSlots} value={v.agResSlot} onChange={v.pickAgResSlot} columns={3} /></div>
                    {v.agResShowCurrent && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", font: "var(--type-caption)", color: "var(--text-secondary)" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-primary)", flex: "none" }} />
                          <span>
                            <span dir="ltr">
                              {v.resCurrentTime}
                            </span>
                            {" הוא המועד הנוכחי"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ flex: "1", minWidth: "0", display: "flex" }}>
                    <Button variant="outline" size="lg" fullWidth={true} iconStart="arrow-right" onClick={v.goAgDetail}>
                      חזרה
                    </Button>
                  </div>
                  <div style={{ flex: "2", minWidth: "0", display: "flex" }}>
                    <Button size="lg" fullWidth={true} iconStart="calendar" disabled={v.agResNoSlot} loading={v.agResBusy} onClick={v.agResConfirm}>
                      {v.agResCta}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
