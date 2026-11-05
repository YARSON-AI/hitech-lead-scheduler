"use client";

import { useState, type FormEvent } from "react";
import { LoginView } from "@/components/views/auth/LoginView";
import { api, ApiFailure } from "@/lib/client/api";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (busy || locked) return;
    setBusy(true);
    setError("");
    try {
      const { next } = await api<{ next: string }>("/api/app/auth/login", { email, password });
      window.location.assign(next);
    } catch (failure) {
      setBusy(false);
      if (failure instanceof ApiFailure && failure.code === "locked") setLocked(true);
      else setError(failure instanceof ApiFailure && failure.code === "wrong_credentials" ? failure.message : "משהו השתבש. נסה/י שוב.");
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <LoginView
        v={{
          email,
          onEmail: (event: { target: { value: string } }) => setEmail(event.target.value),
          pw: password,
          onPw: (event: { target: { value: string } }) => setPassword(event.target.value),
          pwType: showPassword ? "text" : "password",
          pwIcon: showPassword ? "eye-off" : "eye",
          togglePw: () => setShowPassword(!showPassword),
          loginFieldErr: error ? " " : undefined,
          loginErr: error,
          locked,
          busy,
          loginCta: busy ? "מתחבר..." : locked ? "נסה שוב בעוד 5 דקות" : "כניסה",
          submitLogin: () => submit(),
        }}
      />
    </form>
  );
}
