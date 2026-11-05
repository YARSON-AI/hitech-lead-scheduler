"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader, Tabs } from "@/components/ds";
import { useIsPhone } from "@/lib/client/hooks";
import { logout } from "./StaffShell";
import { ToastProvider } from "./ToastProvider";

const HREF: Record<string, string> = {
  meetings: "/agent",
  hours: "/agent/hours",
  overrides: "/agent/overrides",
  links: "/agent/links",
};

function current(path: string): string {
  if (path.startsWith("/agent/hours")) return "hours";
  if (path.startsWith("/agent/overrides")) return "overrides";
  if (path.startsWith("/agent/links")) return "links";
  return "meetings";
}

export function AgentShell({ firstName, meetingCount, children }: { firstName: string; meetingCount: number; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const isPhone = useIsPhone();
  const tabs = [
    { value: "meetings", label: isPhone ? "פגישות" : "הפגישות שלי", icon: "calendar", count: meetingCount },
    { value: "hours", label: isPhone ? "שעות" : "שעות פעילות", icon: "clock" },
    { value: "overrides", label: "החרגות", icon: "list" },
    { value: "links", label: isPhone ? "קישורים" : "קישורי הזמנה", icon: "mail" },
  ];
  const onChange = (value: string) => router.push(HREF[value]);
  return (
    <ToastProvider>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <PageHeader userName={firstName} onLogout={logout} logoSrc="/brand/logo.png" />
        <div style={{ padding: "0 16px", maxWidth: 776, width: "100%", margin: "0 auto" }}>
          {!isPhone && <Tabs tabs={tabs} value={current(path)} onChange={onChange} />}
        </div>
        <div style={{ flex: 1, padding: "20px 16px 88px", maxWidth: 776, width: "100%", margin: "0 auto" }}>{children}</div>
        {isPhone && (
          <div className="hti-hscroll" style={{ position: "sticky", bottom: 0, display: "flex", overflowX: "auto", padding: "10px 12px", background: "var(--surface-card)", borderTop: "1px solid var(--border-subtle)" }}>
            <Tabs variant="pills" tabs={tabs} value={current(path)} onChange={onChange} />
          </div>
        )}
      </div>
    </ToastProvider>
  );
}
