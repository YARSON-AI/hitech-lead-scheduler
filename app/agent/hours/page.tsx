import { AgentHoursScreen } from "@/components/screens/AgentScreens";
import { requirePage } from "@/lib/auth/actor";
import { AGENT } from "@/lib/auth/types";
import { readHours } from "@/lib/schedule-read";

export default async function AgentHoursPage() {
  const actor = await requirePage(AGENT);
  return <AgentHoursScreen hours={await readHours(actor.agentEmail!)} />;
}
