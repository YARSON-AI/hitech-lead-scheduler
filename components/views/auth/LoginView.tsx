"use client";

/* eslint-disable @next/next/no-img-element */
import { Fragment } from "react";
import { Alert, Button, Card, Icon, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function LoginView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
            <div style={{ width: "100%", maxWidth: "384px" }}>
              <Card elevation="xl" padding="lg">
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                  <div style={{ borderRadius: "50%", background: "var(--color-primary-soft)", padding: "16px", color: "var(--color-primary)", display: "flex" }}>
                    <Icon name="lock" size={32} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  <img src="/brand/logo.png" alt="הייטק סוכנות לביטוח" style={{ width: "100%", maxWidth: "144px", height: "auto", display: "block" }} />
                </div>
                <p style={{ textAlign: "center", color: "var(--text-tertiary)", marginBottom: "24px" }}>
                  הזן פרטי התחברות כדי להמשיך
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <TextInput filled={true} iconStart="mail" placeholder="כתובת מייל" inputMode="email" value={v.email} onChange={v.onEmail} error={v.loginFieldErr} />
                  <TextInput filled={true} type={v.pwType} iconEnd={v.pwIcon} onIconEndClick={v.togglePw} placeholder="סיסמה" value={v.pw} onChange={v.onPw} error={v.loginFieldErr} />
                  {v.loginErr && (
                    <>
                      <p style={{ textAlign: "center", font: "var(--type-body-sm)", color: "var(--text-error)" }}>
                        {v.loginErr}
                      </p>
                    </>
                  )}
                  {v.locked && (
                    <>
                      <Alert tone="warning" title="הכניסה נחסמה זמנית" icon={true}>
                        חמישה ניסיונות שגויים. אפשר לנסות שוב בעוד 5 דקות, או לפנות למנהלת המוקד לאיפוס הסיסמה.
                      </Alert>
                    </>
                  )}
                  <Button size="lg" fullWidth={true} loading={v.busy} disabled={v.locked} type="submit">
                    {v.loginCta}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
    </>
  );
}
