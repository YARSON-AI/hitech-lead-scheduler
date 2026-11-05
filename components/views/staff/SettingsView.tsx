"use client";

 
import { Fragment } from "react";
import { Alert, Button, Card, Icon, IconButton, SectionHeader } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function SettingsView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-fade-in">
        <h1 style={{ font: "var(--type-h1)" }}>
          הגדרות פגישה
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: "20px", alignItems: "stretch" }}>
          {(v.profiles ?? []).map((p: VM, index: number) => (
            <Fragment key={p.key ?? p.id ?? index}>
              <Card padding="lg" style={css(p.cardStyle)}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={css(p.iconStyle)}>
                      <Icon name={p.icon} size={20} />
                    </div>
                    <h2 style={{ font: "var(--type-h2)", color: "var(--text-brand)", flex: "1", minWidth: "0", whiteSpace: "nowrap" }}>
                      {p.title}
                    </h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {(p.fields ?? []).map((f: VM, index: number) => (
                      <Fragment key={f.key ?? f.id ?? index}>
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "12px", alignItems: "center" }}>
                          <div style={{ minWidth: "0" }}>
                            <div style={{ font: "var(--type-label)", color: "var(--text-primary)" }}>
                              {f.label}
                            </div>
                            <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", textWrap: "pretty" }}>
                              {f.hint}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "none" }}>
                            <input type="text" inputMode="numeric" value={f.value} dir="ltr" style={{ height: "44px", width: "52px", border: "2px solid var(--border-default)", borderRadius: "var(--radius-control)", padding: "0", fontFamily: "var(--font-body)", fontSize: "var(--text-base)", color: "var(--text-primary)", background: "var(--surface-card)", textAlign: "center" }} />
                            <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)", width: "44px" }}>
                              {f.unit}
                            </span>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ flex: "1 1 auto", display: "flex", alignItems: "flex-end", minHeight: "8px" }}>
                    {p.hasNote && (
                      <>
                        <Alert {...v.alertProps} tone="info">
                          בפגישה זוגית אין מרווח בין שתי הפגישות של בני הזוג. מול כל אירוע אחר ביומן המרווחים חלים כרגיל.
                        </Alert>
                      </>
                    )}
                  </div>
                  <div style={{ paddingTop: "16px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <Button size="md" iconStart="check" onClick={v.showSaved}>
                      שמירה
                    </Button>
                    <Button variant="ghost" size="md" onClick={v.noop}>
                      איפוס
                    </Button>
                  </div>
                </div>
              </Card>
            </Fragment>
          ))}
        </div>
        <Card padding="lg">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ width: "40px", height: "40px", flex: "none", borderRadius: "50%", background: "var(--color-primary-soft-2)", color: "var(--teal-800)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {" "}{v.linkGlyph}{" "}
              </div>
              <div style={{ flex: "1", minWidth: "0" }}>
                <h2 style={{ font: "var(--type-h2)", color: "var(--text-brand)" }}>
                  קישורי הזמנה ללקוח
                </h2>
                <p style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                  הגדרה לכל הסוכנות, לשני סוגי הפגישות
                </p>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "12px", alignItems: "center", flex: "1 1 320px", maxWidth: "560px" }}>
                <div style={{ minWidth: "0" }}>
                  <div style={{ font: "var(--type-label)", color: "var(--text-primary)" }}>
                    תוקף קישור הזמנה (ימים)
                  </div>
                  <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", textWrap: "pretty" }}>
                    כמה ימים קישור שנשלח ללקוח/ה נשאר פתוח. חל על קישורים חדשים בלבד.
                  </div>
                </div>
                <input type="text" inputMode="numeric" value="7" dir="ltr" style={{ height: "44px", width: "52px", border: "2px solid var(--border-default)", borderRadius: "var(--radius-control)", padding: "0", fontFamily: "var(--font-body)", fontSize: "var(--text-base)", color: "var(--text-primary)", background: "var(--surface-card)", textAlign: "center" }} />
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Button size="md" iconStart="check" onClick={v.showSaved}>
                  שמירה
                </Button>
                <Button variant="ghost" size="md" onClick={v.noop}>
                  איפוס
                </Button>
              </div>
            </div>
          </div>
        </Card>
        <Card padding={v.holPad}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
              <div style={{ width: "40px", height: "40px", flex: "none", borderRadius: "50%", background: "var(--amber-100)", color: "var(--amber-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="calendar" size={20} />
              </div>
              <div style={{ flex: "1 1 220px", minWidth: "0" }}>
                <h2 style={{ font: "var(--type-h2)", color: "var(--text-brand)" }}>
                  ימי חג וחופשה
                </h2>
                <p style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", textWrap: "pretty" }}>
                  הימים נטענים אוטומטית מלוח החגים. כאן מגדירים רק חריגות.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconButton icon="chevron-right" label="שנה קודמת" variant="ghost" disabled={v.holPrevOff} onClick={v.holPrev} />
                  <span dir="ltr" style={{ minWidth: "56px", textAlign: "center", font: "var(--type-h3)", color: "var(--text-brand)" }}>
                    {v.holYear}
                  </span>
                  <IconButton icon="chevron-left" label="שנה הבאה" variant="ghost" disabled={v.holNextOff} onClick={v.holNext} />
                </div>
                <Button variant="outline" size="md" iconStart="plus" onClick={v.openHolAdd}>
                  הוספת יום חופש
                </Button>
              </div>
            </div>
            {(v.holMonths ?? []).map((m: VM, index: number) => (
              <Fragment key={m.key ?? m.id ?? index}>
                <div>
                  <div style={{ padding: "18px 0 8px", font: "var(--type-label)", color: "var(--text-brand)", borderBottom: "1px solid var(--border-default)" }}>
                    {m.title}
                  </div>
                  {(m.rows ?? []).map((h: VM, index: number) => (
                    <Fragment key={h.key ?? h.id ?? index}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                        <div style={{ flex: "1 1 280px", minWidth: "0", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                          <div style={{ width: "144px", flex: "none" }}>
                            <div style={{ font: "var(--type-label)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                              <span dir="ltr">
                                {h.dateLabel}
                              </span>
                            </div>
                            <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                              {h.dowLabel}
                            </div>
                          </div>
                          <div style={{ minWidth: "0", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                            <div style={{ font: "var(--type-label)", color: "var(--text-primary)" }}>
                              {h.name}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                              {h.badge}{h.src}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-end", marginInlineStart: "auto" }}>
                          {" "}{h.stateEl}{" "}
                          <IconButton icon="pencil" label="עריכה" variant="subtle" onClick={h.edit} />
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </Fragment>
            ))}
            {v.holNone && (
              <>
                <p style={{ padding: "24px 0", textAlign: "center", color: "var(--text-tertiary)" }}>
                  אין ימי חג או חופשה בשנה הזו.
                </p>
              </>
            )}
          </div>
        </Card>
        <Card padding="md">
          <SectionHeader title="היסטוריית שינויים" divider={true} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(v.settingsHistory ?? []).map((h: VM, index: number) => (
              <Fragment key={h.key ?? h.id ?? index}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 240px", minWidth: "0" }}>
                    <div style={{ font: "var(--type-label)" }}>
                      {h.field}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
                      <span>
                        עודכן מ־
                      </span>
                      <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
                        {h.from}
                      </span>
                      <span>
                        ל־
                      </span>
                      <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
                        {h.to}
                      </span>
                      <span>
                        {h.unit}
                      </span>
                    </div>
                  </div>
                  <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                    <span dir="ltr">
                      {h.when}
                    </span>
                    {" ● "}{h.actor}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
