"use client";

 
import { Fragment } from "react";
import { Alert, Badge, Button, Card, Icon, ProgressSteps, RadioGroup, SearchableSelect, SectionHeader, SummaryItem, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function LinkNewView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }} className="hti-fade-in">
        <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Button variant="link" iconStart="arrow-right" onClick={v.lkBack}>
              {v.lkBackLabel}
            </Button>
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ font: "var(--type-h1)" }}>
              קישור הזמנה ללקוח
            </h1>
            <p style={{ marginTop: "8px", color: "var(--text-secondary)", textWrap: "pretty" }}>
              הלקוח/ה יבחר/תבחר מועד בעצמו/ה מתוך הזמנים הפנויים של הסוכן/ת
            </p>
          </div>
          <ProgressSteps steps={3} current={v.lkStep} complete={v.lkDone} labels={v.lkLabels} />
        </div>
        {v.lkForm && (
          <>
            <div style={{ width: "100%", maxWidth: "600px" }}>
              <Card padding={v.lkPad}>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <SectionHeader title="פרטי הליד" description="הזן מספר ליד ובדוק אותו מול שורנס" />
                  <TextInput label="מספר ליד*" placeholder="הזן מספר ליד" inputMode="numeric" value={v.lkLead} onChange={v.onLkLead} error={v.lkLeadErr} disabled={v.lkChecked} />
                  <TextInput label="כתובת לפגישה פרונטלית, לא חובה" placeholder="ללא כתובת, הפגישה תהיה אונליין" value={v.lkAddress} onChange={v.onLkAddress} disabled={v.lkChecked} />
                  {v.lkErr && (
                    <>
                      <Alert {...v.alertProps} tone="error">
                        {v.lkErr}
                      </Alert>
                    </>
                  )}
                  {v.lkNotChecked && (
                    <>
                      <Button size="lg" fullWidth={true} iconStart="search" loading={v.lkBusy} onClick={v.lkCheck}>
                        {v.lkCheckCta}
                      </Button>
                    </>
                  )}
                  {v.lkChecked && (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-slide-down">
                        <Card tone="subtle" padding="sm">
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
                            <h3 style={{ font: "var(--type-label)", color: "var(--gray-700)" }}>
                              הליד שנמצא
                            </h3>
                            <Button variant="link" size="sm" onClick={v.lkReset}>
                              שינוי ליד
                            </Button>
                          </div>
                          <SummaryItem label="שם הלקוח" value={v.lkCustomer} last={true} />
                        </Card>
                        <SectionHeader title="סוכן/ת" description={v.lkAgentHint} />
                        {v.lkStaff && (
                          <>
                            <RadioGroup options={v.lkAssignOptions} value={v.lkAssign} onChange={v.onLkAssign} />
                          </>
                        )}
                        {v.lkManual && (
                          <>
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-slide-down">
                              <SearchableSelect label="התמחות" options={v.specOptions} value={v.lkSpec} onChange={v.onLkSpec} placeholder="סנן לפי התמחות" />
                              <SearchableSelect label="סוכן*" options={v.agentPickOptions} value={v.lkAgent} onChange={v.onLkAgent} placeholder="בחר סוכן" emptyPlaceholder="לא נמצאו סוכנים זמינים" />
                            </div>
                          </>
                        )}
                        {v.lkIsAgent && (
                          <>
                            <TextInput label="סוכן/ת" value={v.lkOwnName} disabled={true} />
                          </>
                        )}
                        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "20px" }}>
                          <Button size="lg" fullWidth={true} disabled={v.lkCreateDisabled} loading={v.lkCreating} onClick={v.lkCreate}>
                            {v.lkCreateCta}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
        {v.lkDone && (
          <>
            <div style={{ width: "100%", maxWidth: "560px" }}>
              <Card elevation="xl" padding={v.lkPad}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center" }}>
                  <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--green-100)", color: "var(--green-800)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="check" size={40} />
                  </div>
                  <div>
                    <h2 style={{ font: "var(--type-h2)" }}>
                      הקישור נוצר
                    </h2>
                    <p style={{ marginTop: "6px", color: "var(--text-secondary)", textWrap: "pretty" }}>
                      יש להעתיק את הקישור ולשלוח אותו ללקוח/ה בוואטסאפ או במייל.
                    </p>
                  </div>
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div dir="ltr" style={{ height: "52px", display: "flex", alignItems: "center", gap: "10px", padding: "0 16px", border: "2px solid var(--color-primary)", borderRadius: "var(--radius-control)", background: "var(--color-primary-soft)", color: "var(--text-brand)", fontFamily: "var(--font-body)", fontSize: "15px", fontVariantNumeric: "tabular-nums", minWidth: "0" }}>
                      {" "}{v.linkGlyph}{" "}
                      <span style={{ flex: "1", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
                        {v.lkUrl}
                      </span>
                    </div>
                    {" "}{v.lkCopyBtn}{" "}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Badge tone="neutral" icon="clock">
                        {v.lkExpiry}
                      </Badge>
                    </div>
                  </div>
                  <div style={{ width: "100%", background: "var(--surface-subtle)", borderRadius: "var(--radius-control)", padding: "6px 20px", textAlign: "start" }}>
                    {(v.lkFacts ?? []).map((f: VM, index: number) => (
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
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", font: "var(--type-body-sm)", color: "var(--text-tertiary)", textAlign: "start", textWrap: "pretty" }}>
                    <Icon name="info" size={16} style={css(v.mt2)} />
                    <span>
                      יצירת קישור חדש לאותו ליד מבטלת את הקישור הפתוח הקודם.
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", paddingTop: "4px" }}>
                    <Button variant="outline" size="lg" iconStart="plus" onClick={v.lkRestart}>
                      קישור נוסף
                    </Button>
                    <Button variant="ghost" size="lg" onClick={v.goLinks}>
                      לקישורי הזמנה
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
