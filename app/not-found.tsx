import Link from "next/link";

export default function NotFound() {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>הדף לא נמצא</h1>
      <p>ייתכן שהקישור שגוי או שאין לך גישה אליו.</p>
      <Link href="/">חזרה למערכת</Link>
    </div>
  );
}
