import { notFound } from "next/navigation";
import { AgentSettingsScreen } from "@/components/screens/StaffAgentScreens";
import { requirePage } from "@/lib/auth/actor";
import { MANAGER } from "@/lib/auth/types";
import { agentRows } from "@/lib/booking/agent-rows";
import { readHours, readOverrides, upcomingBlockedHolidays } from "@/lib/schedule-read";
import { serverClient } from "@/lib/supabase/server";

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage(MANAGER);
  const { id } = await params;
  const agent = (await agentRows()).find((row) => row.id === id);
  if (!agent) notFound();
  const supabase = await serverClient();
  const [hours, overrides, holidays, { count }] = await Promise.all([
    readHours(agent.email),
    readOverrides(agent.email),
    upcomingBlockedHolidays(),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("agent_email", agent.email).eq("status", "confirmed").gte("start_at", new Date().toISOString()),
  ]);
  return <AgentSettingsScreen agent={agent} hours={hours} overrides={overrides} holidays={holidays} futureCount={count ?? 0} />;
}
