"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader, Tabs } from "@/components/ds";
import { useIsPhone } from "@/lib/client/hooks";
import { logout } from "./StaffShell";
import { PhoneNav } from "./PhoneNav";
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
          {isPhone && (
            <div style={{ paddingTop: 24 }}>
              <PhoneNav items={tabs.map((tab) => ({ key: tab.value, href: HREF[tab.value], label: tab.label, icon: tab.icon, count: tab.count, on: current(path) === tab.value }))} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, padding: isPhone ? "20px 16px 48px" : "20px 16px 88px", maxWidth: 776, width: "100%", margin: "0 auto" }}>{children}</div>
      </div>
    </ToastProvider>
  );
}
