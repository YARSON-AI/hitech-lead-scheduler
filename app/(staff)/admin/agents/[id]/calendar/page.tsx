import { notFound } from "next/navigation";
import { AgentCalendarScreen } from "@/components/screens/StaffAgentScreens";
import { requirePage } from "@/lib/auth/actor";
import { MANAGER } from "@/lib/auth/types";
import { agentRows } from "@/lib/booking/agent-rows";

export default async function AgentCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage(MANAGER);
  const { id } = await params;
  const agent = (await agentRows()).find((row) => row.id === id);
  if (!agent) notFound();
  return <AgentCalendarScreen agent={agent} />;
}
