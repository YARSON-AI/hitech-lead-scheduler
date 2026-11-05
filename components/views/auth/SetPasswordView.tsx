"use client";

/* eslint-disable @next/next/no-img-element, react/jsx-key */
import { Fragment } from "react";
import { Button, Card, Icon, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function SetPasswordView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
            <div style={{ width: "100%", maxWidth: "384px" }}>
              <Card elevation="xl" padding="lg">
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                  <div style={{ borderRadius: "50%", background: `${v.pwIconBg}`, padding: "16px", color: `${v.pwIconFg}`, display: "flex" }}>
                    <Icon name={v.pwsIcon} size={32} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  <img src="/brand/logo.png" alt="הייטק סוכנות לביטוח" style={{ width: "100%", maxWidth: "144px", height: "auto", display: "block" }} />
                </div>
                {v.pwForm && (
                  <>
                    <p style={{ textAlign: "center", color: "var(--text-tertiary)" }}>
                      הגדרת סיסמה לחשבון
                    </p>
                    <p style={{ textAlign: "center", font: "var(--type-label)", color: "var(--text-brand)", margin: "4px 0 24px" }}>
                      <span dir="ltr">
                        {v.pwEmail}
                      </span>
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <TextInput filled={true} type={v.pwsType} iconEnd={v.pwEye} onIconEndClick={v.togglePwShow} placeholder="סיסמה חדשה" value={v.pwNew} onChange={v.onPwNew} error={v.pwRuleErr} />
                      <TextInput filled={true} type={v.pwsType} placeholder="אימות סיסמה" value={v.pwConf} onChange={v.onPwConf} error={v.pwMatchErr} />
                      {v.pwHintOn && (
                        <>
                          <p style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", textAlign: "center", whiteSpace: "nowrap" }}>
                            לפחות 10 תווים, אות גדולה ואות קטנה באנגלית וספרה
                          </p>
                        </>
                      )}
                      <Button size="lg" fullWidth={true} loading={v.pwBusy} type="submit">
                        {v.pwCta}
                      </Button>
                    </div>
                  </>
                )}
                {v.pwSaved && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "center", marginBottom: "24px" }}>
                      <h2 style={{ font: "var(--type-h2)" }}>
                        הסיסמה נשמרה
                      </h2>
                      <p style={{ color: "var(--text-secondary)" }}>
                        אפשר להיכנס עם המייל והסיסמה החדשה.
                      </p>
                    </div>
                    <Button size="lg" fullWidth={true} onClick={v.pwToLogin}>
                      כניסה למערכת
                    </Button>
                  </>
                )}
                {v.pwDead && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "center" }}>
                      <h2 style={{ font: "var(--type-h2)" }}>
                        הקישור אינו בתוקף
                      </h2>
                      <p style={{ color: "var(--text-secondary)", textWrap: "pretty" }}>
                        פג התוקף של הקישור, או שכבר נעשה בו שימוש. יש לבקש ממנהלת התיאום לשלוח הזמנה חדשה.
                      </p>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
    </>
  );
}
