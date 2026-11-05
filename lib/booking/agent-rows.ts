import "server-only";
import type { AgentRow } from "@/components/screens/StaffAgentScreens";
import { airtable, type RosterAgent } from "@/lib/integrations/airtable";
import { serverClient } from "@/lib/supabase/server";

const lightOf = (agent: RosterAgent): AgentRow["light"] => (agent.trafficLight === "🔴" ? "red" : agent.trafficLight === "🟡" ? "amber" : "green");

export async function agentRows(): Promise<AgentRow[]> {
  const supabase = await serverClient();
  const [roster, { data: connections }] = await Promise.all([airtable().listAgents(), supabase.from("calendar_connections").select("agent_email, connected")]);
  const offline = new Set((connections ?? []).filter((row) => !row.connected).map((row) => row.agent_email));
  return roster
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      light: lightOf(agent),
      daily: agent.dailyQuota != null ? String(agent.dailyQuota) : "—",
      monthly: agent.monthlyQuota != null ? String(agent.monthlyQuota) : "—",
      weight: `${agent.weight ?? 100}%`,
      count: String(agent.monthlyCount),
      blockDate: agent.blockedSince ? agent.blockedSince.split("-").reverse().join(".") : null,
      blockReason: agent.blockReason ?? null,
      disconnected: offline.has(agent.email),
      excludedFor: Object.entries(agent.exclusions).filter(([, value]) => value).map(([key]) => key),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "he"));
}
