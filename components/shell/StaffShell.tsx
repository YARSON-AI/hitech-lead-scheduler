"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { Button, Icon, PageHeader } from "@/components/ds";
import { api } from "@/lib/client/api";
import { NEW_BOOKING_EVENT } from "@/lib/client/hooks";
import { PhoneNav } from "./PhoneNav";
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
  const startNew = (event?: { preventDefault: () => void }) => {
    if (path !== "/") return router.push("/");
    event?.preventDefault();
    window.dispatchEvent(new Event(NEW_BOOKING_EVENT));
  };
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
            <Button size="md" fullWidth iconStart="plus" onClick={() => startNew()} style={{ marginBottom: 8 }}>
              תיאום פגישה חדשה
            </Button>
            {items.map((item) => (
              <Link key={item.key} href={item.href} className="hti-nav" data-on={item.on ? "1" : "0"} style={deskStyle(item.on)} aria-current={item.on ? "page" : undefined}>
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
            <div className="hti-phone-only">
              <PhoneNav
                items={[
                  { key: "new", href: "/", label: "תיאום חדש", icon: "plus", on: path === "/", primary: true, onClick: startNew },
                  ...items.map((item) => ({ key: item.key, href: item.href, label: item.label, icon: item.icon, count: item.count, on: item.on })),
                ]}
              />
            </div>
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
