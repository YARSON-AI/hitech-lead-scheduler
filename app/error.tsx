"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>משהו השתבש</h1>
      <p>אפשר לנסות שוב. אם זה חוזר, יש לפנות למוקד.</p>
      <button type="button" onClick={reset} style={{ textDecoration: "underline", cursor: "pointer" }}>
        נסה/י שוב
      </button>
    </div>
  );
}
