import type { ReactNode } from "react";
import { AgentShell } from "@/components/shell/AgentShell";
import { requirePage } from "@/lib/auth/actor";
import { AGENT } from "@/lib/auth/types";
import { serverClient } from "@/lib/supabase/server";

export default async function AgentLayout({ children }: { children: ReactNode }) {
  const actor = await requirePage(AGENT);
  const supabase = await serverClient();
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed")
    .gte("start_at", new Date().toISOString());
  return (
    <AgentShell firstName={actor.name.split(" ")[0]} meetingCount={count ?? 0}>
      {children}
    </AgentShell>
  );
}
