"use client";

import { useState } from "react";
import { SetPasswordView } from "@/components/views/auth/SetPasswordView";
import { api, ApiFailure } from "@/lib/client/api";
import { PASSWORD_RULE } from "@/lib/auth/types";

type Step = "normal" | "saved" | "dead";
type Change = { target: { value: string } };

export function SetPasswordScreen({ token, email }: { token: string | null; email: string | null }) {
  const [step, setStep] = useState<Step>(token ? "normal" : "dead");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [problem, setProblem] = useState<"" | "rule" | "match">("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!PASSWORD_RULE.test(password)) return setProblem("rule");
    if (password !== confirm) return setProblem("match");
    setBusy(true);
    try {
      await api("/api/app/auth/set-password", { token, password });
      setStep("saved");
    } catch (failure) {
      if (failure instanceof ApiFailure && failure.code === "dead_link") setStep("dead");
      else if (failure instanceof ApiFailure && failure.code === "weak_password") setProblem("rule");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
    <SetPasswordView
      v={{
        pwForm: step === "normal",
        pwSaved: step === "saved",
        pwDead: step === "dead",
        pwsIcon: step === "saved" ? "check" : step === "dead" ? "alert-circle" : "lock",
        pwIconBg: step === "saved" ? "var(--green-100)" : step === "dead" ? "var(--gray-100)" : "var(--color-primary-soft)",
        pwIconFg: step === "saved" ? "var(--green-700)" : step === "dead" ? "var(--gray-500)" : "var(--color-primary)",
        pwEmail: email,
        pwsType: show ? "text" : "password",
        pwEye: show ? "eye-off" : "eye",
        togglePwShow: () => setShow(!show),
        pwNew: password,
        onPwNew: (event: Change) => {
          setPassword(event.target.value);
          setProblem("");
        },
        pwConf: confirm,
        onPwConf: (event: Change) => {
          setConfirm(event.target.value);
          setProblem("");
        },
        pwRuleErr: problem === "rule" ? "לפחות 10 תווים, אות גדולה ואות קטנה באנגלית וספרה" : undefined,
        pwMatchErr: problem === "match" ? "הסיסמאות אינן תואמות" : undefined,
        pwHintOn: problem !== "rule",
        pwBusy: busy,
        pwCta: busy ? "שומר..." : "שמירת סיסמה",
        pwToLogin: () => window.location.assign("/login"),
      }}
    />
    </form>
  );
}
