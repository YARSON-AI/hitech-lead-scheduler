"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Card, Icon, TextInput } from "@/components/ds";
import { api, ApiFailure } from "@/lib/client/api";
import { logout } from "@/components/shell/StaffShell";

interface Enrollment {
  factorId: string;
  qr: string;
  secret: string;
}

export function TwoStepScreen({ factorId }: { factorId: string | null }) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const started = useRef(false);

  useEffect(() => {
    if (factorId || started.current) return;
    started.current = true;
    api<Enrollment>("/api/app/auth/mfa/enroll", {})
      .then(setEnrollment)
      .catch(() => setError("לא הצלחנו להתחיל את ההגדרה. נסה/י לרענן את הדף."));
  }, [factorId]);

  const activeFactor = factorId ?? enrollment?.factorId;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!activeFactor || busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/app/auth/mfa/verify", { factorId: activeFactor, code });
      window.location.assign("/admin");
    } catch (failure) {
      setBusy(false);
      setError(failure instanceof ApiFailure ? failure.message : "משהו השתבש. נסה/י שוב.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 384 }}>
        <Card elevation="xl" padding="lg">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ borderRadius: "50%", background: "var(--color-primary-soft)", padding: 16, color: "var(--color-primary)", display: "flex" }}>
              <Icon name="shield-check" size={32} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="הייטק סוכנות לביטוח" style={{ width: "100%", maxWidth: 144, height: "auto", display: "block" }} />
          </div>
          <p style={{ textAlign: "center", color: "var(--text-tertiary)", marginBottom: 24 }}>
            {factorId ? "הזן/י את הקוד מאפליקציית האימות" : "סריקת הקוד באפליקציית אימות, והזנת הקוד שמופיע בה"}
          </p>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {enrollment && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={enrollment.qr} alt="קוד QR להגדרת אפליקציית האימות" width={180} height={180} />
                <code dir="ltr" style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", overflowWrap: "anywhere", textAlign: "center" }}>
                  {enrollment.secret}
                </code>
              </div>
            )}
            <TextInput filled iconStart="lock" placeholder="קוד בן 6 ספרות" inputMode="numeric" dir="ltr" maxLength={6} value={code} onChange={(event: { target: { value: string } }) => setCode(event.target.value)} error={error || undefined} />
            <Button type="submit" size="lg" fullWidth loading={busy} disabled={!activeFactor || code.length !== 6}>
              {busy ? "מאמת..." : "אישור"}
            </Button>
            <Button variant="ghost" size="md" fullWidth onClick={logout}>
              התנתקות
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
