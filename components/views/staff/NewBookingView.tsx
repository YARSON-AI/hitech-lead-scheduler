"use client";

 
import { Fragment } from "react";
import { Alert, Badge, Button, Calendar, Card, EmptyState, FieldLabel, Icon, ProgressSteps, RadioGroup, SearchableSelect, SectionHeader, Spinner, SummaryItem, TextInput, TimeSlots, ToggleButton } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function NewBookingView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }} className="hti-fade-in">
        <div style={{ width: "100%", maxWidth: `${v.newHeaderMax}`, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Button variant="link" iconStart="arrow-right" onClick={v.goBookings}>
              חזרה לפגישות
            </Button>
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ font: "var(--type-h1)" }}>
              תיאום פגישה חדשה
            </h1>
            <p style={{ marginTop: "8px", color: "var(--text-secondary)" }}>
              {v.newSub}
            </p>
          </div>
          <ProgressSteps steps={3} current={v.newStep} complete={v.newDone} labels={v.newLabels} />
        </div>
        {v.newStep1 && (
          <>
            <div style={{ width: "100%", maxWidth: "600px" }}>
              <Card padding="lg">
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <SectionHeader title="פרטי הליד" description="הזן את פרטי הליד לפגישה" />
                  <TextInput label="מספר ליד*" placeholder="הזן מספר ליד" inputMode="numeric" value={v.leadNum} onChange={v.onLeadNum} error={v.leadErr} />
                  {v.newSpouse && (
                    <>
                      <div className="hti-slide-down">
                        <TextInput label="מספר ליד בן/בת הזוג שכבר תואם*" placeholder="הזן מספר ליד בן/בת הזוג" value={v.spouseLead} onChange={v.onSpouseLead} />
                      </div>
                    </>
                  )}
                  <ToggleButton label="בן/בת זוג" icon="user-plus" checked={v.newSpouse} onToggle={v.toggleSpouse} />
                  <div style={{ borderTop: "1px solid var(--border-strong)" }} />
                  <ToggleButton label="פגישה פרונטלית" icon="map-pin" checked={v.newInPerson} onToggle={v.toggleInPerson} />
                  {v.newInPerson && (
                    <>
                      <div className="hti-slide-down">
                        <TextInput label="כתובת לפגישה*" placeholder="הזן כתובת מלאה" value={v.newAddress} onChange={v.onNewAddress} />
                      </div>
                    </>
                  )}
                  {v.step1Err && (
                    <>
                      <Alert {...v.alertProps} tone="error">
                        {v.step1Err}
                      </Alert>
                    </>
                  )}
                  <Button size="lg" fullWidth={true} iconEnd="arrow-left" loading={v.newBusy} onClick={v.newNext}>
                    {v.step1Cta}
                  </Button>
                </div>
              </Card>
            </div>
          </>
        )}
        {v.newStep2 && (
          <>
            <div style={{ width: "100%", maxWidth: "600px" }}>
              <Card padding="lg">
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <SectionHeader title="הקצאת סוכן" description="בחר כיצד להקצות סוכן לפגישה" />
                  <Card tone="subtle" padding="sm">
                    <h3 style={{ font: "var(--type-label)", color: "var(--gray-700)", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid var(--border-strong)" }}>
                      סיכום פרטי הליד
                    </h3>
                    <SummaryItem label="ליד" value={v.leadSummary} />
                    {v.newSpouse && (
                      <>
                        <SummaryItem label="ליד בן/בת הזוג" value={v.spouseSummary} />
                      </>
                    )}
                    <SummaryItem label="סוג פגישה" value={v.meetingKind} last={v.notInPerson} />
                    {v.newInPerson && (
                      <>
                        <SummaryItem label="כתובת" value={v.newAddress} last={true} />
                      </>
                    )}
                  </Card>
                  {v.newSpouse && (
                    <>
                      <Alert {...v.alertProps} tone="info" title="פגישה זוגית">
                        הפגישה תוקצה לסוכן/ת של בן/בת הזוג. רמזור ומכסות אינם חלים, והמרווח מבוטל רק בין שתי הפגישות.
                      </Alert>
                    </>
                  )}
                  <RadioGroup options={v.assignOptions} value={v.newAssign} onChange={v.onNewAssign} />
                  {v.newManual && (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-slide-down">
                        <SearchableSelect label="התמחות" options={v.specOptions} value={v.newSpec} onChange={v.onNewSpec} placeholder="סנן לפי התמחות" />
                        <SearchableSelect label="סוכן*" options={v.agentPickOptions} value={v.newAgent} onChange={v.onNewAgent} placeholder="בחר סוכן" emptyPlaceholder="לא נמצאו סוכנים זמינים" />
                        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                          <ToggleButton label="קביעה כפויה — מועד שהסוכן/ת אינו פנוי בו" icon="alert-triangle" checked={v.newForced} onToggle={v.toggleForced} />
                          <p style={{ font: "var(--type-body-sm)", color: "var(--text-tertiary)" }}>
                            דורש בחירת סוכן/ת. עוקף שעות פעילות, מרווחים, התראה מוקדמת ומכסות. הפעולה מתועדת.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                    <div style={{ flex: "1", minWidth: "0", display: "flex" }}>
                      <Button variant="outline" size="lg" fullWidth={true} iconStart="arrow-right" onClick={v.newBack}>
                        חזרה
                      </Button>
                    </div>
                    <div style={{ flex: "2", minWidth: "0", display: "flex" }}>
                      <Button size="lg" fullWidth={true} iconStart="calendar" disabled={v.step2Disabled} onClick={v.newNext}>
                        קביעת פגישה
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
        {v.newStep3 && (
          <>
            <div style={{ width: "100%", maxWidth: "880px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <Card padding="lg">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
                  <div style={{ borderRadius: "50%", background: "var(--color-primary-soft-2)", padding: "8px", color: "var(--color-primary-hover)", display: "flex" }}>
                    <Icon name="users" size={20} />
                  </div>
                  <div style={{ flex: "1 1 160px", minWidth: "0" }}>
                    <p style={{ font: "var(--type-h3)", color: "var(--text-brand)" }}>
                      {v.pickerAgent}
                    </p>
                    <p style={{ font: "var(--type-body-sm)", color: "var(--text-tertiary)" }}>
                      {v.pickerHint}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <Badge tone="neutral" icon="clock">
                      30 דקות
                    </Badge>
                    <Badge tone={v.locationTone} icon={v.locationIcon}>
                      {v.meetingKind}
                    </Badge>
                  </div>
                </div>
                {v.pkTransfer && (
                  <>
                    <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <SearchableSelect label="סוכן/ת חדש/ה*" options={v.agentPickOptions} value={v.transferAgent} onChange={v.onTransferAgent} placeholder="בחר סוכן/ת" />
                      <Alert {...v.alertProps} tone="info">
                        המועד הקיים של הפגישה, יום שלישי 15.09.2026 בשעה 10:00, ייבחר מראש אם הסוכן/ת החדש/ה פנוי/ה בו. פגישה זוגית אינה עוברת יחד — יש להעביר כל פגישה בנפרד.
                      </Alert>
                    </div>
                  </>
                )}
                {v.pkReschedule && (
                  <>
                    <div style={{ marginBottom: "20px" }}>
                      <Alert {...v.alertProps} tone="info" title="שינוי מועד">
                        אותו/אותה סוכן/ת ואותה פגישה. המועד הקיים, יום שלישי 15.09.2026 בשעה 10:00, חסום ואינו זמין לבחירה — הוא יתפנה רק לאחר שהפגישה תועבר או תבוטל.
                      </Alert>
                    </div>
                  </>
                )}
                {v.pkForced && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <Alert {...v.alertProps} tone="warning" title="קביעה כפויה" icon={true}>
                        הסוכן/ת אינו פנוי/ה במועד שתזין. הפגישה תיקבע בכל מקרה, תירשם כקביעה כפויה ותתועד ביומן הפעולות.
                      </Alert>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)", position: "relative" }}>
                          <FieldLabel>
                            תאריך*
                          </FieldLabel>
                          <div>
                            {v.forceField}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-field)" }}>
                          <FieldLabel>
                            שעה*
                          </FieldLabel>
                          <input type="time" value="18:30" dir="ltr" style={{ height: "44px", border: "2px solid var(--border-default)", borderRadius: "var(--radius-control)", padding: "0 var(--pad-input-x)", font: "var(--type-body)", fontFamily: "var(--font-body)", color: "var(--text-primary)", background: "var(--surface-card)", width: "100%" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
                        <div style={{ flex: "1", minWidth: "0", display: "flex" }}>
                          <Button variant="outline" size="lg" fullWidth={true} iconStart="arrow-right" onClick={v.newBack}>
                            חזרה
                          </Button>
                        </div>
                        <div style={{ flex: "2", minWidth: "0", display: "flex" }}>
                          <Button size="lg" fullWidth={true} iconStart="calendar" onClick={v.newConfirm}>
                            קביעת פגישה כפויה
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {v.pkLoading && (
                  <>
                    <div style={{ minHeight: "320px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", color: "var(--text-tertiary)" }}>
                      <Spinner size={32} />
                      <p style={{ font: "var(--type-body)" }}>
                        טוען מועדים פנויים...
                      </p>
                    </div>
                  </>
                )}
                {v.pkEmpty && (
                  <>
                    <div>
                      <EmptyState icon="calendar" title="אין מועדים פנויים בחלון התיאום" description="לא נמצאו מועדים פנויים ב-21 הימים הקרובים. אפשר לבחור סוכן/ת אחר/ת, או לקבוע מועד כפוי בתיאום טלפוני." />
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                        <Button variant="outline" size="lg" iconStart="arrow-right" onClick={v.newBack}>
                          בחירת סוכן/ת אחר/ת
                        </Button>
                        <Button variant="secondary" size="lg" iconStart="alert-triangle" onClick={v.showForcedNew}>
                          קביעה כפויה
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                {v.pkError && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <EmptyState icon="alert-triangle" title="הפגישה לא נקבעה" description="משהו השתבש והפגישה לא נשמרה. אפשר לנסות שוב." />
                      <Button variant="outline" size="lg" onClick={v.pkRetry}>
                        נסה/י שוב
                      </Button>
                    </div>
                  </>
                )}
                {v.pkGrid && (
                  <>
                    <div>
                      {v.pkTaken && (
                        <>
                          <div style={{ marginBottom: "16px" }}>
                            <Alert {...v.alertProps} tone="warning" title="המועד נתפס לפני רגע">
                              10:30 אינו פנוי יותר. השעות הפנויות רועננו — בחר מועד אחר.
                            </Alert>
                          </div>
                        </>
                      )}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "flex-start" }}>
                        <Calendar value={v.newDate} onChange={v.pickNewDate} today={v.todayDate} availableDates={v.availableDates} />
                        <div style={{ flex: "1 1 260px", minWidth: "240px", display: "flex", flexDirection: "column", gap: "12px", alignSelf: "stretch" }}>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                            <div style={{ font: "var(--type-label)", color: "var(--gray-700)" }}>
                              <span dir="ltr">
                                {v.newDateLabel}
                              </span>
                            </div>
                            <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                              {v.slotCount}
                            </div>
                          </div>
                          <TimeSlots slots={v.newSlots} value={v.newSlot} onChange={v.pickNewSlot} columns={4} />
                          <div style={{ marginTop: "4px", paddingTop: "14px", borderTop: "1px dashed var(--border-default)", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)", textWrap: "pretty" }}>
                              הלקוח/ה מעדיף/ה לבחור מועד בעצמו/ה?
                            </div>
                            <Button variant="outline" size="md" fullWidth={true} iconStart="mail" onClick={v.newToLink}>
                              שליחת קישור ללקוח
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
                        <div style={{ flex: "1", minWidth: "0", display: "flex" }}>
                          <Button variant="outline" size="lg" fullWidth={true} iconStart="arrow-right" onClick={v.newBack}>
                            חזרה
                          </Button>
                        </div>
                        <div style={{ flex: "2", minWidth: "0", display: "flex" }}>
                          <Button size="lg" fullWidth={true} iconStart="calendar" disabled={v.noSlot} onClick={v.newConfirm}>
                            {v.confirmLabel}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </>
        )}
        {v.newDone && (
          <>
            <div style={{ width: "100%", maxWidth: "520px" }}>
              <Card elevation="xl" padding="lg">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center" }}>
                  <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--green-100)", color: "var(--green-800)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="check" size={40} />
                  </div>
                  <h2 style={{ font: "var(--type-h2)" }}>
                    הפגישה נקבעה בהצלחה
                  </h2>
                  <p style={{ color: "var(--text-secondary)" }}>
                    פרטי הפגישה נשלחו למייל.
                  </p>
                  <div style={{ width: "100%", background: "var(--surface-subtle)", borderRadius: "var(--radius-control)", padding: "6px 20px", textAlign: "start" }}>
                    {(v.newSummary ?? []).map((f: VM, index: number) => (
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
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", paddingTop: "4px" }}>
                    <Button size="lg" iconStart="plus" onClick={v.newRestart}>
                      תיאום פגישה נוספת
                    </Button>
                    <Button variant="outline" size="lg" onClick={v.goBookings}>
                      חזרה לפגישות
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
}
