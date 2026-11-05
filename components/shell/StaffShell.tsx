"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { Button, Icon, PageHeader } from "@/components/ds";
import { api } from "@/lib/client/api";
import { ToastProvider } from "./ToastProvider";

const NAV = [
  { key: "bookings", href: "/admin", label: "פגישות", icon: "list", managerOnly: false },
  { key: "alerts", href: "/admin/alerts", label: "התראות", icon: "bell", managerOnly: false },
  { key: "links", href: "/admin/links", label: "קישורי הזמנה", icon: "mail", managerOnly: false },
  { key: "agents", href: "/admin/agents", label: "סוכנים", icon: "users", managerOnly: true },
  { key: "users", href: "/admin/users", label: "משתמשים", icon: "user-plus", managerOnly: true },
  { key: "settings", href: "/admin/settings", label: "הגדרות פגישה", icon: "settings", managerOnly: true },
];

function isActive(key: string, path: string): boolean {
  if (key === "bookings") return path === "/admin" || path.startsWith("/admin/bookings");
  return path.startsWith(NAV.find((item) => item.key === key)!.href);
}

export async function logout() {
  await api("/api/app/auth/logout", {});
  window.location.assign("/login");
}

export function StaffShell({
  userName,
  isManager,
  alertCount,
  children,
}: {
  userName: string;
  isManager: boolean;
  alertCount: number;
  children: ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const items = NAV.filter((item) => isManager || !item.managerOnly).map((item) => ({
    ...item,
    count: item.key === "alerts" ? alertCount : 0,
    on: isActive(item.key, path),
  }));

  const deskStyle = (on: boolean): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "11px 12px",
    borderRadius: "var(--radius-control)",
    cursor: "pointer",
    textAlign: "start",
    font: "var(--type-label)",
    fontFamily: "var(--font-body)",
    border: "2px solid " + (on ? "var(--color-primary)" : "transparent"),
    background: on ? "var(--color-primary-soft)" : "transparent",
    color: on ? "var(--text-brand)" : "var(--text-secondary)",
    textDecoration: "none",
  });

  const phoneStyle = (on: boolean): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    flex: "none",
    height: 36,
    padding: "0 14px",
    border: "none",
    borderRadius: "var(--radius-pill)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    background: on ? "var(--color-primary)" : "transparent",
    color: on ? "#fff" : "var(--gray-600)",
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    fontSize: 14,
    textDecoration: "none",
  });

  return (
    <ToastProvider>
      <div style={{ maxWidth: 1360, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <PageHeader userName={userName} onLogout={logout} logoSrc="/brand/logo.png" />
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, flexWrap: "wrap", flex: 1 }}>
          <nav
            aria-label="ניווט ראשי"
            className="hti-desk-only"
            style={{ width: 256, flex: "none", borderInlineStart: "1px solid var(--border-subtle)", background: "var(--surface-subtle)", padding: "20px 16px", flexDirection: "column", gap: 6 }}
          >
            <Button size="md" fullWidth iconStart="plus" onClick={() => router.push("/")} style={{ marginBottom: 8 }}>
              תיאום פגישה חדשה
            </Button>
            {items.map((item) => (
              <Link key={item.key} href={item.href} style={deskStyle(item.on)} aria-current={item.on ? "page" : undefined}>
                <Icon name={item.icon} size={20} />
                <span style={{ flex: 1, textAlign: "start" }}>{item.label}</span>
                {item.count > 0 && (
                  <span
                    style={{
                      minWidth: 22,
                      height: 22,
                      borderRadius: 999,
                      padding: "0 6px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: item.on ? "var(--color-primary)" : "var(--status-error)",
                      color: "#fff",
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <main style={{ flex: "1 1 520px", minWidth: 0, padding: "24px 20px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="hti-phone-only" style={{ position: "relative", width: "100%", minWidth: 0, borderRadius: "var(--radius-pill)", background: "var(--surface-subtle)" }}>
              <div className="hti-hscroll" style={{ display: "flex", gap: 6, overflowX: "auto", padding: 4, borderRadius: "var(--radius-pill)" }}>
                <Link href="/" style={{ ...phoneStyle(path === "/"), background: "var(--color-primary)", color: "#fff" }}>
                  <Icon name="plus" size={16} />
                  <span>תיאום חדש</span>
                </Link>
                {items.map((item) => (
                  <Link key={item.key} href={item.href} style={phoneStyle(item.on)} aria-current={item.on ? "page" : undefined}>
                    <Icon name={item.icon} size={16} />
                    <span>{item.label}</span>
                    {item.count > 0 && (
                      <span style={{ minWidth: 20, borderRadius: 999, padding: "0 6px", background: item.on ? "rgba(255,255,255,.25)" : "var(--status-error)", color: "#fff", fontSize: 12, textAlign: "center" }}>
                        {item.count}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
